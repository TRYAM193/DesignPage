// src/functions/text.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function Text(setSelectedId, setActiveTool) {
  // Use a fresh reference to state inside the function call to ensure current data
  const getCanvasObjects = () => store.getState().canvas.present;

  function handleAddText(obj) {
    const currentObjects = getCanvasObjects();
    const newObjects = [...currentObjects, obj];
    store.dispatch(setCanvasObjects(newObjects));
    if (setActiveTool) setActiveTool(obj.type === 'circle-text' ? 'text' : obj.type);
    if (setSelectedId) setSelectedId(obj.id);
  }

  const addText = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'New Text',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 30,
        fontFamily: 'Arial',
        opacity: 1,
        textEffect: 'none' // Explicitly straight
      },
    };
    handleAddText(newText);
  };

  const addHeading = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'Heading',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 68,
        fontFamily: 'Helvetica Neue',
        fontWeight: 'bold',
        opacity: 1,
        textEffect: 'none'
      },
    };
    handleAddText(newText);
  };

  const addSubheading = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'Sub Heading',
        left: 200,
        top: 200,
        angle: 0,
        fill: '#000000',
        fontSize: 50,
        fontFamily: 'Helvetica Neue',
        fontWeight: 'bold',
        opacity: 1,
        textEffect: 'none'
      },
    };
    handleAddText(newText);
  };

  // --- NEW ADDERS ---

  const addCircleText = () => {
    const newText = {
      id: Date.now(),
      type: 'circle-text', // Special type for our CanvasEditor logic
      props: {
        text: 'Circle Text',
        left: 300,
        top: 300,
        angle: 0,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        opacity: 1,
        radius: 150,       // Default Radius
        textEffect: 'circle'
      },
    };
    handleAddText(newText);
  };

  const addArcText = () => {
    const newText = {
      id: Date.now(),
      type: 'text', // Technically standard text object with a path
      props: {
        text: 'Arc Text',
        left: 300,
        top: 300,
        angle: 0,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        opacity: 1,
        textEffect: 'arc',
        effectValue: 50 // Default curve intensity
      },
    };
    handleAddText(newText);
  };

  const addFlagText = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      props: {
        text: 'Flag Text',
        left: 300,
        top: 300,
        angle: 0,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        opacity: 1,
        textEffect: 'flag',
        effectValue: 50 // Default wave intensity
      },
    };
    handleAddText(newText);
  };

  return { addText, addHeading, addSubheading, addCircleText, addArcText, addFlagText };
}