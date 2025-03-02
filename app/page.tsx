import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Crypto {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

// ✅ Fetching data in a Server Component
async function getCryptoData(): Promise<Crypto[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false",
      { next: { revalidate: 60 } } // Cache data for 60 seconds
    );
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Home() {
  const cryptos = await getCryptoData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Top 10 Cryptocurrencies</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Live Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Market Cap</TableHead>
                <TableHead>24h Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cryptos.length > 0 ? (
                cryptos.map((coin) => (
                  <TableRow key={coin.id}>
                    <TableCell>{coin.name} ({coin.symbol.toUpperCase()})</TableCell>
                    <TableCell>${coin.current_price.toLocaleString()}</TableCell>
                    <TableCell>${coin.market_cap.toLocaleString()}</TableCell>
                    <TableCell className={coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}>
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
