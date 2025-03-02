import { IconCurrencyBitcoin } from "@tabler/icons-react";

export default function Header() {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <IconCurrencyBitcoin size={24} className="text-yellow-500" />
        <h1 className="text-xl font-semibold">Crypto Portfolio Tracker</h1>
      </div>
      <nav>
        <ul className="flex space-x-4">
          <li className="text-gray-700 hover:text-black cursor-pointer">Home</li>
          <li className="text-gray-700 hover:text-black cursor-pointer">Dashboard</li>
        </ul>
      </nav>
    </header>
  );
}
