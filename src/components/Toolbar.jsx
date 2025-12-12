// src/components/Toolbar.jsx
import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiSearch, FiExternalLink, FiLoader } from 'react-icons/fi';
import WebFont from 'webfontloader';

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
  const props = object?.props || {};
  const [liveProps, setLiveProps] = useState(props);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [showFontUrlInput, setShowFontUrlInput] = useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [originalFontFamily, setOriginalFontFamily] = useState(props.fontFamily || 'Arial'); 
  
  // Effect State
  const currentEffect = object?.textEffect || props.textEffect || 'none';
  const [radius, setRadius] = useState(props.radius || 150);

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

  const handleLiveUpdate = (key, value) => {
    setLiveProps(prev => ({ ...prev, [key]: value }));
    liveUpdateFabric(fabricCanvas, id, { [key]: value }, liveProps);
  };

  const toggleTextStyle = (style) => {
    let propKey, nextValue;
    const currentProps = object?.props || {}; 
    if (style === 'underline') {
      propKey = 'underline';
      nextValue = !currentProps.underline; 
    } else if (style === 'italic') {
      propKey = 'fontStyle';
      nextValue = currentProps.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (style === 'bold') {
      propKey = 'fontWeight';
      nextValue = currentProps.fontWeight === 'bold' ? 'normal' : 'bold';
    } else return;
    handleUpdateAndHistory(propKey, nextValue);
  };

  if (!object) {
    return <div className="property-panel-message"><p>Select an object.</p></div>;
  }

  // Treat circle-text as text for UI
  const isTextObject = type === 'text' || type === 'circle-text';

  return (
    <div className="property-panel-content">
      <h2 className="property-panel-title">
        {isTextObject ? 'Text' : type.charAt(0).toUpperCase() + type.slice(1)} Properties
      </h2>

      {isTextObject && (
        <div className="property-group">
          <h3 className="property-group-title">Text Content & Style</h3>
          <div className="control-row full-width">
            <textarea
              className="text-input"
              rows="3"
              value={props.text || object.text || ''}
              onBlur={(e) => handleUpdateAndHistory('text', e.target.value)}
              onChange={(e) => handleLiveUpdate('text', e.target.value)}
              placeholder="Enter text"
            />
          </div>

          <h3 className="property-group-subtitle">Formatting</h3>
          <div className="control-row-buttons" style={{ marginBottom: '15px' }}>
            <button className={`style-button ${liveProps.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => toggleTextStyle('bold')} title="Bold"><FiBold size={16} /></button>
            <button className={`style-button ${liveProps.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => toggleTextStyle('italic')} title="Italic"><FiItalic size={16} /></button>
            <button className={`style-button ${liveProps.underline ? 'active' : ''}`} onClick={() => toggleTextStyle('underline')} title="Underline"><FiUnderline size={16} /></button>
          </div>

          {/* Show Radius slider if it is a Circle Text */}
          {(currentEffect === 'circle' || type === 'circle-text') && (
             <div className="control-row full-width">
                <div className="control-row">
                    <label className="control-label">Radius</label>
                    <span style={{fontSize: '12px', color: '#666'}}>{radius}</span>
                </div>
                <input
                    type="range"
                    className="slider-input"
                    min="50"
                    max="400"
                    step="10"
                    value={radius}
                    onInput={(e) => setRadius(Number(e.target.value))}
                    onMouseUp={(e) => updateObject(id, { radius: Number(e.target.value) })}
                />
             </div>
          )}

          <h3 className="property-group-subtitle">Font</h3>
          <div className="control-row full-width font-control-group">
            <input type="text" className="text-input font-input" value={liveProps.fontFamily || ''} onChange={(e) => handleLiveUpdate('fontFamily', e.target.value)} disabled={isFontLoading} />
            <div className="font-link-helper">
              <button className="style-button primary-button small-button" onClick={() => handleApplyFont(liveProps.fontFamily)} disabled={!liveProps.fontFamily || isFontLoading}>{isFontLoading ? <FiLoader className="icon-spin" /> : 'Apply'}</button>
              <button className="style-button" onClick={() => setShowFontUrlInput(!showFontUrlInput)}><FiSearch size={16} /></button>
              <a href="https://fonts.google.com/" target="_blank" rel="noreferrer" className="style-button external-link-button"><FiExternalLink size={16} /></a>
            </div>
          </div>
          
          {showFontUrlInput && (
            <div className="control-row full-width font-url-input-group">
              <textarea rows="2" className="text-input" value={googleFontUrl} onChange={(e) => setGoogleFontUrl(e.target.value)} placeholder="Paste Google Fonts link..." />
              <button className="primary-button small-button" onClick={handleUrlPaste} disabled={!googleFontUrl.trim()}>Extract</button>
            </div>
          )}

          <div className="control-row">
            <label className="control-label">Size</label>
            <input type="number" className="number-input small" value={Math.round(liveProps.fontSize || 0)} onChange={(e) => handleLiveUpdate('fontSize', Number(e.target.value))} onBlur={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />
          </div>
          <input type="range" className="slider-input" min="10" max="200" value={liveProps.fontSize || 0} onInput={(e) => handleLiveUpdate('fontSize', Number(e.target.value))} onMouseUp={(e) => handleUpdateAndHistory('fontSize', Number(e.target.value))} />

          <div className="control-row">
            <label className="control-label">Color</label>
            <input type="color" className="color-input" value={liveProps.fill || '#000000'} onInput={(e) => handleLiveUpdate('fill', e.target.value)} onChange={(e) => handleUpdateAndHistory('fill', e.target.value)} />
          </div>
        </div>
      )}

      <div className="property-group">
        <h3 className="property-group-title">General</h3>
        <div className="control-row">
          <label className="control-label">Opacity</label>
          <input type="range" className="slider-input" min="0" max="100" value={Math.round((liveProps.opacity || 1) * 100)} onInput={(e) => handleLiveUpdate('opacity', Number(e.target.value) / 100)} onMouseUp={(e) => handleUpdateAndHistory('opacity', Number(e.target.value) / 100)} />
        </div>
      </div>
    </div>
  );
}