import { useState } from 'react';
import type { Materiaal, WerkorderFormData } from '../types/Werkorder';
import MateriaalSection from './MateriaalSection';
import FotoSection, { type FotoItem } from './FotoSection';
import { createWerkorder, uploadFoto } from '../services/werkorderService';

const generateWerkorderId = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

export default function WerkorderForm() {
  const [werkorder, setWerkorder] = useState<WerkorderFormData>({
    werkorder_id: generateWerkorderId(),
    aankomsttijd: '',
    eindtijd: '',
    datum: '',
    uitgevoerde_werkzaamheden: '',
    status: '',
  });

  const [klantMaterialen, setKlantMaterialen] = useState<Materiaal[]>([{ tip: 'klant', naam: '', aantal: 0 }]);
  const [bedrijfMaterialen, setBedrijfMaterialen] = useState<Materiaal[]>([{ tip: 'bedrijf', naam: '', aantal: 0 }]);
  const [verkoopMaterialen, setVerkoopMaterialen] = useState<Materiaal[]>([{ tip: 'verkoop', naam: '', aantal: 0 }]);
  const [fotos, setFotos] = useState<FotoItem[]>([{ beschrijving: '', file: null, previewUrl: '' }]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (field: keyof WerkorderFormData, value: string) => {
    setWerkorder({ ...werkorder, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!werkorder.status) {
      setErrorMessage('Statusveld is verplicht');
      return;
    }

    const allMaterialen = [...klantMaterialen, ...bedrijfMaterialen, ...verkoopMaterialen]
      .filter((m) => m.naam.trim() !== '');

    try {
      setLoading(true);

      const result = await createWerkorder({
        werkorder,
        materialen: allMaterialen,
      });

      const newWerkorderId = result.id;

      for (const foto of fotos) {
        if (foto.file) {
          await uploadFoto(newWerkorderId, foto.file, foto.beschrijving);
        }
      }

      setSuccessMessage(`Werkorder succesvol verzonden (ID: ${newWerkorderId})`);

      setWerkorder({
        werkorder_id: generateWerkorderId(),
        aankomsttijd: '',
        eindtijd: '',
        datum: '',
        uitgevoerde_werkzaamheden: '',
        status: '',
      });
      setKlantMaterialen([{ tip: 'klant', naam: '', aantal: 0 }]);
      setBedrijfMaterialen([{ tip: 'bedrijf', naam: '', aantal: 0 }]);
      setVerkoopMaterialen([{ tip: 'verkoop', naam: '', aantal: 0 }]);
      setFotos([{ beschrijving: '', file: null, previewUrl: '' }]);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Opleverformulier Werkorder</h1>

      <form onSubmit={handleSubmit}>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Werkorder ID</label>
          <input
            type="text"
            value={werkorder.werkorder_id}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-600"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Aankomsttijd</label>
          <input
            type="time"
            value={werkorder.aankomsttijd}
            onChange={(e) => updateField('aankomsttijd', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Eindtijd</label>
          <input
            type="time"
            value={werkorder.eindtijd}
            onChange={(e) => updateField('eindtijd', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={werkorder.datum}
            onChange={(e) => updateField('datum', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Uitgevoerde werkzaamheden</label>
          <textarea
            value={werkorder.uitgevoerde_werkzaamheden}
            onChange={(e) => updateField('uitgevoerde_werkzaamheden', e.target.value)}
            placeholder="Beschrijf hier de uitgevoerde werkzaamheden..."
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={4}
            required
          />
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status van werkorder</label>
          <select
            value={werkorder.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="">Kies status</option>
            <option value="Voltooid">Voltooid</option>
            <option value="Niet Voltooid">Niet Voltooid</option>
            <option value="In Afwachting">In Afwachting</option>
          </select>
        </div>

        <MateriaalSection
          title="Gebruikte materialen van de klant"
          tip="klant"
          placeholder="Materiaal (bijv. verf, hout)"
          materialen={klantMaterialen}
          onChange={setKlantMaterialen}
        />

        <MateriaalSection
          title="Geleverde goederen vanuit ons als bedrijf"
          tip="bedrijf"
          placeholder="Materiaal (bijv. schroeven, kabel)"
          materialen={bedrijfMaterialen}
          onChange={setBedrijfMaterialen}
        />

        <MateriaalSection
          title="Extra gebruikte materialen van ons (verkoop)"
          tip="verkoop"
          placeholder="Materiaal (bijv. beschermfolie)"
          materialen={verkoopMaterialen}
          onChange={setVerkoopMaterialen}
        />

        <FotoSection fotos={fotos} onChange={setFotos} />

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{successMessage}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded"
        >
          {loading ? 'Bezig met verzenden...' : 'Formulier verzenden'}
        </button>

      </form>
    </div>
  );
}