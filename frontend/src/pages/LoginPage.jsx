import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart3, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    // Simulate a brief network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 sm:px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-primary-600/30">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            NSE Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 sm:mt-2">
            Sign in to access market data and analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5 sm:py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-600/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/10">
            <p className="text-[10px] sm:text-xs text-slate-500 text-center">
              Demo mode — enter any email and password to sign in.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs text-slate-600 mt-4 sm:mt-6">
          © {new Date().getFullYear()} NSE Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
}
