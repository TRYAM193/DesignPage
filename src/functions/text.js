// src/functions/addText.js
import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function Text(setSelectedId, setActiveTool) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;

  const newText = () => {
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

  const newObjects = [...canvasObjects, newText];
  store.dispatch(setCanvasObjects(newObjects));

  // Keep local UI state in sync
  if (setActiveTool) setActiveTool(newText.type);
  if (setSelectedId) setSelectedId(newText.id);
}
