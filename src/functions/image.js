import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

export default function addImage(setSelectedId, setActiveTool, src) {
  const state = store.getState();
  const canvasObjects = state.canvas.present;

  const newImage = {
    id: Date.now(),
    type: 'image',
    src,
    props: {
      left: 200,
      top: 200,
      // width: 200,
      // height: 50,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    }
  } 

  const newObjects = [...canvasObjects, newImage]
  store.dispatch(setCanvasObjects(newObjects))

  if (setActiveTool) setActiveTool(newImage.type);
  if (setSelectedId) setSelectedId(newImage.id);
}
