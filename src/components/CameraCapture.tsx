import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function CameraCapture({ onCapture, onClose, isLoading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && !isProcessing) {
      setIsProcessing(true);
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl glass-card overflow-hidden p-8">
        <button 
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all z-10 border border-white/10"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-mono uppercase tracking-widest mb-4">
            <Sparkles size={12} />
            Face Detection
          </div>
          <h2 className="text-3xl font-serif font-black tracking-tight">
            Scan Your Mood
          </h2>
          <p className="text-white/40 text-sm mt-2 font-light">Look into the camera and let AI detect your vibe.</p>
        </div>

        <div className="relative aspect-video bg-black/40 rounded-3xl overflow-hidden border border-white/10 mb-8 shadow-2xl">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-400/10 flex items-center justify-center mb-4">
                <X size={32} />
              </div>
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-orange-400 mb-4" size={48} />
                  <p className="text-xs font-mono uppercase tracking-widest text-white/50">Analyzing Vibe...</p>
                </div>
              )}
              
              {/* Scanning Line Effect */}
              {!isLoading && !error && (
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent z-10 pointer-events-none"
                />
              )}
            </>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="flex-1 py-4 rounded-2xl glass hover:bg-white/10 transition-all font-bold text-sm uppercase tracking-widest text-white/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={captureImage}
            disabled={isLoading || isProcessing || !!error}
            className="flex-[2] py-4 rounded-2xl bg-white text-black hover:bg-orange-500 hover:text-white transition-all font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-orange-500/20"
          >
            {(isLoading || isProcessing) ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
            {(isLoading || isProcessing) ? 'Analyzing...' : 'Capture Mood'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
