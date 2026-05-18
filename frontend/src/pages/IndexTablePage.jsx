import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchAllIndices, fetchEquityStockIndices } from "../api/client";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

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

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#e11d48",
  "#7c3aed",
  "#0ea5e9",
  "#d946ef",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#6d28d9",
  "#0891b2",
];

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

export default function IndexTablePage() {
  const [indices, setIndices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [indexMeta, setIndexMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});
  const [tab, setTab] = useState("table");

  useEffect(() => {
    fetchAllIndices()
      .then((list) => {
        setIndices(list);
        if (list.length > 0) {
          const first = list[0].indexName || list[0].name || "";
          if (first) {
            setSelectedIndex(first);
          }
        }
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
      [col]: {
        ...(prev[col] || {}),
        [field]: value,
      },
    }));
  }, []);

  const filteredRows = useMemo(() => {
    return flatRows.filter((row) => {
      return columns.every((col) => {
        const cf = filters[col];
        if (!cf) return true;
        const operator = cf.operator || "=";
        const value = cf.value !== undefined ? cf.value : "";
        return applyFilter(row[col], operator, value);
      });
    });
  }, [flatRows, columns, filters]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    const key = sort.key;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (isNumeric(av) && isNumeric(bv)) {
        return (parseFloat(av) - parseFloat(bv)) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filteredRows, sort]);

  // Summary stats
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
    const totalValue = flatRows.reduce(
      (s, r) => s + (r.totalTradedValue || 0),
      0,
    );
    return {
      gainers: gainers.length,
      losers: losers.length,
      topGainer,
      topLoser,
      avgChange,
      totalVolume,
      totalValue,
    };
  }, [flatRows]);

  // Industry distribution for pie chart
  const industryData = useMemo(() => {
    const map = {};
    flatRows.forEach((r) => {
      const ind = r.industry || "Unknown";
      if (!map[ind]) map[ind] = { count: 0, totalPChange: 0 };
      map[ind].count++;
      map[ind].totalPChange += r.pChange || 0;
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        count: v.count,
        avgPChange: Number((v.totalPChange / v.count).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count);
  }, [flatRows]);

  // Top gainers chart data
  const topGainersData = useMemo(() => {
    return [...flatRows]
      .sort((a, b) => (b.pChange || 0) - (a.pChange || 0))
      .slice(0, 10)
      .map((r) => ({ symbol: r.symbol, pChange: r.pChange || 0 }));
  }, [flatRows]);

  // Top losers chart data
  const topLosersData = useMemo(() => {
    return [...flatRows]
      .sort((a, b) => (a.pChange || 0) - (b.pChange || 0))
      .slice(0, 10)
      .map((r) => ({ symbol: r.symbol, pChange: r.pChange || 0 }));
  }, [flatRows]);

  // Industry performance (avg pChange by industry)
  const industryPerformance = useMemo(() => {
    return [...industryData]
      .sort((a, b) => b.avgPChange - a.avgPChange)
      .slice(0, 15);
  }, [industryData]);

  // Volume by industry
  const volumeByIndustry = useMemo(() => {
    const map = {};
    flatRows.forEach((r) => {
      const ind = r.industry || "Unknown";
      if (!map[ind]) map[ind] = { totalTradedVolume: 0, count: 0 };
      map[ind].totalTradedVolume += r.totalTradedVolume || 0;
      map[ind].count++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        totalTradedVolume: v.totalTradedVolume,
        avgVolume: Math.round(v.totalTradedVolume / v.count),
      }))
      .sort((a, b) => b.totalTradedVolume - a.totalTradedVolume)
      .slice(0, 10);
  }, [flatRows]);

  return (
    <div className="w-full min-h-screen px-4 py-4 bg-slate-50 dark:bg-slate-900">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-5 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
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

          <div className="flex items-center gap-3">
            {indexMeta && (
              <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg text-sm">
                <span className="text-primary-800 dark:text-primary-300 font-medium">
                  {indexMeta.last?.toLocaleString()}
                </span>
                <span
                  className={`ml-2 font-medium ${
                    indexMeta.change >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
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
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex-shrink-0">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Gainers"
            value={summary.gainers}
            color="emerald"
          />
          <SummaryCard
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
            label="Losers"
            value={summary.losers}
            color="rose"
          />
          <SummaryCard
            icon={<Activity className="w-5 h-5 text-primary-600" />}
            label="Avg Change"
            value={`${summary.avgChange.toFixed(2)}%`}
            color={summary.avgChange >= 0 ? "emerald" : "rose"}
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Top Gainer"
            value={summary.topGainer?.symbol}
            sub={`+${summary.topGainer?.pChange?.toFixed(2)}%`}
            color="emerald"
          />
          <SummaryCard
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
            label="Top Loser"
            value={summary.topLoser?.symbol}
            sub={`${summary.topLoser?.pChange?.toFixed(2)}%`}
            color="rose"
          />
          <SummaryCard
            icon={<DollarSign className="w-5 h-5 text-blue-600" />}
            label="Total Volume"
            value={(summary.totalVolume / 1e6).toFixed(1) + "M"}
            color="blue"
          />
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("table")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "table"
              ? "bg-primary-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          Table
        </button>
        <button
          onClick={() => setTab("charts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            tab === "charts"
              ? "bg-primary-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Charts & Analysis
        </button>
        <button
          onClick={() => setTab("industry")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            tab === "industry"
              ? "bg-primary-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          <PieChartIcon className="w-4 h-4" /> Industry
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading…
          </span>
        </div>
      ) : tab === "table" ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-auto max-h-[65vh]">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="uppercase tracking-wide text-xs">
                          {col.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        {sort.key === col &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-primary-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary-600" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
                <tr className="bg-white dark:bg-slate-800">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 border-b border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-1">
                        <select
                          value={filters[col]?.operator || "="}
                          onChange={(e) =>
                            handleFilterChange(col, "operator", e.target.value)
                          }
                          className="px-1 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
                          title="Operator"
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
                          value={filters[col]?.value || ""}
                          onChange={(e) =>
                            handleFilterChange(col, "value", e.target.value)
                          }
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No data available.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={`px-4 py-2 whitespace-nowrap ${
                            col === "pChange" || col === "change"
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
                          {col === "pChange"
                            ? `${row[col] != null ? row[col].toFixed(2) + "%" : ""}`
                            : fmt(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "charts" ? (
        /* Charts & Analysis View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Top 10 Gainers (% Change)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topGainersData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="symbol"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={90}
                />
                <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, "Change"]} />
                <Bar
                  dataKey="pChange"
                  fill="#10b981"
                  name="% Change"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 Losers (% Change)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topLosersData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="symbol"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={90}
                />
                <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, "Change"]} />
                <Bar
                  dataKey="pChange"
                  fill="#f43f5e"
                  name="% Change"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Industry Performance (Avg % Change)">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={industryPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip
                  formatter={(v) => [`${v.toFixed(2)}%`, "Avg Change"]}
                />
                <Bar
                  dataKey="avgPChange"
                  name="Avg % Change"
                  radius={[0, 4, 4, 0]}
                >
                  {industryPerformance.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgPChange >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Volume by Industry">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={volumeByIndustry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v / 1e6).toFixed(0) + "M"}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip
                  formatter={(v) => [(v / 1e6).toFixed(1) + "M", "Volume"]}
                />
                <Bar
                  dataKey="totalTradedVolume"
                  fill="#6366f1"
                  name="Volume"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : (
        /* Industry View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Industry Distribution">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  label={({ name, percent }) =>
                    `${name.substring(0, 20)} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={true}
                  fontSize={10}
                >
                  {industryData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Stock Count by Industry">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={industryData.slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  name="Stocks"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Industry Avg % Change (All)">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={industryPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip
                  formatter={(v) => [`${v.toFixed(2)}%`, "Avg Change"]}
                />
                <Bar
                  dataKey="avgPChange"
                  name="Avg % Change"
                  radius={[0, 4, 4, 0]}
                >
                  {industryPerformance.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgPChange >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Industry Details Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Industry Summary
            </h3>
            <div className="overflow-auto max-h-[400px]">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 dark:border-slate-700">
                      Industry
                    </th>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 dark:border-slate-700 text-right">
                      Stocks
                    </th>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 dark:border-slate-700 text-right">
                      Avg % Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {industryData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {row.name}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300">
                        {row.count}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          row.avgPChange > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.avgPChange < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {row.avgPChange.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }) {
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

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
