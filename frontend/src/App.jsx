import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import IndexTablePage from "./pages/IndexTablePage";
import ETFPage from "./pages/ETFPage";
import OptionChainPage from "./pages/OptionChainPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<IndexTablePage />} />
            <Route path="/etf" element={<ETFPage />} />
            <Route
              path="/option-chain-analysis"
              element={<OptionChainPage />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
