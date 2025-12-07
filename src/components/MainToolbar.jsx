import React from 'react';
import ImageHandler from './Image';
import { 
    FiType, FiImage, FiZap, FiSquare, FiTool 
} from 'react-icons/fi'; // Re-use the confirmed icons

// Component for a single tool button
const ToolButton = ({ icon: Icon, label, isActive, onClick }) => (
    <button 
        title={label}
        onClick={onClick}
        className={`w-16 h-16 flex flex-col items-center justify-center text-xs font-medium transition-colors 
            ${isActive ? 'bg-gray-200 text-indigo-700 border-l-4 border-indigo-700' : 'text-gray-600 hover:bg-gray-100'}
        `}
    >
        <Icon size={24} className="mb-1" />
        {label}
    </button>
);

export default function MainToolbar({ activePanel, onSelectTool, addText, setSelectedId, setActiveTool }) {
  return (
    <div className="main-toolbar w-16 border-r bg-white flex flex-col shadow-sm shrink-0">
        
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
            setActiveTool={setActiveTool}
            // Since ImageHandler manages file input, we can't directly use ToolButton
            // We apply similar styles here
        >
            <div 
                className={`w-16 h-16 flex flex-col items-center justify-center text-xs font-medium transition-colors 
                    ${activePanel === 'image' ? 'bg-gray-200 text-indigo-700 border-l-4 border-indigo-700' : 'text-gray-600 hover:bg-gray-100'}
                `}
                onClick={() => onSelectTool('image')} // Keep sidebar open on click
            >
                <FiImage size={24} className="mb-1" />
                <span>Image</span>
            </div>
        </ImageHandler>

        {/* AI Tool */}
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
        
        {/* Other Tools (e.g., Templates, Tools) */}
        <ToolButton 
            icon={FiTool} 
            label="More" 
            isActive={activePanel === 'more'}
            onClick={() => onSelectTool('more')}
        />

    </div>
  );
}