import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  fetchOptionChainContractInfo,
  fetchOptionChainData,
} from "../api/client";
import Tabs from "../components/Tabs";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  DollarSign,
  Table2,
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
  LineChart,
  Line,
} from "recharts";

const SYMBOLS = ["NIFTY", "NIFTYNXT50", "FINNIFTY", "BANKNIFTY", "MIDCPNIFTY"];

export default function OptionChainPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const [expiryDates, setExpiryDates] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [optionChainData, setOptionChainData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spotPrice, setSpotPrice] = useState(0);
  const optionScrollRef = useRef(null);
  const [optionScrollShadow, setOptionScrollShadow] = useState("");

  useEffect(() => {
    const el = optionScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft > 0 && scrollLeft + clientWidth < scrollWidth - 1) {
        setOptionScrollShadow("scroll-shadow-both");
      } else if (scrollLeft > 0) {
        setOptionScrollShadow("scroll-shadow-left");
      } else if (scrollLeft + clientWidth < scrollWidth - 1) {
        setOptionScrollShadow("scroll-shadow-right");
      } else {
        setOptionScrollShadow("");
      }
    };
    el.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const loadContractInfo = useCallback(async (symbol) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchOptionChainContractInfo(symbol);
      const dates = res?.expiryDates || res?.data?.expiryDates || [];
      setExpiryDates(dates);
      if (dates.length > 0) {
        setSelectedExpiry(dates[0]);
      } else {
        setSelectedExpiry("");
      }
    } catch (err) {
      setError(err.message || "Failed to load contract info.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptionChain = useCallback(async () => {
    if (!selectedSymbol || !selectedExpiry) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchOptionChainData(selectedSymbol, selectedExpiry);
      const data = res?.records?.data || res?.data || [];
      setOptionChainData(data);
      const sp = res?.records?.underlyingValue || res?.underlyingValue || 0;
      setSpotPrice(sp);
    } catch (err) {
      setError(err.message || "Failed to load option chain data.");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, selectedExpiry]);

  useEffect(() => {
    loadContractInfo(selectedSymbol);
  }, [selectedSymbol, loadContractInfo]);

  useEffect(() => {
    if (selectedExpiry) {
      loadOptionChain();
    }
  }, [selectedExpiry, loadOptionChain]);

  const tableData = useMemo(() => {
    return optionChainData.map((item) => ({
      strikePrice: item.strikePrice,
      callOI: item.CE?.openInterest || 0,
      callChangeOI: item.CE?.changeinOpenInterest || 0,
      callVolume: item.CE?.totalTradedVolume || 0,
      callIV: item.CE?.impliedVolatility || 0,
      callLTP: item.CE?.lastPrice || 0,
      putOI: item.PE?.openInterest || 0,
      putChangeOI: item.PE?.changeinOpenInterest || 0,
      putVolume: item.PE?.totalTradedVolume || 0,
      putIV: item.PE?.impliedVolatility || 0,
      putLTP: item.PE?.lastPrice || 0,
    }));
  }, [optionChainData]);

  const summary = useMemo(() => {
    if (!tableData.length) return null;
    const totalCallOI = tableData.reduce((s, r) => s + r.callOI, 0);
    const totalPutOI = tableData.reduce((s, r) => s + r.putOI, 0);
    const totalCallVolume = tableData.reduce((s, r) => s + r.callVolume, 0);
    const totalPutVolume = tableData.reduce((s, r) => s + r.putVolume, 0);

    const maxBy = (key) =>
      tableData.reduce(
        (max, row) => (row[key] > max[key] ? row : max),
        tableData[0],
      );

    return {
      totalCallOI,
      totalPutOI,
      pcr: totalCallOI ? Number((totalPutOI / totalCallOI).toFixed(2)) : 0,
      highestCallOI: maxBy("callOI"),
      highestPutOI: maxBy("putOI"),
      highestCallVolume: maxBy("callVolume"),
      highestPutVolume: maxBy("putVolume"),
      totalCallVolume,
      totalPutVolume,
    };
  }, [tableData]);

  const chartData = useMemo(() => {
    return tableData.map((row) => ({
      strikePrice: row.strikePrice,
      callOI: row.callOI,
      putOI: row.putOI,
      callChangeOI: row.callChangeOI,
      putChangeOI: row.putChangeOI,
      callVolume: row.callVolume,
      putVolume: row.putVolume,
      pcr: row.callOI ? Number((row.putOI / row.callOI).toFixed(2)) : 0,
    }));
  }, [tableData]);

  const atmStrike = useMemo(() => {
    if (!spotPrice || !tableData.length) return 0;
    return tableData.reduce(
      (closest, row) =>
        Math.abs(row.strikePrice - spotPrice) < Math.abs(closest - spotPrice)
          ? row.strikePrice
          : closest,
      tableData[0].strikePrice,
    );
  }, [spotPrice, tableData]);

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-3 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="symbol-select"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Select Index
            </label>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full max-w-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {SYMBOLS.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label
              htmlFor="expiry-select"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Select Expiry
            </label>
            <select
              id="expiry-select"
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="w-full max-w-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {expiryDates.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {spotPrice > 0 && (
              <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg text-xs sm:text-sm text-primary-800 dark:text-primary-300 font-medium">
                Spot: {spotPrice.toLocaleString()}
              </div>
            )}
            <button
              onClick={loadOptionChain}
              disabled={loading}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-6">
          <SummaryCard
            icon={<DollarSign className="w-5 h-5 text-primary-600" />}
            label="PCR"
            value={summary.pcr}
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Total Call OI"
            value={summary.totalCallOI.toLocaleString()}
          />
          <SummaryCard
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
            label="Total Put OI"
            value={summary.totalPutOI.toLocaleString()}
          />
          <SummaryCard
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
            label="Highest Call OI"
            value={summary.highestCallOI?.strikePrice}
            sub={`${summary.highestCallOI?.callOI.toLocaleString()} OI`}
          />
          <SummaryCard
            icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
            label="Highest Put OI"
            value={summary.highestPutOI?.strikePrice}
            sub={`${summary.highestPutOI?.putOI.toLocaleString()} OI`}
          />
          <SummaryCard
            icon={<Activity className="w-5 h-5 text-violet-600" />}
            label="Highest Call Vol"
            value={summary.highestCallVolume?.strikePrice}
            sub={`${summary.highestCallVolume?.callVolume.toLocaleString()} Vol`}
          />
          <SummaryCard
            icon={<Activity className="w-5 h-5 text-pink-600" />}
            label="Highest Put Vol"
            value={summary.highestPutVolume?.strikePrice}
            sub={`${summary.highestPutVolume?.putVolume.toLocaleString()} Vol`}
          />
        </div>
      )}

      {/* Tabs: Table & Charts */}
      <Tabs
        defaultTab="table"
        tabs={[
          {
            id: "table",
            label: "Option Chain",
            icon: Table2,
            content:
              loading && !tableData.length ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <span className="ml-2 text-slate-600 dark:text-slate-400">
                    Loading…
                  </span>
                </div>
              ) : tableData.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div
                    ref={optionScrollRef}
                    className={`sticky-table-wrapper ${optionScrollShadow}`}
                    style={{ maxHeight: "70vh" }}
                  >
                    <table className="min-w-full text-xs sm:text-sm text-left">
                      <thead className="sticky-header text-slate-700 dark:text-slate-300">
                        <tr>
                          <th
                            colSpan={5}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-center border-b border-slate-200 dark:border-slate-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] sm:text-xs"
                          >
                            CALLS
                          </th>
                          <th className="sticky-strike-col-header px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-center border-b border-slate-200 dark:border-slate-600 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-[10px] sm:text-xs">
                            Strike
                          </th>
                          <th
                            colSpan={5}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-center border-b border-slate-200 dark:border-slate-600 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 text-[10px] sm:text-xs"
                          >
                            PUTS
                          </th>
                        </tr>
                        <tr>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            OI
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            Chg OI
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            Volume
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            IV
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            LTP
                          </th>
                          <th className="sticky-strike-col-header px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-center text-[10px] sm:text-xs">
                            Strike
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            LTP
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            IV
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            Volume
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            Chg OI
                          </th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs">
                            OI
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tableData.map((row, idx) => {
                          const isATM = row.strikePrice === atmStrike;
                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${isATM ? "atm-row" : ""}`}
                            >
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.callOI.toLocaleString()}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.callChangeOI.toLocaleString()}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.callVolume.toLocaleString()}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.callIV}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.callLTP}
                              </td>
                              <td
                                className={`sticky-strike-col px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap font-bold text-center ${
                                  isATM
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {row.strikePrice}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.putLTP}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.putIV}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.putVolume.toLocaleString()}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.putChangeOI.toLocaleString()}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {row.putOI.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  No data available. Select an index and expiry.
                </div>
              ),
          },
          {
            id: "charts",
            label: "Charts & Analysis",
            icon: BarChart3,
            content:
              chartData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
                  <ChartCard title="Open Interest by Strike">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="strikePrice" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="callOI" fill="#10b981" name="Call OI" />
                        <Bar dataKey="putOI" fill="#f43f5e" name="Put OI" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Change in Open Interest">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="strikePrice" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="callChangeOI"
                          fill="#3b82f6"
                          name="Call Chg OI"
                        />
                        <Bar
                          dataKey="putChangeOI"
                          fill="#f97316"
                          name="Put Chg OI"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Volume by Strike">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="strikePrice" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="callVolume"
                          fill="#8b5cf6"
                          name="Call Volume"
                        />
                        <Bar
                          dataKey="putVolume"
                          fill="#ec4899"
                          name="Put Volume"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="PCR by Strike">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="strikePrice" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="pcr"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                          name="PCR"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  No chart data available. Select an index and expiry.
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-2 sm:p-4">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        {icon}
        <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-sm sm:text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-200">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-2 sm:p-4">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
