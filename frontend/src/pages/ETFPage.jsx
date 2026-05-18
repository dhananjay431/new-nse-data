import { useEffect, useState } from 'react';
import { fetchETF } from '../api/client';
import DataTable from '../components/DataTable';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ETFPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchETF()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col px-4 py-4 bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-5 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">ETF Details</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Exchange Traded Funds data from NSE India</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError('');
              fetchETF()
                .then((data) => setRows(data))
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex-shrink-0">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Loading…</span>
        </div>
      ) : (
        <DataTable rows={rows} />
      )}
    </div>
  );
}
