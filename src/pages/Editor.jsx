// src/pages/Editor.jsx
import React from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import { useState } from 'react';
import addText from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import RightSidebarTabs from '../components/RightSidebarTabs';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainToolbar from '../components/MainToolbar'; 
import ContextualSidebar from '../components/ContextualSidebar'; 
import { 
    FiTrash2, FiRotateCcw, FiRotateCw, FiDownload, FiSave, FiShoppingBag 
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
  const present = useSelector((state) => state.canvas.present);
  console.log(fabricCanvas.getActiveObject());
  
  const [activePanel, setActivePanel] = useState('text'); 
  
  const handleToolClick = (tool) => {
      setActivePanel(prev => prev === tool ? null : tool);
  };

  // NEW: Define the Brand Display content to be rendered in the MainToolbar
  const BrandDisplay = (
    <div className="header-brand toolbar-brand">
        <div className="logo-circle">
            <img 
                src="/assets/LOGO.png" 
                alt="TRYAM Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        </div>
        <h1>TRYAM</h1>
    </div>
  );


  return (
    // Updated container class for full height
    <div className="main-app-container">
      
      {/* 💥 REMOVED: The <header> component is gone */}
      
      {/* 💥 MAIN EDITOR BODY: Three Columns (Takes full remaining height) */}
      <div className="main full-height-main">
        
        {/* 1. Main Toolbar (Now includes brand display) */}
        <MainToolbar 
            activePanel={activePanel} 
            onSelectTool={handleToolClick} 
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
            navigation={navigation}
            brandDisplay={BrandDisplay} 
        />

        {/* 2. Contextual Sidebar */}
        {activePanel && (
            <ContextualSidebar 
                activePanel={activePanel} 
                setActivePanel={setActivePanel}
                addText={addText}
            />
        )}
        
        {/* 3. Center Preview Area (Canvas) */}
        <main className="preview-area">
            
            {/* CONSOLIDATED TOP BAR (Floating above canvas) */}
            <div className="top-bar consolidated-bar">
                
                {/* 1. Undo/Redo Controls */}
                <div className="control-group">
                    <button
                        title="Undo"
                        className="top-bar-button"
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
                        className="top-bar-button"
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
                
                {/* 2. Object Delete Control */}
                <div className="control-group divider">
                    <button title="Delete" className="top-bar-button danger" onClick={() => removeObject(selectedId)}>
                        <FiTrash2 size={20} />
                    </button>
                </div>
                
                {/* 3. Action Buttons (Save, Export, Order Print) */}
                <div className="control-group">
                    {fabricCanvas && (
                        <SaveDesignButton
                            canvas={fabricCanvas}
                            userId={userId}
                            currentDesign={currentDesign}
                            editingDesignId={editingDesignId}
                            className="top-bar-button"
                        />
                    )}
                    
                    <button title="Download" className="top-bar-button text-button">
                        <FiDownload size={18} />
                        <span>Export</span>
                    </button>
                    
                    <button 
                        title="Order Print" 
                        className="top-bar-button text-button accent"
                        onClick={() => navigation('/checkout')}
                    >
                        <FiShoppingBag size={18} />
                        <span>Order Print</span>
                    </button>
                </div>

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
          <RightSidebarTabs
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
// powershell -ExecutionPolicy Bypass -File autosync.ps1