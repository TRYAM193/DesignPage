import { store } from '../redux/store';
import { setCanvasObjects } from '../redux/canvasSlice';

function addShape(type, props) {
    const state = store.getState();
    const canvasObjects = state.canvas.present;

    const newShape = {
        id: Date.now(),
        type,
        props: {
            left: 100,
            top: 100,
            fill: '#070707ff',
            stroke: '#000000',
            strokeWidth: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            ...props
        }
    }

    
  store.dispatch(setCanvasObjects([...canvasObjects, newShape]));
};

export const addRectangle = () => {
  addShape('rect', { width: 100, height: 100 });
}

export const addCircle = () => {
  addShape('circle', { radius: 50, width: 100, height: 100 }); 
};

export const addTriangle = () => {
  addShape('triangle', { width: 100, height: 100 });
};