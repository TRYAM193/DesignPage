// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink, FiLoader, FiSlash, FiCircle, FiActivity, FiSunrise, FiFlag } from 'react-icons/fi'; // ADDED FiSunrise, FiFlag
import WebFont from 'webfontloader';
import CircleText from '../objectAdders/CircleText';

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
function liveUpdateFabric(fabricCanvas, id, updates, currentLiveProps, object) {
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

  if (existing.textEffect === 'circle') {
    const mergedProps = { ...currentLiveProps, ...updates };

    // 1. Generate the new group with updated props
    const newGroup = CircleText({
      id: id,
      props: mergedProps
    });

    // 2. Preserve Z-Index (stacking order)
    const index = fabricCanvas.getObjects().indexOf(existing);

    // 3. Swap the objects
    fabricCanvas.remove(existing);
    fabricCanvas.add(newGroup);

    // Move to original position in stack
    if (index > -1) {
      fabricCanvas.moveObjectTo(newGroup, index);
    }

    // 4. Restore Selection
    fabricCanvas.setActiveObject(newGroup);

    // 5. Render
    newGroup.setCoords();
    fabricCanvas.requestRenderAll();
    return;
  }
  existing.setCoords();
  fabricCanvas.requestRenderAll();
}

const Outline = ({liveProps, handleLiveUpdate, handleUpdateAndHistory, object}) => (
  <>
    <h3 className="property-group-title">Outline</h3>

    <div className="control-row">
      <label className="control-label">Color</label>
      <input
        type="color"
        className="color-input"
        value={liveProps.stroke || '#000000'}
        onInput={(e) => handleLiveUpdate('stroke', e.target.value, object)}
        onChange={(e) => handleUpdateAndHistory('stroke', e.target.value)}
      />
    </div>
    <div className="control-row">
      <label className="control-label">Width</label>
      <input
        type="number"
        className="number-input small"
        value={Math.round(liveProps.strokeWidth || 0)}
        onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value), object)}
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
      onInput={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value), object)}
      onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
    />
</>
)


