// src/functions/addText.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function Text(setSelectedId, setActiveTool) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;

  function handleAddText(obj) {
    const newObjects = [...canvasObjects, obj];
    store.dispatch(setCanvasObjects(newObjects));
    if (setActiveTool) setActiveTool(obj.type);
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
        fill: '#fe0404',
        fontSize: 30,
        fontFamily: 'Arial',
        opacity: 1,
        shadow: true,
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: -2,
        shadowColor: '#000000',
        charSpacing: 1,
        stroke: '#f70000',
        strokeWidth: 1,
        textStyle: 'straight'
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
        shadow: true,
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: -2,
        shadowColor: '#000000',
        charSpacing: 1,
        stroke: null,
        strokeWidth: 0,
        textStyle: 'straight'
      },
    };
    handleAddText(newText);
  }

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
        fontSize: 39,
        fontFamily: 'Helvetica Neue',
        fontWeight: 'bold',
        opacity: 1,
        shadow: true,
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: -2,
        shadowColor: '#000000',
        charSpacing: 1,
        stroke: null,
        strokeWidth: 0,
        textStyle: 'straight'
      },
    }
    handleAddText(newText);
  }
  return { addText, addHeading, addSubheading };
}
