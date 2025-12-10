// src/components/LayersPanel.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiTrash2 } from 'react-icons/fi';

import { reorderLayers } from '../functions/layer'; // Reordering function from Step 1
import removeObject from '../functions/remove'; // Assumed to be available
import LayerPreview from './LayerPreview'; // The visual preview component

// --- Draggable Item Component ---
const DraggableLayerItem = ({ object, index, isSelected, onSelect, onDelete }) => (
  <Draggable draggableId={object.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps} // Use the entire box as the handle
        
        className={`layer-item 
          ${isSelected ? 'active' : ''} 
          ${snapshot.isDragging ? 'is-dragging' : ''}
        `}
        onClick={() => onSelect(object.id)}
      >
        {/* Layer Content and Preview */}
        <div className="layer-content-wrapper">
            <div className="layer-thumbnail-box">
                <LayerPreview object={object} />
            </div>
            
            <span className="layer-name">
                {object.type === 'text' 
                    ? (object.props.text ? object.props.text.substring(0, 20) : 'Text') 
                    : object.type.charAt(0).toUpperCase() + object.type.slice(1)}
            </span>
        </div>
        
        {/* Controls */}
        <div className="layer-controls">
            <button 
                title="Delete" 
                onClick={(e) => { e.stopPropagation(); onDelete(object.id); }}
                className="delete-button"
            >
                <FiTrash2 size={14} />
            </button>
        </div>
      </div>
    )}
  </Draggable>
);


export default function LayersPanel({ selectedId, setSelectedId, fabricCanvas }) {
  // canvasObjects is back-to-front (index 0 is back)
  const canvasObjects = useSelector(state => state.canvas.present);
  
  // Local state for D&D operations (display order is front-to-back, matching user expectation)
  const [layers, setLayers] = useState([]);

  // Sync local state with Redux state
  useEffect(() => {
      // Re-reverse the redux state (which is back-to-front) to match the display order
      const reduxLayers = [...canvasObjects].reverse();
      setLayers(reduxLayers);
  }, [canvasObjects]);


  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return; // Dropped outside the list
    if (source.index === destination.index) return; // No change in position

    // Update local state (display order: front-to-back)
    const newDisplayOrder = Array.from(layers);
    const [removed] = newDisplayOrder.splice(source.index, 1);
    newDisplayOrder.splice(destination.index, 0, removed);
    
    setLayers(newDisplayOrder); // Update visual display

    // CRITICAL: Reverse array back to Redux order (back-to-front) before saving
    const newReduxOrder = [...newDisplayOrder].reverse();
    
    // Update Redux history with the new layer order (calls setCanvasObjects)
    reorderLayers(newReduxOrder);
  };


  const handleSelectLayer = (id) => {
    setSelectedId(id);
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => o.customId === id);
      if (obj) {
        fabricCanvas.setActiveObject(obj);
        fabricCanvas.renderAll();
      }
    }
  };
  
  const handleDeleteLayer = (id) => {
      removeObject(id);
      setSelectedId(null);
  };

  return (
    <div className="layers-panel-content">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="layer-list-droppable">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="layer-list"
            >
              {layers.length === 0 && (
                <p className="property-panel-message">No objects on the canvas.</p>
              )}
              {layers.map((obj, index) => (
                <DraggableLayerItem
                  key={obj.id}
                  object={obj}
                  index={index}
                  isSelected={obj.id === selectedId}
                  onSelect={handleSelectLayer}
                  onDelete={handleDeleteLayer}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}