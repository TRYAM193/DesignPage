import * as fabric from 'fabric';

export function CircleText(obj) {
  const chars = obj.props.text.split('');
  const angleStep = (2 * Math.PI) / chars.length;

  const groupItems = chars.map((char, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const charX = obj.radius * Math.cos(angle);
    const charY = obj.radius * Math.sin(angle);

    const fabricChar = new fabric.FabricText(char, {
      left: charX,
      top: charY,
      originX: 'center',
      originY: 'center',
      ...obj.props,
      selectable: false,
      angle: (angle * 180) / Math.PI + 90,
    });

    // Shadow
    if (obj.props.shadow) {
      fabricChar.set('shadow', {
        color: obj.props.shadowColor || '#fff',
        blur: obj.props.shadowBlur,
        offsetX: obj.props.shadowOffsetX,
        offsetY: obj.props.shadowOffsetY,
      });
    }

    // Stroke
    if (obj.props.strokeWidth > 0) {
      fabricChar.set('stroke', obj.props.strokeColor || '#000');
      fabricChar.set('strokeWidth', obj.props.strokeWidth);
    }

    return fabricChar;
  });
  const group = new fabric.Group(groupItems, {
    left: obj.x,
    top: obj.y,
    originX: 'center',
    originY: 'center',
    angle: obj.angle,
    width: obj.width,
    height: obj.height,
    customId: obj.id,
    hasControls: true,
  });
  return group;
}
