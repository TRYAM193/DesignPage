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
  const isSyncingRef = useRef(false); // 🧩 prevents infinite loops
  const [initialized, setInitialized] = useState(false);
  const wrapperRef = useRef(null);
  const canvasObjects = useSelector((state) => state.canvas.present);
  const location = useLocation();

  // 🟩 Initialize Fabric.js once
  useEffect(() => {
    const ORIGINAL_WIDTH = 800; // set your design size
    const ORIGINAL_HEIGHT = 800;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: true,
    });

    canvas.setWidth(ORIGINAL_WIDTH);
    canvas.setHeight(ORIGINAL_HEIGHT);

    const resize = () => {
      const wrapper = wrapperRef.current;

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

      // METHOD 1: Try sessionStorage first (most reliable)
      try {
        const sessionData = sessionStorage.getItem('editingDesign');
        if (sessionData) {
          designToLoad = JSON.parse(sessionData);
          console.log('✅ Loaded from sessionStorage');
          sessionStorage.removeItem('editingDesign'); // Clear after use
        }
      } catch (e) {
        console.warn('sessionStorage read failed:', e);
      }

      // METHOD 2: Try localStorage
      if (!designToLoad) {
        try {
          const localData = localStorage.getItem('editingDesign');
          if (localData) {
            designToLoad = JSON.parse(localData);
            console.log('✅ Loaded from localStorage');
            localStorage.removeItem('editingDesign'); // Clear after use
          }
        } catch (e) {
          console.warn('localStorage read failed:', e);
        }
      }

      // METHOD 3: Get ID from URL parameter
      if (!designToLoad) {
        const urlParams = new URLSearchParams(window.location.search);
        designId = urlParams.get('designId');
      }

      // METHOD 4: Get ID from cookie
      if (!designToLoad && !designId) {
        designId = getCookie('editingDesignId');
        if (designId) {
          // Clear cookie
          document.cookie = 'editingDesignId=; path=/; max-age=0';
        }
      }

      // If we have an ID but no data, fetch from Firestore
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
            alert('Design not found!');
            return;
          }
        } catch (error) {
          console.error('❌ Firestore fetch error:', error);
          alert('Failed to load design');
          return;
        }
      }

      // Load the design if we found it
      if (designToLoad) {

        setCurrentDesign(designToLoad);
        setEditingDesignId(designToLoad.id);

        if (designToLoad.canvasJSON) {
          fabricCanvas.loadFromJSON(designToLoad.canvasJSON, () => {
            setTimeout(() => {
              fabricCanvas.requestRenderAll();

              // Sync objects to Redux
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
      } else {
        console.log('ℹ️ No design to load - starting with blank canvas');
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

        // 🔒 Only update React state if selection truly changed
        if (newId !== lastSelectedRef.id || newType !== lastSelectedRef.type) {
          lastSelectedRef.id = newId;
          lastSelectedRef.type = newType;
          setSelectedId(newId);
          setActiveTool(newType);
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

      const obj = e.target;
      if (!obj) return;

      const fabricCanvas = fabricCanvasRef.current;
      if (!fabricCanvas) return;

      if (obj.type === 'activeselection') {
        const present = store.getState().canvas.present;
        const updated = present.map(o => ({ ...o, props: { ...o.props } }));

        obj.getObjects().forEach(child => {

          const idx = updated.findIndex(o => o.id === child.customId);
          if (idx === -1) return;

          child.setCoords();

          // ----- 💯 THE CORRECT ABSOLUTE POSITION FIX -----
          const center = child.getRelativeCenterPoint();
          const absCenter = fabric.util.transformPoint(
            center,
            fabricCanvas.viewportTransform
          );
          const absLeft = absCenter.x - (child.width * child.scaleX) / 2;
          const absTop = absCenter.y - (child.height * child.scaleY) / 2;

          // -----------------------------------------------

          if (child.type === 'text' || child.type === 'textbox') {
            const newFontSize = child.fontSize * child.scaleX;
            child.set({ fontSize: newFontSize, scaleX: 1, scaleY: 1 });
            child.setCoords();

            updated[idx].props = {
              ...updated[idx].props,
              left: absLeft,
              top: absTop,
              angle: child.angle,
              fontSize: newFontSize,
            };
          } else {
            updated[idx].props = {
              ...updated[idx].props,
              left: absLeft,
              top: absTop,
              angle: child.angle,
              scaleX: child.scaleX,
              scaleY: child.scaleY,
            };
          }
        });

        store.dispatch(setCanvasObjects(updated));
        return;
      }

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

    // This flag prevents the loop when Fabric itself triggers a Redux update
    isSyncingRef.current = true;
    setTimeout(() => {
      const fabricObjects = fabricCanvas.getObjects();

      // 1. UPDATE or ADD objects
      canvasObjectsMap.forEach(async (objData, id) => {
        let existing = fabricObjects.find((o) => o.customId === id);
        if (existing) {
          const props = objData.props;

          // --- Calculate absolute center from stored left/top ---
          const absCenterX = props.left + (existing.width * (props.scaleX ?? existing.scaleX)) / 2;
          const absCenterY = props.top + (existing.height * (props.scaleY ?? existing.scaleY)) / 2;

          // ============================================================
          // TEXT OBJECTS
          // ============================================================
          if (existing.type === "text" || existing.type === "textbox") {

            // 1. Position text *by absolute center* (fixes undo jumping)
            existing.setPositionByOrigin(
              new fabric.Point(absCenterX, absCenterY),
              "center",
              "center"
            );

            // 2. Restore final text properties
            existing.set({
              angle: props.angle,
              fontSize: props.fontSize,
              fill: props.fill,
              opacity: props.opacity,
              stroke: props.stroke,
              strokeWidth: props.strokeWidth,

              // Text ALWAYS has normalized scale:
              scaleX: 1,
              scaleY: 1,
            });

            existing.setCoords();
            return;
          }

          // ============================================================
          // IMAGE OBJECTS
          // ============================================================
          if (existing.type === "image") {

            // 1. Position image *by center* to avoid jump
            existing.setPositionByOrigin(
              new fabric.Point(absCenterX, absCenterY),
              "center",
              "center"
            );

            // 2. Apply image props
            existing.set({
              angle: props.angle,
              scaleX: props.scaleX,
              scaleY: props.scaleY,
              opacity: props.opacity,
            });

            existing.setCoords();
            return;
          }

          // ============================================================
          // OTHER OBJECT TYPES (shapes)
          // ============================================================
          existing.setPositionByOrigin(
            new fabric.Point(absCenterX, absCenterY),
            "center",
            "center"
          );

          existing.set({
            angle: props.angle,
            scaleX: props.scaleX,
            scaleY: props.scaleY,
          });

          existing.setCoords();
          return;
        } else {
          // Logic to add new objects remains the same (as it only runs for new IDs)
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
            fabricCanvas.setActiveObject(newObj);
            fabricCanvas.renderAll();
          }
        }
        return
      });

      //Adding image 


      // 2. REMOVE objects (Deletion logic remains efficient)
      const ids = Array.from(canvasObjectsMap.keys());
      fabricObjects.forEach((obj) => {
        if (!ids.includes(obj.customId)) fabricCanvas.remove(obj);
      });

      fabricCanvas.renderAll();
      const currentFabricObjects = fabricCanvas.getObjects();

      // Fabric's internal object array (which controls stacking)
      let fabricObjectsArray = fabricCanvas._objects;

      // Iterate through the source of truth (Redux state)
      canvasObjects.forEach((reduxObj, index) => {
        const fabricObj = currentFabricObjects.find(
          (obj) => obj.customId === reduxObj.id
        );

        if (fabricObj) {
          const currentIndex = fabricObjectsArray.indexOf(fabricObj);

          // Only move if the object is not already at the correct index
          if (currentIndex !== index) {

            // --- GUARANTEED Z-INDEX FIX ---

            // 1. Remove object from its current position in the internal array
            fabricObjectsArray.splice(currentIndex, 1);

            // 2. Insert object into the desired position
            fabricObjectsArray.splice(index, 0, fabricObj);

            // Re-assign the modified array back to the canvas's internal state
            fabricCanvas._objects = fabricObjectsArray;
          }
        }
      });


      fabricCanvas.renderAll();

      // ✅ allow updates again after short delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }, 20);
  }, [canvasObjects, initialized, canvasObjectsMap]);

  return (
    <div ref={wrapperRef} id="canvas-wrapper">
      <canvas ref={canvasRef} id="canvas" />
    </div>
  );
}
