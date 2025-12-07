// src/components/MainToolbar.jsx
import React from 'react';
import ImageHandler from './Image';
import { 
    FiType, FiImage, FiZap, FiSquare, FiTool, FiFolder // <-- Added FiFolder
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

export default function MainToolbar({ activePanel, onSelectTool, setSelectedId, setActiveTool, navigation }) {
  return (
    <div className="main-toolbar">
        {/* NEW: Saved Designs Link */}
        <button 
            title="Saved Designs"
            onClick={() => navigation('/saved-designs')}
            className="tool-button-wrapper saved-designs-link"
        >
            <FiFolder size={24} />
            <span>Saved</span>
        </button>
        <hr className="toolbar-divider" />
        
        {/* Text Tool */}
        <ToolButton 
            icon={FiType} 
            label="Text" 
            isActive={activePanel === 'text'}
            onClick={() => onSelectTool('text')}
        />
        {/* ... rest of the tools ... */}
        <ImageHandler 
            setSelectedId={setSelectedId} 
            setActiveTool={onSelectTool} 
            className={`tool-button-wrapper ${activePanel === 'image' ? 'active' : ''}`}
        >
            <FiImage size={24} />
            <span>Image</span>
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
        <hr className="toolbar-divider" />
        <ToolButton 
            icon={FiTool} 
            label="More" 
            isActive={activePanel === 'more'}
            onClick={() => onSelectTool('more')}
        />
    </div>
  );
}