// src/components/CanvasEditor.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as fabric from 'fabric';
import StraightText from '../objectAdders/straightText';
import CircleText from '../objectAdders/CircleText';
import updateObject from '../functions/update';
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase.js';
import { FabricImage } from 'fabric';
import updateExisting from '../utils/updateExisting'
import { useDispatch } from 'react-redux';
import FloatingMenu from './FloatingMenu';
import { handleCanvasAction } from '../utils/canvasActions';

fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    return toObject.call(
      this,
      (propertiesToInclude || []).concat(['customId', 'textStyle', 'textEffect', 'radius', 'effectValue'])
    );
  };
})(fabric.Object.prototype.toObject);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// 🛡️ Helper: Compare values with tolerance
const isDifferent = (val1, val2) => {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return Math.abs(val1 - val2) > 0.1;
  }
  return val1 !== val2;
};

export default function CanvasEditor({
  setActiveTool,
  setSelectedId,
  setFabricCanvas,
  fabricCanvas,
  setEditingDesignId,
  setCurrentDesign,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const wrapperRef = useRef(null);
  const canvasObjects = useSelector((state) => state.canvas.present);
  const location = useLocation();
  const previousStatesRef = useRef(new Map());
  const dispatch = useDispatch();

  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedObjectLocked, setSelectedObjectLocked] = useState(false);
  const [selectedObjectUUID, setSelectedObjectUUID] = useState(null);

  // 🆕 HELPER: Update Menu Position
  // 🆕 HELPER: Syncs menu position and checks if object is locked
  const updateMenuPosition = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    const canvasContainer = document.getElementById('canvas-wrapper');

    if (activeObj && canvasContainer) {
      const boundingRect = activeObj.getBoundingRect(true); // Get absolute coordinates

      setMenuPosition({
        left: boundingRect.left + boundingRect.width / 2,
        top: boundingRect.top
      });

      // Sync the lock state for the icon
      setSelectedObjectLocked(activeObj.lockMovementX === true);
      setSelectedObjectUUID(activeObj.customId);
    } else {
      setMenuPosition(null);
      setSelectedObjectUUID(null);
    }
  };

  // 🟩 Initialize Fabric.js once
  useEffect(() => {
    const ORIGINAL_WIDTH = 800;
    const ORIGINAL_HEIGHT = 800;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: true,
    });

    canvas.setWidth(ORIGINAL_WIDTH);
    canvas.setHeight(ORIGINAL_HEIGHT);

    const resize = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const newWidth = wrapper.clientWidth;
      const newHeight = wrapper.clientHeight;

      const scaleX = newWidth / ORIGINAL_WIDTH;
      const scaleY = newHeight / ORIGINAL_HEIGHT;

      const scale = Math.min(scaleX, scaleY);

      canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
    };

    resize();
    window.addEventListener('resize', resize);

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);
    setInitialized(true);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Load Saved Designs
  useEffect(() => {
    if (location.state?.designToLoad && fabricCanvas) {
      const design = location.state.designToLoad;
      setCurrentDesign(design);
      setEditingDesignId(design.id);

      fabricCanvas.loadFromJSON(design.canvasJSON, () => { });
      setTimeout(() => {
        fabricCanvas.requestRenderAll();

        fabricCanvas.getObjects().forEach((obj) => {
          const state = store.getState();
          const canvasObjects = state.canvas.present;

          const newObj = {
            id: obj.customId,
            type: obj.textEffect === 'circle' ? 'circle-text' : obj.type, // Rehydrate type
            props: {
              text: obj.text,
              left: obj.left,
              top: obj.top,
              angle: obj.angle,
              fill: obj.fill,
              fontSize: obj.fontSize,
              opacity: obj.opacity,
              shadowBlur: obj.shadowBlur,
              shadowOffsetX: obj.shadowOffsetX,
              shadowOffsetY: obj.shadowOffsetY,
              shadowColor: obj.shadowColor,
              charSpacing: obj.charSpacing,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth,
              textStyle: obj.textStyle,
              textEffect: obj.textEffect,
              effectValue: obj.effectValue,
              radius: obj.radius
            },
          };
          store.dispatch(setCanvasObjects([...canvasObjects, newObj]));
        });
      }, 90);
    }
  }, [location.state, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || !initialized) return;

    const loadDesign = async () => {
      let designToLoad = null;
      let designId = null;

      try {
        const sessionData = sessionStorage.getItem('editingDesign');
        if (sessionData) {
          designToLoad = JSON.parse(sessionData);
          sessionStorage.removeItem('editingDesign');
        }
      } catch (e) {
        console.warn('sessionStorage read failed:', e);
      }

      if (!designToLoad) {
        try {
          const localData = localStorage.getItem('editingDesign');
          if (localData) {
            designToLoad = JSON.parse(localData);
            localStorage.removeItem('editingDesign');
          }
        } catch (e) {
          console.warn('localStorage read failed:', e);
        }
      }

      if (!designToLoad) {
        const urlParams = new URLSearchParams(window.location.search);
        designId = urlParams.get('designId');
      }

      if (!designToLoad && !designId) {
        designId = getCookie('editingDesignId');
        if (designId) {
          document.cookie = 'editingDesignId=; path=/; max-age=0';
        }
      }

      if (!designToLoad && designId) {
        try {
          const designRef = doc(firestore, `users/test-user-123/designs`, designId);
          const designSnap = await getDoc(designRef);

          if (designSnap.exists()) {
            designToLoad = {
              id: designId,
              ...designSnap.data()
            };
          } else {
            console.error('❌ Design not found in Firestore');
            return;
          }
        } catch (error) {
          console.error('❌ Firestore fetch error:', error);
          return;
        }
      }

      if (designToLoad) {
        setCurrentDesign(designToLoad);
        setEditingDesignId(designToLoad.id);

        if (designToLoad.canvasJSON) {
          fabricCanvas.loadFromJSON(designToLoad.canvasJSON, () => {
            setTimeout(() => {
              fabricCanvas.requestRenderAll();
              fabricCanvas.getObjects().forEach(obj => {
                const state = store.getState();
                const canvasObjects = state.canvas.present;

                const newObj = {
                  id: obj.customId,
                  type: obj.textEffect === 'circle' ? 'circle-text' : obj.type,
                  props: {
                    text: obj.text,
                    left: obj.left,
                    top: obj.top,
                    angle: obj.angle,
                    fill: obj.fill,
                    fontSize: obj.fontSize,
                    opacity: obj.opacity,
                    shadowBlur: obj.shadowBlur,
                    shadowOffsetX: obj.shadowOffsetX,
                    shadowOffsetY: obj.shadowOffsetY,
                    shadowColor: obj.shadowColor,
                    charSpacing: obj.charSpacing,
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    textStyle: obj.textStyle,
                    textEffect: obj.textEffect,
                    effectValue: obj.effectValue,
                    radius: obj.radius
                  }
                };
                const existingIndex = canvasObjects.findIndex(o => o.id === obj.customId);
                if (existingIndex === -1) {
                  store.dispatch(setCanvasObjects([...canvasObjects, newObj]));
                }
              });
            }, 90);
          });
        }
      }
    };

    loadDesign();
  }, [fabricCanvas, initialized]);


  // 🟩 Handle selection
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleSelection = (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        setSelectedId(selected.customId);
        setActiveTool(selected.textEffect === 'circle' ? 'circle-text' : selected.type);
        updateMenuPosition(); // <--- Update Menu
      }
    };

    const handleCleared = () => {
      setSelectedId(null);
      setActiveTool(null);
      setMenuPosition(null); // <--- Hide Menu
    };

    const handleMoving = () => {
      updateMenuPosition(); // <--- Follow Object while dragging
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);
    canvas.on('object:moving', handleMoving);
    canvas.on('object:scaling', handleMoving);
    canvas.on('object:rotating', handleMoving);
    canvas.on('object:modified', handleMoving);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      canvas.off('object:moving', handleMoving);
      canvas.off('object:scaling', handleMoving);
      canvas.off('object:rotating', handleMoving);
      canvas.off('object:modified', handleMoving);
    };
  }, [setSelectedId, setActiveTool]);

  // src/components/CanvasEditor.jsx

