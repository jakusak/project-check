import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle, Loader2 } from "lucide-react";

interface MobileBarcodeScannerProps {
  onScanSuccess: (value: string) => void;
  onClose: () => void;
  title?: string;
}

export default function MobileBarcodeScanner({
  onScanSuccess,
  onClose,
  title = "Scan Barcode",
}: MobileBarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startScanner = async () => {
      if (!containerRef.current) return;

      try {
        const html5Qrcode = new Html5Qrcode("barcode-scanner-container");
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Vibrate on success if supported
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            onScanSuccess(decodedText);
          },
          () => {
            // Scan error - ignore, keep scanning
          }
        );

        setIsStarting(false);
      } catch (err: any) {
        console.error("Scanner error:", err);
        if (err.toString().includes("NotAllowedError")) {
          setError("Camera access denied. Please enable camera permissions and try again.");
        } else if (err.toString().includes("NotFoundError")) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to start camera. Please try again or use manual entry.");
        }
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="font-medium">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative" ref={containerRef}>
        {isStarting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center text-white">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center text-white p-6">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="mb-6">{error}</p>
            <Button onClick={onClose} variant="secondary" size="lg">
              Use Manual Entry
            </Button>
          </div>
        ) : (
          <div
            id="barcode-scanner-container"
            className="w-full max-w-md mx-auto"
          />
        )}
      </div>

      {/* Instructions */}
      {!error && (
        <div className="p-4 bg-black/80 text-center text-white/80 text-sm">
          <p>Point your camera at a barcode</p>
          <p className="mt-1 text-white/60">Scanning will happen automatically</p>
        </div>
      )}

      {/* Manual entry fallback */}
      <div className="p-4 bg-black">
        <Button
          variant="outline"
          className="w-full h-12 text-base border-white/30 text-white hover:bg-white/10"
          onClick={onClose}
        >
          Cancel &amp; Enter Manually
        </Button>
      </div>
    </div>
  );
}
