// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi';

const FONT_OPTIONS = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New'];

const createFabricShadow = (color, blur, offsetX, offsetY) => {
  if ((!blur || blur === 0) && (offsetX === 0) && (offsetY === 0)) {
    return null;
  }

  return {
    color: color || '#000000',
    blur: blur || 0,
    offsetX: offsetX || 0,
    offsetY: offsetY || 0,
  };
};

function extractFontNameFromUrl(url) {
  if (!url) return null;

  // Pattern 1: Finds family=Font+Name in link tag or @import URL
  const matchFamily = url.match(/family=([^&:]+)/);
  if (matchFamily && matchFamily[1]) {
    // Decode and clean up (+ signs replaced by spaces)
    return decodeURIComponent(matchFamily[1].replace(/\+/g, ' '));
  }
  return null;
}

// Function to directly update the Fabric object without touching Redux history
function liveUpdateFabric(fabricCanvas, id, updates, currentLiveProps) {
  if (!fabricCanvas) return;
  const existing = fabricCanvas.getObjects().find((o) => o.customId === id);
  if (!existing) return;

  let finalUpdates = { ...updates };

  const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];
  const shadowUpdateKeys = Object.keys(updates).filter(key => shadowKeys.includes(key));

  if (shadowUpdateKeys.length > 0) {
    // Assemble the full shadow state from current live props + the single new update
    const mergedProps = { ...currentLiveProps, ...updates };

    // Create the new fabric.Shadow object
    finalUpdates.shadow = createFabricShadow(
      mergedProps.shadowColor,
      mergedProps.shadowBlur,
      mergedProps.shadowOffsetX,
      mergedProps.shadowOffsetY
    );

    // Remove individual shadow keys from finalUpdates to prevent Fabric from failing
    shadowKeys.forEach(key => delete finalUpdates[key]);
  }

  existing.set(finalUpdates);

  if (existing.type === 'text') {
    if (finalUpdates.text !== undefined || finalUpdates.fontFamily !== undefined || finalUpdates.fontSize !== undefined) {
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
  const [liveProps, setLiveProps] = useState(props);

  useEffect(() => {
    setLiveProps(props);
  }, [props, id]);


  // --- HISTORY-PUSHING HANDLER (Called on mouse up/final change) ---
  const handleUpdateAndHistory = (key, value) => {
    const updates = { [key]: value };

    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];

    if (shadowKeys.includes(key)) {
      // 1. Update the Redux store with the individual property change
      updateObject(id, updates);

      // 2. Assemble the full shadow state from liveProps, incorporating the final change
      const mergedProps = { ...liveProps, [key]: value };

      const shadowObject = createFabricShadow(
        mergedProps.shadowColor,
        mergedProps.shadowBlur,
        mergedProps.shadowOffsetX,
        mergedProps.shadowOffsetY
      );

      // 3. IMPORTANT: Push the assembled 'shadow' object to history
      // This ensures the object is saved/loaded correctly and the Fabric sync logic works
      updateObject(id, { shadow: shadowObject });
      return;
    }

    // For non-shadow properties, proceed as before
    updateObject(id, updates);
  };

  // --- LIVE VISUAL HANDLER (Called on drag/input) ---
  const handleLiveUpdate = (key, value) => {
    // 1. Update local state
    setLiveProps(prev => ({ ...prev, [key]: value }));

    // 2. Directly update Fabric object
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps);
  };

  // Helper for Text Style (Bold/Italic/Underline)
  const toggleTextStyle = (style) => {
    // ... (existing implementation for bold, italic, underline, which immediately pushes to history)
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
            <div className="control-row full-width font-control-group">
              <label className="control-label">Font Family</label>

              {/* Custom Input for Font Name */}
              <input
                type="text"
                className="text-input font-input"
                value={liveProps.fontFamily || 'Arial'}
                // Live update on input
                onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)}
                // Final update on blur
                onBlur={(e) => handleUpdateAndHistory('fontFamily', e.target.value)}
                placeholder="Enter font name (e.g., Roboto)"
                title="Enter a custom font name (must be loaded in your app)"
              />

              {/* Google Fonts Link Helper Button */}
              <div className="font-link-helper">
                <button
                  className="style-button"
                  title="Use Google Fonts Link"
                  onClick={() => setShowFontUrlInput(prev => !prev)}
                >
                  <FiSearch size={16} />
                </button>
                <a
                  href="https://fonts.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="style-button external-link-button"
                  title="Go to Google Fonts"
                >
                  <FiExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Google Fonts URL Input Section (Conditionally Rendered) */}
            {showFontUrlInput && (
              <div className="control-row full-width font-url-input-group">
                <p className="font-helper-text">Paste the full Google Fonts **link** or **@import** statement:</p>
                <textarea
                  rows="2"
                  className="text-input"
                  value={googleFontUrl}
                  onChange={(e) => setGoogleFontUrl(e.target.value)}
                  placeholder="e.g., https://fonts.googleapis.com/css2?family=Roboto..."
                />
                <button
                  className="primary-button small-button"
                  onClick={handleUrlPaste}
                  disabled={!googleFontUrl.trim()}
                >
                  Extract & Apply
                </button>
              </div>
            )}

            {/* System Font Dropdown */}
            <div className="control-row full-width" style={{ marginTop: '15px' }}>
              <label className="control-label">System Presets</label>
              <select
                className="font-select"
                value={liveProps.fontFamily || 'Arial'}
                onChange={(e) => handleUpdateAndHistory('fontFamily', e.target.value)}
                title="Select System Font Preset"
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
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

      {/* --- 3. SHADOW/EFFECTS --- */}
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
// {/* --- 1. TYPE-SPECIFIC PROPERTIES --- */}
// {type === 'text' && (
//   <div className="property-group">
//     <h3 className="property-group-title">Text Content & Style</h3>

