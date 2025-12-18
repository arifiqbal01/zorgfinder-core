import { Card } from "../../../../ui";

export default function Favourites() {
  return (
    <Card className="max-w-3xl">
      <h2 className="text-lg font-semibold mb-2">Favourites</h2>
      <p className="text-sm text-gray-500">
        Your saved providers will appear here.
      </p>
    </Card>
  );
}
