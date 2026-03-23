"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">(
    "prompt"
  );
  const router = useRouter();
  const rafRef = useRef<number>(0);

  const handleScan = useCallback(
    (batchId: string) => {
      setScanning(false);
      void router.push(`/verify/${batchId}`);
    },
    [router]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraPermission("granted");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
        }
      } catch {
        setCameraPermission("denied");
        setError("Camera access denied. Please allow camera access or use manual entry below.");
      }
    }

    void startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // QR scanning loop
  useEffect(() => {
    if (!scanning) return;

    let active = true;

    async function scanFrame() {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Dynamic import jsQR to keep bundle size low
      const { default: jsQR } = await import("jsqr");
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Extract batchId from URL pattern /verify/{batchId} or raw batchId
        const match = /\/verify\/([^/?#]+)/.exec(code.data);
        const batchId = match ? match[1] : code.data;
        handleScan(batchId);
        return;
      }

      if (active) {
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    }

    void scanFrame();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [scanning, handleScan]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Scan Your Food</h1>
          <p className="text-gray-400 text-sm">Point camera at the QR code on your packaging</p>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-square mb-6">
          {cameraPermission === "granted" ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                aria-label="Camera feed for QR scanning"
              />
              <canvas ref={canvasRef} className="hidden" aria-hidden />

              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-brand-400 rounded-2xl relative">
                  {/* Corner markers */}
                  {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map(
                    (pos) => (
                      <div
                        key={pos}
                        className={`absolute ${pos} w-6 h-6 border-brand-400`}
                        style={{ border: "3px solid" }}
                      />
                    )
                  )}
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-400 animate-bounce" />
                </div>
              </div>

              {scanning && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-brand-400 text-sm animate-pulse">Scanning…</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <span className="text-6xl mb-4">📷</span>
              {cameraPermission === "denied" ? (
                <p className="text-red-400 text-sm">{error}</p>
              ) : (
                <p className="text-gray-400 text-sm">Requesting camera access…</p>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && cameraPermission === "denied" && (
          <div
            className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Manual Entry Fallback */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-3 text-center uppercase tracking-wide">
            Or enter batch ID manually
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. 4821"
              className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Batch ID manual entry"
            />
            <button
              type="submit"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              aria-label="Look up batch"
            >
              Look Up
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          QR codes are printed on FoodLink-certified packaging
        </p>
      </div>
    </div>
  );
}
