// src/components/CanvasEditor.jsx
import React from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as fabric from 'fabric';
import StraightText from '../objectAdders/straightText';
import updateObject from '../functions/update';
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase.js';
import { FabricImage } from 'fabric';
import CircleText from '../objectAdders/CircleText';

fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    return toObject.call(
      this,
      (propertiesToInclude || []).concat(['customId', 'textStyle'])
    );
  };
})(fabric.Object.prototype.toObject);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Helper: Compare floats with tolerance to prevent infinite loops on tiny differences
const isDifferent = (val1, val2) => {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return Math.abs(val1 - val2) > 0.1; // 0.1px tolerance
  }
  return val1 !== val2;
};

export default function CanvasEditor({
  activeTool,
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
            type: obj.type,
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
                  type: obj.type,
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
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const lastSelectedRef = { id: null, type: null };

    const handleSelection = (e) => {
      const selected = e.selected?.[0];
      if (selected && selected.customId) {
        const newId = selected.customId;
        const newType = selected.type;

        if (newId !== lastSelectedRef.id || newType !== lastSelectedRef.type) {
          lastSelectedRef.id = newId;
          lastSelectedRef.type = newType;
          if (selected.textEffect === 'circle') {
            setActiveTool('text');
          } else {
            setActiveTool(selected.type);
          }
          setSelectedId(newId);
        }
      }
    };

    const handleCleared = () => {
      if (lastSelectedRef.id !== null) {
        lastSelectedRef.id = null;
        lastSelectedRef.type = null;
        setSelectedId(null);
        setActiveTool(null);
      }
    };

    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleCleared);

    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleCleared);
    };
  }, [setActiveTool, setSelectedId]);

  // 🟩 Handle movement, rotation, resize
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleObjectModified = (e) => {
      if (isSyncingRef.current) return;

      let obj = e.target;
      if (!obj) return;

      const type = obj.type.toLowerCase();

      if (type === 'activeselection') {
        // 🔥 FIX: Use setTimeout to allow Fabric to finish its internal processing
        // BEFORE we disrupt the group. This stops the RangeError.
        const children = [...obj.getObjects()];

        setTimeout(() => {
          // 1. Break group -> Fabric sets children to ABSOLUTE coords
          fabricCanvas.discardActiveObject();

          // 2. Read new ABSOLUTE props and update Redux
          const present = store.getState().canvas.present;
          let updatedPresent = present.map((o) => JSON.parse(JSON.stringify(o)));
          let hasChanges = false;

          children.forEach((child) => {
            const index = updatedPresent.findIndex((o) => o.id === child.customId);
            if (index === -1) return;

            // Get values directly from the object (now absolute)
            let newProps = {};

            if (child.type === 'text' || child.type === 'textbox') {
              const newFontSize = child.fontSize * child.scaleX;
              child.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
              child.setCoords();
              newProps = {
                fontSize: newFontSize,
                left: child.left,
                top: child.top,
                angle: child.angle,
              };
            } else {
              newProps = {
                left: child.left,
                top: child.top,
                angle: child.angle,
                scaleX: child.scaleX,
                scaleY: child.scaleY,
                width: child.width,
                height: child.height,
              };
            }

            // Update props
            updatedPresent[index].props = { ...updatedPresent[index].props, ...newProps };
            hasChanges = true;
          });

          if (hasChanges) {
            store.dispatch(setCanvasObjects(updatedPresent));
          }

          // 3. 💥 CRITICAL: Restore the selection so the user doesn't see a "flash" or loss of selection
          const sel = new fabric.ActiveSelection(children, {
            canvas: fabricCanvas,
          });
          fabricCanvas.setActiveObject(sel);
          fabricCanvas.requestRenderAll();

        }, 0);
        return;
      }

      if (obj.textEffect === 'circle' || obj.type === 'group') {
         updateObject(obj.customId, {
            left: obj.left,
            top: obj.top,
            angle: obj.angle,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            // We don't update radius/text here, only transforms
         });
         return;
      }

      // Single object handling
      if (obj.type === 'text' || obj.type === 'textbox') {
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
      if (obj.type === 'image') {
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

  useEffect(() => {
    if (!initialized) return;
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    // 🕵️ 1. Handle Active Selection vs Absolute Updates
    // If we have a group selected, we MUST discard it to apply absolute updates safely.
    // If we don't, Fabric tries to apply absolute coords to relative group children -> JUMP.
    let selectedIds = [];
    const activeObject = fabricCanvas.getActiveObject();
    const isMultiSelect = activeObject && activeObject.type.toLowerCase() === 'activeselection';

    if (isMultiSelect) {
      selectedIds = activeObject.getObjects().map(o => o.customId);
      fabricCanvas.discardActiveObject();
    }

    isSyncingRef.current = true;
    const fabricObjects = fabricCanvas.getObjects();

    // 2. UPDATE or ADD objects
    canvasObjectsMap.forEach(async (objData, id) => {
      let existing = fabricObjects.find((o) => o.customId === id);
const targetType = objData.props.textEffect === 'circle' ? 'circle-text' : 'text';

      // ------------------------------------------
      // CASE A: CIRCLE TEXT
      // ------------------------------------------
      if (targetType === 'circle-text') {
         if (existing) {
             // If existing object is NOT a circle (it was straight), or structural props changed
             const isStructureChanged = 
                existing.textEffect !== 'circle' || // Was straight, now circle
                existing.text !== objData.props.text ||
                existing.radius !== objData.props.radius ||
                existing.fontSize !== objData.props.fontSize ||
                existing.fontFamily !== objData.props.fontFamily;

             if (isStructureChanged) {
                 // 💥 DESTROY & RECREATE
                 fabricCanvas.remove(existing); 
                 existing = null; 
             } else {
                 // ⚡ LIGHTWEIGHT UPDATE (Move/Scale/Color)
                 existing.set({
                    left: objData.props.left,
                    top: objData.props.top,
                    angle: objData.props.angle,
                    scaleX: objData.props.scaleX,
                    scaleY: objData.props.scaleY,
                    opacity: objData.props.opacity
                 });
                 // Color update requires iterating group children
                 if (objData.props.fill !== existing.fill) {
                    existing.set('fill', objData.props.fill); // Update group prop for tracking
                    existing.getObjects().forEach(c => c.set('fill', objData.props.fill));
                 }
                 existing.setCoords();
             }
         }
         
         if (!existing) {
             const newGroup = CircleText(objData);
             fabricCanvas.add(newGroup);
         }
         return; // Done
      }

      // ------------------------------------------
      // CASE B: STRAIGHT TEXT (or Image)
      // ------------------------------------------
      
      // If existing object was a Circle but now needs to be Straight (Undo operation)
      if (existing && existing.textEffect === 'circle' && targetType === 'text') {
          fabricCanvas.remove(existing);
          existing = null; // Will trigger creation below
      }
      if (existing) {
        let updatesNeeded = {};

        // 🛡️ COMPARE WITH TOLERANCE (Fixes infinite jumping loops)
        for (const key in objData.props) {
          if (isDifferent(existing[key], objData.props[key])) {
            updatesNeeded[key] = objData.props[key];
          }
        }

        if (Object.keys(updatesNeeded).length > 0) {
          // Shadow Fix
          if (updatesNeeded.shadowColor || updatesNeeded.shadowBlur || updatesNeeded.shadowOffsetX || updatesNeeded.shadowOffsetY) {
            const shadowObject = {
              color: updatesNeeded.shadowColor || existing.shadow?.color || '#000000',
              blur: updatesNeeded.shadowBlur || existing.shadow?.blur || 0,
              offsetX: updatesNeeded.shadowOffsetX || existing.shadow?.offsetX || 0,
              offsetY: updatesNeeded.shadowOffsetY || existing.shadow?.offsetY || 0,
            };
            updatesNeeded.shadow = shadowObject;
            ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'].forEach(key => delete updatesNeeded[key]);
          }

          if (updatesNeeded.scaleX !== undefined || updatesNeeded.scaleY !== undefined) {
            existing.set({
              scaleX: updatesNeeded.scaleX ?? existing.scaleX,
              scaleY: updatesNeeded.scaleY ?? existing.scaleY,
            });
            delete updatesNeeded.scaleX;
            delete updatesNeeded.scaleY;
          }

          existing.set(updatesNeeded);
          existing.setCoords();
        }

      } else {
        let newObj;
        if (objData.type === 'text')
          newObj = StraightText(objData);
        if (objData.type === 'image') {
          if (!existing || !existing.map(obj => obj.customId).includes(objData.id)) {
            newObj = await FabricImage.fromURL(objData.src, {
              customId: objData.id,
              left: objData.props.left,
              top: objData.props.top,
              scaleX: objData.props.scaleX,
              scaleY: objData.props.scaleY,
              angle: objData.props.angle,
              width: objData.props.width,
              height: objData.props.height,
            });
          }
        }
        if (newObj) {
          newObj.customId = objData.id;
          fabricCanvas.add(newObj);
        }
      }
      return
    });

    // 3. REMOVE objects
    const ids = Array.from(canvasObjectsMap.keys());
    fabricObjects.forEach((obj) => {
      if (!ids.includes(obj.customId)) fabricCanvas.remove(obj);
    });

    // 4. Z-Index Sorting
    const currentFabricObjects = fabricCanvas.getObjects();
    let fabricObjectsArray = fabricCanvas._objects;

    canvasObjects.forEach((reduxObj, index) => {
      const fabricObj = currentFabricObjects.find(
        (obj) => obj.customId === reduxObj.id
      );

      if (fabricObj) {
        const currentIndex = fabricObjectsArray.indexOf(fabricObj);
        if (currentIndex !== index) {
          fabricObjectsArray.splice(currentIndex, 1);
          fabricObjectsArray.splice(index, 0, fabricObj);
          fabricCanvas._objects = fabricObjectsArray;
        }
      }
    });

    // 🕵️ 5. EXPLICITLY RE-ACTIVATE SELECTION
    if (selectedIds.length > 0) {
      const objectsToSelect = fabricCanvas.getObjects().filter(obj => selectedIds.includes(obj.customId));
      if (objectsToSelect.length > 0) {
        // Re-create the group. Fabric calculates relative coords automatically here.
        const selection = new fabric.ActiveSelection(objectsToSelect, {
          canvas: fabricCanvas,
        });
        fabricCanvas.setActiveObject(selection);
      }
    }

    fabricCanvas.requestRenderAll();

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [canvasObjects, initialized, canvasObjectsMap]);

  return (
    <div ref={wrapperRef} id="canvas-wrapper">
      <canvas ref={canvasRef} id="canvas" />
    </div>
  );
}