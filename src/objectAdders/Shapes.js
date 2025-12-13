// src/objectAdders/Shapes.js
import { Rect, Circle, Triangle, Polygon, Line } from 'fabric';

// Helper: Generate Star Points
const getStarPoints = (spikes = 5, outerRadius = 50, innerRadius = 25) => {
  const points = [];
  const step = Math.PI / spikes;
  // Start at -PI/2 to point upwards
  let angle = -Math.PI / 2;

  for (let i = 0; i < 2 * spikes; i++) {
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    points.push({ x, y });
    angle += step;
  }
  return points;
};

// Helper: Generate Regular Polygon Points (e.g., Pentagon, Hexagon)
const getPolygonPoints = (sides = 5, radius = 50) => {
  const points = [];
  const step = (Math.PI * 2) / sides;
  // Start at -PI/2 to point upwards
  let angle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push({ x, y });
    angle += step;
  }
  return points;
};

export default function ShapeAdder(obj) {
  if (!obj) return null;
  const { type, props, id } = obj;

  const options = {
    ...props,
    customId: id,
    // Center origin is best for resizing/rotating
    originX: 'center',
    originY: 'center',
  };

  switch (type) {
    case 'rect':
      return new Rect(options);
    case 'circle':
      return new Circle(options);
    case 'triangle':
      return new Triangle(options);
    
    // 🆕 NEW SHAPES
    case 'star':
      return new Polygon(getStarPoints(5, 50, 25), {
        ...options,
        // Force initial dimensions to match props if needed, but Polygon auto-sizes based on points
      });
    
    case 'pentagon':
      return new Polygon(getPolygonPoints(5, 50), options);

    case 'hexagon':
        return new Polygon(getPolygonPoints(6, 50), options);

    case 'line':
      // Lines need specific coordinates [x1, y1, x2, y2]
      // We create a line of length 100 centered
      return new Line([0, 0, 100, 0], {
        ...options,
        stroke: options.stroke || options.fill || '#000000', // Ensure it has a stroke color
        strokeWidth: options.strokeWidth || 4, // Make it visible by default
        fill: null // Lines don't usually have fill
      });

    default:
      return null;
  }
}