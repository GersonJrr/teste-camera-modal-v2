import { useEffect, useState } from "react";
import axios from "axios";

interface VideoProdutoProps {
  idProduto: string;
}

export function VideoProduto({ idProduto }: VideoProdutoProps) {
  const [videoEditado, setVideoEditado] = useState<string | null>(null);
  const [videoOriginal, setVideoOriginal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!idProduto) return;

      setLoading(true);
      setError(null);
      setVideoEditado(null);
      setVideoOriginal(null);

      try {
        const response = await axios.get(
          "https://a7dlltxg6a.execute-api.us-east-2.amazonaws.com/dev/api/busca-link-video-produto",
          { params: { id_produto: idProduto } }
        );

        const data = response.data;

        if (data && (data.link_video || data.video_original)) {
          setVideoEditado(data.link_video || null);
          setVideoOriginal(data.video_original || null);
        } else {
          setError("Nenhum vídeo encontrado para este produto.");
        }

      } catch (err) {
        console.error(err);
        setError("Erro ao buscar o vídeo.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [idProduto]);

  if (loading) return <p>Carregando vídeos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!videoEditado && !videoOriginal)
    return <p>Nenhum vídeo disponível para este produto.</p>;

  return (
    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
      {videoOriginal && (
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h4>Vídeo Original</h4>
          <video src={videoOriginal} controls width="100%">
            Seu navegador não suporta vídeo.
          </video>
        </div>
      )}
      {videoEditado && (
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h4>Vídeo Editado</h4>
          <video src={videoEditado} controls width="100%">
            Seu navegador não suporta vídeo.
          </video>
        </div>
      )}
    </div>
  );
}
