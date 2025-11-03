"use client"
import CameraCapture from './camera/components/CameraCapture';

export default function Home() {

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Gravar video
        </h1>
        <CameraCapture />
      </div>
    </main>
  );
}