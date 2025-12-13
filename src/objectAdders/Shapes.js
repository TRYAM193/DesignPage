// src/objectAdders/Shapes.js
import { Rect, Circle, Triangle } from 'fabric';

export default function ShapeAdder(obj) {
  if (!obj) return null;
  const { type, props, id } = obj;

  const options = {
    ...props,
    customId: id,
  };

  switch (type) {
    case 'rect':
      return new Rect(options);
    case 'circle':
      return new Circle(options);
    case 'triangle':
      return new Triangle(options);
    default:
      return null;
  }
}