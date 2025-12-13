// src/utils/canvasActions.js
import { v4 as uuidv4 } from 'uuid';

export const handleCanvasAction = (action, selectedId, canvasObjects, dispatch, setCanvasObjects) => {
  if (!selectedId || !canvasObjects) return;

  const currentIndex = canvasObjects.findIndex(o => o.id === selectedId);
  if (currentIndex === -1) return;

  const object = canvasObjects[currentIndex];
  let newObjects = [...canvasObjects];

  switch (action) {
    // --- LAYERING ---
    case 'bringForward':
      if (currentIndex < newObjects.length - 1) {
        [newObjects[currentIndex], newObjects[currentIndex + 1]] = 
        [newObjects[currentIndex + 1], newObjects[currentIndex]];
      }
      break;

    case 'bringToFront':
      newObjects.splice(currentIndex, 1);
      newObjects.push(object);
      break;

    case 'sendBackward':
      if (currentIndex > 0) {
        [newObjects[currentIndex], newObjects[currentIndex - 1]] = 
        [newObjects[currentIndex - 1], newObjects[currentIndex]];
      }
      break;

    case 'sendToBack':
      newObjects.splice(currentIndex, 1);
      newObjects.unshift(object);
      break;

    // --- DUPLICATE ---
    case 'duplicate':
      const newProps = { 
        ...object.props, 
        left: (object.props.left || 0) + 20, 
        top: (object.props.top || 0) + 20 
      };
      
      const newObj = {
        ...object,
        id: uuidv4(), // Generate new ID
        props: newProps
      };
      newObjects.push(newObj);
      break;

    // --- DELETE ---
    case 'delete':
      newObjects.splice(currentIndex, 1);
      break;

    // --- FLIP ---
    case 'flipHorizontal':
      newObjects[currentIndex] = {
        ...object,
        props: { ...object.props, flipX: !object.props.flipX }
      };
      break;

    case 'flipVertical':
      newObjects[currentIndex] = {
        ...object,
        props: { ...object.props, flipY: !object.props.flipY }
      };
      break;

    // --- LOCK/UNLOCK ---
    case 'toggleLock':
      const isLocked = object.props.lockMovementX; // Check current state
      const lockState = !isLocked;
      
      newObjects[currentIndex] = {
        ...object,
        props: {
          ...object.props,
          lockMovementX: lockState,
          lockMovementY: lockState,
          lockRotation: lockState,
          lockScalingX: lockState,
          lockScalingY: lockState,
          hasControls: !lockState, // Hide controls when locked
          // We keep 'selectable: true' so they can click it to Unlock it
        }
      };
      break;

    default:
      return;
  }

  // Dispatch update to Redux
  dispatch(setCanvasObjects(newObjects));
};