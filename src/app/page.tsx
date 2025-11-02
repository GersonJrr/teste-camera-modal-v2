"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Restrições de alta resolução (Full HD)
  const HIGH_RES_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 60, max: 60 },
      facingMode: "environment",
    },
    audio: false,
  };

  // Restrições de fallback (HD)
  const FALLBACK_RES_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: true,
  };

  // Inicia câmera
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, max: 60 },
          facingMode: "environment",
        },
        audio: false,
      };

      const stream = (await navigator.mediaDevices.getUserMedia(constraints)) as MediaStream;
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () =>
          videoRef.current!.play().catch(console.error);
      }
    } catch (err) {
      console.warn("Falha câmera traseira de alta resolução, tentando frontal HD:", err);
      try {
        const stream = (await navigator.mediaDevices.getUserMedia(
          FALLBACK_RES_CONSTRAINTS
        )) as MediaStream;
        cameraStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () =>
            videoRef.current!.play().catch(console.error);
        }
      } catch (fallbackErr) {
        console.error("Não foi possível acessar a câmera:", fallbackErr);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }
  };

  // Iniciar gravação
  const startRecording = () => {
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

    const videoBitsPerSecond = 8000000; // 8 Mbps

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(2000);
      setRecording(true);
    } catch (err: any) {
      console.error("Erro ao iniciar gravação:", err);
      alert("Erro ao iniciar gravação: " + err.message);
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Salvar vídeo
  const saveVideo = () => {
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

  // Fechar modal e liberar câmera
  const handleClose = () => {
    if (recording) stopRecording();
    setIsOpen(false);
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setRecordedChunks([]);
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="text-center">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors"
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
            <div className="p-4 flex-grow overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="relative w-full max-h-[75vh] rounded-md overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[75vh] bg-black rounded-md"
                  />
                  <div
                    className="absolute top-1/2 left-1/2 w-[386px] h-[583px] -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-red-500 pointer-events-none"
                  />
                </div>

                {!recording ? (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg w-full transition-colors"
                    onClick={startRecording}
                  >
                    ▶️ Iniciar Gravação
                  </button>
                ) : (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg text-lg w-full transition-colors"
                    onClick={stopRecording}
                  >
                    ⏹️ Parar Gravação
                  </button>
                )}

                {recordedChunks.length > 0 && (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg w-full transition-colors"
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
