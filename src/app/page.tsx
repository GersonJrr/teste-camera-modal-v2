"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { FaCamera } from "react-icons/fa";


export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ovalRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const detectionFrame = useRef<number | null>(null);
  const lastPositions = useRef<{ x: number; y: number }[]>([]);

  const [isReady, setIsReady] = useState(false);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoTaken, setPhotoTaken] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [detectionActive, setDetectionActive] = useState(true);
  const [faceIsTooClose, setFaceIsTooClose] = useState(false);
  const [faceIsTooFar, setFaceIsTooFar] = useState(false);
  const [isFacingForward, setIsFacingForward] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const MAX_POSITIONS = 15;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getMessage = useCallback(() => {
    if (countdown) return `Capturando em ${countdown}...`;
    if (isFaceAligned && isFacingForward) return "MANTENHA ESSA POSIÇÃO... SORRIA 😊";
    if (!isFacingForward) return "OLHE DIRETAMENTE PARA A CÂMERA";
    if (faceIsTooClose) return "AFASTE UM POUCO O ROSTO";
    if (faceIsTooFar) return "APROXIME UM POUCO MAIS O ROSTO";
    return "Posicione seu rosto no centro da câmera";
  }, [countdown, isFaceAligned, isFacingForward, faceIsTooClose, faceIsTooFar]);

  const getMessageBackground = useCallback(() => {
    if (countdown) return "bg-blue-500/90";
    if (isFaceAligned && isFacingForward) return "bg-green-500/90";
    if (!isFacingForward) return "bg-yellow-500/90";
    if (faceIsTooClose) return "bg-red-500/90";
    if (faceIsTooFar) return "bg-black/90";
    return "bg-red-500/90";
  }, [countdown, isFaceAligned, isFacingForward, faceIsTooClose, faceIsTooFar]);

  const videoConstraints = useMemo(
    () => ({
      width: { ideal: isMobile ? 1920 : 4096 },
      height: { ideal: isMobile ? 1440 : 3072 },
      facingMode: "user",
      frameRate: { ideal: 10, max: 15 },
      aspectRatio: 4 / 3,
    }),
    [isMobile]
  );

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("🔄 Iniciando carregamento dos modelos...");
        const MODEL_URL = "/models";

        const modelsLoaded =
          faceapi.nets.tinyFaceDetector.isLoaded &&
          faceapi.nets.faceLandmark68Net.isLoaded &&
          faceapi.nets.faceExpressionNet.isLoaded;

        if (modelsLoaded) {
          console.log("✅ Modelos já carregados");
          setIsReady(true);
          return;
        }

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("✅ TinyFaceDetector carregado");

        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("✅ FaceLandmark68Net carregado");

        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log("✅ FaceExpressionNet carregado");

        setIsReady(true);
        console.log("✅ Todos os modelos carregados com sucesso");
      } catch (error) {
        console.error("❌ Erro ao carregar modelos:", error);
      }
    };
    loadModels();
  }, []);

  const resetCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setCountdown(null);
  }, []);

  const handleCapture = useCallback(() => {
    if (isCapturing || showConfirmModal || tempPhoto) return;

    if (!isFaceAligned || !isFacingForward || faceIsTooClose || faceIsTooFar) {
      console.log("Cancelando captura - rosto não está na posição ideal ou não olhando para frente");
      resetCountdown();
      return;
    }

    try {
      const video = webcamRef.current?.video;
      if (!video || !video.videoWidth || !video.videoHeight || video.readyState !== 4) return;

      setIsCapturing(true);
      processingRef.current = true;
      setIsFaceAligned(false);
      resetCountdown();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL("image/png", 1.0);
      setTempPhoto(photoData);
      setPhotoTaken(photoData);
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Erro ao capturar foto:", error);
    }
  }, [
    isCapturing,
    showConfirmModal,
    tempPhoto,
    resetCountdown,
    isFaceAligned,
    isFacingForward,
    faceIsTooClose,
    faceIsTooFar,
  ]);

  const startCountdown = useCallback(() => {
    if (countdown || countdownTimer.current || isCapturing || showConfirmModal) return;

    if (!isFaceAligned || !isFacingForward || faceIsTooClose || faceIsTooFar) {
      console.log("Rosto não está na posição ideal ou não olhando para frente");
      return;
    }

    let count = 3;
    setCountdown(count);

    countdownTimer.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setCountdown(null);
        handleCapture();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [
    countdown,
    handleCapture,
    isCapturing,
    showConfirmModal,
    isFaceAligned,
    isFacingForward,
    faceIsTooClose,
    faceIsTooFar,
  ]);

  const checkFaceAlignment = useCallback((detection: faceapi.FaceDetection, video: HTMLVideoElement) => {
    try {
      const box = detection.box;
      const ovalElement = ovalRef.current;

      if (!ovalElement) return false;

      const ovalRect = ovalElement.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;

      const ovalBox = {
        x: (ovalRect.left - videoRect.left) * scaleX,
        y: (ovalRect.top - videoRect.top) * scaleY,
        width: ovalRect.width * scaleX,
        height: ovalRect.height * scaleY,
      };

      const minFaceSize = ovalBox.height * 0.35;
      const maxFaceSize = ovalBox.height * 0.6;
      const faceSize = box.height;

      setFaceIsTooClose(false);
      setFaceIsTooFar(false);

      if (faceSize < minFaceSize) {
        console.log("❌ Chegue mais perto");
        setFaceIsTooFar(true);
        return false;
      }
      if (faceSize > maxFaceSize) {
        console.log("❌ Afaste um pouco - rosto muito próximo");
        setFaceIsTooClose(true);
        return false;
      }

      const faceCenterX = box.x + box.width / 2;
      const faceCenterY = box.y + box.height / 2;
      const ovalCenterX = ovalBox.x + ovalBox.width / 2;
      const ovalCenterY = ovalBox.y + ovalBox.height / 2;

      const toleranceX = ovalBox.width * 0.3;
      const toleranceY = ovalBox.height * 0.3;

      const currentPosition = { x: faceCenterX, y: faceCenterY };
      lastPositions.current.push(currentPosition);

      if (lastPositions.current.length > MAX_POSITIONS) {
        lastPositions.current.shift();
      }

      const avgPosition = lastPositions.current.reduce(
        (acc, pos) => ({
          x: acc.x + pos.x / lastPositions.current.length,
          y: acc.y + pos.y / lastPositions.current.length,
        }),
        { x: 0, y: 0 }
      );

      const isAligned =
        Math.abs(avgPosition.x - ovalCenterX) < toleranceX && Math.abs(avgPosition.y - ovalCenterY) < toleranceY;

      return isAligned;
    } catch (error) {
      console.error("Erro no checkFaceAlignment:", error);
      return false;
    }
  }, []);

  const checkFaceOrientation = useCallback((landmarks: faceapi.FaceLandmarks68) => {
    try {
      if (!landmarks) return false;

      const nose = landmarks.positions[30];
      const leftEye = landmarks.positions[36];
      const rightEye = landmarks.positions[45];

      const midX = (leftEye.x + rightEye.x) / 2;
      const noseOffset = Math.abs(nose.x - midX);
      const eyeDistance = Math.abs(rightEye.x - leftEye.x);
      const threshold = eyeDistance * 0.1;

      return noseOffset <= threshold;
    } catch (error) {
      console.error("Erro ao verificar orientação do rosto:", error);
      return false;
    }
  }, []);

  const detectFace = useCallback(async () => {
    if (!webcamRef.current?.video || !isReady || processingRef.current || isCapturing || showConfirmModal || tempPhoto)
      return;

    processingRef.current = true;

    try {
      const video = webcamRef.current.video;
      if (video.readyState !== 4) {
        processingRef.current = false;
        return;
      }

      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.25,
          })
        )
        .withFaceLandmarks();

      if (detection && detection.detection.score > 0.35) {
        const isAligned = checkFaceAlignment(detection.detection, video);
        const isFacing = checkFaceOrientation(detection.landmarks);
        setIsFacingForward(isFacing);

        if (isAligned !== isFaceAligned) {
          setIsFaceAligned(isAligned);
        }

        if (isAligned && isFacing && !countdown && !countdownTimer.current && !isCapturing) {
          startCountdown();
        } else if ((!isAligned || !isFacing) && countdown === 3) {
          resetCountdown();
        }
      } else {
        if (!detection || detection.detection.score < 0.15) {
          setIsFaceAligned(false);
          setIsFacingForward(false);
          if (countdown === 3) resetCountdown();
        }
      }
    } catch (error) {
      console.error("Erro na detecção:", error);
      setIsFaceAligned(false);
      setIsFacingForward(false);
    } finally {
      processingRef.current = false;
    }
  }, [
    isReady,
    countdown,
    checkFaceAlignment,
    checkFaceOrientation,
    startCountdown,
    resetCountdown,
    isFaceAligned,
    isCapturing,
    showConfirmModal,
    tempPhoto,
  ]);

  const handleNewPhoto = useCallback(() => {
    setPhotoTaken(null);
    setTempPhoto(null);
    setShowConfirmModal(false);
    setIsCapturing(false);
    processingRef.current = false;
    lastPositions.current = [];
  }, []);

  const handleRetryPhoto = useCallback(() => {
    setShowConfirmModal(false);
    setTempPhoto(null);
    setPhotoTaken(null);
    setIsFaceAligned(false);
    lastPositions.current = [];
    resetCountdown();
    setIsCapturing(false);
    processingRef.current = false;
  }, [resetCountdown]);

  useEffect(() => {
    if (!isReady || !detectionActive || isCapturing || !cameraStarted) return;

    let timeoutId: NodeJS.Timeout;

    const processFrame = () => {
      detectFace().finally(() => {
        if (isReady && detectionActive && !isCapturing && cameraStarted) {
          timeoutId = setTimeout(() => {
            requestAnimationFrame(processFrame);
          }, 200);
        }
      });
    };

    processFrame();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isReady, detectFace, isCapturing, cameraStarted, detectionActive]);

  useEffect(() => {
    if (showConfirmModal || tempPhoto) {
      setDetectionActive(false);
    } else {
      setDetectionActive(true);
    }
  }, [showConfirmModal, tempPhoto]);

  useEffect(() => {
    return () => {
      if (detectionFrame.current) {
        cancelAnimationFrame(detectionFrame.current);
      }
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);


  const handleStartCamera = useCallback(() => {
    setIsLoadingCamera(true);
    setCameraStarted(true);
  }, []);

  return (
    <>
      <div className="relative w-full">
        <div
          ref={ovalRef}
          className="relative aspect-[3/4] overflow-hidden min-h-[400px] w-full bg-gray-900"
        >
          {!cameraStarted ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <button
                onClick={handleStartCamera}
                className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-8 rounded-full shadow-lg"
              >
                <span className="text-2xl mr-2">📸</span>
                Iniciar Câmera
              </button>
            </div>
          ) : photoTaken ? (
            <div className="relative w-full h-full">
              <img
                src={photoTaken}
                alt="Foto capturada"
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={handleNewPhoto}
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-8 rounded-full shadow-lg"
                >
                  <span className="text-2xl mr-2">📸</span>
                  Nova Foto
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoadingCamera && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90">
                  <div className="w-16 h-16 mb-4 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
                  <p className="text-white text-lg">Iniciando câmera...</p>
                </div>
              )}
              <Webcam
                ref={webcamRef}
                audio={false}
                key={cameraStarted ? "camera-on" : "camera-off"}
                screenshotFormat="image/png"
                videoConstraints={videoConstraints}
                forceScreenshotSourceSize={true}
                className="w-full h-full object-cover"
                style={{
                  transform: "scaleX(-1)",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  minHeight: "400px",
                }}
                onUserMedia={(stream) => {
                  console.log("📸 Câmera iniciada com sucesso");
                  setIsLoadingCamera(false);
                  const track = stream.getVideoTracks()[0];
                  const capabilities = track.getCapabilities();
                  console.log("📷 Capacidades da câmera:", capabilities);
                }}
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            </>
          )}
        </div>

        {/* Feedback message */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div
            className={`
               px-6 py-4 rounded-xl
               text-white text-center text-lg font-medium
               transition-colors duration-300
               ${getMessageBackground()}
             `}
          >
            {countdown && <span className="text-2xl mr-2">📸</span>}
            {isFaceAligned && <span className="text-2xl mr-2">😊</span>}
            {!isFaceAligned && !faceIsTooClose && !faceIsTooFar && <span className="text-2xl mr-2">👀</span>}
            {getMessage()}
          </div>
        </div>
      </div>
      {countdown && (
        <div
          className={`mt-5 mx-auto max-w-[84px] w-full h-[84px] text-white font-bold flex items-center justify-center gap-2 rounded-full ${getMessageBackground()}`}
        >
          <FaCamera size={30} />
          <span className="text-[50px]">{countdown}</span>
        </div>
      )}
    </>
  );
}
