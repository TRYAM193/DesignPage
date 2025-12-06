import React from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import { useState, useEffect } from 'react';
import addText from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import ImageHandler from '../components/Image';
import RightPanel from '../components/Toolbar';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ShapesSidebar from '../components/ShapesSidebar';

export default function EditorPanel() {
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [editingDesignId, setEditingDesignId] = useState(null);
  const userId = 'test-user-123';
  const navigation = useNavigate()
  const dispatch = useDispatch();
  const canvasObjects = useSelector((state) => state.canvas.present);
  const past = useSelector((state) => state.canvas.past);
  const future = useSelector((state) => state.canvas.future);
  console.log(useSelector(o => o.canvas.present))
  const [isShapesOpen, setIsShapesOpen] = useState(false); 

  return (
    <div className="container app">
      <header className="header">
        <h1>TRYAM Designer</h1>
        <a href="/saved-designs" className="saved-designs-link">Saved Designs</a>
      </header>

      <div className="main">
        <ShapesSidebar 
         isOpen={isShapesOpen} 
         onClose={() => setIsShapesOpen(false)} 
       />
        <aside className="left-panel">
          <button onClick={() => addText(setSelectedId, setActiveTool)}>
            Text
          </button>
          <ImageHandler
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
          />
          <button>AI</button>
          <button onClick={() => setIsShapesOpen(!isShapesOpen)}>Shapes</button>
          <button onClick={() => console.log(fabricCanvas.getActiveObject())}>
            Testing
          </button>
        </aside>

        <main className="preview-area">
          <div className="top-bar">
            <button
              onClick={() => {
                fabricCanvas.discardActiveObject()
                fabricCanvas.renderAll();
                dispatch(undo())
              }}
              disabled={past.length === 0}
            >
              Undo
            </button>
            <button
              onClick={() => {
                fabricCanvas.discardActiveObject()
                fabricCanvas.renderAll();
                dispatch(redo());
              }}
              disabled={future.length === 0}
            >
              Redo
            </button>
            <button onClick={() => removeObject(selectedId)}>Delete</button>
            {fabricCanvas && (
              <SaveDesignButton
                canvas={fabricCanvas}
                userId={userId}
                currentDesign={currentDesign}
                editingDesignId={editingDesignId}
              />
            )}
          </div>

          <CanvasEditor
            setFabricCanvas={setFabricCanvas}
            canvasObjects={canvasObjects}
            setActiveTool={setActiveTool}
            setSelectedId={setSelectedId}
            fabricCanvas={fabricCanvas}
            setCurrentDesign={setCurrentDesign}
            setEditingDesignId={setEditingDesignId}
          />
        </main>

        <aside className="right-panel">
          <RightPanel
            id={selectedId}
            type={activeTool}
            object={canvasObjects.find((obj) => obj.id === selectedId)}
            updateObject={updateObject}
            removeObject={removeObject}
            addText={addText}
            fabricCanvas={fabricCanvas}
          />
        </aside>
      </div>
      <footer>
        <button onClick={() => navigation('/preview3d')}>
          3D Mockup
        </button>
      </footer>
    </div>
  );
}


// https://github.com/TRYAM193/DesignPage.git