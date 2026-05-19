import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchAllIndices, fetchEquityStockIndices } from "../api/client";
import Tabs from "../components/Tabs";
import ETFPage from "./ETFPage";
import OptionChainPage from "./OptionChainPage";
import AllIndicesPage from "./AllIndicesPage";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Table2,
  List,
  Landmark,
  CandlestickChart,
} from "lucide-react";

const OPERATORS = ["=", ">=", "<=", ">", "<"];

const HIDDEN_COLS = new Set([
  "chartTodayPath",
  "chart30dPath",
  "chart365dPath",
  "date365dAgo",
  "date30dAgo",
  "meta",
  "priority",
  "identifier",
  "series",
  "stockIndClosePrice",
]);

function isNumeric(value) {
  if (value === null || value === undefined) return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function applyFilter(rowValue, operator, filterValue) {
  if (filterValue === "" || filterValue === null || filterValue === undefined)
    return true;
  const source = isNumeric(rowValue)
    ? parseFloat(rowValue)
    : String(rowValue).toLowerCase();
  const target = isNumeric(filterValue)
    ? parseFloat(filterValue)
    : String(filterValue).toLowerCase();

  if (typeof source === "number" && typeof target === "number") {
    switch (operator) {
      case "=":
        return source === target;
      case ">=":
        return source >= target;
      case "<=":
        return source <= target;
      case ">":
        return source > target;
      case "<":
        return source < target;
      default:
        return true;
    }
  }

  switch (operator) {
    case "=":
      return String(source) === String(target);
    default:
      return String(source).includes(String(target));
  }
}

function fmt(val) {
  if (val == null) return "";
  if (typeof val === "number") return val.toLocaleString();
  return String(val);
}

function getRowBg(change) {
  if (change >= 50) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (change >= 20) return "bg-emerald-50 dark:bg-emerald-900/20";
  if (change >= 10) return "bg-emerald-50/60 dark:bg-emerald-900/10";
  if (change > 0) return "bg-emerald-50/30 dark:bg-emerald-900/5";
  if (change === 0) return "";
  if (change >= -10) return "bg-rose-50/30 dark:bg-rose-900/5";
  if (change >= -20) return "bg-rose-50/60 dark:bg-rose-900/10";
  if (change >= -50) return "bg-rose-50 dark:bg-rose-900/20";
  return "bg-rose-100 dark:bg-rose-900/30";
}

export default function IndexTablePage() {
  const [indices, setIndices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState("NIFTY 50");
  const [rawRows, setRawRows] = useState([]);
  const [indexMeta, setIndexMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchAllIndices()
      .then((list) => {
        setIndices(list);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedIndex) return;
    setLoading(true);
    setError("");
    fetchEquityStockIndices(selectedIndex)
      .then(({ rows, metadata }) => {
        setRawRows(rows);
        setIndexMeta(metadata);
        setFilters({});
        setSort({ key: null, direction: "asc" });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedIndex]);

  // Filter to priority 0 (actual stocks), exclude index summary row
  const stockRows = useMemo(() => {
    return rawRows.filter((r) => r.priority === 0);
  }, [rawRows]);

  // Flatten: bring meta.industry up, remove meta object
  const flatRows = useMemo(() => {
    return stockRows.map((r) => {
      const { meta, ...rest } = r;
      return {
        ...rest,
        industry: meta?.industry || "Unknown",
        companyName: meta?.companyName || r.symbol,
      };
    });
  }, [stockRows]);

  const columns = useMemo(() => {
    if (!flatRows.length) return [];
    return Object.keys(flatRows[0]).filter((c) => !HIDDEN_COLS.has(c));
  }, [flatRows]);

  const handleSort = useCallback((col) => {
    setSort((prev) => {
      if (prev.key === col) {
        return {
          key: col,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: col, direction: "asc" };
    });
  }, []);

  const handleFilterChange = useCallback((col, field, value) => {
    setFilters((prev) => ({
      ...prev,
      [col]: { ...(prev[col] || {}), [field]: value },
    }));
  }, []);

  const filteredRows = useMemo(() => {
    return flatRows.filter((row) =>
      columns.every((col) => {
        const cf = filters[col];
        if (!cf) return true;
        return applyFilter(row[col], cf.operator || "=", cf.value ?? "");
      }),
    );
  }, [flatRows, columns, filters]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    const key = sort.key;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (isNumeric(av) && isNumeric(bv))
        return (parseFloat(av) - parseFloat(bv)) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [filteredRows, sort]);

  // ── Derived chart data ──────────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!flatRows.length) return null;
    const gainers = flatRows.filter((r) => r.change > 0);
    const losers = flatRows.filter((r) => r.change < 0);
    const topGainer = [...flatRows].sort(
      (a, b) => (b.pChange || 0) - (a.pChange || 0),
    )[0];
    const topLoser = [...flatRows].sort(
      (a, b) => (a.pChange || 0) - (b.pChange || 0),
    )[0];
    const avgChange =
      flatRows.reduce((s, r) => s + (r.pChange || 0), 0) / flatRows.length;
    const totalVolume = flatRows.reduce(
      (s, r) => s + (r.totalTradedVolume || 0),
      0,
    );
    return {
      gainers: gainers.length,
      losers: losers.length,
      topGainer,
      topLoser,
      avgChange,
      totalVolume,
    };
  }, [flatRows]);

  // ── Reusable sortable table renderer ───────────────────────────────────
  function renderSortableTable({
    cols,
    rows,
    sortState,
    onSort,
    filtersState,
    onFilterChange,
    pChangeFields = ["pChange", "percChange", "change"],
  }) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-700">
          <span className="font-medium">{rows.length}</span> rows
        </div>
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 sticky top-0">
              <tr>
                {cols.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => onSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="uppercase tracking-wide text-xs">
                        {col.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      {sortState.key === col &&
                        (sortState.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4 text-primary-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-primary-600" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="bg-white dark:bg-slate-800">
                {cols.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 border-b border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-1">
                      <select
                        value={filtersState[col]?.operator || "="}
                        onChange={(e) =>
                          onFilterChange(col, "operator", e.target.value)
                        }
                        className="px-1 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Filter"
                        value={filtersState[col]?.value || ""}
                        onChange={(e) =>
                          onFilterChange(col, "value", e.target.value)
                        }
                        className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols.length}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const changeVal = Number(row.change || 0);
                  const rowBg = getRowBg(changeVal);
                  return (
                    <tr
                      key={idx}
                      className={`${rowBg} hover:brightness-95 dark:hover:brightness-110 transition-colors`}
                    >
                      {cols.map((col) => (
                        <td
                          key={col}
                          className={`px-4 py-2 whitespace-nowrap ${
                            pChangeFields.includes(col)
                              ? row[col] > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : row[col] < 0
                                  ? "text-rose-600 dark:text-rose-400 font-medium"
                                  : "text-slate-700 dark:text-slate-300"
                              : col === "industry"
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {col === "symbol" ? (
                            <a
                              href={`https://www.tradingview.com/chart/?symbol=NSE:${row[col]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                              {fmt(row[col])}
                            </a>
                          ) : pChangeFields.includes(col) &&
                            row[col] != null ? (
                            `${Number(row[col]).toFixed(2)}%`
                          ) : (
                            fmt(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-4 py-4 bg-slate-50 dark:bg-slate-900">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex-shrink-0">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        defaultTab="table"
        tabs={[
          {
            id: "table",
            label: "Table",
            icon: Table2,
            content: (
              <div className="flex flex-col gap-3">
                {/* Index Selector & Meta */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="index-select"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Select Index
                    </label>
                    <select
                      id="index-select"
                      value={selectedIndex}
                      onChange={(e) => setSelectedIndex(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {indices.map((idx, i) => (
                        <option
                          key={i}
                          value={idx.indexName || idx.name || idx.index || idx}
                        >
                          {idx.indexName || idx.name || idx.index || idx}
                        </option>
                      ))}
                    </select>
                  </div>
                  {indexMeta && (
                    <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg text-sm">
                      <span className="text-primary-800 dark:text-primary-300 font-medium">
                        {indexMeta.last?.toLocaleString()}
                      </span>
                      <span
                        className={`ml-2 font-medium ${indexMeta.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {indexMeta.change >= 0 ? "+" : ""}
                        {indexMeta.change?.toFixed(2)} (
                        {indexMeta.percChange?.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Filter className="w-4 h-4" />
                    <span>{filteredRows.length} rows</span>
                  </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <SummaryCard
                      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                      label="Gainers"
                      value={summary.gainers}
                    />
                    <SummaryCard
                      icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
                      label="Losers"
                      value={summary.losers}
                    />
                    <SummaryCard
                      icon={<Activity className="w-5 h-5 text-primary-600" />}
                      label="Avg Change"
                      value={`${summary.avgChange.toFixed(2)}%`}
                    />
                    <SummaryCard
                      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                      label="Top Gainer"
                      value={summary.topGainer?.symbol}
                      sub={`+${summary.topGainer?.pChange?.toFixed(2)}%`}
                    />
                    <SummaryCard
                      icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
                      label="Top Loser"
                      value={summary.topLoser?.symbol}
                      sub={`${summary.topLoser?.pChange?.toFixed(2)}%`}
                    />
                    <SummaryCard
                      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
                      label="Total Volume"
                      value={(summary.totalVolume / 1e6).toFixed(1) + "M"}
                    />
                  </div>
                )}

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">
                      Loading…
                    </span>
                  </div>
                ) : (
                  renderSortableTable({
                    cols: columns,
                    rows: sortedRows,
                    sortState: sort,
                    onSort: handleSort,
                    filtersState: filters,
                    onFilterChange: handleFilterChange,
                    pChangeFields: ["pChange", "change"],
                  })
                )}
              </div>
            ),
          },
          {
            id: "allIndices",
            label: "AllIndices",
            icon: List,
            content: <AllIndicesPage />,
          },
          {
            id: "etf",
            label: "ETF",
            icon: Landmark,
            content: <ETFPage />,
          },
          {
            id: "optionChain",
            label: "Option Chain",
            icon: CandlestickChart,
            content: <OptionChainPage />,
          },
        ]}
      />
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}
