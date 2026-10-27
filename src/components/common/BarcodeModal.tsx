import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanBarcode, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ isOpen, onClose, onScan }) => {
  const { products } = useERP();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported by browser. Use simulated barcodes or manual entry.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Check if native BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'code_39', 'qr_code'],
        });

        const scanLoop = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected) {
                onScan(detected);
                onClose();
                return;
              }
            }
          } catch (e) {
            // continue loop
          }
          if (isOpen) {
            requestAnimationFrame(scanLoop);
          }
        };
        requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      setCameraError('Camera unavailable or permission denied. You can test using simulated barcode badges below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <ScanBarcode className="h-5 w-5 text-indigo-600" />
            <span>Barcode Scanner (Camera & Hardware)</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewport / Scanner */}
        <div className="mt-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                {/* Red scanning line animation */}
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-white/40 rounded-lg" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <Camera className="h-10 w-10 text-slate-600" />
                <span className="text-xs text-slate-400">
                  {cameraError || 'Initializing camera viewfinder...'}
                </span>
                <button
                  onClick={startCamera}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleSubmitManual} className="mt-4">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Manual Barcode / SKU Entry
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. 619001234001"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Scan
            </button>
          </div>
        </form>

        {/* Quick Simulator Barcode Chips for easy testing */}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Quick Scan Test (Click product to simulate laser scan):
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
            {products.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onScan(p.barcode);
                  onClose();
                }}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-indigo-950/40"
              >
                <div className="truncate">
                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                  <div className="font-mono text-[10px] text-slate-400">{p.barcode}</div>
                </div>
                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ${p.selling_price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-slate-400">
          Hardware USB & Bluetooth scanners work directly: simply pull the scanner trigger on any screen.
        </div>
      </div>
    </div>
  );
};
