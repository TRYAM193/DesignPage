import { FabricImage } from "fabric";

export default async function Image(obj) {
  if (!obj || obj.type !== "image") return;

  const props = obj.props;
  
  const fabricImage = await FabricImage.fromURL(obj.src, {
    ...props,
    customId: obj.id
  });
  
  return fabricImage;
}
