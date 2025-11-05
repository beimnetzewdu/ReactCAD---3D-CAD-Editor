import React from 'react';

function Toolbar({ 
  onAddBox, 
  onAddSphere, 
  onAddCylinder, 
  onStartSketch,
  onDelete,
  onExport,
  onImport,
  selectionMode,
  onSelectionModeChange,
  mode,
  sketchTool,
  hasSelection
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="toolbar-label">Shapes</div>
        <div className="toolbar-buttons">
          <button className="btn btn-icon" onClick={onAddBox} title="Add Box">
            📦
          </button>
          <button className="btn btn-icon" onClick={onAddSphere} title="Add Sphere">
            ⚪
          </button>
          <button className="btn btn-icon" onClick={onAddCylinder} title="Add Cylinder">
            🔵
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-label">Sketch</div>
        <div className="toolbar-buttons">
          <button 
            className={`btn btn-icon ${mode === 'sketch' && sketchTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => onStartSketch('rectangle')}
            title="Rectangle"
          >
            ▭
          </button>
          <button 
            className={`btn btn-icon ${mode === 'sketch' && sketchTool === 'circle' ? 'active' : ''}`}
            onClick={() => onStartSketch('circle')}
            title="Circle"
          >
            ○
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-label">Selection</div>
        <div className="toolbar-buttons">
          <button 
            className={`btn ${selectionMode === 'shape' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('shape')}
            title="Select Shape"
          >
            Shape
          </button>
          <button 
            className={`btn ${selectionMode === 'face' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('face')}
            title="Select Face"
          >
            Face
          </button>
          <button 
            className={`btn ${selectionMode === 'edge' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('edge')}
            title="Select Edge"
          >
            Edge
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-label">Actions</div>
        <div className="toolbar-buttons">
          <button 
            className="btn" 
            onClick={onDelete}
            disabled={!hasSelection || mode === 'sketch'}
            title="Delete Selected Object (Del)"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-label">File</div>
        <div className="toolbar-buttons">
          <button className="btn btn-icon" onClick={onExport} title="Export JSON">
            💾
          </button>
          <button className="btn btn-icon" onClick={onImport} title="Import JSON">
            📁
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
