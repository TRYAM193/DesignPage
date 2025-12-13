// src/utils/shapeUtils.js

// 1. Point Generators
export const getStarPoints = (spikes = 5, outerRadius = 50, innerRadius = 25) => {
  const points = [];
  const step = Math.PI / spikes;
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

export const getPolygonPoints = (sides = 5, radius = 50) => {
  const points = [];
  const step = (Math.PI * 2) / sides;
  let angle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push({ x, y });
    angle += step;
  }
  return points;
};

export const getTrianglePoints = (width, height) => {
  return [
    { x: 0, y: -height / 2 },
    { x: -width / 2, y: height / 2 },
    { x: width / 2, y: height / 2 }
  ];
};

// 2. Rounding Logic (Converts Points -> SVG Path Data with Arcs)
export const getRoundedPathFromPoints = (points, radius) => {
  if (!points || points.length === 0) return "";
  if (radius === 0) {
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} z`;
  }

  const len = points.length;
  let path = "";

  for (let i = 0; i < len; i++) {
    const p1 = points[i]; // Current Vertex
    const p0 = points[(i - 1 + len) % len]; // Previous Vertex
    const p2 = points[(i + 1) % len]; // Next Vertex

    // Vectors
    const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Clamp radius to not exceed half the side length
    const r = Math.min(radius, len1 / 2, len2 / 2);

    // Normalize and scale to radius
    const u1 = { x: v1.x / len1 * r, y: v1.y / len1 * r };
    const u2 = { x: v2.x / len2 * r, y: v2.y / len2 * r };

    // Start of curve (on the incoming line)
    const startX = p1.x + u1.x;
    const startY = p1.y + u1.y;

    // End of curve (on the outgoing line)
    const endX = p1.x + u2.x;
    const endY = p1.y + u2.y;

    if (i === 0) {
      path += `M ${startX},${startY} `;
    } else {
      path += `L ${startX},${startY} `;
    }

    // Quadratic Bezier curve using Vertex (p1) as control point
    path += `Q ${p1.x},${p1.y} ${endX},${endY} `;
  }

  path += "z"; // Close path
  return path;
};