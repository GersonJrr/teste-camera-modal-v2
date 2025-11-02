"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type RecordingState = "idle" | "recording" | "stopped";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Constraints
  const HIGH_RES_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 60, max: 60 },
      facingMode: "environment"
    },
    audio: false,
  };

  const FALLBACK_RES_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    },
    audio: true,
  };

  // Cleanup da câmera
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Inicia câmera
  const startCamera = useCallback(async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(HIGH_RES_CONSTRAINTS);
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(console.error);
      }
    } catch (err) {
      console.warn("Falha câmera traseira, tentando frontal:", err);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(FALLBACK_RES_CONSTRAINTS);
        cameraStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(console.error);
        }
      } catch (fallbackErr) {
        const errorMsg = "Não foi possível acessar a câmera. Verifique as permissões.";
        console.error(errorMsg, fallbackErr);
        setError(errorMsg);
      }
    }
  }, []);

  // Iniciar gravação
  const startRecording = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (!stream) {
      setError("Câmera não está pronta. Aguarde alguns segundos.");
      return;
    }

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType, 
        videoBitsPerSecond: 8000000 
      });
      
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        setRecordingState("stopped");
      };

      mediaRecorder.start(2000);
      setRecordingState("recording");
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Erro ao iniciar gravação:", err);
      setError(`Erro ao iniciar gravação: ${errorMsg}`);
    }
  }, []);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  // Salvar vídeo
  const saveVideo = useCallback(() => {
    if (recordedChunks.length === 0) {
      setError("Nenhum vídeo gravado!");
      return;
    }

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `video_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    setRecordedChunks([]);
    setRecordingState("idle");
    setError(null);
  }, [recordedChunks]);

  // Fechar modal
  const handleClose = useCallback(() => {
    if (recordingState === "recording") stopRecording();
    setIsOpen(false);
    stopCamera();
    setRecordedChunks([]);
    setRecordingState("idle");
    setError(null);
  }, [recordingState, stopRecording, stopCamera]);

  // Abrir modal
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    startCamera();
  }, [startCamera]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current && recordingState === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopCamera, recordingState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors shadow-lg"
        onClick={handleOpen}
        aria-label="Abrir câmera para gravação"
      >
        📹 Abrir Câmera
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-title"
        >
          <div
            className="w-full max-w-6xl h-[95vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 id="camera-title" className="text-xl font-bold text-gray-800">
                Gravador de Vídeo
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                aria-label="Fechar câmera"
              >
                ×
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col gap-4 h-full">
                <div className="relative w-full flex-1 rounded-md overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />

                  {/* Marca pontilhada - 386x583 */}
                  <div
                    className="absolute top-1/2 left-1/2 w-[386px] h-[583px] -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-red-500 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {recordingState === "idle" && (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg flex-1 transition-colors"
                      onClick={startRecording}
                      aria-label="Iniciar gravação"
                    >
                      ▶️ Iniciar Gravação
                    </button>
                  )}

                  {recordingState === "recording" && (
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg text-lg flex-1 transition-colors animate-pulse"
                      onClick={stopRecording}
                      aria-label="Parar gravação"
                    >
                      ⏹️ Parar Gravação
                    </button>
                  )}

                  {recordingState === "stopped" && recordedChunks.length > 0 && (
                    <>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg flex-1 transition-colors"
                        onClick={saveVideo}
                        aria-label="Salvar vídeo"
                      >
                        💾 Salvar Vídeo
                      </button>
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors"
                        onClick={() => {
                          setRecordedChunks([]);
                          setRecordingState("idle");
                        }}
                        aria-label="Descartar vídeo"
                      >
                        🗑️ Descartar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}