//     {/* Text Content Input */}
//     <div className="control-row full-width">
//       <textarea
//         className="text-input"
//         rows="3"
//         value={liveProps.text || ''}
//         // Final update on blur
//         onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
//         // Live update on every change
//         onChange={(e) => handleLiveUpdate('text', e.target.value)}
//         placeholder="Enter your text here"
//       />
//     </div>

//     {/* Text Style Buttons & Font Family */}
//     <div className="control-row-buttons">
//       {/* ... (Bold, Italic, Underline buttons use history handler) ... */}
//       <button
//         className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`}
//         onClick={() => toggleTextStyle('bold')}
//         title="Bold"
//       >
//         <FiBold size={16} />
//       </button>
//       <button
//         className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`}
//         onClick={() => toggleTextStyle('italic')}
//         title="Italic"
//       >
//         <FiItalic size={16} />
//       </button>
//       <button
//         className={`style-button ${liveProps.underline ? 'active' : ''}`}
//         onClick={() => toggleTextStyle('underline')}
//         title="Underline"
//       >
//         <FiUnderline size={16} />
//       </button>

//       {/* Font Family Dropdown - HISTORY update on change */}
//       <select
//         className="font-select"
//         value={liveProps.fontFamily || 'Arial'}
//         onChange={(e) => handleUpdateAndHistory('fontFamily', e.target.value)}
//         title="Font Family"
//       >
//         {FONT_OPTIONS.map(font => (
//           <option key={font} value={font}>{font}</option>
//         ))}
//       </select>
//     </div>


//     {/* Font Size Slider */}
//     <div className="control-row">
//       <label className="control-label">Font Size</label>
//       <input
//         type="number"
//         className="number-input small"
//         value={Math.round(liveProps.fontSize || 30)}
//         // Live update on every keystroke
//         onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
//         // Final update on blur
//         onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
//       />
//     </div>
//     <input
//       type="range"
//       className="slider-input"
//       min="10"
//       max="200"
//       step="1"
//       value={liveProps.fontSize || 30}
//       // Live update on input (drag)
//       onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
//       // Final update on mouse up
//       onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
//     />

//     {/* Text Color Control */}
//     <div className="control-row">
//       <label className="control-label">Text Color</label>
//       <input
//         type="color"
//         className="color-input"
//         value={liveProps.fill || '#000000'}
//         // Live update on input (drag)
//         onInput={(e) => handleLiveUpdate('fill', e.target.value)}
//         // Final update on change (when color selection modal closes)
//         onChange={(e) => handleUpdateAndHistory('fill', e.target.value)}
//       />
//     </div>

//     {/* Stroke Color and Width */}
//     <h3 className="property-group-subtitle">Outline</h3>

//     <div className="control-row">
//       <label className="control-label">Color</label>
//       <input
//         type="color"
//         className="color-input"
//         value={liveProps.stroke || '#000000'}
//         onInput={(e) => handleLiveUpdate('stroke', e.target.value)}
//         onChange={(e) => handleUpdateAndHistory('stroke', e.target.value)}
//       />
//     </div>
//     <div className="control-row">
//       <label className="control-label">Width</label>
//       <input
//         type="number"
//         className="number-input small"
//         value={Math.round(liveProps.strokeWidth || 0)}
//         onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
//         onBlur={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
//       />
//     </div>
//     <input
//       type="range"
//       className="slider-input"
//       min="0"
//       max="10"
//       step="0.5"
//       value={liveProps.strokeWidth || 0}
//       onInput={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value))}
//       onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
//     />

//   </div>
// )}