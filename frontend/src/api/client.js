import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export async function fetchAllIndices() {
  const { data } = await client.get("/allIndices");
  // data may be an object with data array; normalise
  const list = Array.isArray(data) ? data : data?.data || [];
  return list;
}

export async function fetchEquityStockIndices(indexName) {
  const { data } = await client.get(
    `/equity-stockIndices?index=${encodeURIComponent(indexName)}`,
  );
  const rows = Array.isArray(data) ? data : data?.data || [];
  const metadata = data?.metadata || null;
  return { rows, metadata };
}

export async function fetchETF() {
  const { data } = await client.get("/etf");
  const list = Array.isArray(data) ? data : data?.data || [];
  return list;
}

export async function fetchOptionChainContractInfo(symbol = "NIFTY") {
  const { data } = await client.get(
    `/option-chain-contract-info?symbol=${encodeURIComponent(symbol)}`,
  );
  return data;
}

export async function fetchOptionChainData(symbol, expiry, type = "Indices") {
  const { data } = await client.get(
    `/option-chain?type=${encodeURIComponent(type)}&symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(expiry)}`,
  );
  return data;
}

export default client;
