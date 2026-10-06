import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import { OverlayAnnotation } from '../types';

interface ScreenshotOverlayViewerProps {
  imageUrl: string;
  timeframe?: string;
  overlays?: OverlayAnnotation[];
}

export const ScreenshotOverlayViewer: React.FC<ScreenshotOverlayViewerProps> = ({
  imageUrl,
  timeframe = '15 Minute',
  overlays = [],
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.75));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-gray-800 bg-[#090d16] overflow-hidden flex flex-col relative shadow-xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[500px]'
      }`}
    >
      {/* Control Toolbar */}
      <div className="p-3 bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-gray-200">Chart Inspection</span>
          <span className="text-[11px] font-mono bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
            {timeframe}
          </span>
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            Zoom: {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {overlays.length > 0 && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                showOverlays
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
              title="Toggle AI Level Overlays"
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="text-[11px]">AI Overlays</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-gray-800 mx-1"></div>

          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
            title="Full Screen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing flex items-center justify-center bg-black/60 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt="Chart Screenshot"
            className="max-h-[440px] w-auto object-contain rounded pointer-events-none shadow-2xl"
          />

          {/* AI Annotation Overlays */}
          {showOverlays && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {overlays.map((ov, idx) => {
                if (ov.y_percent !== undefined) {
                  const isRes = ov.type.includes('resistance');
                  const isSup = ov.type.includes('support');
                  const color = isRes ? '#ef4444' : isSup ? '#10b981' : '#3b82f6';

                  return (
                    <div
                      key={idx}
                      style={{ top: `${ov.y_percent}%` }}
                      className="absolute left-0 right-0 flex items-center"
                    >
                      <div
                        style={{ backgroundColor: color }}
                        className="h-[2px] w-full opacity-60"
                      />
                      <span
                        style={{
                          backgroundColor: '#0f172a',
                          color,
                          borderColor: color,
                        }}
                        className="absolute right-3 text-[10px] font-mono px-2 py-0.5 rounded border shadow-md font-semibold transform -translate-y-1/2"
                      >
                        {ov.label}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
