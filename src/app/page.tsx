"use client"
import { useState } from "react";
import { VideoProduto } from "./camera/components/CameraCapture";

export default function Home() {
  // Definindo explicitamente o tipo como string
  const [idProduto, setIdProduto] = useState<string>(""); 

  // Exemplo: você pode alterar idProduto dinamicamente
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdProduto(e.target.value);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Consultar vídeo
        </h1>

        {/* Input para digitar o id do produto */}
        <input
          type="text"
          placeholder="Digite o id do produto"
          value={idProduto}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded text-black"
        />

        {/* Só renderiza se houver idProduto */}
        {idProduto && <VideoProduto idProduto={idProduto} />}
      </div>
    </main>
  );
}
