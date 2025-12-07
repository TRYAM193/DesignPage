// src/pages/Editor.jsx
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
import MainToolbar from '../components/MainToolbar'; 
import ContextualSidebar from '../components/ContextualSidebar'; 
// Re-import all needed icons
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
  
  const [activePanel, setActivePanel] = useState('text'); 
  
  const handleToolClick = (tool) => {
      setActivePanel(prev => prev === tool ? null : tool);
  };


  return (
    <div className="container app">
      
      {/* 💥 1. HEADER: Logo and Title Only (Top 50px) */}
      <header className="header simplified-header">
        <div className="header-brand">
            <div className="logo-circle">
                <span>T</span>
            </div>
            <h1>TRYAM</h1>
        </div>
      </header>
      
      {/* 💥 2. MAIN EDITOR BODY: Three Columns (Takes remaining height) */}
      <div className="main">
        
        {/* 1. Main Toolbar */}
        <MainToolbar 
            activePanel={activePanel} 
            onSelectTool={handleToolClick} 
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
            navigation={navigation}
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
            
            {/* 💥 CONSOLIDATED TOP BAR (Undo, Redo, Delete, Save, Export, Order Print) */}
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
                        disabled={future.length === 0}t
                        s
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
                        className="top-bar-button text-button "
                        onClick={() => navigation('/checkout')}
                    >
                        <FiShoppingBag size={18} />
                        <span>Order</span>
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