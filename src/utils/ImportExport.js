import * as THREE from 'three';
import { createBoxGeometry, createSphereGeometry, createCylinderGeometry, extrudeSketch } from './GeometryUtils';

/**
 * Exports the entire scene to JSON
 */
export function exportScene(objects) {
  const sceneData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    objects: []
  };
  
  objects.forEach(obj => {
    if (obj.userData.isCADObject) {
      const objectData = {
        id: obj.userData.id,
        type: obj.userData.type,
        name: obj.userData.name || obj.userData.type,
        position: {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z
        },
        rotation: {
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z
        },
        scale: {
          x: obj.scale.x,
          y: obj.scale.y,
          z: obj.scale.z
        },
        material: {
          color: obj.material.color.getHex(),
          opacity: obj.material.opacity,
          transparent: obj.material.transparent
        }
      };
      
      // Add type-specific data
      if (obj.userData.type === 'box') {
        objectData.parameters = {
          width: obj.userData.width || 1,
          height: obj.userData.height || 1,
          depth: obj.userData.depth || 1
        };
      } else if (obj.userData.type === 'sphere') {
        objectData.parameters = {
          radius: obj.userData.radius || 0.5,
          segments: obj.userData.segments || 32
        };
      } else if (obj.userData.type === 'cylinder') {
        objectData.parameters = {
          radiusTop: obj.userData.radiusTop || 0.5,
          radiusBottom: obj.userData.radiusBottom || 0.5,
          height: obj.userData.height || 1,
          segments: obj.userData.segments || 32
        };
      } else if (obj.userData.type === 'extruded') {
        objectData.parameters = {
          sketchData: obj.userData.sketchData,
          extrudeDepth: obj.userData.extrudeDepth || 1
        };
      }
      
      sceneData.objects.push(objectData);
    }
  });
  
  return JSON.stringify(sceneData, null, 2);
}

/**
 * Imports scene from JSON
 */
export function importScene(jsonString) {
  try {
    const sceneData = JSON.parse(jsonString);
    const objects = [];
    
    sceneData.objects.forEach(objData => {
      let geometry;
      
      // Create geometry based on type
      if (objData.type === 'box') {
        const { width, height, depth } = objData.parameters;
        geometry = createBoxGeometry(width, height, depth);
      } else if (objData.type === 'sphere') {
        const { radius, segments } = objData.parameters;
        geometry = createSphereGeometry(radius, segments);
      } else if (objData.type === 'cylinder') {
        const { radiusTop, radiusBottom, height, segments } = objData.parameters;
        geometry = createCylinderGeometry(radiusTop, radiusBottom, height, segments);
      } else if (objData.type === 'extruded') {
        const { sketchData, extrudeDepth } = objData.parameters;
        geometry = extrudeSketch(sketchData, extrudeDepth);
      }
      
      if (!geometry) return;
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: objData.material.color,
        opacity: objData.material.opacity,
        transparent: objData.material.transparent,
        roughness: 0.5,
        metalness: 0.1
      });
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      
      // Set transform
      mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
      mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
      mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
      
      // Set userData
      mesh.userData.isCADObject = true;
      mesh.userData.id = objData.id;
      mesh.userData.type = objData.type;
      mesh.userData.name = objData.name;
      
      // Set type-specific userData
      if (objData.parameters) {
        Object.assign(mesh.userData, objData.parameters);
      }
      
      objects.push(mesh);
    });
    
    return objects;
  } catch (error) {
    console.error('Error importing scene:', error);
    return null;
  }
}

/**
 * Downloads JSON file
 */
export function downloadJSON(jsonString, filename = 'scene.json') {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads JSON file
 */
export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
