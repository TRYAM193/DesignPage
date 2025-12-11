import { FabricImage } from "fabric";
import addImage from "../functions/image";


export default async function Image(src, setSelectedId, setActiveTool, fabricCanvas) {
  let addedImage = false;
  if (!src) return;

  const id = Date.now()

  let fabricImage;
  if (!addedImage) {
    fabricImage = await FabricImage.fromURL(src, {
      customId: id
    });

    setSelectedId(id)
    setActiveTool('image')
    addedImage = true;
  }

  if (fabricCanvas && addedImage && fabricImage) {
    fabricCanvas.add(fabricImage);
    fabricCanvas.setActiveObject(fabricImage);
    fabricCanvas.requestRenderAll();
    addedImage = false;
    addImage(fabricImage)
  }
}
