import * as fabric from 'fabric';

export default function CircleText(objData) {
  const props = objData.props;
  
  // Default fallback values
  const text = props.text || 'Circle Text';
  const radius = props.radius || 150;
  const fontSize = props.fontSize || 20;
  const fontFamily = props.fontFamily || 'Arial';
  const fill = props.fill || '#000000';
  const charSpacing = props.charSpacing || 0;

  const chars = text.split('');
  const angleStep = (2 * Math.PI) / chars.length;

  const groupItems = chars.map((char, i) => {
    const angle = i * angleStep - Math.PI / 2;
    
    // Polar to Cartesian coordinates
    const charX = radius * Math.cos(angle);
    const charY = radius * Math.sin(angle);

    const fabricChar = new fabric.FabricText(char, {
      left: charX,
      top: charY,
      originX: 'center',
      originY: 'center',
      fontSize: fontSize,
      fontFamily: fontFamily,
      charSpacing: charSpacing,
      fill: fill,
      opacity: props.opacity ?? 1,
      selectable: false, 
      angle: (angle * 180) / Math.PI + 90,
      
      // Inherit styles
      fontStyle: props.fontStyle,
      fontWeight: props.fontWeight,
      underline: props.underline,
    });

    // Shadow
    if (props.shadow) {
      fabricChar.set('shadow', {
        color: props.shadow.color || '#000000',
        blur: props.shadow.blur || 0,
        offsetX: props.shadow.offsetX || 0,
        offsetY: props.shadow.offsetY || 0,
      });
    }

    // Stroke
    if (props.strokeWidth > 0) {
      fabricChar.set({
        stroke: props.stroke || '#000000',
        strokeWidth: props.strokeWidth
      });
    }

    return fabricChar;
  });

  const group = new fabric.Group(groupItems, {
    left: props.left,
    top: props.top,
    angle: props.angle || 0,
    scaleX: props.scaleX || 1,
    scaleY: props.scaleY || 1,
    originX: 'center',
    originY: 'center',
    customId: objData.id,
    objectCaching: false, 
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily,
    radius: radius,
    textEffect: 'circle', // Mark it
  });

  return group;
}