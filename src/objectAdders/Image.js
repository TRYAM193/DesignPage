import { FabricImage } from "fabric";
import { useState } from "react";
export default async function Image(src, setSelectedId, setActiveTool) {
  
  if (!src) return;
  
  const id = Date.now()
  
  const fabricImage = await FabricImage.fromURL(src, {
    customId: id
  });

  setSelectedId(id)
  setActiveTool('image')
  
  return fabricImage;
}
