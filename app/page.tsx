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
          time: d[0],  // Timestamp
          price: d[1]  // Price
        }));
        setCryptoData(formattedData);
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Bitcoin Price Chart</h1>
      <CryptoChart data={cryptoData} />
    </div>
  );
}
