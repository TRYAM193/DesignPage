import React from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import { useState } from 'react';
import addText from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import RightPanel from '../components/Toolbar';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// New Components
import MainToolbar from '../components/MainToolbar'; 
import ContextualSidebar from '../components/ContextualSidebar'; 
// Re-import icons that we know work
import { 
  FiRotateCcw, FiRotateCw, FiTrash2, FiDownload, FiSave, FiShoppingBag 
} from 'react-icons/fi';


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
  
  // NEW STATE: Controls which panel is open (e.g., 'ai', 'shapes', 'text')
  const [activePanel, setActivePanel] = useState('text'); 
  
  const handleToolClick = (tool) => {
      // If the same tool is clicked, close the sidebar. Otherwise, open the new tool.
      setActivePanel(prev => prev === tool ? null : tool);
  };


  return (
    // Updated root class
    <div className="container app">
      
      {/* TOP BAR: Project Actions & Global Controls (Header) */}
      <header className="header">
        <div className="flex items-center gap-4">
          <h1>TRYAM Designer</h1>
          <a href="/saved-designs" className="text-sm text-gray-500 hover:text-indigo-700">Saved Designs</a>
        </div>
        
        <div className="header-actions">
            {/* Undo/Redo Buttons (Moved from top-bar to header) */}
            <div className="header-undo-redo">
                <button
                title="Undo"
                onClick={() => {
                    fabricCanvas.discardActiveObject()
                    fabricCanvas.renderAll();
                    dispatch(undo())
                }}
                disabled={past.length === 0}
                >
                <FiRotateCcw size={20} />
                </button>
                <button
                title="Redo"
                onClick={() => {
                    fabricCanvas.discardActiveObject()
                    fabricCanvas.renderAll();
                    dispatch(redo());
                }}
                disabled={future.length === 0}
                >
                <FiRotateCw size={20} />
                </button>
            </div>
            <div className="header-divider" /> 

            {/* Save Button */}
            {fabricCanvas && (
              <SaveDesignButton
                canvas={fabricCanvas}
                userId={userId}
                currentDesign={currentDesign}
                editingDesignId={editingDesignId}
                className="header-button"
              >
                  <FiSave size={18} /> 
                  <span>Save</span>
              </SaveDesignButton>
            )}

            {/* Final Action Buttons */}
            <button title="Download" className="header-button export">
                <FiDownload size={18} />
                <span>Export</span>
            </button>
            <button 
                title="Order Print" 
                className="header-button"
                // This is the trigger for your final Shopify/POD logic
                onClick={() => navigation('/checkout')}
            >
                <FiShoppingBag size={18} />
                <span>Order Print</span>
            </button>
        </div>
      </header>

      {/* MAIN EDITOR BODY: Three Columns */}
      <div className="main">
        
        {/* 1. Main Toolbar (Tool Selector) */}
        <MainToolbar 
            activePanel={activePanel} 
            onSelectTool={handleToolClick} 
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
        />

        {/* 2. Contextual Sidebar (Tool Content) */}
        {activePanel && (
            <ContextualSidebar 
                activePanel={activePanel} 
                setActivePanel={setActivePanel}
                addText={addText}
            />
        )}
        
        {/* 3. Center Preview Area (Canvas) */}
        <main className="preview-area">
            {/* Canvas Controls (Only Delete remains here for object-specific action) */}
            <div className="top-bar">
                 <button title="Delete" onClick={() => removeObject(selectedId)}>
                    <FiTrash2 size={20} />
                </button>
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

        {/* 4. Right Properties Panel */}
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
    </div>
  );
}

// https://github.com/TRYAM193/DesignPage.git