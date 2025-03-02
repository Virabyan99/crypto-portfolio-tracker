"use client";

import { useEffect, useState } from "react";
import CryptoChart from "@/components/CryptoChart";

interface CryptoData {
  time: number;
  price: number;
}

const COINS = [
  { id: "bitcoin", name: "Bitcoin (BTC)" },
  { id: "ethereum", name: "Ethereum (ETH)" },
  { id: "dogecoin", name: "Dogecoin (DOGE)" },
  { id: "cardano", name: "Cardano (ADA)" },
  { id: "solana", name: "Solana (SOL)" }
];

// Mapping to convert coin names to Binance symbols
const symbolMap: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth",
  dogecoin: "doge",
  cardano: "ada",
  solana: "sol"
};

export default function Home() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [coin, setCoin] = useState(COINS[0].id);

  // Fetch historical data (last 7 days) from CoinGecko when coin changes
  useEffect(() => {
    fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=7`)
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.prices.map((d: [number, number]) => ({
          time: d[0],
          price: d[1],
        }));
        setCryptoData(formattedData);
      })
      .catch((error) => console.error("Error fetching historical data:", error));
  }, [coin]);

  // Connect to Binance WebSocket for live updates and append new data
  useEffect(() => {
    const binanceSymbol = symbolMap[coin] || "btc";
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}usdt@trade`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newPoint = { time: Date.now(), price: parseFloat(data.p) };

      setCryptoData((prev) => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
        // Filter out points older than 7 days and append the new point
        const filtered = prev.filter((p) => p.time >= sevenDaysAgo);
        return [...filtered, newPoint];
      });
    };

    return () => socket.close();
  }, [coin]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Live {coin.toUpperCase()} Price Chart (Last 7 Days)
      </h1>
      <div className="mb-4">
        <label className="text-sm font-semibold mr-2">Select Coin:</label>
        <select
          className="border bg-white rounded px-3 py-1 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
          value={coin}
          onChange={(e) => setCoin(e.target.value)}
        >
          {COINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {cryptoData.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading price data...</p>
      ) : (
        // Pass the coin as key so that switching coins remounts the chart for a fresh fade‑in
        <CryptoChart data={cryptoData} key={coin} />
      )}
    </div>
  );
}