export default function Toolbar({ id, type, object, updateObject, removeObject, addText, fabricCanvas }) {
  const props = object?.props || {};
  const [liveProps, setLiveProps] = useState(props);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [showFontUrlInput, setShowFontUrlInput] = useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [originalFontFamily, setOriginalFontFamily] = useState(props.fontFamily || 'Arial');

  // Text Effect State (from props or default)
  // We use object.textEffect if available (for circle-text which stores it on object root) or props.textEffect
  const currentEffect = object?.textEffect || props.textEffect || 'none';
  const [radius, setRadius] = useState(props.radius || 150); // Radius for Circle

  useEffect(() => {
    if (object && object.props) {
      setLiveProps(object.props);
    }
  }, [object]);

  // --- FONT APPLICATION HANDLER (Consolidated Logic) ---
  const handleApplyFont = (fontName) => {
    if (!fontName || isFontLoading) return;

    if (FONT_OPTIONS.includes(fontName) || fontName === originalFontFamily) {
      liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps);
      handleUpdateAndHistory('fontFamily', fontName);
      return;
    }

    setIsFontLoading(true);
    liveUpdateFabric(fabricCanvas, id, { fontFamily: fontName }, liveProps);

    WebFont.load({
      google: {
        families: [fontName],
      },
      fontactive: (familyName) => {
        setIsFontLoading(false);
        handleUpdateAndHistory('fontFamily', familyName);
      },
      fontinactive: (familyName) => {
        setIsFontLoading(false);
        alert(`Failed to load font: ${familyName}. Please check the spelling.`);
        setLiveProps(prev => ({ ...prev, fontFamily: originalFontFamily }));
        liveUpdateFabric(fabricCanvas, id, { fontFamily: originalFontFamily }, liveProps);
        handleUpdateAndHistory('fontFamily', originalFontFamily);
      },
      timeout: 3000
    });
  };

  const handleUrlPaste = () => {
    const fontName = extractFontNameFromUrl(googleFontUrl);
    if (fontName) {
      setLiveProps(prev => ({ ...prev, fontFamily: fontName }));
      setGoogleFontUrl('');
      setShowFontUrlInput(false);
      handleApplyFont(fontName);
    } else {
      alert('Could not extract a valid font name from the link.');
    }
  };

  const handleUpdateAndHistory = (key, value) => {
    const updates = { [key]: value };
    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];
    const shapes = 

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

  const handleLiveUpdate = (key, value, object = null) => {
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps, object);
  };

  const toggleTextStyle = (style) => {
    let propKey;
    let nextValue;
    const currentProps = object?.props || {};

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
    handleUpdateAndHistory(propKey, nextValue);
  };

  const applyTextEffect = (effectType) => {
    // Determine target updates based on effect type
    // Note: Actual implementation for semicircle/flag will be handled in CanvasEditor later
    let updates = { textEffect: effectType };

    if (effectType === 'circle') {
      updates.radius = radius;
    } else if (effectType === 'none') {
      updates.path = null; // Clear path for straight text
    }

    updateObject(id, updates);
  };


  if (!object) {
    return (
      <div className="property-panel-message">
        <p>Select an object on the canvas to edit its properties.</p>
      </div>
    );
  }

  // Determine effective type (handle circle-text as 'text' for UI purposes)
  const isTextObject = type === 'text' || type === 'circle-text';

  return (
    <div className="property-panel-content">
      <h2 className="property-panel-title">
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Properties
      </h2>

      {isTextObject && (
        <div className="property-group">
          <h3 className="property-group-title">Text Content & Style</h3>

          <div className="control-row full-width">
            <textarea
              className="text-input"
              rows="3"
              value={liveProps.text || ''} // Handle text on props or root
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              onChange={(e) => handleLiveUpdate('text', e.target.value, object)}
              placeholder="Enter your text here"
            />
          </div>

          <h3 className="property-group-subtitle">Text Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px', display: type === 'circle-text' ? 'none' : 'flex' }}>
            <button
              className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('bold')}
              style={{ backgroundColor: object.props.fontWeight === 'bold' ? '#4949e5' : '', color: 'black' }}
              title="Bold"
            >
              <FiBold size={16} />
            </button>
            <button
              className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => toggleTextStyle('italic')}
              title="Italic"
              style={{ backgroundColor: object.props.fontStyle === 'italic' ? '#4949e5' : '', color: 'black' }}
            >
              <FiItalic size={16} />
            </button>
            <button
              className={`style-button ${liveProps.underline ? 'active' : ''}`}
              onClick={() => toggleTextStyle('underline')}
              title="Underline"
              style={{ backgroundColor: object.props.underline ? '#4949e5' : '', color: 'black' }}
            >
              <FiUnderline size={16} />
            </button>
          </div>

          {/* --- TEXT EFFECTS SECTION --- */}
          <h3 className="property-group-subtitle">Text Effects</h3>
          <div className="control-row-buttons">
            <button
              className={`style-button ${currentEffect === 'straight' ? 'active' : ''}`}
              onClick={() => applyTextEffect('straight')}
              title="Straight"
            >
              <FiSlash size={16} />
            </button>
            <button
              className={`style-button ${currentEffect === 'circle' ? 'active' : ''}`}
              onClick={() => applyTextEffect('circle')}
              title="Circle"
            >
              <FiCircle size={16} />
            </button>
            {/* Semicircle Button */}
            <button
              className={`style-button ${currentEffect === 'semicircle' ? 'active' : ''}`}
              onClick={() => applyTextEffect('semicircle')}
              title="Semicircle"
            >
              <FiSunrise size={16} />
            </button>
            {/* Flag Button */}
            <button
              className={`style-button ${currentEffect === 'flag' ? 'active' : ''}`}
              onClick={() => applyTextEffect('flag')}
              title="Flag"
            >
              <FiFlag size={16} />
            </button>
          </div>

          {/* Effect Controls */}
          {currentEffect === 'circle' && (
            <div className="control-row full-width">
              <div className="control-row">
                <label className="control-label">Radius</label>
                <span style={{ fontSize: '12px', color: '#666' }}>{radius}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="50"
                max="400"
                step="10"
                value={radius}
                onInput={(e) => {
                  const val = Number(e.target.value);
                  setRadius(val);
                }}
                onMouseUp={(e) => {
                  updateObject(id, { radius: Number(e.target.value) });
                }}
                onChange={(e) => handleLiveUpdate('radius', Number(e.target.value), object)}
              />
            </div>
          )}
          {/* Placeholders for Semicircle/Flag intensity if needed later */}
          {/* {(currentEffect === 'semicircle' || currentEffect === 'flag') && ( ... )} */}


          <h3 className="property-group-subtitle">Font Family</h3>

          <div className="control-row full-width font-control-group">
            <input
              type="text"
              className="text-input font-input"
              value={liveProps.fontFamily || ''}
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value, object)}
              placeholder="Enter font name (e.g., Roboto)"
              disabled={isFontLoading}
            />

            <div className="font-link-helper">
              <button
                className="style-button primary-button apply small-button apply-button"
                onClick={() => handleApplyFont(liveProps.fontFamily)}
                disabled={!liveProps.fontFamily || isFontLoading}
              >
                {isFontLoading ? <FiLoader size={16} className="icon-spin" /> : 'Apply'}
              </button>

              <button
                className="style-button"
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
              >
                <FiExternalLink size={16} />
              </a>
            </div>
          </div>

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

          <h3 className="property-group-subtitle" style={{ marginTop: '15px' }}>System Presets</h3>
          <div className="control-row full-width">
            <select
              className="font-select"
              value={liveProps.fontFamily || 'Arial'}
              onChange={(e) => handleLiveUpdate('fontFamily', e.target.value, object)}
              disabled={isFontLoading}
            >
              {FONT_OPTIONS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>


          <div className="control-row">
            <label className="control-label">Font Size</label>
            <input
              type="number"
              className="number-input small"
              value={Math.round(liveProps.fontSize || object.props.fontSize || 0)}
              onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value), object)}
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
            onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value), object)}
            onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))}
          />

          <div className="control-row">
            <label className="control-label">Text Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.fill || '#000000'}
              onInput={(e) => handleLiveUpdate('fill', e.target.value, object)}
              onChange={(e) => handleUpdateAndHistory('fill', e.target.value)}
            />
          </div>

          <Outline liveProps={liveProps} handleLiveUpdate={handleLiveUpdate} handleUpdateAndHistory={handleUpdateAndHistory} object={object} />

        </div>
      )}

      {/* --- 2. GENERIC PROPERTIES (Opacity) --- */}
      <div className="property-group">
        <h3 className="property-group-title">General Appearance</h3>

        <div className="control-row">
          <label className="control-label">Opacity</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round((liveProps.opacity || object.props.opacity || 0) * 100)}
            onChange={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100, object)}
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
          onInput={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100, object)}
          onMouseUp={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)}
        />
      </div>

      {['rect', 'circle', 'triangle'].includes(type) && (
        <Outline liveProps={liveProps} handleLiveUpdate={handleLiveUpdate} handleUpdateAndHistory={handleUpdateAndHistory} object={object} />
      )}

      {/* --- 3. SHADOW/EFFECTS --- */}
      <div className="property-group">
        <h3 className="property-group-title">Shadow Effect</h3>

        <div className="control-row">
          <label className="control-label">Shadow Color</label>
          <input
            type="color"
            className="color-input"
            value={liveProps.shadowColor || '#000000'}
            onInput={(e) => handleLiveUpdate('shadowColor', e.target.value, object)}
            onChange={(e) => handleUpdateAndHistory('shadowColor', e.target.value)}
          />
        </div>

        <div className="control-row">
          <label className="control-label">Blur</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowBlur || 0)}
            onChange={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value), object)}
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
          onInput={(e) => handleLiveUpdate('shadowBlur', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowBlur', Number(e.target.value))}
        />

        <div className="control-row">
          <label className="control-label">Offset X</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetX || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value), object)}
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
          onInput={(e) => handleLiveUpdate('shadowOffsetX', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetX', Number(e.target.value))}
        />

        <div className="control-row">
          <label className="control-label">Offset Y</label>
          <input
            type="number"
            className="number-input small"
            value={Math.round(liveProps.shadowOffsetY || 0)}
            onChange={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value), object)}
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
          onInput={(e) => handleLiveUpdate('shadowOffsetY', Number(e.target.value), object)}
          onMouseUp={(e) => handleUpdateAndHistory('shadowOffsetY', Number(e.target.value))}
        />
      </div>

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