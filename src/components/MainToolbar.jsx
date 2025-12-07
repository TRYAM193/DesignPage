// src/components/MainToolbar.jsx
import React from 'react';
import ImageHandler from './Image';
import { 
    FiType, FiImage, FiZap, FiSquare, FiTool 
} from 'react-icons/fi'; 

// Component for a single tool button
const ToolButton = ({ icon: Icon, label, isActive, onClick }) => (
    <button 
        title={label}
        onClick={onClick}
        className={`tool-button-wrapper ${isActive ? 'active' : ''}`}
    >
        <Icon size={24} />
        {label}
    </button>
);

export default function MainToolbar({ activePanel, onSelectTool, setSelectedId, setActiveTool }) {
  return (
    <div className="main-toolbar">
        
        {/* Text Tool */}
        <ToolButton 
            icon={FiType} 
            label="Text" 
            isActive={activePanel === 'text'}
            onClick={() => onSelectTool('text')}
        />

        {/* Image Tool (Using ImageHandler for file input logic) */}
        <ImageHandler 
            setSelectedId={setSelectedId} 
            setActiveTool={() => onSelectTool('image')} // Ensures sidebar opens on click
        >
            <div 
                className={`tool-button-wrapper ${activePanel === 'image' ? 'active' : ''}`}
                // The actual file input is hidden, this div handles the visual part
            >
                <FiImage size={24} />
                <span>Image</span>
            </div>
        </ImageHandler>

        {/* AI Tool - Next major feature! */}
        <ToolButton 
            icon={FiZap} 
            label="AI" 
            isActive={activePanel === 'ai'}
            onClick={() => onSelectTool('ai')}
        />
        
        {/* Shapes Tool */}
        <ToolButton 
            icon={FiSquare} 
            label="Shapes" 
            isActive={activePanel === 'shapes'}
            onClick={() => onSelectTool('shapes')}
        />

        <hr className="my-2 border-gray-200" />
        
        {/* Other Tools */}
        <ToolButton 
            icon={FiTool} 
            label="More" 
            isActive={activePanel === 'more'}
            onClick={() => onSelectTool('more')}
        />

    </div>
  );
}