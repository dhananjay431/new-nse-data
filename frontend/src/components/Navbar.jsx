import { Link } from "react-router-dom";
import {
  BarChart3,
  CandlestickChart,
  TableProperties,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              NSE Dashboard
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              to="/"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Indices
            </Link>
            <Link
              to="/etf"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <CandlestickChart className="w-4 h-4" /> ETF
            </Link>
            <Link
              to="/option-chain-analysis"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <TableProperties className="w-4 h-4" /> Option Chain
            </Link>
            <button
              onClick={toggleTheme}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
