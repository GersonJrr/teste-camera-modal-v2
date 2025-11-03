"use client"
import CameraCapture from './camera/components/CameraCapture';

export default function Home() {
  const handlePhotoCapture = (photo: string) => {
    console.log("Foto capturada com sucesso!");
    // Aqui você pode adicionar lógica adicional:
    // - Salvar no storage
    // - Enviar para uma API
    // - Processar a imagem
    // - etc.
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Captura de Foto com Detecção Facial
        </h1>
        <CameraCapture onPhotoCapture={handlePhotoCapture} />
      </div>
    </main>
  );
}