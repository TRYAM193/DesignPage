import { FabricText, Textbox } from 'fabric';

export default function StraightText(obj) {
  if (!obj) return;
  const props = obj.props;
  return new FabricText(obj.props.text, {
    ...props,
    customStyle: obj.textStyle,
    customId: obj.id
  });
}