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
  let allFaceIndices = [faceIndex];
  
  if (indices) {
    const i1 = indices.array[faceIndex * 3];
    const i2 = indices.array[faceIndex * 3 + 1];
    const i3 = indices.array[faceIndex * 3 + 2];
    
    vertices = [
      new THREE.Vector3().fromBufferAttribute(positions, i1).applyMatrix4(mesh.matrixWorld),
      new THREE.Vector3().fromBufferAttribute(positions, i2).applyMatrix4(mesh.matrixWorld),
      new THREE.Vector3().fromBufferAttribute(positions, i3).applyMatrix4(mesh.matrixWorld)
    ];
    
    // Try to find adjacent coplanar triangle to form a quad
    const adjacentTriangle = findAdjacentCoplanarTriangle(
      geometry, 
      faceIndex, 
      normal, 
      mesh.matrixWorld,
      0.01 // tolerance for coplanarity
    );
    
    if (adjacentTriangle) {
      // Merge the two triangles into a quad
      vertices = mergeTrianglesIntoQuad(vertices, adjacentTriangle.vertices);
      allFaceIndices.push(adjacentTriangle.faceIndex);
    }
  }
  
  // Calculate area
  let area;
  if (vertices.length === 3) {
    const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
    const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
    area = edge1.cross(edge2).length() / 2;
  } else if (vertices.length === 4) {
    // Calculate quad area as sum of two triangles
    const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
    const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
    const edge3 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
    const edge4 = new THREE.Vector3().subVectors(vertices[3], vertices[0]);
    area = (edge1.cross(edge2).length() + edge3.cross(edge4).length()) / 2;
  }
  
  return {
    type: 'face',
    faceIndex: faceIndex,
    faceIndices: allFaceIndices,
    normal: normal,
    vertices: vertices,
    area: area,
    mesh: mesh,
    point: intersection.point
  };
}

/**
 * Finds an adjacent triangle that is coplanar with the given face
 */
