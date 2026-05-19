import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import IndexTablePage from "./pages/IndexTablePage";
import ETFPage from "./pages/ETFPage";
import OptionChainPage from "./pages/OptionChainPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login route - accessible only when not authenticated */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
                  <Navbar />
                  <main className="flex-1 px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                    <IndexTablePage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/etf"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
                  <Navbar />
                  <main className="flex-1 px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                    <ETFPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/option-chain-analysis"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
                  <Navbar />
                  <main className="flex-1 px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                    <OptionChainPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
