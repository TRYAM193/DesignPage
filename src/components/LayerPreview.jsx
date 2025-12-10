// src/components/LayerPreview.jsx
import React from 'react';

// Renders a small visual preview based on object type
export default function LayerPreview({ object }) {
    const { type, props } = object;
    
    const previewStyle = {
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    // --- 1. Text Preview (Shows color, font, and clipped content) ---
    if (type === 'text') {
        const textPreviewStyle = {
            color: props.fill || '#000000',
            fontFamily: props.fontFamily || 'Arial',
            fontWeight: props.fontWeight === 'bold' ? 'bold' : 'normal',
            fontStyle: props.fontStyle === 'italic' ? 'italic' : 'normal',
            textDecoration: props.underline ? 'underline' : 'none',
            fontSize: '10px',
            lineHeight: '1.2',
            maxWidth: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
        };
        const displayContent = props.text.substring(0, 10) + '...' || 'Text';

        return (
            <div style={{ ...previewStyle, backgroundColor: '#fff', padding: '2px' }} title={props.text}>
                <span style={textPreviewStyle}>{displayContent}</span>
            </div>
        );
    }

    // --- 2. Image/Shape Thumbnail ---
    if (type === 'image') {
        // If it's an image, render the source URL
        return (
            <div style={{ ...previewStyle, backgroundColor: '#fff' }}>
                <img 
                    src={props.src} 
                    alt="Thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
        );
    }
    
    if (type === 'shape') {
        // If it's a shape, render a colored box
        return (
            <div style={{
                ...previewStyle, 
                backgroundColor: props.fill || '#ddd', 
                border: '1px solid #000'
            }} title="Shape">
            </div>
        );
    }

    // Default Fallback
    return <span style={previewStyle}>{type}</span>;
}