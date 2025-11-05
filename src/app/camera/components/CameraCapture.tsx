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

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(HIGH_RES_CONSTRAINTS);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
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

      track
        .applyConstraints({
          advanced: [{ zoom: clampedZoom } as unknown as MediaTrackConstraintSet],
        })
        .catch(console.error);

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

    // 🔍 Define o formato automaticamente
    let mimeType = isIOS || isSafari
      ? "video/mp4;codecs=avc1.42E01E,mp4a.40.2"
      : "video/webm;codecs=vp9";

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = isIOS || isSafari ? "video/mp4" : "video/webm";
    }

    console.log("Usando formato:", mimeType);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });
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

    const isApple = isIOS || isSafari;
    const mimeType = isApple ? "video/mp4" : "video/webm";
    const extension = isApple ? "mp4" : "webm";

    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
    alert(`Vídeo salvo em formato .${extension}!`);
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
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeCamera}
        >
          <div
            className="w-[100%] md:w-[80vw] h-[95vh] md:h-[90vh] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1 h-full flex flex-col items-center justify-center gap-4">
              <div className="relative w-full max-h-[70vh]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full bg-black rounded-md object-cover"
                />
                <img
                  src="https://imgproductioncrm.s3.us-east-2.amazonaws.com/2008guia.png1762373792.3064"
                  alt="Guia de orientação"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    aspectRatio: "1080/1920",
                    height: "100%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                     objectFit: "contain"
                  }}
                />
                <div
                  className="absolute border-2 border-dashed border-white"
                  style={{
                    aspectRatio: "386/584",
                    height: "100%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Controles de Zoom */}
              <div className="flex gap-2 items-center justify-center mt-2">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  −
                </button>
                <span className="text-white font-semibold min-w-[40px] text-center">
                  {zoom.toFixed(1)}x
                </span>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                >
                  +
                </button>
              </div>

              {!recording ? (
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg w-full"
                  onClick={startRecording}
                >
                  ▶️ Iniciar Gravação
                </button>
              ) : (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full"
                  onClick={stopRecording}
                >
                  ⏹️ Parar Gravação
                </button>
              )}

              {recordedChunks.length > 0 && (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg w-full"
                  onClick={saveVideo}
                >
                  💾 Salvar Vídeo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
