import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchAllIndices } from "../api/client";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Table2,
  LayoutGrid,
} from "lucide-react";

const OPERATORS = ["=", ">=", "<=", ">", "<"];

const ALL_IDX_HIDDEN_COLS = new Set([
  "key",
  "chartTodayPath",
  "chart30dPath",
  "chart365dPath",
  "date365dAgo",
  "date30dAgo",
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

function getHeatColor(p) {
  if (p >= 3) return { bg: "bg-emerald-600", text: "text-white" };
  if (p >= 1) return { bg: "bg-emerald-400", text: "text-white" };
  if (p > 0) return { bg: "bg-emerald-200", text: "text-emerald-800" };
  if (p === 0)
    return {
      bg: "bg-slate-200 dark:bg-slate-600",
      text: "text-slate-600 dark:text-slate-300",
    };
  if (p >= -1) return { bg: "bg-rose-200", text: "text-rose-800" };
  if (p >= -3) return { bg: "bg-rose-400", text: "text-white" };
  return { bg: "bg-rose-600", text: "text-white" };
}

function getRowBg(p) {
  if (p >= 3) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (p >= 2) return "bg-emerald-50 dark:bg-emerald-900/20";
  if (p >= 1) return "bg-emerald-50/60 dark:bg-emerald-900/10";
  if (p > 0) return "bg-emerald-50/30 dark:bg-emerald-900/5";
  if (p === 0) return "";
  if (p >= -1) return "bg-rose-50/30 dark:bg-rose-900/5";
  if (p >= -2) return "bg-rose-50/60 dark:bg-rose-900/10";
  if (p >= -3) return "bg-rose-50 dark:bg-rose-900/20";
  return "bg-rose-100 dark:bg-rose-900/30";
}

export default function AllIndicesPage() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState("");
  const [groupValue, setGroupValue] = useState("");
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchAllIndices()
      .then((list) => setIndices(list))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(() => {
    if (!indices.length) return [];
    return Object.keys(indices[0]).filter((c) => !ALL_IDX_HIDDEN_COLS.has(c));
  }, [indices]);

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

  // Unique values for the selected group-by column
  const groupValues = useMemo(() => {
    if (!groupBy || !indices.length) return [];
    const vals = new Set(indices.map((r) => String(r[groupBy] ?? "")));
    return [...vals].sort();
  }, [indices, groupBy]);

  // Columns visible in the table (hide the group-by column)
  const visibleColumns = useMemo(() => {
    if (!groupBy) return columns;
    return columns.filter((c) => c !== groupBy);
  }, [columns, groupBy]);

  const filteredRows = useMemo(() => {
    return indices.filter((row) => {
      // Group-by filter
      if (groupBy && groupValue) {
        if (String(row[groupBy] ?? "") !== groupValue) return false;
      }
      // Per-column filters
      return columns.every((col) => {
        const cf = filters[col];
        if (!cf) return true;
        return applyFilter(row[col], cf.operator || "=", cf.value ?? "");
      });
    });
  }, [indices, columns, filters, groupBy, groupValue]);

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

  const pChangeFields = ["percentChange", "pChange", "percChange", "change"];

  function renderSortableTable() {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-700">
          <span className="font-medium">{sortedRows.length}</span> rows
        </div>
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full text-xs sm:text-sm text-left">
            <thead className="sticky-header bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <tr>
              {visibleColumns.map((col, colIdx) => (
                <th
                  key={col}
                  className={`px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-200 dark:border-slate-700 cursor-pointer select-none whitespace-nowrap ${
                    colIdx === 0 ? "sticky-first-col-header bg-slate-50 dark:bg-slate-700" : ""
                  }`}
                  onClick={() => handleSort(col)}
                >
                    <div className="flex items-center gap-1">
                      <span className="uppercase tracking-wide text-[10px] sm:text-xs">
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
              {visibleColumns.map((col, colIdx) => (
                <th
                  key={col}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 border-b border-slate-200 dark:border-slate-700 ${
                    colIdx === 0 ? "sticky-first-col-header bg-white dark:bg-slate-800" : ""
                  }`}
                >
                    <div className="flex items-center gap-1">
                      <select
                        value={filters[col]?.operator || "="}
                        onChange={(e) =>
                          handleFilterChange(col, "operator", e.target.value)
                        }
                        className="px-1 py-0.5 sm:py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
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
                        className="w-16 sm:w-20 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
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
                    colSpan={visibleColumns.length}
                    className="px-2 sm:px-4 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, idx) => {
                  const pChange =
                    row.percentChange ||
                    row.pChange ||
                    row.percChange ||
                    row.change ||
                    0;
                  const rowBg = getRowBg(Number(pChange));
                  return (
                    <tr
                      key={idx}
                      className={`${rowBg} hover:brightness-95 dark:hover:brightness-110 transition-colors`}
                    >
                       {visibleColumns.map((col, colIdx) => (
                        <td
                          key={col}
                          className={`px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap ${
                            colIdx === 0 ? "sticky-first-col bg-white dark:bg-slate-800" : ""
                          } ${
                            pChangeFields.includes(col)
                              ? row[col] > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : row[col] < 0
                                  ? "text-rose-600 dark:text-rose-400 font-medium"
                                  : "text-slate-700 dark:text-slate-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {pChangeFields.includes(col) && row[col] != null
                            ? `${Number(row[col]).toFixed(2)}%`
                            : fmt(row[col])}
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

  function renderHeatmap() {
    if (sortedRows.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No data available.
        </div>
      );
    }

    const sorted = [...sortedRows].sort(
      (a, b) =>
        (b.percentChange || b.pChange || b.percChange || b.change || 0) -
        (a.percentChange || a.pChange || a.percChange || a.change || 0),
    );

    // Find the pChange field name
    const pField =
      columns.find((c) => c === "percentChange") ||
      columns.find((c) => c === "pChange") ||
      "pChange";
    const nameField =
      columns.find((c) => c === "indexName") ||
      columns.find((c) => c === "name") ||
      columns[0];
    const lastField = columns.find((c) => c === "last") || null;
    const changeField = columns.find((c) => c === "change") || null;

    return (
      <div className="flex flex-col gap-4">
        {/* Legend */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="font-medium">pChange:</span>
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white">
            ≤ -3%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-400 text-white">
            -3% to -1%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800">
            -1% to 0%
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
            0%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
            0% to 1%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-400 text-white">
            1% to 3%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
            ≥ 3%
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex flex-wrap gap-2">
          {sorted.map((row, idx) => {
            const p = row[pField] || 0;
            const { bg, text } = getHeatColor(p);
            const name = row[nameField] || `Index ${idx}`;
            const last = lastField ? row[lastField] : null;
            const change = changeField ? row[changeField] : null;

            return (
              <a
                key={idx}
                href={`https://www.tradingview.com/chart/?symbol=NSE:${name}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${bg} ${text} rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hover:opacity-80 transition-opacity cursor-pointer flex flex-col items-center min-w-[70px] sm:min-w-[90px]`}
                title={`${name}: ${p >= 0 ? "+" : ""}${p.toFixed(2)}%`}
              >
                <span className="font-semibold text-[10px] sm:text-xs leading-tight text-center">
                  {name}
                </span>
                {last != null && (
                  <span className="text-[9px] sm:text-[10px] leading-tight">
                    {typeof last === "number" ? last.toLocaleString() : last}
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-medium leading-tight">
                  {p >= 0 ? "+" : ""}
                  {p.toFixed(2)}%
                </span>
                {change != null && (
                  <span className="text-[9px] sm:text-[10px] leading-tight">
                    {change >= 0 ? "+" : ""}
                    {typeof change === "number" ? change.toFixed(2) : change}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-2 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Table2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode("heatmap")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
              viewMode === "heatmap"
                ? "bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Heatmap
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600" />

        {/* Group By */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            Group By
          </span>
        </div>
        <select
          value={groupBy}
          onChange={(e) => {
            setGroupBy(e.target.value);
            setGroupValue("");
          }}
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">-- None --</option>
          {columns.map((col) => (
            <option key={col} value={col}>
              {col.replace(/([A-Z])/g, " $1").trim()}
            </option>
          ))}
        </select>
        {groupBy && (
          <>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              =
            </span>
            <select
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-xs"
            >
              <option value="">-- All --</option>
              {groupValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setGroupBy("");
                setGroupValue("");
              }}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              title="Clear group by"
            >
              ✕ Clear
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-900/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading…
          </span>
        </div>
      ) : viewMode === "heatmap" ? (
        renderHeatmap()
      ) : (
        renderSortableTable()
      )}
    </div>
  );
}
