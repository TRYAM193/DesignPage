// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi';

const FONT_OPTIONS = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New'];

// Function to directly update the Fabric object without touching Redux history
function liveUpdateFabric(fabricCanvas, id, updates) {
  if (!fabricCanvas) return;
  const existing = fabricCanvas.getObjects().find((o) => o.customId === id);
  if (!existing) return;

  existing.set(updates);

  // If text properties change, dimensions must be re-initialized
  if (existing.type === 'text') {
    if (updates.text !== undefined || updates.fontFamily !== undefined || updates.fontSize !== undefined) {
      existing.initDimensions();
    }
  }
  existing.setCoords();
  fabricCanvas.requestRenderAll();
}


export default function Toolbar({ id, type, object, updateObject, removeObject, addText, fabricCanvas }) {
  if (!object) {
    return (
      <div className="property-panel-message">
        <p>Select an object on the canvas to edit its properties.</p>
      </div>
    );
  }

  const props = object.props || {};

  // --- NEW LOCAL STATE FOR LIVE UPDATES ---
  // This local state holds the value being dragged/inputted.
  const [liveProps, setLiveProps] = useState(props);

  // Sync local state when the selected object changes (id changes) or Redux pushes a final update
  useEffect(() => {
    // This ensures the local state always reflects the Redux state after a final history-pushing action
    setLiveProps(props);
  }, [props, id]);


  // --- HISTORY-PUSHING HANDLER (Called on mouse up/final change) ---
  const handleUpdateAndHistory = (key, value) => {
    // 1. Update the Redux store (which pushes a single event to history)
    updateObject(id, { [key]: value });
  };

  // --- LIVE VISUAL HANDLER (Called on drag/input) ---
  const handleLiveUpdate = (key, value) => {
    // 1. Update local state
    setLiveProps(prev => ({ ...prev, [key]: value }));

    // 2. Directly update Fabric object for immediate visual feedback
    liveUpdateFabric(fabricCanvas, id, { [key]: value });
  };

  // Helper for Text Style (Bold/Italic/Underline) - Discrete actions push to history immediately
  const toggleTextStyle = (style) => {
    let newValue;

    if (style === 'underline') {
      newValue = !liveProps.underline;
      handleUpdateAndHistory('underline', newValue);
      return;
    }
    if (style === 'italic') {
      newValue = liveProps.fontStyle === 'italic' ? 'normal' : 'italic';
      handleUpdateAndHistory('fontStyle', newValue);
      return;
    }
    if (style === 'bold') {
      const newWeight = liveProps.fontWeight === 'bold' ? 'normal' : 'bold';
      handleUpdateAndHistory('fontWeight', newWeight);
      return;
    }
  };


  return (
    <div className="property-panel-content">
      <h2 className="property-panel-title">
        {type.charAt(0).toUpperCase() + type.slice(1)} Properties
      </h2>

      {/* --- 1. TYPE-SPECIFIC PROPERTIES --- */}
      {type === 'text' && (
        <div className="property-group">
          <h3 className="property-group-title">Text Content & Style</h3>

          {/* Text Content Input */}
          <div className="control-row full-width">
            <textarea
              className="text-input"
              rows="3"
              value={liveProps.text || ''}
              // Final update on blur
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              // Live update on every change
              onChange={(e) => handleLiveUpdate('text', e.target.value)}
              placeholder="Enter your text here"
            />
          </div>

          {/* Text Style Buttons & Font Family */}
          <div className="control-row-buttons">
            {/* ... (Bold, Italic, Underline buttons use history handler) ... */}
            <button
              className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('bold')}
              title="Bold"
            >
              <FiBold size={16} />
            </button>
            <button
              className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('italic')}
              title="Italic"
            >
              <FiItalic size={16} />
            </button>
            <button
              className={`style-button ${liveProps.underline ? 'active' : ''}`}
              onClick={() => toggleTextStyle('underline')}
              title="Underline"
            >
              <FiUnderline size={16} />
            </button>

            {/* Font Family Dropdown - HISTORY update on change */}
            <select
              className="font-select"
              value={liveProps.fontFamily || 'Arial'}
              onChange={(e) => handleUpdateAndHistory('fontFamily', e.target.value)}
              title="Font Family"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>


          {/* Font Size Slider */}
          <div className="control-row">
            <label className="control-label">Font Size</label>
            <input
              type="number"
              className="number-input small"
              value={Math.round(liveProps.fontSize || 30)}
              // Live update on every keystroke
              onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
              // Final update on blur
              onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
            />
          </div>
          <input
            type="range"
            className="slider-input"
            min="10"
            max="200"
            step="1"
            value={liveProps.fontSize || 30}
            // Live update on input (drag)
            onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
            // Final update on mouse up
            onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
          />

          {/* Text Color Control */}
          <div className="control-row">
            <label className="control-label">Text Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.fill || '#000000'}
              // Live update on input (drag)
              onInput={(e) => handleLiveUpdate('fill', e.target.value)}
              // Final update on change (when color selection modal closes)
              onChange={(e) => handleUpdateAndHistory('fill', e.target.value)}
            />
          </div>

          {/* Stroke Color and Width */}
          <h3 className="property-group-subtitle">Outline</h3>

          <div className="control-row">
            <label className="control-label">Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.stroke || '#000000'}
              onInput={(e) => handleLiveUpdate('stroke', e.target.value)}
              onChange={(e) => handleUpdateAndHistory('stroke', e.target.value)}
            />
          </div>
          <div className="control-row">
            <label className="control-label">Width</label>
            <input
              type="number"
              className="number-input small"
              value={Math.round(liveProps.strokeWidth || 0)}
              onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
              onBlur={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
            />
          </div>
          <input
            type="range"
            className="slider-input"
            min="0"
            max="10"
            step="0.5"
            value={liveProps.strokeWidth || 0}
            onInput={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
            onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
          />

        </div>
      )}

      {/* --- 2. GENERIC PROPERTIES (Opacity) --- */}
      <div className="property-group">
        <h3 className="property-group-title">General Appearance</h3>

        {/* Opacity Slider */}
        <div className="control-row">
          <label className="control-label">Opacity</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round((liveProps.opacity || 1) * 100)}
            onChange={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100)}
            onBlur={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="0"
          max="100"
          step="1"
          value={Math.round((liveProps.opacity || 1) * 100)}
          onInput={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100)}
          onMouseUp={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)}
        />
      </div>

      {/* --- 3. SHADOW/EFFECTS (Shadow Blur, Offset X, Offset Y) --- */}
      <div className="property-group">
        <h3 className="property-group-title">Shadow Effect</h3>

        {/* Shadow Color */}
        <div className="control-row">
          <label className="control-label">Shadow Color</label>
          <input
            type="color"
            className="color-input"
            value={liveProps.shadowColor || '#000000'}
            onInput={(e) => handleLiveUpdate('shadowColor', e.target.value)}
            onChange={(e) => handleUpdateAndHistory('shadowColor', e.target.value)}
          />
        </div>

        {/* Shadow Blur Slider */}
        <div className="control-row">
          <label className="control-label">Blur</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowBlur || 0)}
            onChange={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value))}
            onBlur={(e) => handleUpdateAndHistory('shadowBlur', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="0"
          max="50"
          step="1"
          value={liveProps.shadowBlur || 0}
          onInput={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value))}
          onMouseUp={(e) => handleUpdateAndHistory('shadowBlur', Number(e.target.value))}
        />

        {/* Shadow X Offset Slider */}
        <div className="control-row">
          <label className="control-label">Offset X</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetX || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value))}
            onBlur={(e) => handleUpdateAndHistory('shadowOffsetX', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="-10"
          max="10"
          step="1"
          value={liveProps.shadowOffsetX || 0}
          onInput={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value))}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetX', Number(e.target.value))}
        />

        {/* Shadow Y Offset Slider */}
        <div className="control-row">
          <label className="control-label">Offset Y</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetY || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value))}
            onBlur={(e) => handleUpdateAndHistory('shadowOffsetY', Number(e.target.value))}
          />
        </div>
        <input
          type="range"
          className="slider-input"
          min="-10"
          max="10"
          step="1"
          value={liveProps.shadowOffsetY || 0}
          onInput={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value))}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetY', Number(e.target.value))}
        />
      </div>

      {/* --- 4. IMAGE-SPECIFIC ACTIONS --- */}
      {type === 'image' && (
        <div className="property-group">
          <button className="primary-button full-width">
            Remove Background (AI)
          </button>
          <button className="secondary-button full-width">
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}