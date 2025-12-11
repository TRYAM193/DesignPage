import { FabricImage } from "fabric";

export default async function Image({src, setSelectedId, setActiveTool}) {
  if (!src) return;
  
  const id = Dtae
  
  const fabricImage = await FabricImage.fromURL(src, {
    customId: id
  });
  
  return fabricImage;
}
