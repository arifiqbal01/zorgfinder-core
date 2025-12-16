import React from "react";

import { Card, Button, ProviderLogo, Stars } from "../../ui";

export default function TopSummaryCards({ providers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
      {providers.map((p) => (
        <Card key={p.id} className="text-center">
          <div className="flex justify-center mb-4">
            <ProviderLogo name={p.provider} logo={p.logo} size={56} />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {p.provider}
          </h2>

          <div className="flex justify-center mt-2">
            <Stars value={p.reviews?.overall || 0} size={16} />
          </div>

          <div className="text-sm text-gray-500 mt-1">
            {p.reviews?.overall || 0} / 5 · {p.reviews?.count || 0} reviews
          </div>

          <div className="mt-5">
            <Button full>
              Book appointment
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getBadge(p) {
    if (p.reviews?.avg_rating >= 4.5) return "Top Rated";
    if (p.has_hkz) return "HKZ Certified";
    return "Good Choice";
}
