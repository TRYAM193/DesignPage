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
  past
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
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const handleSelection = (e) => {
      const selected = e.selected?.[0];
      if (selected && selected.customId) {
        const newId = selected.customId;
        const newType = selected.type;

        // If it's a circle-text group, treat it as 'circle-text' type in selection
        // This ensures the Toolbar sees it as a 'circle-text' and shows the radius slider
        if (newId !== selected) {
          setSelectedId(newId);
          setActiveTool(selected.textEffect === 'circle' ? 'circle-text' : newType);
        }
      }
    };

    const handleCleared = () => {
      setSelectedId(null);
      setActiveTool(null);
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

  useEffect(() => {
    if (!initialized) return;
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    let pastData

    let selectedIds = [];
    const activeObject = fabricCanvas.getActiveObject();

    const isMultiSelect = activeObject && activeObject.type?.toLowerCase() === 'activeselection';

    if (isMultiSelect) {
      selectedIds = activeObject.getObjects().map(o => o.customId);
      fabricCanvas.discardActiveObject();
    }

    isSyncingRef.current = true;
    const fabricObjects = fabricCanvas.getObjects();

    canvasObjectsMap.forEach(async (objData, id) => {
      let existing = fabricObjects.find((o) => o.customId === id);

      let newObj;
      if (objData.type === 'text') {
        if (objData.props.textEffect === 'straight') {
          newObj = StraightText(objData);
        } else if (objData.props.textEffect === 'circle') {
          newObj = CircleText(objData);
        }

        if (existing) {
          fabricCanvas.remove(existing);
        }
      }

      if (objData.type === 'image') {
        if (!existing && !fabricCanvas.getObjects().some(obj => obj.customId === objData.id)) {
          try {
            newObj = await FabricImage.fromURL(objData.src, { ...objData.props, customId: objData.id });
          } catch (err) {
            console.error("Error loading image:", err);
          }
        } else if (existing) {
          updateExisting(existing, objData, isDifferent);
        }
      }

      if (newObj) {
        newObj.customId = objData.id;
        fabricCanvas.add(newObj);
        fabricCanvas.setActiveObject(newObj);
        setTimeout(() => {
          fabricCanvas.requestRenderAll();
        }, 50);
      }

    });

    const ids = Array.from(canvasObjectsMap.keys());
    fabricObjects.forEach((obj) => {
      if (!ids.includes(obj.customId)) fabricCanvas.remove(obj);
    });

    // Z-Index Sorting
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

    if (selectedIds.length > 0) {
      const objectsToSelect = fabricCanvas.getObjects().filter(obj => selectedIds.includes(obj.customId));
      if (objectsToSelect.length > 0) {
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