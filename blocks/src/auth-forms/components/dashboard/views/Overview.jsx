import { Card } from "../../../../ui";

export default function Overview({ user }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="text-xl font-semibold text-indigo-700 mb-1">
        Welcome, {user.name}
      </h2>
      <p className="text-sm text-gray-600">
        Manage your saved providers and profile details.
      </p>
    </Card>
  );
}
