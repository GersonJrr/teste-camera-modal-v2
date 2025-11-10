import { useEffect, useState } from "react";
import axios from "axios";

interface VideoProdutoProps {
  idProduto: string;
}

export function VideoProduto({ idProduto }: VideoProdutoProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!idProduto) return;

      setLoading(true);
      setError(null);
      setVideoUrl(null); // reseta video anterior

      try {
        const response = await axios.get(
          "https://a7dlltxg6a.execute-api.us-east-2.amazonaws.com/dev/api/busca-link-video-produto",
          { params: { id_produto: idProduto } }
        );

        if (response.data && response.data.link_video) {
          setVideoUrl(response.data.link_video);
        } else {
          setVideoUrl(null); // garante reset
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

  return (
    <div>
      {loading && <p>Carregando vídeo...</p>}

      {!loading && error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !videoUrl && !error && (
        <p>Nenhum vídeo disponível para este produto.</p>
      )}

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          width="100%"
          style={{ marginTop: "1rem" }}
        >
          Seu navegador não suporta vídeo.
        </video>
      )}
    </div>
  );
}