// ... inside CanvasEditor component ...

  // 🆕 MOBILE PINCH-TO-RESIZE LOGIC
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Helper: Calculate distance between two touch points
    const getDistance = (touches) => {
      const [t1, t2] = touches;
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    let initialDistance = 0;
    let initialScaleX = 1;
    let initialScaleY = 1;
    let isPinching = false;

    const handleTouchStart = (e) => {
      // Check for exactly 2 fingers (Pinch)
      if (e.touches.length === 2) {
        const activeObj = canvas.getActiveObject();
        
        // Only trigger if an object is selected
        if (activeObj) {
            isPinching = true;
            initialDistance = getDistance(e.touches);
            initialScaleX = activeObj.scaleX || 1;
            initialScaleY = activeObj.scaleY || 1;
            
            // Prevent default browser zoom/scroll
            if (e.cancelable) e.preventDefault(); 
        }
      }
    };

    const handleTouchMove = (e) => {
      if (isPinching && e.touches.length === 2) {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          if (e.cancelable) e.preventDefault(); // Stop page from zooming
          
          const currentDistance = getDistance(e.touches);
          
          if (initialDistance > 0) {
             const scaleFactor = currentDistance / initialDistance;
             
             // Apply the new scale relative to the start of the pinch
             const newScaleX = initialScaleX * scaleFactor;
             const newScaleY = initialScaleY * scaleFactor;

             // Respect minimum scale limit to prevent objects vanishing
             if (newScaleX > 0.1 && newScaleY > 0.1) {
                 activeObj.set({
                     scaleX: newScaleX,
                     scaleY: newScaleY
                 });
                 activeObj.setCoords();
                 canvas.requestRenderAll();
             }
          }
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (isPinching) {
         // Fire 'modified' event so Redux history saves the change
         const activeObj = canvas.getActiveObject();
         if (activeObj) {
             canvas.fire('object:modified', { target: activeObj });
         }
      }
      isPinching = false;
    };

    // We attach listeners to 'upperCanvasEl' (the interactive layer)
    // using { passive: false } is CRITICAL to allow e.preventDefault()
    const upperCanvas = canvas.upperCanvasEl;
    if (upperCanvas) {
        upperCanvas.style.touchAction = 'none'; // CSS hint to browser
        upperCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        upperCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        upperCanvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
       if (upperCanvas) {
           upperCanvas.removeEventListener('touchstart', handleTouchStart);
           upperCanvas.removeEventListener('touchmove', handleTouchMove);
           upperCanvas.removeEventListener('touchend', handleTouchEnd);
       }
    };
  }, [initialized]); // Run once canvas is initialized

  // 🟩 Handle movement, rotation, resize
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleObjectModified = (e) => {
      if (isSyncingRef.current) return;

      let obj = e.target;
      if (!obj) return;

      const type = obj.type ? obj.type.toLowerCase() : '';

      if (type === 'activeselection') {
        const children = [...obj.getObjects()];

        setTimeout(() => {
          fabricCanvas.discardActiveObject();
          fabricCanvas.requestRenderAll();

          const present = store.getState().canvas.present;
          let updatedPresent = present.map((o) => JSON.parse(JSON.stringify(o)));
          let hasChanges = false;

          children.forEach((child) => {
            const index = updatedPresent.findIndex((o) => o.id === child.customId);
            if (index === -1) return;

            const matrix = child.calcTransformMatrix();
            const { translateX, translateY, angle, scaleX } = fabric.util.qrDecompose(matrix);

            if (child.type === 'text' || child.type === 'textbox' || child.customType === 'text') {
              const newFontSize = child.fontSize * scaleX;
              child.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
              child.setCoords();

              updatedPresent[index].props = {
                ...updatedPresent[index].props,
                fontSize: newFontSize,
                left: child.left,
                top: child.top,
                angle: child.angle,
                scaleX: 1,
                scaleY: 1
                  (child.type === 'group' && child.textEffect === 'circle') ? { width: child.width, height: child.height } : {}
              };
            } else {
              // For circle text (group) or images, we just save the transforms
              updatedPresent[index].props = {
                ...updatedPresent[index].props,
                left: translateX,
                top: translateY,
                angle: angle,
                scaleX: scaleX, // Use calculated scale
                scaleY: scaleX,
                width: child.width,
                height: child.height,
              };
            }
            hasChanges = true;
          });

          if (hasChanges) {
            store.dispatch(setCanvasObjects(updatedPresent));
          }

          if (children.length > 0) {
            const sel = new fabric.ActiveSelection(children, {
              canvas: fabricCanvas,
            });
            fabricCanvas.setActiveObject(sel);
            fabricCanvas.requestRenderAll();
          }

        }, 0);
        return;
      }

      // Single object handling
      if (type === 'text' || type === 'textbox') {
        const newFontSize = obj.fontSize * obj.scaleX;
        obj.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
        obj.setCoords();
        fabricCanvas.renderAll();

        updateObject(obj.customId, {
          fontSize: newFontSize,
          left: obj.left,
          top: obj.top,
          angle: obj.angle,
        });
        return;
      }

      // Handle Circle Text Group or Images (Moved/Scaled/Rotated)
      if (obj.textEffect === 'circle' || type === 'group' || type === 'image') {
        updateObject(obj.customId, {
          left: obj.left,
          top: obj.top,
          angle: obj.angle,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          width: obj.width,
          height: obj.height,
        });
        return;
      }
    };
    fabricCanvas.on('object:modified', handleObjectModified);
    return () => {
      fabricCanvas.off('object:modified', handleObjectModified);
    };
  }, []);

  // 🟩 Sync Redux state → Fabric
  const canvasObjectsMap = useMemo(() => {
    const map = new Map();
    canvasObjects.forEach(obj => {
      map.set(obj.id, obj);
    });
    return map;
  }, [canvasObjects]);

  // 🟩 Sync Redux state → Fabric (OPTIMIZED)
  useEffect(() => {
    if (!initialized) return;
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    // 1. Handle Active Selection (Multiselect)
    let selectedIds = [];
    const activeObject = fabricCanvas.getActiveObject();
    const isMultiSelect = activeObject && activeObject.type?.toLowerCase() === 'activeselection';

    if (isMultiSelect) {
      selectedIds = activeObject.getObjects().map(o => o.customId);
      fabricCanvas.discardActiveObject();
    }

    isSyncingRef.current = true;
    const fabricObjects = fabricCanvas.getObjects();

    canvasObjects.forEach(async (objData) => {
      const currentString = JSON.stringify(objData);
      const previousString = previousStatesRef.current.get(objData.id);

      if (currentString === previousString) {
        return;
      }

      // If we are here, something changed. Update the Fabric object.
      let existing = fabricObjects.find((o) => o.customId === objData.id);

      // --- A. TEXT OBJECTS ---
      if (objData.type === 'text') {
        const isCircle = objData.props.textEffect === 'circle';

        if (!isCircle && existing && existing.type === 'text' && existing.textEffect !== 'circle') {
          existing.set(objData.props);
          if (objData.props.text !== undefined) existing.initDimensions();
          existing.setCoords();
        }
        else {
          if (existing) fabricCanvas.remove(existing);

          let newObj;
          if (isCircle) {
            newObj = CircleText(objData);
          } else {
            newObj = StraightText(objData);
          }

          if (newObj) {
            newObj.customId = objData.id;
            fabricCanvas.add(newObj);
            fabricCanvas.setActiveObject(newObj);
            fabricCanvas.requestRenderAll();
          }
        }
      }

      // --- B. IMAGE OBJECTS ---
      if (objData.type === 'image') {
        if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
          try {
            const newObj = await FabricImage.fromURL(objData.src, { ...objData.props, customId: objData.id });
            fabricCanvas.add(newObj);
          } catch (err) {
            console.error("Error loading image:", err);
          }
        } else if (existing) {
          // Use your existing helper for images
          updateExisting(existing, objData, isDifferent);
          fabricCanvas.requestRenderAll();
        }
      }

      previousStatesRef.current.set(objData.id, currentString);
    });

    const reduxIds = new Set(canvasObjects.map(o => o.id));
    fabricObjects.forEach((obj) => {
      if (!reduxIds.has(obj.customId)) {
        fabricCanvas.remove(obj);
        previousStatesRef.current.delete(obj.customId);
      }
    });

    // 4. Layer Management (Z-Index)
    // Only move layers if the order has actually changed
    const currentFabricObjects = fabricCanvas.getObjects();
    let fabricObjectsArray = fabricCanvas._objects; // Access internal array for speed

    canvasObjects.forEach((reduxObj, index) => {
      const fabricObj = currentFabricObjects.find((obj) => obj.customId === reduxObj.id);
      if (fabricObj) {
        const currentIndex = fabricObjectsArray.indexOf(fabricObj);
        if (currentIndex !== index) {
          fabricCanvas.moveObjectTo(fabricObj, index);
        }
      }
    });

    // 5. Restore Selection
    if (selectedIds.length > 0) {
      const objectsToSelect = fabricCanvas.getObjects().filter(obj => selectedIds.includes(obj.customId));
      if (objectsToSelect.length > 0) {
        const selection = new fabric.ActiveSelection(objectsToSelect, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(selection);
      }
    }

    fabricCanvas.requestRenderAll();

    // Small timeout to ensure sync flag clears after render
    setTimeout(() => {
      updateMenuPosition();
      isSyncingRef.current = false;
    }, 50);

  }, [canvasObjects, initialized]);

  const onMenuAction = (action) => {
    handleCanvasAction(
      action,
      selectedObjectUUID,
      store.getState().canvas.present, // Get latest from store
      dispatch,
      setCanvasObjects
    );
  };

  return (
    <div ref={wrapperRef} id="canvas-wrapper">
      <canvas ref={canvasRef} id="canvas" />

      {menuPosition && selectedObjectUUID && (
        <FloatingMenu
          position={menuPosition}
          onAction={onMenuAction}
          isLocked={selectedObjectLocked}
        />
      )}
    </div>
  );
}