function findAdjacentCoplanarTriangle(geometry, faceIndex, normal, matrixWorld, tolerance) {
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  if (!indices) return null;
  
  const i1 = indices.array[faceIndex * 3];
  const i2 = indices.array[faceIndex * 3 + 1];
  const i3 = indices.array[faceIndex * 3 + 2];
  
  const v1 = new THREE.Vector3().fromBufferAttribute(positions, i1);
  const v2 = new THREE.Vector3().fromBufferAttribute(positions, i2);
  const v3 = new THREE.Vector3().fromBufferAttribute(positions, i3);
  
  // Check all other triangles
  const numFaces = indices.array.length / 3;
  for (let i = 0; i < numFaces; i++) {
    if (i === faceIndex) continue;
    
    const j1 = indices.array[i * 3];
    const j2 = indices.array[i * 3 + 1];
    const j3 = indices.array[i * 3 + 2];
    
    const u1 = new THREE.Vector3().fromBufferAttribute(positions, j1);
    const u2 = new THREE.Vector3().fromBufferAttribute(positions, j2);
    const u3 = new THREE.Vector3().fromBufferAttribute(positions, j3);
    
    // Calculate normal of the other triangle
    const edge1 = new THREE.Vector3().subVectors(u2, u1);
    const edge2 = new THREE.Vector3().subVectors(u3, u1);
    const otherNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    otherNormal.transformDirection(matrixWorld);
    
    // Check if normals are parallel (same direction)
    const dotProduct = Math.abs(normal.dot(otherNormal));
    if (dotProduct < 1 - tolerance) continue;
    
    // Check if triangles share exactly 2 vertices (an edge)
    const sharedVertices = [];
    const currentIndices = [i1, i2, i3];
    const otherIndices = [j1, j2, j3];
    
    for (const ci of currentIndices) {
      for (const oi of otherIndices) {
        if (ci === oi) {
          sharedVertices.push(ci);
        }
      }
    }
    
    // If they share exactly 2 vertices, they are adjacent
    if (sharedVertices.length === 2) {
      // Check if all 4 unique vertices are coplanar
      const allVertices = [v1, v2, v3, u1, u2, u3];
      const uniqueVertices = [];
      
      for (const v of allVertices) {
        let isUnique = true;
        for (const uv of uniqueVertices) {
          if (v.distanceTo(uv) < 0.0001) {
            isUnique = false;
            break;
          }
        }
        if (isUnique) uniqueVertices.push(v);
      }
      
      // Should have exactly 4 unique vertices for a quad
      if (uniqueVertices.length === 4) {
        // Check coplanarity
        if (areVerticesCoplanar(uniqueVertices, tolerance)) {
          return {
            faceIndex: i,
            vertices: [
              u1.clone().applyMatrix4(matrixWorld),
              u2.clone().applyMatrix4(matrixWorld),
              u3.clone().applyMatrix4(matrixWorld)
            ]
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Checks if vertices are coplanar
 */
function areVerticesCoplanar(vertices, tolerance) {
  if (vertices.length < 4) return true;
  
  // Use first 3 vertices to define the plane
  const v1 = vertices[0];
  const v2 = vertices[1];
  const v3 = vertices[2];
  
  const edge1 = new THREE.Vector3().subVectors(v2, v1);
  const edge2 = new THREE.Vector3().subVectors(v3, v1);
  const planeNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
  
  // Check if all other vertices lie on the same plane
  for (let i = 3; i < vertices.length; i++) {
    const v = vertices[i];
    const toVertex = new THREE.Vector3().subVectors(v, v1);
    const distance = Math.abs(toVertex.dot(planeNormal));
    
    if (distance > tolerance) {
      return false;
    }
  }
  
  return true;
}

/**
 * Merges two triangles into a quad by finding the 4 unique vertices in correct order
 */
function mergeTrianglesIntoQuad(triangle1, triangle2) {
  // Find all unique vertices
  const allVertices = [...triangle1, ...triangle2];
  const uniqueVertices = [];
  
  for (const v of allVertices) {
    let isUnique = true;
    for (const uv of uniqueVertices) {
      if (v.distanceTo(uv) < 0.0001) {
        isUnique = false;
        break;
      }
    }
    if (isUnique) {
      uniqueVertices.push(v);
    }
  }
  
  // Should have exactly 4 vertices
  if (uniqueVertices.length !== 4) {
    return triangle1; // Fallback to original triangle
  }
  
  // Order vertices to form a proper quad (counter-clockwise)
  return orderQuadVertices(uniqueVertices);
}

/**
 * Orders 4 vertices to form a proper quad
 */
function orderQuadVertices(vertices) {
  // Calculate centroid
  const centroid = new THREE.Vector3();
  for (const v of vertices) {
    centroid.add(v);
  }
  centroid.divideScalar(vertices.length);
  
  // Calculate normal using first 3 vertices
  const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
  const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
  const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
  
  // Sort vertices by angle around centroid
  const sortedVertices = vertices.slice().sort((a, b) => {
    const vecA = new THREE.Vector3().subVectors(a, centroid);
    const vecB = new THREE.Vector3().subVectors(b, centroid);
    
    // Project onto plane perpendicular to normal
    const right = new THREE.Vector3(1, 0, 0);
    if (Math.abs(normal.dot(right)) > 0.9) {
      right.set(0, 1, 0);
    }
    const tangent = new THREE.Vector3().crossVectors(normal, right).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent);
    
    const angleA = Math.atan2(vecA.dot(bitangent), vecA.dot(tangent));
    const angleB = Math.atan2(vecB.dot(bitangent), vecB.dot(tangent));
    
    return angleA - angleB;
  });
  
  return sortedVertices;
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
  let positions;
  let indices;
  
  if (vertices.length === 3) {
    // Triangle face
    positions = new Float32Array([
      vertices[0].x, vertices[0].y, vertices[0].z,
      vertices[1].x, vertices[1].y, vertices[1].z,
      vertices[2].x, vertices[2].y, vertices[2].z
    ]);
  } else if (vertices.length === 4) {
    // Quad face - create two triangles
    positions = new Float32Array([
      vertices[0].x, vertices[0].y, vertices[0].z,
      vertices[1].x, vertices[1].y, vertices[1].z,
      vertices[2].x, vertices[2].y, vertices[2].z,
      vertices[3].x, vertices[3].y, vertices[3].z
    ]);
    
    // Define indices for two triangles forming the quad
    indices = new Uint16Array([
      0, 1, 2,  // First triangle
      0, 2, 3   // Second triangle
    ]);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  if (indices) {
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  
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
