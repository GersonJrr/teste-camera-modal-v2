import { useState, useRef, useEffect } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [zoom, setZoom] = useState<number>(1);

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

  const startCamera = async (): Promise<void> => {
    try {
      const constraints: MediaStreamConstraints = {
        ...HIGH_RES_CONSTRAINTS,
        video: {
          ...(HIGH_RES_CONSTRAINTS.video as MediaTrackConstraints),
          facingMode: "environment"
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () =>
          videoRef.current?.play().catch(console.error);
      }

      applyZoom(1);
    } catch (err) {
      console.warn("Falha câmera traseira de alta resolução, tentando frontal HD:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia(FALLBACK_RES_CONSTRAINTS);
        cameraStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () =>
            videoRef.current?.play().catch(console.error);
        }
        
        applyZoom(1);
      } catch (fallbackErr) {
        console.error("Não foi possível acessar a câmera:", fallbackErr);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }
  };

  const applyZoom = (zoomLevel: number): void => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    // Type guard: checa se 'zoom' existe
    if ("zoom" in capabilities) {
      const zoomCap = capabilities as MediaTrackCapabilities & { zoom: { min: number; max: number } };
      const maxZoom = zoomCap.zoom.max ?? 1;
      const minZoom = zoomCap.zoom.min ?? 1;

      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));

      track.applyConstraints({
        advanced: [{ zoom: clampedZoom } as any]
      }).catch(console.error);
    }
  };

  const handleZoomIn = (): void => {
    const newZoom = Math.min(zoom + 0.5, 5);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const handleZoomOut = (): void => {
    const newZoom = Math.max(zoom - 0.5, 1);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const startRecording = (): void => {
    const stream = cameraStreamRef.current;
    if (!stream) {
      alert("Câmera não está pronta. Aguarde alguns segundos.");
      return;
    }

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }

    const videoBitsPerSecond = 8000000;

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(2000);
      setRecording(true);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      alert("Erro ao iniciar gravação: " + (err as Error).message);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const saveVideo = (): void => {
    if (recordedChunks.length === 0) {
      alert("Nenhum vídeo gravado!");
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

    alert("Vídeo salvo! Verifique a pasta de Downloads.");
    setRecordedChunks([]);
  };

  const handleClose = (): void => {
    if (recording) stopRecording();
    setIsOpen(false);
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
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
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
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
          onClick={handleClose}
        >
          <div
            className="w-[95vw] md:w-[80vw] h-[95vh] md:h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex flex-col gap-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[75vh] bg-black rounded-md"
                />

                <div className="flex gap-2 items-center justify-center">
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                  >
                    −
                  </button>
                  <span className="text-gray-700 font-semibold min-w-[60px] text-center">
                    {zoom.toFixed(1)}x
                  </span>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                  >
                    +
                  </button>
                </div>

                {!recording ? (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg w-full transition-colors"
                    onClick={startRecording}
                  >
                    ▶️ Iniciar Gravação
                  </button>
                ) : (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg w-full transition-colors"
                    onClick={stopRecording}
                  >
                    ⏹️ Parar Gravação
                  </button>
                )}

                {recordedChunks.length > 0 && (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg w-full transition-colors"
                    onClick={saveVideo}
                  >
                    💾 Salvar Vídeo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}