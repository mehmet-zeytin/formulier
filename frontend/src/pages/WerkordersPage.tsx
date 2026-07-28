import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllWerkorders } from '../services/werkorderService';
import { logout, isAuthenticated } from '../services/authService';

interface WerkorderListItem {
  id: number;
  werkorder_id: string;
  datum: string;
  status: string;
  uitgevoerde_werkzaamheden: string;
}

export default function WerkordersPage() {
  const [werkorders, setWerkorders] = useState<WerkorderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const fetchWerkorders = async () => {
      try {
        const data = await getAllWerkorders();
        setWerkorders(data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          navigate('/admin/login');
        } else {
          setError('Werkorders konden niet worden geladen');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWerkorders();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const statusColor = (status: string) => {
    if (status === 'Voltooid') return 'bg-green-100 text-green-700';
    if (status === 'Niet Voltooid') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alle Werkorders</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Uitloggen
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="bg-white rounded shadow divide-y divide-gray-200">
          {werkorders.length === 0 && (
            <div className="p-6 text-center text-gray-500">Nog geen werkorders ingevuld.</div>
          )}

          {werkorders.map((wo) => (
            <Link
              key={wo.id}
              to={`/admin/werkorders/${wo.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{wo.werkorder_id}</p>
                  <p className="text-sm text-gray-500">
                    {wo.datum.split('-').reverse().join('-')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(wo.status)}`}>
                  {wo.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}