import React from "react";

export default function RightPanel({
  id,
  type,
  object,
  updateObject,
  addText,
  removeObject
}) {
  if(!id || !object) return
  if (type === 'text') {
    return (
      <div>
        <button onClick={() => addText()} style={{color: 'white'}}>Add Text</button>
        <input
          type="text"
          value={object.props.text}
          onChange={(e) => updateObject(id, { text: e.target.value })}
        />
        <button onClick={() => removeObject(id)}>Remove Text</button>
        
      </div>
    );
  } else {
    return <></>;
  }
}
