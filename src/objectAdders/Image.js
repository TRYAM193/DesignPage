import { FabricImage } from "fabric";

export default async function Image({src, setSelectedId, setActiveTool}) {
  if (!src) return;
  
  const fabricImage = await FabricImage.fromURL(src, {
    customId: Date.now()
  });
  
  return fabricImage;
}
