import { useEffect, useState } from "react";
import { fetchETF } from "../api/client";
import DataTable from "../components/DataTable";
import { Loader2, AlertCircle } from "lucide-react";

export default function ETFPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchETF()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 dark:text-slate-200">
            ETF Details
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Exchange Traded Funds data from NSE India
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setError("");
            fetchETF()
              .then((data) => setRows(data))
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-900/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading…
          </span>
        </div>
      ) : (
        <DataTable rows={rows} />
      )}
    </div>
  );
}
