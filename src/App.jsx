import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import { CADEngine } from './engine/CADEngine';
import { exportScene, importScene, downloadJSON, readJSONFile } from './utils/ImportExport';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import BottomToolbar from './components/BottomToolbar';

function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [selectionMode, setSelectionMode] = useState('shape');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mode, setMode] = useState('select');
  const [sketchTool, setSketchTool] = useState(null);
  const [extrudeDepth, setExtrudeDepth] = useState(1);

  // Initialize CAD Engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CADEngine(canvasRef.current);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Delete key
      if (event.key === 'Delete' && selectedEntity && mode !== 'sketch') {
        handleDelete();
      }
      // Escape key - cancel sketch
      if (event.key === 'Escape' && mode === 'sketch') {
        handleCancelSketch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, mode]);

  // Handle canvas click and mouse move events
  useEffect(() => {
    if (!engineRef.current) return;

    const canvas = engineRef.current.renderer.domElement;

    const onCanvasClick = (event) => {
      if (!engineRef.current) return;

      if (mode === 'sketch') {
        const sketchData = engineRef.current.handleSketchClick(event);
        if (sketchData) {
          engineRef.current.addExtrudedShape(sketchData, extrudeDepth);
          setMode('select');
          setSketchTool(null);
        }
      } else {
        const selection = engineRef.current.handleClick(event, selectionMode);
        setSelectedEntity(selection);
      }
    };

    const onCanvasMouseMove = (event) => {
      if (!engineRef.current || mode !== 'sketch') return;
      engineRef.current.handleSketchMove(event);
    };

    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onCanvasMouseMove);

    return () => {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMouseMove);
    };
  }, [mode, selectionMode, extrudeDepth]);

  const handleAddBox = () => {
    if (engineRef.current) {
      engineRef.current.addBox(1, 1, 1);
    }
  };

  const handleAddSphere = () => {
    if (engineRef.current) {
      engineRef.current.addSphere(0.5, 32);
    }
  };

  const handleAddCylinder = () => {
    if (engineRef.current) {
      engineRef.current.addCylinder(0.5, 0.5, 1, 32);
    }
  };

  const handleSelectionModeChange = (newMode) => {
    setSelectionMode(newMode);
    if (engineRef.current) {
      engineRef.current.clearSelection();
      setSelectedEntity(null);
    }
  };

  const handleStartSketch = (tool) => {
    if (engineRef.current) {
      setMode('sketch');
      setSketchTool(tool);
      engineRef.current.startSketch(tool);
      engineRef.current.clearSelection();
      setSelectedEntity(null);
    }
  };

  const handleCancelSketch = () => {
    if (engineRef.current) {
      engineRef.current.cancelSketch();
      setMode('select');
      setSketchTool(null);
    }
  };

  const handleDelete = () => {
    if (engineRef.current) {
      engineRef.current.deleteSelected();
      setSelectedEntity(null);
    }
  };

  const handleTransform = (property, axis, value) => {
    if (engineRef.current && selectedEntity) {
      engineRef.current.transformSelected(property, axis, parseFloat(value));
      // Force re-render by updating the selected entity reference
      setSelectedEntity({...selectedEntity});
    }
  };

  const handleExport = () => {
    if (engineRef.current) {
      const json = exportScene(engineRef.current.getObjects());
      downloadJSON(json, `cad-scene-${Date.now()}.json`);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file || !engineRef.current) return;

    try {
      const jsonString = await readJSONFile(file);
      const objects = importScene(jsonString);
      
      if (objects) {
        engineRef.current.clearScene();
        objects.forEach(obj => engineRef.current.addImportedObject(obj));
        setSelectedEntity(null);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import scene. Please check the file format.');
    }

    event.target.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleToggleSnap = () => {
    if (engineRef.current) {
      engineRef.current.snapToGridEnabled = !engineRef.current.snapToGridEnabled;
    }
  };

  return (
    <div className="app">
      <div 
        ref={canvasRef} 
        className="canvas-container"
      />
      
      <Toolbar
        onAddBox={handleAddBox}
        onAddSphere={handleAddSphere}
        onAddCylinder={handleAddCylinder}
        onStartSketch={handleStartSketch}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImportClick}
        selectionMode={selectionMode}
        onSelectionModeChange={handleSelectionModeChange}
        mode={mode}
        sketchTool={sketchTool}
        hasSelection={!!selectedEntity}
      />
      
      <Sidebar
        selectedEntity={selectedEntity}
        onTransform={handleTransform}
        extrudeDepth={extrudeDepth}
        onExtrudeDepthChange={setExtrudeDepth}
      />
      
      <BottomToolbar
        mode={mode}
        sketchTool={sketchTool}
        onCancelSketch={handleCancelSketch}
        onToggleSnap={handleToggleSnap}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="file-input"
      />
    </div>
  );
}

export default App;
