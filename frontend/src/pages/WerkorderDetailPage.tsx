import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWerkorderDetail, deleteFoto } from '../services/werkorderService';

interface Materiaal {
  id: number;
  tip: string;
  naam: string;
  aantal: number;
  eenheid: string;
}

interface Foto {
  id: number;
  beschrijving: string;
  bestandspad: string;
}

interface WerkorderDetail {
  id: number;
  werkorder_id: string;
  aankomsttijd: string;
  eindtijd: string;
  datum: string;
  uitgevoerde_werkzaamheden: string;
  status: string;
  materialen: Materiaal[];
  fotos: Foto[];
}

const tipLabels: Record<string, string> = {
  klant: 'Gebruikte materialen van de klant',
  bedrijf: 'Geleverde goederen vanuit ons als bedrijf',
  verkoop: 'Extra gebruikte materialen van ons (verkoop)',
};

export default function WerkorderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<WerkorderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getWerkorderDetail(Number(id));
        setDetail(data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          navigate('/admin/login');
        } else {
          setError('Werkorder niet gevonden');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const handleDeleteFoto = async (fotoId: number) => {
    if (!detail) return;
    if (!window.confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

    try {
      await deleteFoto(detail.id, fotoId);
      setDetail({
        ...detail,
        fotos: detail.fotos.filter((f) => f.id !== fotoId),
      });
    } catch (err) {
      alert('Foto silinirken bir hata oluştu');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Laden...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!detail) return null;

  const materialenPerTip = (tip: string) =>
    detail.materialen.filter((m) => m.tip === tip);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <Link to="/admin/werkorders" className="text-blue-600 hover:underline text-sm">
          ← Terug naar overzicht
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">{detail.werkorder_id}</h1>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Aankomsttijd</span>
            <p className="font-medium">{detail.aankomsttijd}</p>
          </div>
          <div>
            <span className="text-gray-500">Eindtijd</span>
            <p className="font-medium">{detail.eindtijd}</p>
          </div>
          <div>
            <span className="text-gray-500">Datum</span>
            <p className="font-medium">{detail.datum.split('-').reverse().join('-')}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className="font-medium">{detail.status}</p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-gray-500 text-sm">Uitgevoerde werkzaamheden</span>
          <p className="mt-1">{detail.uitgevoerde_werkzaamheden}</p>
        </div>

        {['klant', 'bedrijf', 'verkoop'].map((tip) => {
          const items = materialenPerTip(tip);
          if (items.length === 0) return null;

          return (
            <div key={tip} className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">{tipLabels[tip]}</h3>
              <ul className="text-sm space-y-1">
                {items.map((m) => (
                  <li key={m.id} className="text-gray-700">
                    {m.naam} — {m.aantal} {m.eenheid}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {detail.fotos.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Foto's en Beschrijvingen</h3>
            <div className="grid grid-cols-2 gap-4">
              {detail.fotos.map((foto) => (
                <div key={foto.id} className="relative">
                  <img
                    src={`http://localhost:3000${foto.bestandspad}`}
                    alt={foto.beschrijving}
                    onClick={() => setSelectedFoto(foto)}
                    className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-90 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFoto(foto.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                    title="Foto verwijderen"
                  >
                    ✕
                  </button>
                  {foto.beschrijving && (
                    <p className="text-sm text-gray-600 mt-1">{foto.beschrijving}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedFoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFoto(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={`http://localhost:3000${selectedFoto.bestandspad}`}
              alt={selectedFoto.beschrijving}
              className="w-full max-h-[80vh] object-contain rounded"
            />
            {selectedFoto.beschrijving && (
              <p className="text-white text-center mt-3">{selectedFoto.beschrijving}</p>
            )}
            <button
              type="button"
              onClick={() => setSelectedFoto(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
              title="Sluiten"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}