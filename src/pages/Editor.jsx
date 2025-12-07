import React from 'react';
import '../styles/Editor.css';
import CanvasEditor from '../components/CanvasEditor';
import { useState } from 'react';
import addText from '../functions/text';
import updateObject from '../functions/update';
import removeObject from '../functions/remove';
import SaveDesignButton from '../components/SaveDesignButton';
import ImageHandler from '../components/Image';
import RightPanel from '../components/Toolbar';
import { undo, redo } from '../redux/canvasSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Components we need to create or modify
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
  
  // Function to toggle the sidebar
  const handleToolClick = (tool) => {
      // If the same tool is clicked, close the sidebar. Otherwise, open the new tool.
      setActivePanel(prev => prev === tool ? null : tool);
  };


  return (
    <div className="container app h-screen flex flex-col bg-gray-50"> {/* Use full height and background */}
      
      {/* 💥 TOP BAR: Project Actions & Global Controls (Header) */}
      <header className="header flex justify-between items-center h-16 px-4 border-b bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-indigo-700">TRYAM Designer</h1>
          <a href="/saved-designs" className="text-sm text-gray-500 hover:text-indigo-700">Saved Designs</a>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Undo/Redo Buttons */}
            <button
              title="Undo"
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
              onClick={() => {
                fabricCanvas.discardActiveObject()
                fabricCanvas.renderAll();
                dispatch(redo());
              }}
              disabled={future.length === 0}
            >
              <FiRotateCw size={20} />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2" /> 

            {/* Save Button */}
            {fabricCanvas && (
              <SaveDesignButton
                canvas={fabricCanvas}
                userId={userId}
                currentDesign={currentDesign}
                editingDesignId={editingDesignId}
              />
            )}

            {/* Final Action Buttons */}
            <button title="Download" className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <FiDownload size={18} />
                Export
            </button>
            <button 
                title="Order Print" 
                className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                // This will be the Shopify Checkout trigger
            >
                <FiShoppingBag size={18} />
                Order Print
            </button>
        </div>
      </header>

      {/* 💥 MAIN EDITOR BODY: Three Columns */}
      <div className="main flex flex-grow overflow-hidden">
        
        {/* 1. Thin Left Vertical Toolbar (MainTool Selector) */}
        <MainToolbar 
            activePanel={activePanel} 
            onSelectTool={handleToolClick} 
            addText={addText} // Pass initial text function
            setSelectedId={setSelectedId}
            setActiveTool={setActiveTool}
        />

        {/* 2. Wider Contextual Sidebar (Content changes based on activePanel) */}
        <ContextualSidebar 
            activePanel={activePanel} 
            setActivePanel={setActivePanel}
            // You will connect the image upload/AI components here later
        />

        {/* 3. Center Preview Area (Canvas) - Takes up remaining space */}
        <main className="preview-area flex-grow flex flex-col items-center justify-center p-8 overflow-auto bg-gray-100">
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

        {/* 4. Right Properties Panel (Toolbar for Object Properties) */}
        <aside className="right-panel w-72 border-l bg-white shadow-lg overflow-y-auto shrink-0">
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

      {/* FOOTER is now integrated into the Header's action buttons, simplifying the layout */}
    </div>
  );
}


// https://github.com/TRYAM193/DesignPage.git