import { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

/**
 * Custom TitleBar - Frameless window title bar with window controls
 * Follows JARVIS "Minimal HUD" design spec (Section 3.5)
 */
export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximized state
    if (window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }

    // Listen for window state changes
    const handleResize = () => {
      if (window.electronAPI?.isMaximized) {
        window.electronAPI.isMaximized().then(setIsMaximized);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="titlebar-container">
      {/* Drag region - title */}
      <div className="titlebar-drag-region">
        <div className="titlebar-brand">
          <span className="titlebar-logo">J</span>
          <span className="titlebar-title">JARVIS</span>
        </div>
      </div>

      {/* Window controls */}
      <div className="titlebar-controls">
        <button
          className="titlebar-button titlebar-button-minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>

        <button
          className="titlebar-button titlebar-button-maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
        </button>

        <button
          className="titlebar-button titlebar-button-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
