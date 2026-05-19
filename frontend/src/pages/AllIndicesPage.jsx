import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchAllIndices } from "../api/client";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

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

export default function AllIndicesPage() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState("");
  const [groupValue, setGroupValue] = useState("");

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

  const pChangeFields = ["pChange", "percChange", "change"];

  function renderSortableTable() {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-700">
          <span className="font-medium">{sortedRows.length}</span> rows
        </div>
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 sticky top-0">
              <tr>
                {visibleColumns.map((col) => (
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
                {visibleColumns.map((col) => (
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
                    colSpan={visibleColumns.length}
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
                    {visibleColumns.map((col) => (
                      <td
                        key={col}
                        className={`px-4 py-2 whitespace-nowrap ${
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Group By Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Group By
          </span>
        </div>
        <select
          value={groupBy}
          onChange={(e) => {
            setGroupBy(e.target.value);
            setGroupValue("");
          }}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <span className="text-sm text-slate-500 dark:text-slate-400">
              =
            </span>
            <select
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-xs"
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
              className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              title="Clear group by"
            >
              ✕ Clear
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
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
      ) : (
        renderSortableTable()
      )}
    </div>
  );
}
