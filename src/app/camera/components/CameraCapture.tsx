"use client";
import { useState, useRef, useEffect } from "react";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const HIGH_RES_CONSTRAINTS: MediaStreamConstraints = {
    video: { width: 1920, height: 1080, facingMode: "environment" },
    audio: false,
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(HIGH_RES_CONSTRAINTS);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      applyZoom(zoom);
    } catch (err) {
      console.error("Não foi possível acessar a câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const applyZoom = (zoomLevel: number) => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if ("zoom" in capabilities) {
      const { min = 1, max = 5 } = capabilities.zoom as { min?: number; max?: number };
      const clampedZoom = Math.max(min, Math.min(max, zoomLevel));

      track.applyConstraints({
        advanced: [{ zoom: clampedZoom } as unknown as MediaTrackConstraintSet],
      }).catch(console.error);

      setZoom(clampedZoom);
    }
  };

  const handleZoomIn = () => applyZoom(zoom + 0.5);
  const handleZoomOut = () => applyZoom(zoom - 0.5);

  const startRecording = () => {
    const stream = cameraStreamRef.current;
    if (!stream) {
      alert("Câmera não está pronta.");
      return;
    }

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    mediaRecorderRef.current = mediaRecorder;

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => setRecordedChunks(chunks);

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const saveVideo = () => {
    if (recordedChunks.length === 0) return alert("Nenhum vídeo gravado!");
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
    alert("Vídeo salvo!");
  };

  const closeCamera = () => {
    if (recording) stopRecording();
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setIsOpen(false);
    setRecordedChunks([]);
    setZoom(1);
  };

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="text-center">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
        onClick={() => {
          setIsOpen(true);
          startCamera();
        }}
      >
        📹 Abrir Câmera
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black z-50">
          {/* Vídeo em tela cheia */}
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Overlay pontilhado central - Proporção 386x583 */}
           {/* Overlay pontilhado central - Proporção 386x584 */}
            <div
              className="absolute border-2 border-dashed border-white"
              style={{
                width: "386px",
                height: "584px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />

            {/* Áreas que serão cortadas - escurecidas */}
            <div
              className="absolute top-0 left-0 right-0 bg-black/60"
              style={{
                height: "calc((100vh - 584px) / 2)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/60"
              style={{
                height: "calc((100vh - 584px) / 2)",
                pointerEvents: "none",
              }}
            >
              <div className="absolute top-2 left-0 right-0 text-center">
                <span className="text-white/80 text-sm font-semibold bg-black/40 px-3 py-1 rounded">
                  Área que será cortada
                </span>
              </div>
            </div>

            {/* Controles sobrepostos */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {/* Controles de Zoom */}
              <div className="flex gap-2 items-center justify-center mb-4">
                <button
                  className="bg-gray-700/90 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  −
                </button>
                <span className="text-white font-semibold min-w-[50px] text-center">{zoom.toFixed(1)}x</span>
                <button
                  className="bg-gray-700/90 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                >
                  +
                </button>
              </div>

              {/* Botões de controle */}
              <div className="flex flex-col gap-2">
                {!recording ? (
                  <button
                    className="bg-green-500/90 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
                    onClick={startRecording}
                  >
                    ▶️ Iniciar Gravação
                  </button>
                ) : (
                  <button
                    className="bg-red-500/90 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg"
                    onClick={stopRecording}
                  >
                    ⏹️ Parar Gravação
                  </button>
                )}

                {recordedChunks.length > 0 && (
                  <button
                    className="bg-blue-500/90 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
                    onClick={saveVideo}
                  >
                    💾 Salvar Vídeo
                  </button>
                )}

                <button
                  className="bg-gray-700/90 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                  onClick={closeCamera}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}