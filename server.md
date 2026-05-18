# NSE India API Proxy — Express.js + Axios

## Prerequisites

```bash
npm install express axios cors helmet
```

## server.js

Copy-paste the file below and run with `node server.js`.

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// ── Cookie Management ──────────────────────────────────────────────────────
let nseCookies = '';

async function refreshCookies() {
  try {
    const res = await axios.get('https://www.nseindia.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
    });

    const setCookie = res.headers['set-cookie'];
    if (setCookie && setCookie.length) {
      nseCookies = setCookie.map(c => c.split(';')[0]).join('; ');
      console.log('[Cookie Refreshed]', new Date().toISOString());
    }
  } catch (err) {
    console.error('[Cookie Refresh Failed]', err.message);
  }
}

// Refresh on startup and every 4 minutes
refreshCookies();
setInterval(refreshCookies, 4 * 60 * 1000);

// ── Axios helper ───────────────────────────────────────────────────────────
const axiosInstance = axios.create({ timeout: 15000 });

async function nseGet(url, referer) {
  return axiosInstance.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,mr;q=0.8',
      'Referer': referer,
      'Cookie': nseCookies,
      'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    },
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────

// 1. allIndices
app.get('/api/allIndices', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/allIndices',
      'https://www.nseindia.com/market-data/live-market-indices'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 2. index-names
app.get('/api/index-names', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/index-names',
      'https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 3. index details data
app.get('/api/equity-stockIndices', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
      'https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 4. ETF details data
app.get('/api/etf', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/etf',
      'https://www.nseindia.com/market-data/exchange-traded-funds-etf'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 5. graph api
app.get('/api/graph', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/NextApi/apiClient?functionName=getGraphChart&&type=NIFTY%2050&flag=1D',
      'https://www.nseindia.com/'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 6. indices data (homeApi)
app.get('/api/homeApi', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/NextApi/apiClient/homeApi?functionName=getIndicesData',
      'https://www.nseindia.com/'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 7. getIndexData
app.get('/api/getIndexData', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/NextApi/apiClient?functionName=getIndexData&&type=All',
      'https://www.nseindia.com/'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 8. getMarketSnapshot
app.get('/api/getMarketSnapshot', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/NextApi/apiClient?functionName=getMarketSnapshot&&type=G',
      'https://www.nseindia.com/'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

// 9. option chain
app.get('/api/option-chain', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/option-chain-v3?type=Indices&symbol=NIFTY&expiry=19-May-2026',
      'https://www.nseindia.com/option-chain'
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message, response: err.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
```

## Endpoint Map

| # | Proxy Endpoint | NSE Endpoint | Required Referer |
|---|----------------|--------------|------------------|
| 1 | `GET /api/allIndices` | `https://www.nseindia.com/api/allIndices` | `https://www.nseindia.com/market-data/live-market-indices` |
| 2 | `GET /api/index-names` | `https://www.nseindia.com/api/index-names` | `https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050` |
| 3 | `GET /api/equity-stockIndices` | `https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050` | `https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050` |
| 4 | `GET /api/etf` | `https://www.nseindia.com/api/etf` | `https://www.nseindia.com/market-data/exchange-traded-funds-etf` |
| 5 | `GET /api/graph` | `https://www.nseindia.com/api/NextApi/apiClient?functionName=getGraphChart&&type=NIFTY%2050&flag=1D` | `https://www.nseindia.com/` |
| 6 | `GET /api/homeApi` | `https://www.nseindia.com/api/NextApi/apiClient/homeApi?functionName=getIndicesData` | `https://www.nseindia.com/` |
| 7 | `GET /api/getIndexData` | `https://www.nseindia.com/api/NextApi/apiClient?functionName=getIndexData&&type=All` | `https://www.nseindia.com/` |
| 8 | `GET /api/getMarketSnapshot` | `https://www.nseindia.com/api/NextApi/apiClient?functionName=getMarketSnapshot&&type=G` | `https://www.nseindia.com/` |
| 9 | `GET /api/option-chain` | `https://www.nseindia.com/api/option-chain-v3?type=Indices&symbol=NIFTY&expiry=19-May-2026` | `https://www.nseindia.com/option-chain` |

## Notes

- **Auto-fetch cookies**: On startup the server sends a pre-flight `GET` to `https://www.nseindia.com/`, extracts `set-cookie` headers, flattens them into a `; `-delimited string, and re-runs every 4 minutes.
- **Headers**: NSE endpoints are sensitive to the `Referer`. Each proxy route sends the exact `Referer` from the real NSE page (extracted from the original `curl` commands).
- **Option Chain Expiry**: The example hard-codes `expiry=19-May-2026`. You can make this dynamic via a query parameter if needed.
- **Error Handling**: All routes return `502` on upstream failure and echo the error body when available.

## Quick Start

```bash
npm install express axios cors helmet
node server.js
```

Test with:

```bash
curl http://localhost:3000/api/allIndices
```
