// src/components/Image.jsx
import React from 'react';
import { useRef } from 'react';
import addImage from '../functions/image';

// Corrected Props: Remove FiImage and add 'children'
export default function ImageHandler({setSelectedId, setActiveTool, children}) {
  const fileInput = useRef(null);

  const handleClick = () => {
    fileInput.current.click();
    // Also trigger the sidebar to open on click
    if (setActiveTool) {
        setActiveTool('image');
    }
  };

  const handleChange = (event) => {
    const file = event.target.files[0];

    if (file && file.type.substring(0, 5) === 'image') {
      const reader = new FileReader();

      reader.onload = (e) => {
        const src = e.target.result;

        if (src) {
          addImage(setSelectedId, setActiveTool, src);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Use children to render the icon and text passed from MainToolbar */}
      <button onClick={handleClick} className="tool-button w-16 h-16">
        {children || 'Upload'}
      </button>
      <input
        type="file"
        ref={fileInput}
        onChange={handleChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </>
  );
}