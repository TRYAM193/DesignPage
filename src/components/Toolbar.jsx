// src/components/Toolbar.jsx
import React from 'react';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi'; // Icons for text styling
// Define common fonts available in most browsers (you can expand this later)
const FONT_OPTIONS = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New'];

export default function Toolbar({ id, type, object, updateObject, removeObject, addText, fabricCanvas }) {
    if (!object) {
        return (
            <div className="property-panel-message">
                <p>Select an object on the canvas to edit its properties.</p>
            </div>
        );
    }
    
    // Helper to extract nested props
    const props = object.props || {};

    // Helper to handle simple property updates (e.g., slider value)
    const handleUpdate = (key, value) => {
        updateObject(id, { [key]: value });
    };

    // Helper for Text Style (Bold/Italic/Underline)
    const toggleTextStyle = (style) => {
        // NOTE: Fabric.js properties for text are handled directly by Fabric.
        // For simplicity here, we toggle the property directly on the object props.
        let newValue;

        if (style === 'underline' || style === 'italic' || style === 'fontWeight') {
             // Toggles boolean or string state
             newValue = !props[style]; 
             handleUpdate(style, newValue);
             return;
        }

        if (style === 'bold') {
            const newWeight = props.fontWeight === 'bold' ? 'normal' : 'bold';
            handleUpdate('fontWeight', newWeight);
            return;
        }
    };


    return (
        <div className="property-panel-content">
            {/* Header: Object Type */}
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
                            onChange={(e) => handleUpdate('text', e.target.value)}
                            placeholder="Enter your text here"
                        />
                    </div>
                    
                    {/* Text Style Buttons & Font Family */}
                    <div className="control-row-buttons">
                        {/* Bold Button (Uses fontWeight) */}
                        <button 
                            className={`style-button ${props.fontWeight === 'bold' ? 'active' : ''}`}
                            onClick={() => toggleTextStyle('bold')}
                            title="Bold"
                        >
                            <FiBold size={16} />
                        </button>
                        {/* Italic Button (Uses fontStyle) */}
                        <button 
                            className={`style-button ${props.fontStyle === 'italic' ? 'active' : ''}`}
                            onClick={() => handleUpdate('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
                            title="Italic"
                        >
                            <FiItalic size={16} />
                        </button>
                        {/* Underline Button */}
                        <button 
                            className={`style-button ${props.underline ? 'active' : ''}`}
                            onClick={() => toggleTextStyle('underline')}
                            title="Underline"
                        >
                            <FiUnderline size={16} />
                        </button>
                        
                        {/* Font Family Dropdown */}
                        <select 
                            className="font-select"
                            value={props.fontFamily || 'Arial'}
                            onChange={(e) => handleUpdate('fontFamily', e.target.value)}
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
                            value={Math.round(props.fontSize || 30)}
                            onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                        />
                    </div>
                    <input
                        type="range"
                        className="slider-input"
                        min="10"
                        max="200"
                        step="1"
                        value={props.fontSize || 30}
                        onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                    />

                    {/* Text Color Control */}
                    <div className="control-row">
                        <label className="control-label">Text Color</label>
                        <input
                            type="color"
                            className="color-input"
                            value={props.fill || '#000000'}
                            onChange={(e) => handleUpdate('fill', e.target.value)}
                        />
                    </div>
                    
                    {/* Stroke Color and Width */}
                    <h3 className="property-group-subtitle">Outline</h3>

                    <div className="control-row">
                        <label className="control-label">Color</label>
                        <input
                            type="color"
                            className="color-input"
                            value={props.stroke || '#000000'}
                            onChange={(e) => handleUpdate('stroke', e.target.value)}
                        />
                    </div>
                    <div className="control-row">
                        <label className="control-label">Width</label>
                        <input
                            type="number"
                            className="number-input small"
                            value={Math.round(props.strokeWidth || 0)}
                            onChange={(e) => handleUpdate('strokeWidth', Number(e.target.value))}
                        />
                    </div>
                    <input
                        type="range"
                        className="slider-input"
                        min="0"
                        max="10"
                        step="0.5"
                        value={props.strokeWidth || 0}
                        onChange={(e) => handleUpdate('strokeWidth', Number(e.target.value))}
                    />

                </div>
            )}
            
            {/* --- 2. GENERIC PROPERTIES (Image/Text/Shape) --- */}
            <div className="property-group">
                <h3 className="property-group-title">General Appearance</h3>
                
                {/* Opacity Slider */}
                <div className="control-row">
                    <label className="control-label">Opacity</label>
                    <input
                        type="number"
                        className="number-input small"
                        value={Math.round((props.opacity || 1) * 100)}
                        onChange={(e) => handleUpdate('opacity', Number(e.target.value) / 100)}
                    />
                </div>
                <input
                    type="range"
                    className="slider-input"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round((props.opacity || 1) * 100)}
                    onChange={(e) => handleUpdate('opacity', Number(e.target.value) / 100)}
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
                        value={props.shadowColor || '#000000'}
                        onChange={(e) => handleUpdate('shadowColor', e.target.value)}
                    />
                </div>
                
                {/* Shadow Blur Slider */}
                <div className="control-row">
                    <label className="control-label">Blur</label>
                    <input
                        type="number"
                        className="number-input small"
                        value={Math.round(props.shadowBlur || 0)}
                        onChange={(e) => handleUpdate('shadowBlur', Number(e.target.value))}
                    />
                </div>
                <input
                    type="range"
                    className="slider-input"
                    min="0"
                    max="50"
                    step="1"
                    value={props.shadowBlur || 0}
                    onChange={(e) => handleUpdate('shadowBlur', Number(e.target.value))}
                />

                {/* Shadow X Offset Slider */}
                 <div className="control-row">
                    <label className="control-label">Offset X</label>
                    <input
                        type="number"
                        className="number-input small"
                        value={Math.round(props.shadowOffsetX || 0)}
                        onChange={(e) => handleUpdate('shadowOffsetX', Number(e.target.value))}
                    />
                </div>
                <input
                    type="range"
                    className="slider-input"
                    min="-10"
                    max="10"
                    step="1"
                    value={props.shadowOffsetX || 0}
                    onChange={(e) => handleUpdate('shadowOffsetX', Number(e.target.value))}
                />
                
                {/* Shadow Y Offset Slider */}
                 <div className="control-row">
                    <label className="control-label">Offset Y</label>
                    <input
                        type="number"
                        className="number-input small"
                        value={Math.round(props.shadowOffsetY || 0)}
                        onChange={(e) => handleUpdate('shadowOffsetY', Number(e.target.value))}
                    />
                </div>
                <input
                    type="range"
                    className="slider-input"
                    min="-10"
                    max="10"
                    step="1"
                    value={props.shadowOffsetY || 0}
                    onChange={(e) => handleUpdate('shadowOffsetY', Number(e.target.value))}
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