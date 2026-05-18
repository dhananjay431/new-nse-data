const express = require("express");
const axios = require("axios");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// ── Cookie Management ──────────────────────────────────────────────────────
let nseCookies = "";
let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 10_000; // refresh at most once per 10 s

async function refreshCookies() {
  try {
    const res = await axios.get("https://www.nseindia.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 5,
    });

    const setCookie = res.headers["set-cookie"];
    if (setCookie && setCookie.length) {
      nseCookies = setCookie.map((c) => c.split(";")[0]).join("; ");
      lastRefreshTime = Date.now();
      console.log("[Cookie Refreshed]", new Date().toISOString());
    }
  } catch (err) {
    console.error("[Cookie Refresh Failed]", err.message);
  }
}

// Background refresh every 4 minutes
refreshCookies();
setInterval(refreshCookies, 5000);

// ── Axios helper ───────────────────────────────────────────────────────────
const axiosInstance = axios.create({ timeout: 15000 });

async function nseGet(url, referer) {
  if (Date.now() - lastRefreshTime > REFRESH_COOLDOWN_MS) {
    await refreshCookies();
  }
  return axiosInstance.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9,mr;q=0.8",
      Referer: referer,
      Cookie: nseCookies,
      "sec-ch-ua":
        '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────

// 1. allIndices
app.get("/api/allIndices", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/allIndices",
      "https://www.nseindia.com/market-data/live-market-indices",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 2. index-names
app.get("/api/index-names", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/index-names",
      "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 3. index details data
app.get("/api/equity-stockIndices", async (req, res) => {
  const index = req.query.index || "NIFTY 50";
  try {
    const { data } = await nseGet(
      `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(index)}`,
      `https://www.nseindia.com/market-data/live-equity-market?symbol=${encodeURIComponent(index)}`,
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 4. ETF details data
app.get("/api/etf", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/etf",
      "https://www.nseindia.com/market-data/exchange-traded-funds-etf",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 5. graph api
app.get("/api/graph", async (req, res) => {
  const type = req.query.type || "NIFTY 50";
  const flag = req.query.flag || "1D";
  try {
    const { data } = await nseGet(
      `https://www.nseindia.com/api/NextApi/apiClient?functionName=getGraphChart&&type=${encodeURIComponent(type)}&flag=${encodeURIComponent(flag)}`,
      "https://www.nseindia.com/",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 6. indices data (homeApi)
app.get("/api/homeApi", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/NextApi/apiClient/homeApi?functionName=getIndicesData",
      "https://www.nseindia.com/",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 7. getIndexData
app.get("/api/getIndexData", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/NextApi/apiClient?functionName=getIndexData&&type=All",
      "https://www.nseindia.com/",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 8. getMarketSnapshot
app.get("/api/getMarketSnapshot", async (req, res) => {
  try {
    const { data } = await nseGet(
      "https://www.nseindia.com/api/NextApi/apiClient?functionName=getMarketSnapshot&&type=G",
      "https://www.nseindia.com/",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 9. option chain (supports query params)
app.get("/api/option-chain", async (req, res) => {
  const symbol = req.query.symbol || "NIFTY";
  const expiry = req.query.expiry || "19-May-2026";
  const type = req.query.type || "Indices";
  try {
    const { data } = await nseGet(
      `https://www.nseindia.com/api/option-chain-v3?type=${encodeURIComponent(type)}&symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(expiry)}`,
      "https://www.nseindia.com/option-chain",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 10. option chain contract info
app.get("/api/option-chain-contract-info", async (req, res) => {
  const symbol = req.query.symbol || "NIFTY";
  try {
    const { data } = await nseGet(
      `https://www.nseindia.com/api/option-chain-contract-info?symbol=${encodeURIComponent(symbol)}`,
      "https://www.nseindia.com/option-chain",
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
