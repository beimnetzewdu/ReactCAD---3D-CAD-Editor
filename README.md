# Draw3D - Browser-Based CAD Editor

A minimal but structurally solid browser-based CAD editor built with React and Three.js (plain Three.js, no React Three Fiber).

## 🎯 Features

### ✅ Primitive Shape Creation
- **Box, Sphere, and Cylinder** primitives with explicit faces and edges
- Each primitive has distinct, selectable faces and edges
- Visual highlighting of selected entities
- Wireframe rendering for better edge visibility

### ✅ Selection System
- **Shape Selection**: Click on a shape body to select the entire object
- **Face Selection**: Select individual faces with area and normal information
- **Edge Selection**: Select individual edges with length information
- Raycasting-based precision selection
- Visual feedback with color-coded highlights:
  - Green for face/edge selection
  - Yellow for shape selection

### ✅ 2D Sketching and Extrusion
- **Sketch Mode** for 2D drawing on the XZ-plane (ground plane)
- **Rectangle Tool**: Click-drag to define width and height
- **Circle Tool**: Click-drag to define radius
- **Snap-to-Grid**: Precision drawing with configurable grid snapping
- **Real-time Preview**: See your sketch as you draw
- **Extrusion**: Convert 2D sketches into 3D geometry using Three.js ExtrudeGeometry
- Extruded meshes support full selection and transformation

### ✅ Transformations
- **Move**: Translate objects in X, Y, Z axes
- **Rotate**: Rotate objects around X, Y, Z axes (displayed in degrees)
- **Scale**: Scale objects uniformly or per-axis
- Real-time property editing via sidebar inputs
- Transform controls update wireframes and highlights automatically

### ✅ Properties Display
- **Shape Properties**: Type, ID, position, rotation, scale
- **Face Properties**: Face index, area, normal vector
- **Edge Properties**: Edge index, length, start/end points
- **Type-Specific Parameters**: 
  - Box: width, height, depth
  - Sphere: radius, segments
  - Cylinder: radiusTop, radiusBottom, height, segments
  - Extruded: sketch data, extrude depth

### ✅ Import/Export
- **Export to JSON**: Save entire scene with all geometry, transforms, and metadata
- **Import from JSON**: Fully restore scenes with all properties
- Imported objects behave identically to newly created ones
- Example JSON files included in `/examples` folder

