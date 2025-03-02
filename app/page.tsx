"use client";

import { useEffect, useState } from "react";
import CryptoChart from "@/components/CryptoChart";

interface CryptoData {
  time: number;
  price: number;
}

export default function Home() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7")
      .then(res => res.json())
      .then(data => {
        const formattedData = data.prices.map((d: [number, number]) => ({
          time: d[0],  
          price: d[1]
        }));
        setCryptoData(formattedData);
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">📈 Bitcoin Price Chart</h1>
      <p className="text-gray-600 text-center mb-6">Track the latest trends in Bitcoin prices over the past 7 days.</p>
      <CryptoChart data={cryptoData} />
    </div>
  );
}
