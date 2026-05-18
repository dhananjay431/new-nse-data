import { useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const HIDDEN_COLS = new Set([
  'chartTodayPath',
  'chart30dPath',
  'chart365dPath',
  'date365dAgo',
  'date30dAgo',
]);

const OPERATORS = ['=', '>=', '<=', '>', '<'];

function isNumeric(value) {
  if (value === null || value === undefined) return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function applyFilter(rowValue, operator, filterValue) {
  if (filterValue === '' || filterValue === null || filterValue === undefined) return true;
  const source = isNumeric(rowValue) ? parseFloat(rowValue) : String(rowValue).toLowerCase();
  const target = isNumeric(filterValue) ? parseFloat(filterValue) : String(filterValue).toLowerCase();

  if (typeof source === 'number' && typeof target === 'number') {
    switch (operator) {
      case '=': return source === target;
      case '>=': return source >= target;
      case '<=': return source <= target;
      case '>':  return source > target;
      case '<':  return source < target;
      default: return true;
    }
  }

  switch (operator) {
    case '=': return String(source) === String(target);
    default: return String(source).includes(String(target));
  }
}

export default function DataTable({ rows }) {
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((c) => !HIDDEN_COLS.has(c));
  }, [rows]);

  const handleSort = useCallback((col) => {
    setSort((prev) => {
      if (prev.key === col) {
        return { key: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: col, direction: 'asc' };
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
    return rows.filter((row) => {
      return columns.every((col) => {
        const cf = filters[col];
        if (!cf) return true;
        const operator = cf.operator || '=';
        const value = cf.value !== undefined ? cf.value : '';
        return applyFilter(row[col], operator, value);
      });
    });
  }, [rows, columns, filters]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    const key = sort.key;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (isNumeric(av) && isNumeric(bv)) {
        return (parseFloat(av) - parseFloat(bv)) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filteredRows, sort]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 flex-shrink-0">
        <span className="font-medium">{filteredRows.length}</span> rows
      </div>
      <div className="overflow-auto flex-1">
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
                    <span className="uppercase tracking-wide text-xs">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {sort.key === col && (
                      sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-primary-600" /> : <ChevronDown className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-white dark:bg-slate-800">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <select
                      value={filters[col]?.operator || '='}
                      onChange={(e) => handleFilterChange(col, 'operator', e.target.value)}
                      className="px-1 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200"
                      title="Operator"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Filter"
                      value={filters[col]?.value || ''}
                      onChange={(e) => handleFilterChange(col, 'value', e.target.value)}
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
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No data available.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {row[col] != null ? String(row[col]) : ''}
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
