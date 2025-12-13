// src/components/ShapesSidebar.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCanvasObjects } from '../redux/canvasSlice';
import { v4 as uuidv4 } from 'uuid'; // or use nanoid / Date.now() if uuid isn't installed

export default function ShapesSidebar() {
  const dispatch = useDispatch();
  const canvasObjects = useSelector((state) => state.canvas.present);

  const handleAddShape = (type) => {
    const id = uuidv4();
    
    // Default properties for all shapes
    const commonProps = {
      left: 350,  // Center-ish
      top: 350,
      fill: '#3b82f6', // Default blue
      stroke: null,
      strokeWidth: 0,
      opacity: 1,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
    };

    let shapeProps = {};

    // Specific defaults
    if (type === 'rect') {
      shapeProps = { width: 100, height: 100, rx: 0, ry: 0 };
    } else if (type === 'circle') {
      shapeProps = { radius: 50 };
    } else if (type === 'triangle') {
      shapeProps = { width: 100, height: 100 };
    }

    const newObject = {
      id: id,
      type: type,
      props: { ...commonProps, ...shapeProps }
    };

    dispatch(setCanvasObjects([...canvasObjects, newObject]));
  };

  return (
    <div className="sidebar-content">
       <div style={{ 
           display: 'grid', 
           gridTemplateColumns: 'repeat(2, 1fr)', 
           gap: '12px',
           padding: '5px'
       }}>
          <ShapeButton 
            label="Square" 
            onClick={() => handleAddShape('rect')}
            icon={<div style={{ width: '32px', height: '32px', background: 'currentColor', borderRadius: '4px' }} />} 
          />
          <ShapeButton 
            label="Circle" 
            onClick={() => handleAddShape('circle')}
            icon={<div style={{ width: '32px', height: '32px', background: 'currentColor', borderRadius: '50%' }} />} 
          />
          <ShapeButton 
            label="Triangle" 
            onClick={() => handleAddShape('triangle')}
            icon={<div style={{ 
                width: 0, 
                height: 0, 
                borderLeft: '16px solid transparent', 
                borderRight: '16px solid transparent', 
                borderBottom: '32px solid currentColor' 
            }} />} 
          />
       </div>
    </div>
  );
}
// Internal Helper Component for consistent styling
function ShapeButton({ label, onClick, icon }) {
    return (
        <button 
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                color: '#4b5563',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#4b5563';
            }}
        >
            <div style={{ pointerEvents: 'none' }}>{icon}</div>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{label}</span>
        </button>
    )
}
