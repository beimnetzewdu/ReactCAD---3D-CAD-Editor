import React from 'react';

function BottomToolbar({ mode, sketchTool, onCancelSketch, onToggleSnap }) {
  return (
    <div className="bottom-toolbar">
      <div className={`mode-indicator ${mode === 'sketch' ? 'active' : ''}`}>
        {mode === 'sketch' ? (
          <>
            <span>✏️ Sketch Mode: {sketchTool}</span>
            <button className="btn" onClick={onCancelSketch}>
              Cancel (Esc)
            </button>
          </>
        ) : (
          <span>🖱️ Select Mode</span>
        )}
      </div>

      <div className="divider" />

      <button className="btn" onClick={onToggleSnap}>
        📐 Snap to Grid
      </button>

      <div className="divider" />

      <div className="info-text">
        Controls: Alt+Drag to rotate | Shift+Drag to pan | Scroll to zoom
      </div>
    </div>
  );
}

export default BottomToolbar;
