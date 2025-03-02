"use client";

import { useEffect, useState } from "react";
import CryptoChart from "@/components/CryptoChart";

interface CryptoData {
  time: number;
  price: number;
}

// Mapping to convert coin names to Binance symbols
const symbolMap: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth",
};

export default function Home() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [coin, setCoin] = useState("bitcoin");

  // Fetch historical data (last 7 days) from CoinGecko on coin change
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
        <button
          onClick={() => setCoin("bitcoin")}
          className="mr-2 px-3 py-1 bg-gray-200 rounded"
        >
          Bitcoin
        </button>
        <button
          onClick={() => setCoin("ethereum")}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Ethereum
        </button>
      </div>
      <CryptoChart data={cryptoData} />
    </div>
  );
}
