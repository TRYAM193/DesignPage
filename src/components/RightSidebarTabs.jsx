// src/components/RightSidebarTabs.jsx
import React, { useState } from 'react';
import Toolbar from './Toolbar'; // Imports your existing property editor component
import { FiLayers, FiSliders } from 'react-icons/fi'; // Icons for tabs
import LayersPanel from './LayersPanel'

export default function RightSidebarTabs({props, setSelectedId, fabricCanvas}) {
  // State to manage the active tab: 'properties' or 'layers'
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <div className="right-sidebar-tabs">

      {/* Tab Selector Bar */}
      <div className="tab-selector-bar">
        <button
          className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          <FiSliders size={18} />
          <span>Properties</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          <FiLayers size={18} />
          <span>Layers</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="tab-content-area">
        {/* Render the existing Toolbar when on the Properties tab */}
        {activeTab === 'properties' && (
          <Toolbar
            id={props.id}
            type={props.type}
            object={props.object}
            updateObject={props.updateObject}
            removeObject={props.removeObject}
            addText={props.addText}
            fabricCanvas={props.fabricCanvas}
          />
        )}

        {/* Placeholder for Layers tab */}
        {activeTab === 'layers' && (
          <div className="layers-placeholder">
            <h3 style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>Layers Panel</h3>
            {/* Layers Panel */}
            {activeTab === 'layers' && (
              <LayersPanel
                selectedId={props.id}
                setSelectedId={setSelectedId} // Pass setSelectedId function
                fabricCanvas={fabricCanvas}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}