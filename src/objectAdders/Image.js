import { FabricImage } from "fabric";
import React, { useState } from "react";
import addImage from "../functions/image";


export default async function Image(src, setSelectedId, setActiveTool, fabricCanvas) {
  const [addedImage, setAddedImage] = useState(false);
  if (!src) return;

  const id = Date.now()

  let fabricImage;
  if (!addedImage) {
    fabricImage = await FabricImage.fromURL(src, {
      customId: id
    });

    setSelectedId(id)
    setActiveTool('image')
    setAddedImage(true);
  }

  if (fabricCanvas && addedImage && fabricImage) {
    fabricCanvas.add(fabricImage);
    fabricCanvas.setActiveObject(fabricImage);
    fabricCanvas.requestRenderAll();
    setAddedImage(false);
    addImage(fabricImage)
  }
}
