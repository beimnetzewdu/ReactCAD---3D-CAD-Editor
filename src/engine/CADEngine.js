import * as THREE from 'three';
import { createBoxGeometry, createSphereGeometry, createCylinderGeometry, extrudeSketch, snapToGrid } from '../utils/GeometryUtils';
import { raycast, detectFaceSelection, detectEdgeSelection, createFaceHighlight, createEdgeHighlight, createShapeHighlight, createWireframe } from '../utils/SelectionUtils';

export class CADEngine {
  constructor(container) {
    this.container = container;
    this.objects = [];
    this.selectedObject = null;
    this.selectionType = null; // 'shape', 'face', 'edge'
    this.highlightMesh = null;
    this.wireframes = new Map();
    this.mode = 'select'; // 'select', 'sketch'
    this.sketchMode = null; // 'rectangle', 'circle'
    this.sketchStart = null;
    this.sketchPreview = null;
    this.gridSize = 0.5;
    this.snapToGridEnabled = true;
    this.objectIdCounter = 0;
    
    this.init();
  }
  
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);
    
    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, 5, -10);
    this.scene.add(directionalLight2);
    
    // Grid
    this.gridHelper = new THREE.GridHelper(20, 40, 0x444444, 0x222222);
    this.gridHelper.material.opacity = 0.3;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);
    
    // Axes
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
    
    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = 0.1;
    this.mouse = new THREE.Vector2();
    
    // Controls (simple orbit)
    this.setupControls();
    
    // Animation loop
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  setupControls() {
    this.isRotating = false;
    this.isPanning = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
        this.isRotating = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) { // Right mouse or Shift+Left
        this.isPanning = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
    
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (this.isRotating) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        
        const rotationSpeed = 0.005;
        const radius = this.camera.position.length();
        
        const theta = Math.atan2(this.camera.position.x, this.camera.position.z);
        const phi = Math.acos(this.camera.position.y / radius);
        
        const newTheta = theta - deltaX * rotationSpeed;
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * rotationSpeed));
        
        this.camera.position.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
        this.camera.position.y = radius * Math.cos(newPhi);
        this.camera.position.z = radius * Math.sin(newPhi) * Math.cos(newTheta);
        this.camera.lookAt(0, 0, 0);
        
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      } else if (this.isPanning) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        
        const panSpeed = 0.01;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        
        right.crossVectors(this.camera.position, up).normalize();
        
        this.camera.position.addScaledVector(right, -deltaX * panSpeed);
        this.camera.position.y += deltaY * panSpeed;
        
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
    
    this.renderer.domElement.addEventListener('mouseup', () => {
      this.isRotating = false;
      this.isPanning = false;
    });
    
    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      this.camera.position.multiplyScalar(delta);
    });
    
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }
  
  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  addBox(width = 1, height = 1, depth = 1) {
    const geometry = createBoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.5,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData.isCADObject = true;
    mesh.userData.type = 'box';
    mesh.userData.id = this.generateId();
    mesh.userData.width = width;
    mesh.userData.height = height;
    mesh.userData.depth = depth;
    
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    this.addWireframe(mesh);
    
    return mesh;
  }
  
  addSphere(radius = 0.5, segments = 32) {
    const geometry = createSphereGeometry(radius, segments);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe24a4a,
      roughness: 0.5,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = radius;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData.isCADObject = true;
    mesh.userData.type = 'sphere';
    mesh.userData.id = this.generateId();
    mesh.userData.radius = radius;
    mesh.userData.segments = segments;
    
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    this.addWireframe(mesh);
    
    return mesh;
  }
  
  addCylinder(radiusTop = 0.5, radiusBottom = 0.5, height = 1, segments = 32) {
    const geometry = createCylinderGeometry(radiusTop, radiusBottom, height, segments);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4ae290,
      roughness: 0.5,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData.isCADObject = true;
    mesh.userData.type = 'cylinder';
    mesh.userData.id = this.generateId();
    mesh.userData.radiusTop = radiusTop;
    mesh.userData.radiusBottom = radiusBottom;
    mesh.userData.height = height;
    mesh.userData.segments = segments;
    
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    this.addWireframe(mesh);
    
    return mesh;
  }
  
  addExtrudedShape(sketchData, extrudeDepth = 1) {
    const geometry = extrudeSketch(sketchData, extrudeDepth);
    if (!geometry) return null;
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xe2904a,
      roughness: 0.5,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData.isCADObject = true;
    mesh.userData.type = 'extruded';
    mesh.userData.id = this.generateId();
    mesh.userData.sketchData = sketchData;
    mesh.userData.extrudeDepth = extrudeDepth;
    
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    this.addWireframe(mesh);
    
    return mesh;
  }
  
  addWireframe(mesh) {
    const wireframe = createWireframe(mesh);
    this.scene.add(wireframe);
    this.wireframes.set(mesh.userData.id, wireframe);
  }
  
  updateWireframe(mesh) {
    const wireframe = this.wireframes.get(mesh.userData.id);
    if (wireframe) {
      wireframe.position.copy(mesh.position);
      wireframe.rotation.copy(mesh.rotation);
      wireframe.scale.copy(mesh.scale);
    }
  }
  
  removeWireframe(mesh) {
    const wireframe = this.wireframes.get(mesh.userData.id);
    if (wireframe) {
      this.scene.remove(wireframe);
      this.wireframes.delete(mesh.userData.id);
    }
  }
  
  handleClick(event, selectionMode = 'shape') {
    if (this.mode === 'sketch') return;
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.clearSelection();
    
    if (selectionMode === 'edge') {
      // Try edge selection for each object
      for (const obj of this.objects) {
        const edgeSelection = detectEdgeSelection(this.mouse, this.camera, obj, this.raycaster);
        if (edgeSelection) {
          this.selectedObject = edgeSelection;
          this.selectionType = 'edge';
          this.highlightMesh = createEdgeHighlight(edgeSelection);
          this.scene.add(this.highlightMesh);
          return edgeSelection;
        }
      }
    } else if (selectionMode === 'face') {
      const intersects = raycast(this.mouse, this.camera, this.objects, this.raycaster);
      if (intersects.length > 0) {
        const faceSelection = detectFaceSelection(intersects[0], intersects[0].object);
        if (faceSelection) {
          this.selectedObject = faceSelection;
          this.selectionType = 'face';
          this.highlightMesh = createFaceHighlight(faceSelection);
          this.scene.add(this.highlightMesh);
          return faceSelection;
        }
      }
    } else {
      // Shape selection
      const intersects = raycast(this.mouse, this.camera, this.objects, this.raycaster);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        if (mesh.userData.isCADObject) {
          this.selectedObject = mesh;
          this.selectionType = 'shape';
          this.highlightMesh = createShapeHighlight(mesh);
          this.scene.add(this.highlightMesh);
          return mesh;
        }
      }
    }
    
    return null;
  }
  
  clearSelection() {
    if (this.highlightMesh) {
      this.scene.remove(this.highlightMesh);
      this.highlightMesh = null;
    }
    this.selectedObject = null;
    this.selectionType = null;
  }
  
  deleteSelected() {
    if (this.selectedObject && this.selectionType === 'shape') {
      const mesh = this.selectedObject;
      this.scene.remove(mesh);
      this.removeWireframe(mesh);
      this.objects = this.objects.filter(obj => obj !== mesh);
      this.clearSelection();
    }
  }
  
  transformSelected(property, axis, value) {
    if (this.selectedObject && this.selectionType === 'shape') {
      const mesh = this.selectedObject;
      mesh[property][axis] = value;
      this.updateWireframe(mesh);
      
      if (this.highlightMesh) {
        this.scene.remove(this.highlightMesh);
        this.highlightMesh = createShapeHighlight(mesh);
        this.scene.add(this.highlightMesh);
      }
    }
  }
  
  startSketch(type) {
    this.mode = 'sketch';
    this.sketchMode = type;
    this.sketchStart = null;
    this.sketchPreview = null;
  }
  
  handleSketchClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Intersect with XZ plane (y=0)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    
    if (!intersection) return;
    
    if (this.snapToGridEnabled) {
      intersection.x = snapToGrid(intersection.x, this.gridSize);
      intersection.z = snapToGrid(intersection.z, this.gridSize);
    }
    
    if (!this.sketchStart) {
      this.sketchStart = { x: intersection.x, y: intersection.z };
    } else {
      const sketchEnd = { x: intersection.x, y: intersection.z };
      const sketchData = {
        type: this.sketchMode,
        points: [this.sketchStart, sketchEnd]
      };
      
      this.clearSketchPreview();
      this.mode = 'select';
      this.sketchMode = null;
      this.sketchStart = null;
      
      return sketchData;
    }
    
    return null;
  }
  
  handleSketchMove(event) {
    if (!this.sketchStart) return;
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    
    if (!intersection) return;
    
    if (this.snapToGridEnabled) {
      intersection.x = snapToGrid(intersection.x, this.gridSize);
      intersection.z = snapToGrid(intersection.z, this.gridSize);
    }
    
    this.updateSketchPreview(this.sketchStart, { x: intersection.x, y: intersection.z });
  }
  
  updateSketchPreview(start, end) {
    this.clearSketchPreview();
    
    if (this.sketchMode === 'rectangle') {
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      
      if (width === 0 || height === 0) return;
      
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      this.sketchPreview = new THREE.Mesh(geometry, material);
      this.sketchPreview.rotation.x = -Math.PI / 2;
      this.sketchPreview.position.set(
        (start.x + end.x) / 2,
        0.01,
        (start.y + end.y) / 2
      );
      
      this.scene.add(this.sketchPreview);
    } else if (this.sketchMode === 'circle') {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.y - start.y, 2)
      );
      
      if (radius === 0) return;
      
      const geometry = new THREE.CircleGeometry(radius, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      this.sketchPreview = new THREE.Mesh(geometry, material);
      this.sketchPreview.rotation.x = -Math.PI / 2;
      this.sketchPreview.position.set(start.x, 0.01, start.y);
      
      this.scene.add(this.sketchPreview);
    }
  }
  
  clearSketchPreview() {
    if (this.sketchPreview) {
      this.scene.remove(this.sketchPreview);
      this.sketchPreview = null;
    }
  }
  
  cancelSketch() {
    this.mode = 'select';
    this.sketchMode = null;
    this.sketchStart = null;
    this.clearSketchPreview();
  }
  
  generateId() {
    return `obj_${this.objectIdCounter++}_${Date.now()}`;
  }
  
  getObjects() {
    return this.objects;
  }
  
  clearScene() {
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      this.removeWireframe(obj);
    });
    this.objects = [];
    this.clearSelection();
  }
  
  addImportedObject(mesh) {
    this.scene.add(mesh);
    this.objects.push(mesh);
    this.addWireframe(mesh);
  }
  
  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
