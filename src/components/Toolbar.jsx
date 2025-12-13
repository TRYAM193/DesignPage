// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink, FiLoader, FiSlash, FiCircle, FiActivity, FiSunrise, FiFlag } from 'react-icons/fi';
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
    const newGroup = CircleText({ id: id, props: mergedProps });
    const index = fabricCanvas.getObjects().indexOf(existing);
    
    fabricCanvas.remove(existing);
    fabricCanvas.add(newGroup);
    if (index > -1) fabricCanvas.moveObjectTo(newGroup, index);
    
    fabricCanvas.setActiveObject(newGroup);
    newGroup.setCoords();
    fabricCanvas.requestRenderAll();
    return;
  }
  existing.setCoords();
  fabricCanvas.requestRenderAll();
}

export default function Toolbar({ id, type, object, updateObject, removeObject, addText, fabricCanvas }) {
  const props = object?.props || {};
  const [liveProps, setLiveProps] = useState(props);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [showFontUrlInput, setShowFontUrlInput] = useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [originalFontFamily, setOriginalFontFamily] = useState(props.fontFamily || 'Arial');

  const currentEffect = object?.textEffect || props.textEffect || 'none';
  const [radius, setRadius] = useState(props.radius || 150);

  useEffect(() => {
    if (object && object.props) {
      setLiveProps(object.props);
    }
  }, [object]);

  // --- HANDLERS ---
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
      google: { families: [fontName] },
      fontactive: (familyName) => {
        setIsFontLoading(false);
        handleUpdateAndHistory('fontFamily', familyName);
      },
      fontinactive: (familyName) => {
        setIsFontLoading(false);
        alert(`Failed to load font: ${familyName}.`);
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
      alert('Could not extract a valid font name.');
    }
  };

  const handleUpdateAndHistory = (key, value) => {
    const updates = { [key]: value };
    const shadowKeys = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];
    if (shadowKeys.includes(key)) {
      updateObject(id, updates);
      const mergedProps = { ...liveProps, [key]: value };
      const shadowObject = createFabricShadow(
        mergedProps.shadowColor, mergedProps.shadowBlur, mergedProps.shadowOffsetX, mergedProps.shadowOffsetY
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
    let propKey, nextValue;
    const currentProps = object?.props || {};
    if (style === 'underline') { propKey = 'underline'; nextValue = !currentProps.underline; }
    else if (style === 'italic') { propKey = 'fontStyle'; nextValue = currentProps.fontStyle === 'italic' ? 'normal' : 'italic'; }
    else if (style === 'bold') { propKey = 'fontWeight'; nextValue = currentProps.fontWeight === 'bold' ? 'normal' : 'bold'; }
    else return;
    handleUpdateAndHistory(propKey, nextValue);
  };

  const applyTextEffect = (effectType) => {
    let updates = { textEffect: effectType };
    if (effectType === 'circle') updates.radius = radius;
    else if (effectType === 'none') updates.path = null;
    updateObject(id, updates);
  };

  if (!object) {
    return (
      <div className="property-panel-message">
        <p>Select an object on the canvas to edit its properties.</p>
      </div>
    );
  }

  const isTextObject = type === 'text' || type === 'circle-text';
  // Check if it is a Shape
  const isShapeObject = ['rect', 'circle', 'triangle'].includes(type);

  return (
    <div className="property-panel-content">
      <h2 className="property-panel-title">
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Properties
      </h2>

      {/* --- TEXT PROPERTIES --- */}
      {isTextObject && (
        <div className="property-group">
          <h3 className="property-group-title">Text Content & Style</h3>

          <div className="control-row full-width">
            <textarea
              className="text-input"
              rows="3"
              value={liveProps.text || ''}
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              onChange={(e) => handleLiveUpdate('text', e.target.value, object)}
              placeholder="Enter your text here"
            />
          </div>

          <h3 className="property-group-subtitle">Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px', display: type === 'circle-text' ? 'none' : 'flex' }}>
             {/* ... (Existing Bold/Italic buttons kept same) ... */}
            <button className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => toggleTextStyle('bold')}><FiBold size={16} /></button>
            <button className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => toggleTextStyle('italic')}><FiItalic size={16} /></button>
            <button className={`style-button ${liveProps.underline ? 'active' : ''}`} onClick={() => toggleTextStyle('underline')}><FiUnderline size={16} /></button>
          </div>

          {/* ... (Existing Text Effects / Fonts sections kept same) ... */}
          {/* Condensed for brevity, keep your existing Font Family / Size inputs here */}
          
          <div className="control-row">
            <label className="control-label">Font Size</label>
            <input type="number" className="number-input small" value={Math.round(liveProps.fontSize || 0)} onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value), object)} onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />
          </div>
          <input type="range" className="slider-input" min="10" max="200" value={liveProps.fontSize || 0} onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value), object)} onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />

          <div className="control-row">
            <label className="control-label">Text Color</label>
            <input type="color" className="color-input" value={liveProps.fill || '#000000'} onInput={(e) => handleLiveUpdate('fill', e.target.value, object)} onChange={(e) => handleUpdateAndHistory('fill', e.target.value)} />
          </div>

          <h3 className="property-group-title">Outline</h3>
          <div className="control-row">
             <label className="control-label">Color</label>
             <input type="color" className="color-input" value={liveProps.stroke || '#000000'} onInput={(e) => handleLiveUpdate('stroke', e.target.value, object)} onChange={(e) => handleUpdateAndHistory('stroke', e.target.value)} />
          </div>
          <div className="control-row">
             <label className="control-label">Width</label>
             <input type="number" className="number-input small" value={Math.round(liveProps.strokeWidth || 0)} onChange={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value), object)} onBlur={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))} />
          </div>
          <input type="range" className="slider-input" min="0" max="10" step="0.5" value={liveProps.strokeWidth || 0} onInput={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value), object)} onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))} />
        </div>
      )}

      {/* --- SHAPE PROPERTIES (NEW) --- */}
      {isShapeObject && (
        <div className="property-group">
          <h3 className="property-group-title">Shape Style</h3>

          {/* Fill Color */}
          <div className="control-row">
            <label className="control-label">Fill Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.fill || '#000000'}
              onInput={(e) => handleLiveUpdate('fill', e.target.value, object)}
              onChange={(e) => handleUpdateAndHistory('fill', e.target.value)}
            />
          </div>

          {/* Stroke (Border) */}
          <div className="control-row">
            <label className="control-label">Border Color</label>
            <input
              type="color"
              className="color-input"
              value={liveProps.stroke || '#000000'}
              onInput={(e) => handleLiveUpdate('stroke', e.target.value, object)}
              onChange={(e) => handleUpdateAndHistory('stroke', e.target.value)}
            />
          </div>
          <div className="control-row">
            <label className="control-label">Border Width</label>
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
            max="20"
            step="1"
            value={liveProps.strokeWidth || 0}
            onInput={(e) => handleLiveUpdate('strokeWidth', Number(e.target.value), object)}
            onMouseUp={(e) => handleUpdateAndHistory('strokeWidth', Number(e.target.value))}
          />

          {/* 🆕 CORNER RADIUS (Rect Only) */}
          {type === 'rect' && (
            <>
               <div className="control-row" style={{ marginTop: '15px' }}>
                <label className="control-label">Corner Radius</label>
                <span style={{ fontSize: '12px', color: '#666' }}>{Math.round(liveProps.rx || 0)}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="0"
                max="100"
                step="1"
                value={liveProps.rx || 0}
                onInput={(e) => {
                  const val = Number(e.target.value);
                  // Update local state and Fabric manually to sync rx/ry
                  setLiveProps(prev => ({ ...prev, rx: val, ry: val }));
                  liveUpdateFabric(fabricCanvas, id, { rx: val, ry: val }, liveProps, object);
                }}
                onMouseUp={(e) => {
                   const val = Number(e.target.value);
                   updateObject(id, { rx: val, ry: val });
                }}
              />
            </>
          )}
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
      
      {/* --- 3. SHADOW EFFECT --- */}
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
          <button className="primary-button full-width">Remove Background (AI)</button>
        </div>
      )}
    </div>
  );
}