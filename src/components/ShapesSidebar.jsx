import React from 'react';
import '../styles/shape.css';
import { addRectangle, addCircle, addTriangle } from '../functions/shape';

export default function ShapesSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Optional: Backdrop to close when clicking outside */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      
      <div className={`shapes-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Add Shape</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="shapes-grid">
          <button onClick={addRectangle} className="shape-btn" title="Rectangle">
            <div className="shape-icon rect"></div>
            <span>Square</span>
          </button>
          
          <button onClick={addCircle} className="shape-btn" title="Circle">
            <div className="shape-icon circle"></div>
            <span>Circle</span>
          </button>
          
          <button onClick={addTriangle} className="shape-btn" title="Triangle">
            <div className="shape-icon triangle"></div>
            <span>Triangle</span>
          </button>
        </div>
      </div>
    </>
  );
}
