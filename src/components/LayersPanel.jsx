// src/components/LayersPanel.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter } from '@dnd-kit/core';

import { FiTrash2 } from 'react-icons/fi';
import { reorderLayers } from '../functions/layer'; // <-- NEW IMPORT
import removeObject from '../functions/remove'; // Assumed to be available
import LayerPreview from './LayerPreview'; // <-- NEW IMPORT

// --- Sortable Item Component ---
const SortableItem = ({ id, object, isSelected, onSelect, onDelete, fabricCanvas }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSelected ? 20 : 'auto', // Keep selected item elevated
  };
  
  // Logic to handle name display based on type
  const displayName = object.type === 'text' 
    ? (object.props.text ? object.props.text.substring(0, 20) : 'Text') 
    : object.type.charAt(0).toUpperCase() + object.type.slice(1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(id)}
    >
      {/* Draggable Handle */}
      <div className="layer-handle" {...listeners} {...attributes} title="Drag to reorder">
        <span style={{ fontSize: '16px', cursor: 'grab', marginRight: '8px' }}>&#x2261;</span>
      </div>

      {/* Layer Content and Preview */}
      <div className="layer-content-wrapper">
          <div className="layer-thumbnail-box">
              <LayerPreview object={object} />
          </div>
          
          <span className="layer-name">{displayName}</span>
      </div>
      
      {/* Controls */}
      <div className="layer-controls">
          <button 
              title="Delete" 
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
              className="delete-button"
          >
              <FiTrash2 size={14} />
          </button>
      </div>
    </div>
  );
};


export default function LayersPanel({ selectedId, setSelectedId, fabricCanvas }) {
  // canvasObjects is back-to-front (index 0 is back)
  const canvasObjects = useSelector(state => state.canvas.present);
  
  // Local state for D&D operations (display order is front-to-back, matching user expectation)
  const [layers, setLayers] = useState([...canvasObjects].reverse());

  // Sync local state with Redux state (important after undo/redo/normal updates)
  useEffect(() => {
      // Re-reverse the redux state (which is back-to-front) to match the display order
      const reduxLayers = [...canvasObjects].reverse();
      setLayers(reduxLayers);
  }, [canvasObjects]);


  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layers.findIndex(obj => obj.id === active.id);
    const newIndex = layers.findIndex(obj => obj.id === over.id);

    // Update local state (display order: front-to-back)
    const newDisplayOrder = arrayMove(layers, oldIndex, newIndex);
    setLayers(newDisplayOrder);

    // CRITICAL: Reverse array back to Redux order (back-to-front) before saving
    const newReduxOrder = [...newDisplayOrder].reverse();
    
    // Update Redux history with the new layer order
    reorderLayers(newReduxOrder);
    
    // Select the dragged object again to refresh controls
    setSelectedId(active.id);
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
      <DndContext 
        sensors={[]} 
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="layer-list">
          {layers.length === 0 && (
            <p className="property-panel-message">No objects on the canvas.</p>
          )}
          
          <SortableContext
            items={layers.map(obj => obj.id)}
            strategy={verticalListSortingStrategy}
          >
            {layers.map((obj) => (
              <SortableItem
                key={obj.id}
                id={obj.id}
                object={obj}
                isSelected={obj.id === selectedId}
                onSelect={handleSelectLayer}
                onDelete={handleDeleteLayer}
                fabricCanvas={fabricCanvas}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}