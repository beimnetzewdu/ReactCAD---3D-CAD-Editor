import * as THREE from 'three';

/**
 * Creates a box geometry with explicit face and edge data
 */
export function createBoxGeometry(width = 1, height = 1, depth = 1) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  // Add metadata for faces and edges
  geometry.userData.faces = [
    { index: 0, name: 'Front', normal: new THREE.Vector3(0, 0, 1) },
    { index: 1, name: 'Back', normal: new THREE.Vector3(0, 0, -1) },
    { index: 2, name: 'Top', normal: new THREE.Vector3(0, 1, 0) },
    { index: 3, name: 'Bottom', normal: new THREE.Vector3(0, -1, 0) },
    { index: 4, name: 'Right', normal: new THREE.Vector3(1, 0, 0) },
    { index: 5, name: 'Left', normal: new THREE.Vector3(-1, 0, 0) }
  ];
  
  geometry.userData.edges = extractEdges(geometry);
  
  return geometry;
}

/**
 * Creates a sphere geometry with explicit face and edge data
 */
export function createSphereGeometry(radius = 0.5, segments = 32) {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  geometry.userData.edges = extractEdges(geometry);
  geometry.userData.faces = extractFaces(geometry);
  return geometry;
}

/**
 * Creates a cylinder geometry with explicit face and edge data
 */
export function createCylinderGeometry(radiusTop = 0.5, radiusBottom = 0.5, height = 1, segments = 32) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  geometry.userData.edges = extractEdges(geometry);
  geometry.userData.faces = extractFaces(geometry);
  return geometry;
}

/**
 * Extracts edges from geometry
 */
export function extractEdges(geometry) {
  const edges = [];
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);
  const positions = edgesGeometry.attributes.position.array;
  
  for (let i = 0; i < positions.length; i += 6) {
    const start = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
    const end = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
    const length = start.distanceTo(end);
    
    edges.push({
      index: i / 6,
      start: start,
      end: end,
      length: length
    });
  }
  
  return edges;
}

/**
 * Extracts faces from geometry
 */
export function extractFaces(geometry) {
  const faces = [];
  const positions = geometry.attributes.position.array;
  const indices = geometry.index ? geometry.index.array : null;
  
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      
      const v1 = new THREE.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
      const v2 = new THREE.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
      const v3 = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      
      const normal = new THREE.Vector3();
      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      normal.crossVectors(edge1, edge2).normalize();
      
      const area = edge1.cross(edge2).length() / 2;
      
      faces.push({
        index: i / 3,
        vertices: [v1, v2, v3],
        normal: normal,
        area: area
      });
    }
  }
  
  return faces;
}

/**
 * Creates geometry from 2D sketch
 */
export function createSketchGeometry(sketchData) {
  const { type, points } = sketchData;
  
  if (type === 'rectangle') {
    const width = Math.abs(points[1].x - points[0].x);
    const height = Math.abs(points[1].y - points[0].y);
    const centerX = (points[0].x + points[1].x) / 2;
    const centerY = (points[0].y + points[1].y) / 2;
    
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.closePath();
    
    return { shape, centerX, centerY, width, height };
  } else if (type === 'circle') {
    const radius = Math.sqrt(
      Math.pow(points[1].x - points[0].x, 2) + 
      Math.pow(points[1].y - points[0].y, 2)
    );
    
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    
    return { shape, centerX: points[0].x, centerY: points[0].y, radius };
  }
  
  return null;
}

/**
 * Extrudes a 2D shape into 3D geometry
 */
export function extrudeSketch(sketchData, extrudeDepth = 1) {
  const sketchGeom = createSketchGeometry(sketchData);
  if (!sketchGeom) return null;
  
  const { shape, centerX, centerY } = sketchGeom;
  
  const extrudeSettings = {
    depth: extrudeDepth,
    bevelEnabled: false
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Rotate to align with XZ plane (sketch plane)
  geometry.rotateX(-Math.PI / 2);
  
  // Translate to correct position
  geometry.translate(centerX, extrudeDepth / 2, centerY);
  
  geometry.userData.edges = extractEdges(geometry);
  geometry.userData.faces = extractFaces(geometry);
  geometry.userData.sketchData = sketchData;
  geometry.userData.extrudeDepth = extrudeDepth;
  
  return geometry;
}

/**
 * Snaps a value to grid
 */
export function snapToGrid(value, gridSize = 0.5) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Calculates face area
 */
export function calculateFaceArea(vertices) {
  if (vertices.length < 3) return 0;
  
  const v1 = vertices[0];
  const v2 = vertices[1];
  const v3 = vertices[2];
  
  const edge1 = new THREE.Vector3().subVectors(v2, v1);
  const edge2 = new THREE.Vector3().subVectors(v3, v1);
  
  return edge1.cross(edge2).length() / 2;
}

/**
 * Calculates edge length
 */
export function calculateEdgeLength(start, end) {
  return start.distanceTo(end);
}
