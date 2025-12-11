import { FabricImage } from "fabric";
import addImage from "../functions/image";


export default async function Image(src, setSelectedId, setActiveTool, fabricCanvas) {
  
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
