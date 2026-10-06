import React, { useState, useRef } from 'react';
import { Upload, X, ZoomIn, Maximize2, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export interface UploadItem {
  timeframe: string;
  file?: File;
  previewUrl?: string;
  existingId?: number;
}

interface ScreenshotUploaderProps {
  uploads: UploadItem[];
  onChange: (uploads: UploadItem[]) => void;
}

const AVAILABLE_TIMEFRAMES = [
  '5 Minute',
  '15 Minute',
  '1 Hour',
  'Daily',
  '3 Minute',
  '30 Minute',
  '4 Hour',
  'Weekly',
  '1 Minute',
];

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({ uploads, onChange }) => {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [dragOverTimeframe, setDragOverTimeframe] = useState<string | null>(null);

  const handleFileSelect = (timeframe: string, file: File) => {
    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      alert('Only PNG, JPG, JPEG, and WEBP images are allowed');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const existingIndex = uploads.findIndex((u) => u.timeframe === timeframe);

    if (existingIndex >= 0) {
      const updated = [...uploads];
      updated[existingIndex] = { timeframe, file, previewUrl };
      onChange(updated);
    } else {
      onChange([...uploads, { timeframe, file, previewUrl }]);
    }
  };

  const handleRemove = (timeframe: string) => {
    onChange(uploads.filter((u) => u.timeframe !== timeframe));
  };

  const getUploadForTimeframe = (timeframe: string) => {
    return uploads.find((u) => u.timeframe === timeframe);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-200">Multi-Timeframe Screenshots</h4>
          <p className="text-xs text-gray-400">
            Upload at least one primary chart. Adding multiple timeframes (e.g. 5m + 15m + 1h + Daily) enables AI multi-timeframe synthesis.
          </p>
        </div>
        <span className="text-xs font-mono bg-blue-950/80 text-blue-400 px-3 py-1 rounded-full border border-blue-800">
          {uploads.length} Timeframe{uploads.length !== 1 ? 's' : ''} Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AVAILABLE_TIMEFRAMES.slice(0, 4).map((tf) => {
          const item = getUploadForTimeframe(tf);
          const isDragging = dragOverTimeframe === tf;

          return (
            <div
              key={tf}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTimeframe(tf);
              }}
              onDragLeave={() => setDragOverTimeframe(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTimeframe(null);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(tf, e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
                item
                  ? 'border-blue-500/50 bg-[#131b2e]'
                  : isDragging
                  ? 'border-blue-400 bg-blue-950/40'
                  : 'border-dashed border-gray-800 hover:border-gray-700 bg-gray-900/40'
              }`}
            >
              {/* Header */}
              <div className="p-3 border-b border-gray-800/80 flex items-center justify-between bg-gray-950/40">
                <span className="text-xs font-bold text-gray-200">{tf}</span>
                {item ? (
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">Empty</span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[160px] relative">
                {item?.previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                    <img
                      src={item.previewUrl}
                      alt={`${tf} preview`}
                      className="max-h-36 w-full object-contain rounded-lg border border-gray-800 bg-black/40"
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalImage(item.previewUrl!)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                        title="Zoom / Preview"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <label className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer" title="Replace">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileSelect(tf, e.target.files[0]);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemove(tf)}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center group">
                    <div className="w-10 h-10 rounded-full bg-gray-800/80 group-hover:bg-blue-600/20 flex items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">
                      Drop or browse
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(tf, e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Timeframes Toggle if desired */}
      <details className="text-xs text-gray-400 group">
        <summary className="cursor-pointer hover:text-gray-200 transition-colors font-medium">
          + Add more timeframes (3m, 30m, 4h, Weekly, 1m)
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
          {AVAILABLE_TIMEFRAMES.slice(4).map((tf) => {
            const item = getUploadForTimeframe(tf);
            return (
              <div key={tf} className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200 text-xs">{tf}</p>
                  <p className="text-[10px] text-gray-400">{item ? 'Loaded' : 'Optional'}</p>
                </div>
                {item ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(tf)}
                    className="text-red-400 hover:text-red-300 text-xs p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                    Upload
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(tf, e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </details>

      {/* Modal for Zoom / Full screen preview */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-10 right-0 text-gray-300 hover:text-white p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={modalImage}
              alt="Enlarged chart"
              className="max-h-[85vh] max-w-full object-contain rounded-xl border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
