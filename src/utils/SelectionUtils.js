import * as THREE from 'three';

/**
 * Performs raycasting to detect intersections
 */
export function raycast(mouse, camera, objects, raycaster) {
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, true);
}

/**
 * Detects face selection from raycast intersection
 */
export function detectFaceSelection(intersection, mesh) {
  if (!intersection || !intersection.face) return null;
  
  const faceIndex = intersection.faceIndex;
  const geometry = mesh.geometry;
  
  // Get face normal in world space
  const normal = intersection.face.normal.clone();
  normal.transformDirection(mesh.matrixWorld);
  
  // Calculate face vertices in world space
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  let vertices = [];
  if (indices) {
    const i1 = indices.array[faceIndex * 3];
    const i2 = indices.array[faceIndex * 3 + 1];
    const i3 = indices.array[faceIndex * 3 + 2];
    
    vertices = [
      new THREE.Vector3().fromBufferAttribute(positions, i1).applyMatrix4(mesh.matrixWorld),
      new THREE.Vector3().fromBufferAttribute(positions, i2).applyMatrix4(mesh.matrixWorld),
      new THREE.Vector3().fromBufferAttribute(positions, i3).applyMatrix4(mesh.matrixWorld)
    ];
  }
  
  // Calculate area
  const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
  const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
  const area = edge1.cross(edge2).length() / 2;
  
  return {
    type: 'face',
    faceIndex: faceIndex,
    normal: normal,
    vertices: vertices,
    area: area,
    mesh: mesh,
    point: intersection.point
  };
}

/**
 * Detects edge selection from raycast
 */
export function detectEdgeSelection(mouse, camera, mesh, raycaster, threshold = 0.15) {
  const geometry = mesh.geometry;
  const edges = geometry.userData.edges || [];
  
  raycaster.setFromCamera(mouse, camera);
  
  let closestEdge = null;
  let minDistance = Infinity;
  
  edges.forEach(edge => {
    const start = edge.start.clone().applyMatrix4(mesh.matrixWorld);
    const end = edge.end.clone().applyMatrix4(mesh.matrixWorld);
    
    // Create a line segment
    const line = new THREE.Line3(start, end);
    
    // Find closest point on the line segment to the ray
    const rayPoint = new THREE.Vector3();
    const linePoint = new THREE.Vector3();
    
    // Get closest points between ray and line segment
    const rayDir = raycaster.ray.direction.clone().normalize();
    const lineDir = new THREE.Vector3().subVectors(end, start).normalize();
    
    // Calculate distance between ray and line segment
    const w = new THREE.Vector3().subVectors(raycaster.ray.origin, start);
    const a = rayDir.dot(rayDir);
    const b = rayDir.dot(lineDir);
    const c = lineDir.dot(lineDir);
    const d = rayDir.dot(w);
    const e = lineDir.dot(w);
    
    const denom = a * c - b * b;
    let sc, tc;
    
    if (denom < 0.0001) {
      sc = 0.0;
      tc = (b > c ? d / b : e / c);
    } else {
      sc = (b * e - c * d) / denom;
      tc = (a * e - b * d) / denom;
    }
    
    // Clamp tc to line segment
    tc = Math.max(0, Math.min(1, tc));
    
    // Calculate closest points
    rayPoint.copy(raycaster.ray.origin).addScaledVector(rayDir, sc);
    linePoint.copy(start).addScaledVector(new THREE.Vector3().subVectors(end, start), tc);
    
    const distance = rayPoint.distanceTo(linePoint);
    
    if (distance < threshold && distance < minDistance) {
      minDistance = distance;
      closestEdge = {
        type: 'edge',
        index: edge.index,
        start: start,
        end: end,
        length: edge.length,
        mesh: mesh,
        point: linePoint
      };
    }
  });
  
  return closestEdge;
}

/**
 * Creates highlight for selected face
 */
export function createFaceHighlight(faceSelection) {
  const vertices = faceSelection.vertices;
  
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    vertices[0].x, vertices[0].y, vertices[0].z,
    vertices[1].x, vertices[1].y, vertices[1].z,
    vertices[2].x, vertices[2].y, vertices[2].z
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthTest: false
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 999;
  
  return mesh;
}

/**
 * Creates highlight for selected edge
 */
export function createEdgeHighlight(edgeSelection) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    edgeSelection.start.x, edgeSelection.start.y, edgeSelection.start.z,
    edgeSelection.end.x, edgeSelection.end.y, edgeSelection.end.z
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 3,
    depthTest: false
  });
  
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 999;
  
  return line;
}

/**
 * Creates highlight for selected shape
 */
export function createShapeHighlight(mesh) {
  const geometry = mesh.geometry.clone();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthTest: false
  });
  
  const highlight = new THREE.Mesh(geometry, material);
  highlight.position.copy(mesh.position);
  highlight.rotation.copy(mesh.rotation);
  highlight.scale.copy(mesh.scale);
  highlight.renderOrder = 998;
  
  return highlight;
}

/**
 * Creates wireframe for shape
 */
export function createWireframe(mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const material = new THREE.LineBasicMaterial({ 
    color: 0x000000,
    linewidth: 1
  });
  const wireframe = new THREE.LineSegments(edges, material);
  
  wireframe.position.copy(mesh.position);
  wireframe.rotation.copy(mesh.rotation);
  wireframe.scale.copy(mesh.scale);
  
  return wireframe;
}