### ✅ Camera Controls
- **Orbit**: Alt + Left Mouse Drag
- **Pan**: Shift + Left Mouse Drag
- **Zoom**: Mouse Wheel
- Smooth, intuitive navigation

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd Draw3D
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173` (or the URL shown in terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage Guide

### Creating Primitives
1. Click on the primitive buttons in the left toolbar:
   - 📦 Box
   - ⚪ Sphere
   - 🔵 Cylinder
2. The shape will appear at the origin

### Selecting Objects
1. Choose selection mode from the toolbar:
   - **Shape**: Select entire objects
   - **Face**: Select individual faces
   - **Edge**: Select individual edges
2. Click on the desired entity in the viewport
3. View properties in the right sidebar

### 2D Sketching
1. Click the Rectangle (▭) or Circle (○) button
2. Click once to set the start point
3. Move mouse to see preview (snaps to grid by default)
4. Click again to complete the sketch
5. The sketch is automatically extruded into 3D
6. Adjust extrude depth in the sidebar before sketching

### Transforming Objects
1. Select a shape (not face or edge)
2. Use the Transform section in the sidebar
3. Edit Position, Rotation, or Scale values
4. Changes apply in real-time

### Deleting Objects
1. Select a shape
2. Click the 🗑️ delete button in the toolbar

### Export/Import
- **Export**: Click 💾 to download the current scene as JSON
- **Import**: Click 📁 to load a previously saved scene
- Example scenes are in the `/examples` folder

### Keyboard Shortcuts
- **Delete**: Delete selected shape
- **Esc**: Cancel sketch mode

## 🏗️ Architecture

### Project Structure
```
Draw3D/
├── src/
│   ├── components/          # React UI components
│   │   ├── Toolbar.jsx      # Left toolbar with tools
│   │   ├── Sidebar.jsx      # Right sidebar with properties
│   │   └── BottomToolbar.jsx # Bottom status bar
│   ├── engine/              # Core CAD engine
│   │   └── CADEngine.js     # Main Three.js scene manager
│   ├── utils/               # Utility modules
│   │   ├── GeometryUtils.js # Geometry creation and manipulation
│   │   ├── SelectionUtils.js # Raycasting and selection logic
│   │   └── ImportExport.js  # JSON serialization
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── examples/                # Example JSON scenes
│   ├── simple-scene.json
│   └── complex-scene.json
├── package.json
├── vite.config.js
└── README.md
```

### Key Design Decisions

1. **Separation of Concerns**
   - `CADEngine`: Manages Three.js scene, rendering, and 3D operations
   - React Components: Handle UI state and user interactions
   - Utility Modules: Reusable geometry and selection logic

2. **Geometry Metadata**
   - All geometries store face and edge data in `userData`
   - Enables precise face/edge selection and property display
   - Maintains CAD-specific information for import/export

3. **Selection System**
   - Raycasting for shape and face selection
   - Distance-based algorithm for edge selection
   - Visual feedback with separate highlight meshes

4. **Sketch-to-3D Pipeline**
   - 2D sketches drawn on XZ-plane (y=0)
   - Three.js Shape API for 2D geometry
   - ExtrudeGeometry for 3D conversion
   - Automatic rotation and positioning

## 🎨 Reference Implementation

The primitive shape creation follows the approach demonstrated in:
[OnShape-style CAD Interface](https://www.youtube.com/watch?v=lzSKQ_QVH70)

Key features implemented:
- Explicit face and edge representation
- Multi-level selection (shape/face/edge)
- Property inspection
- Clean, professional UI

## ⚠️ Known Limitations

1. **Edge Selection Sensitivity**
   - Edge selection requires precise mouse positioning
   - Threshold is set to 0.1 units - may need adjustment for smaller objects

2. **Sketch Plane**
   - Currently fixed to XZ-plane (ground)
   - No support for sketching on arbitrary faces yet

3. **Undo/Redo**
   - Not implemented in this version
   - Consider using version control for scene files

4. **Performance**
   - Optimized for scenes with up to ~100 objects
   - Very complex geometries may impact frame rate

5. **Wireframe Updates**
   - Wireframes update on transform but not on geometry changes
   - Refresh by re-importing the scene if needed

6. **Material Editing**
   - Colors are preset per primitive type
   - No runtime color picker (can be added easily)

## 🔧 Technical Stack

- **React 18.2**: UI framework
- **Three.js 0.160**: 3D rendering engine
- **Vite 5**: Build tool and dev server
- **Plain JavaScript**: No TypeScript (for simplicity)
- **CSS3**: Modern styling with flexbox/grid

## 🚀 Deployment

### GitHub Pages
```bash
npm run build
# Deploy the dist folder to gh-pages branch
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## 🎯 Future Enhancements (Optional)

- [ ] Undo/Redo system with command pattern
- [ ] Editable sketches (modify after creation)
- [ ] Dimension annotations for faces/edges
- [ ] Object grouping and hierarchy
- [ ] Sketch on arbitrary planes/faces
- [ ] Boolean operations (union, subtract, intersect)
- [ ] Material/color editor
- [ ] Multiple viewport support
- [ ] Measurement tools
- [ ] Constraint-based sketching

## 📝 License

MIT License - Feel free to use this project as a reference or starting point for your own CAD applications.

## 🤝 Contributing

This is an assessment project, but suggestions and improvements are welcome!

---

**Built with ❤️ using React and Three.js**
