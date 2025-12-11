// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink, FiLoader } from 'react-icons/fi'; // ADDED FiLoader
import WebFont from 'webfontloader'; // <-- NEW IMPORT

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

  const matchFamily = url.match(/family=([^&:]+)/);
  if (matchFamily && matchFamily[1]) {
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
    const mergedProps = { ...currentLiveProps, ...updates };

    finalUpdates.shadow = createFabricShadow(
      mergedProps.shadowColor,
      mergedProps.shadowBlur,
      mergedProps.shadowOffsetX,
      mergedProps.shadowOffsetY
    );

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
  // FIX: ALL HOOKS AT THE TOP LEVEL
  const props = object?.props || {};
  const [liveProps, setLiveProps] = useState(props);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [showFontUrlInput, setShowFontUrlInput] = useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [originalFontFamily, setOriginalFontFamily] = useState(props.fontFamily || 'Arial'); 


  // --- FONT APPLICATION HANDLER (Consolidated Logic) ---
  const handleApplyFont = (fontName) => {
    if (!fontName || isFontLoading) return;

    // 1. If it's a system font or the font hasn't changed, apply immediately and return
    if (FONT_OPTIONS.includes(fontName) || fontName === originalFontFamily) {
        liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps);
        handleUpdateAndHistory('fontFamily', fontName);
        return;
    }
    
    // 2. Prepare for loading (for non-system/custom Google Fonts)
    setIsFontLoading(true);
    // Temporarily apply the new font name live, which often shows a fallback font (like serif)
    liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps);
    
    WebFont.load({
      google: {
        families: [fontName],
      },
      fontactive: (familyName) => {
        setIsFontLoading(false);
        // Font loaded successfully, apply the final version to history
        handleUpdateAndHistory('fontFamily', familyName);
      },
      fontinactive: (familyName) => {
        setIsFontLoading(false);
        alert(`Failed to load font: ${familyName}. Please check the spelling or ensure it is a valid Google Font.`);
        
        // CRITICAL FIX: Revert live display and local state to the last known good font
        setLiveProps(prev => ({ ...prev, fontFamily: originalFontFamily }));
        liveUpdateFabric(fabricCanvas, id, { fontFamily: originalFontFamily }, liveProps);
        
        // Also ensure the history is reset to the original font
        handleUpdateAndHistory('fontFamily', originalFontFamily);

      },
      timeout: 3000 // Increased timeout for better resilience
    });
  };

  // Handler to parse the URL (Called on click in URL Input)
  const handleUrlPaste = () => {
    const fontName = extractFontNameFromUrl(googleFontUrl);
    if (fontName) {
      setLiveProps(prev => ({ ...prev, fontFamily: fontName }));
      setGoogleFontUrl('');
      setShowFontUrlInput(false);
      
      // Trigger the main font application process
      handleApplyFont(fontName);
    } else {
      alert('Could not extract a valid font name from the link. Please ensure you pasted the correct Google Fonts link (look for "family=").');
    }
  };


  // --- HISTORY-PUSHING HANDLER (General Properties) ---
  const handleUpdateAndHistory = (key, value) => {
    const updates = { [key]: value };
    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];

    if (shadowKeys.includes(key)) {
      updateObject(id, updates);
      const mergedProps = { ...liveProps, [key]: value };
      const shadowObject = createFabricShadow(
        mergedProps.shadowColor,
        mergedProps.shadowBlur,
        mergedProps.shadowOffsetX,
        mergedProps.shadowOffsetY
      );
      updateObject(id, { shadow: shadowObject });
      return;
    }

    updateObject(id, updates);
  };

  // --- LIVE VISUAL HANDLER ---
  const handleLiveUpdate = (key, value) => {
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps);
  };

  const toggleTextStyle = (style) => {
    let propKey;
    let nextValue;
    const currentProps = object?.props || {}; 
    console.log(currentProps)

    if (style === 'underline') {
      propKey = 'underline';
      nextValue = currentProps.underline === true ? false : true; 
    } else if (style === 'italic') {
      propKey = 'fontStyle';
      nextValue = currentProps.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (style === 'bold') {
      propKey = 'fontWeight';
      nextValue = currentProps.fontWeight === 'bold' ? 'normal' : 'bold';
    } else {
      return;
    }

    // Update local state and history
    handleUpdateAndHistory(propKey, nextValue);
  };


  // SAFE CONDITIONAL RETURN
  if (!object) {
    return (
      <div className="property-panel-message">
        <p>Select an object on the canvas to edit its properties.</p>
      </div>
    );
  }

  // --- RENDER CODE ---
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
              value={props.text || ''}
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              onChange={(e) => handleLiveUpdate('text', e.target.value)}
              placeholder="Enter your text here"
            />
          </div>

          {/* Text Style Buttons */}
          <h3 className="property-group-subtitle">Text Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px' }}>
            <button
              className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('bold')}
              style={{backgroundColor: object.props.fontWeight === 'bold' ? '#4949e5' : '', color: 'black'}}
              title="Bold"
            >
              <FiBold size={16} />
            </button>
            <button
              className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('italic')}
              title="Italic"
              style={{backgroundColor: object.props.fontStyle === 'italic' ? '#4949e5' : '', color: 'black'}}
            >
              <FiItalic size={16} />
            </button>
            <button
              className={`style-button ${liveProps.underline ? 'active' : ''}`}
              onClick={() => toggleTextStyle('underline')}
              title="Underline"
              style={{backgroundColor: object.props.underline ? '#4949e5' : '', color: 'black'}}
            >
              <FiUnderline size={16} />
            </button>
          </div>

          {/* 💥 Custom Font Input and Helper (CONSOLIDATED) */}
          <h3 className="property-group-subtitle">Font Family</h3>

          {/* Font Input + Apply Button */}
          <div className="control-row full-width font-control-group">
            <input
              type="text"
              className="text-input font-input"
              value={liveProps.fontFamily || ''}
              // Live update on change (visual update)
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)}
              placeholder="Enter font name (e.g., Roboto)"
              title="Enter a custom font name (must be loaded in your app)"
              disabled={isFontLoading}
            />

            <div className="font-link-helper">
              {/* Single Apply Button */}
              <button
                className="style-button primary-button apply small-button apply-button"
                title="Apply & Load Font"
                onClick={() => handleApplyFont(liveProps.fontFamily)}
                disabled={!liveProps.fontFamily || isFontLoading}
              >
                {isFontLoading ? <FiLoader size={16} className="icon-spin" /> : 'Apply'}
              </button>

              <button
                className="style-button"
                title="Use Google Fonts Link"
                onClick={() => setShowFontUrlInput(prev => !prev)}
                disabled={isFontLoading}
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

          {/* 💥 System Presets Dropdown (Simplified - now updates the input for the APPLY button) */}
          <h3 className="property-group-subtitle" style={{ marginTop: '15px' }}>System Presets</h3>
          <div className="control-row full-width">
            <select
              className="font-select"
              value={liveProps.fontFamily || 'Arial'}
              // Only update local state on selection
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)}
              title="Select System Font Preset"
              disabled={isFontLoading}
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
              value={Math.round(liveProps.fontSize || object.props.fontSize || 0)}
              onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
              onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
            />
          </div>
          <input
            type="range"
            className="slider-input"
            min="10"
            max="200"
            step="1"
            value={liveProps.fontSize || object.props.fontSize || 0}
            onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value))}
            onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
          />

          {/* Text Color Control */}
          <div className="control-row">
            <label className="control-label">Text Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.fill || '#000000'}
              onInput={(e) => handleLiveUpdate('fill', e.target.value)}
              onChange={(e) => handleUpdateAndHistory('fill', e.target.value)}
            />
          </div>

          {/* Stroke Color and Width */}
          <h3 className="property-group-title">Outline</h3>

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
            value={Math.round((liveProps.opacity || object.props.opacity || 0) * 100)}
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
          value={Math.round((liveProps.opacity || object.props.opacity || 0) * 100)}
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