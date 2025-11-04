import React from 'react';

function Sidebar({ selectedEntity, onTransform, extrudeDepth, onExtrudeDepthChange }) {
  if (!selectedEntity) {
    return (
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Properties</h3>
          <div className="no-selection">
            No object selected
          </div>
        </div>
        <div className="sidebar-section">
          <h3>Sketch Settings</h3>
          <div className="property-row">
            <label className="property-label">Extrude Depth</label>
            <input
              type="number"
              className="property-input"
              value={extrudeDepth}
              onChange={(e) => onExtrudeDepthChange(parseFloat(e.target.value) || 1)}
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
      </div>
    );
  }

  // Shape selection
  if (selectedEntity.userData?.isCADObject) {
    const mesh = selectedEntity;
    return (
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Shape Properties</h3>
          <div className="property-grid">
            <div className="property-row">
              <div className="property-label">Type</div>
              <div className="property-value">{mesh.userData.type}</div>
            </div>
            <div className="property-row">
              <div className="property-label">ID</div>
              <div className="property-value" style={{ fontSize: '10px' }}>
                {mesh.userData.id}
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Transform</h3>
          <div className="transform-controls-vertical">
            <div className="transform-group">
              <div className="transform-group-label">Position</div>
              <div className="transform-item">
                <label>X</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'x', mesh.position.x - 0.1)}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.position.x.toFixed(2)}
                  onChange={(e) => onTransform('position', 'x', e.target.value)}
                  step="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'x', mesh.position.x + 0.1)}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Y</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'y', mesh.position.y - 0.1)}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.position.y.toFixed(2)}
                  onChange={(e) => onTransform('position', 'y', e.target.value)}
                  step="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'y', mesh.position.y + 0.1)}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Z</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'z', mesh.position.z - 0.1)}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.position.z.toFixed(2)}
                  onChange={(e) => onTransform('position', 'z', e.target.value)}
                  step="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('position', 'z', mesh.position.z + 0.1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="transform-group">
              <div className="transform-group-label">Rotation (degrees)</div>
              <div className="transform-item">
                <label>X</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'x', mesh.rotation.x - (5 * Math.PI / 180))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={(mesh.rotation.x * 180 / Math.PI).toFixed(1)}
                  onChange={(e) => onTransform('rotation', 'x', parseFloat(e.target.value) * Math.PI / 180)}
                  step="1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'x', mesh.rotation.x + (5 * Math.PI / 180))}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Y</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'y', mesh.rotation.y - (5 * Math.PI / 180))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={(mesh.rotation.y * 180 / Math.PI).toFixed(1)}
                  onChange={(e) => onTransform('rotation', 'y', parseFloat(e.target.value) * Math.PI / 180)}
                  step="1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'y', mesh.rotation.y + (5 * Math.PI / 180))}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Z</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'z', mesh.rotation.z - (5 * Math.PI / 180))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={(mesh.rotation.z * 180 / Math.PI).toFixed(1)}
                  onChange={(e) => onTransform('rotation', 'z', parseFloat(e.target.value) * Math.PI / 180)}
                  step="1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('rotation', 'z', mesh.rotation.z + (5 * Math.PI / 180))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="transform-group">
              <div className="transform-group-label">Scale</div>
              <div className="transform-item">
                <label>X</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'x', Math.max(0.1, mesh.scale.x - 0.1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.scale.x.toFixed(2)}
                  onChange={(e) => onTransform('scale', 'x', e.target.value)}
                  step="0.1"
                  min="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'x', mesh.scale.x + 0.1)}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Y</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'y', Math.max(0.1, mesh.scale.y - 0.1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.scale.y.toFixed(2)}
                  onChange={(e) => onTransform('scale', 'y', e.target.value)}
                  step="0.1"
                  min="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'y', mesh.scale.y + 0.1)}
                >
                  +
                </button>
              </div>
              <div className="transform-item">
                <label>Z</label>
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'z', Math.max(0.1, mesh.scale.z - 0.1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="transform-input"
                  value={mesh.scale.z.toFixed(2)}
                  onChange={(e) => onTransform('scale', 'z', e.target.value)}
                  step="0.1"
                  min="0.1"
                />
                <button 
                  className="transform-btn"
                  onClick={() => onTransform('scale', 'z', mesh.scale.z + 0.1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {mesh.userData.type === 'box' && (
          <div className="sidebar-section">
            <h3>Box Parameters</h3>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Width</div>
                <div className="property-value">{mesh.userData.width}</div>
              </div>
              <div className="property-row">
                <div className="property-label">Height</div>
                <div className="property-value">{mesh.userData.height}</div>
              </div>
              <div className="property-row">
                <div className="property-label">Depth</div>
                <div className="property-value">{mesh.userData.depth}</div>
              </div>
            </div>
          </div>
        )}

        {mesh.userData.type === 'sphere' && (
          <div className="sidebar-section">
            <h3>Sphere Parameters</h3>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Radius</div>
                <div className="property-value">{mesh.userData.radius}</div>
              </div>
            </div>
          </div>
        )}

        {mesh.userData.type === 'cylinder' && (
          <div className="sidebar-section">
            <h3>Cylinder Parameters</h3>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Radius Top</div>
                <div className="property-value">{mesh.userData.radiusTop}</div>
              </div>
              <div className="property-row">
                <div className="property-label">Radius Bottom</div>
                <div className="property-value">{mesh.userData.radiusBottom}</div>
              </div>
              <div className="property-row">
                <div className="property-label">Height</div>
                <div className="property-value">{mesh.userData.height}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Face selection
  if (selectedEntity.type === 'face') {
    return (
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Face Properties</h3>
          <div className="property-grid">
            <div className="property-row">
              <div className="property-label">Face Index</div>
              <div className="property-value">{selectedEntity.faceIndex}</div>
            </div>
            <div className="property-row">
              <div className="property-label">Area</div>
              <div className="property-value">{selectedEntity.area.toFixed(4)}</div>
            </div>
            <div className="property-row">
              <div className="property-label">Normal</div>
              <div className="property-value">
                ({selectedEntity.normal.x.toFixed(2)}, {selectedEntity.normal.y.toFixed(2)}, {selectedEntity.normal.z.toFixed(2)})
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edge selection
  if (selectedEntity.type === 'edge') {
    return (
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Edge Properties</h3>
          <div className="property-grid">
            <div className="property-row">
              <div className="property-label">Edge Index</div>
              <div className="property-value">{selectedEntity.index}</div>
            </div>
            <div className="property-row">
              <div className="property-label">Length</div>
              <div className="property-value">{selectedEntity.length.toFixed(4)}</div>
            </div>
            <div className="property-row">
              <div className="property-label">Start</div>
              <div className="property-value">
                ({selectedEntity.start.x.toFixed(2)}, {selectedEntity.start.y.toFixed(2)}, {selectedEntity.start.z.toFixed(2)})
              </div>
            </div>
            <div className="property-row">
              <div className="property-label">End</div>
              <div className="property-value">
                ({selectedEntity.end.x.toFixed(2)}, {selectedEntity.end.y.toFixed(2)}, {selectedEntity.end.z.toFixed(2)})
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default Sidebar;
