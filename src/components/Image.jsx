import React from 'react';
import { useRef } from 'react';
import addImage from '../functions/image';

export default function ImageHandler({setSelectedId, setActiveTool}) {
  const fileInput = useRef(null);

  const handleClick = () => {
    fileInput.current.click();
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
      <button onClick={handleClick}>Upload</button>
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
