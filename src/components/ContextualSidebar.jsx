import React from 'react';
// Assuming you will need to import your AI Sidebar and Shapes Sidebar logic here
import ShapesSidebar from './ShapesSidebar'; // Your existing component
// import AISidebar from './AISidebar'; // Component we will create next

export default function ContextualSidebar({ activePanel, setActivePanel }) {
  
  // This state is just for example; we will replace it with actual content
  let ContentComponent = null;

  switch (activePanel) {
    case 'text':
      ContentComponent = () => (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Add Text</h2>
          <button className="w-full p-3 bg-gray-100 rounded-md hover:bg-gray-200">
            Add a text box
          </button>
          {/* Future: Font Presets, Heading Styles, etc. */}
        </div>
      );
      break;
    case 'image':
      ContentComponent = () => (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Uploads & Library</h2>
            <p className='text-sm text-gray-500'>Upload button already handled in MainToolbar.</p>
            {/* Future: Library of previously uploaded images */}
        </div>
      );
      break;
    case 'ai':
      ContentComponent = () => (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">AI Design Generator</h2>
          {/* This is where the DALL-E input component will go */}
          <p className='text-sm text-gray-500'>[DALL-E Prompt Input & Gallery]</p>
        </div>
      );
      break;
    case 'shapes':
      // Reuse your existing ShapesSidebar component, adapting it to the new layout
      // For now, we use a simple content placeholder. You may need to adjust ShapesSidebar.jsx
      ContentComponent = ShapesSidebar;
      break;
    default:
      ContentComponent = null; // No content if panel is closed
  }

  // Conditional Rendering: Only show if a panel is active
  if (!activePanel) {
    return null;
  }

  return (
    <aside 
      className="contextual-sidebar w-72 border-r bg-white shadow-md transition-all duration-300 ease-in-out shrink-0"
    >
      {/* Header with Close Button */}
      <div className="h-16 flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize">{activePanel}</h2>
        <button 
          onClick={() => setActivePanel(null)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          title="Close Sidebar"
        >
          &times;
        </button>
      </div>
      
      {/* Dynamic Content Area */}
      {ContentComponent && <ContentComponent isOpen={true} onClose={() => setActivePanel(null)} />}
    </aside>
  );
}