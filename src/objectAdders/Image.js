import { FabricImage } from "fabric";
import { useState } from "react";
export default async function Image(src, setSelectedId, setActiveTool) {
  const [addedImage, setAddedImage] = useState(false);
  if (!src) return;
  
  const id = Date.now()
  
  const fabricImage = await FabricImage.fromURL(src, {
    customId: id
  });

  setSelectedId(id)
  setActiveTool('image')
  setAddedImage(true);
  
}
