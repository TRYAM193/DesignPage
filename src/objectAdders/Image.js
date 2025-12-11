import { FabricImage } from "fabric";
import { useState } from "react";
export default async function Image(src, setSelectedId, setActiveTool, fabricCanvas) {
  const [addedImage, setAddedImage] = useState(false);
  if (!src) return;
  
  const id = Date.now()
  
  {const fabricImage = await FabricImage.fromURL(src, {
    customId: id
  });

  setSelectedId(id)
  setActiveTool('image')
  setAddedImage(true);}
  
  if (fabricCanvas && addedImage) {
    fabricCanvas.add(fabricImage);
    fabricCanvas.setActiveObject(fabricImage);
    fabricCanvas.requestRenderAll();
    setAddedImage(false);
  }
}
