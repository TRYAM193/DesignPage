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
import CanvasControlBar from '../components/CanvasControlBar';
import { FiTrash2 } from 'react-icons/fi';


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
      
      {/* 💥 1. HEADER: Logo and Title Only */}
      <header className="header simplified-header">
        <div className="header-brand">
            <div className="logo-circle">
                <span>T</span> {/* Placeholder for empty LOGO.svg */}
            </div>
            <h1>TRYAM</h1>
        </div>
      </header>
      
      {/* 💥 2. CONTROL BAR: Undo, Redo, Save, Export */}
      <CanvasControlBar
          fabricCanvas={fabricCanvas}
          dispatch={dispatch}
          undo={undo}
          redo={redo}
          past={past}
          future={future}
          userId={userId}
          currentDesign={currentDesign}
          editingDesignId={editingDesignId}
      />

      {/* 💥 3. MAIN EDITOR BODY: Three Columns */}
      <div className="main">
        
        {/* 1. Main Toolbar (With Saved Designs Link) */}
        <MainToolbar 
            activePanel={activePanel} 
            onSelectTool={handleToolClick} 
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
            navigation={navigation} // Passed for the Saved Designs link
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
            {/* Object Controls (Only Delete remains here) */}
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