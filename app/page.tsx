import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">$0.00</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Gainers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-500">Bitcoin +5%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No coins added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
