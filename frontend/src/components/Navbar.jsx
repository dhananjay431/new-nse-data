import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CandlestickChart,
  TableProperties,
  Sun,
  Moon,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
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
            </div>

            {/* Mobile nav */}
            <div className="flex sm:hidden items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link
                to="/"
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                Indices
              </Link>
              <Link
                to="/etf"
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                ETF
              </Link>
              <Link
                to="/option-chain-analysis"
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                Options
              </Link>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* User info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">
                  {user?.name || "User"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
              <button
                onClick={toggleTheme}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-slate-600 dark:text-slate-400"
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
      </div>
    </nav>
  );
}
