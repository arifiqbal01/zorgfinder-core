import { useState } from "react";
import FavouriteButton from "./FavouriteButton";
import ProviderDetailsDrawer from "./ProviderDetailsDrawer";
import { Card, ProviderLogo, Button, Icon } from "../../ui";
import { useCompareCart } from "../../context/CompareContext";

const ICONS = {
  briefcase:
    "M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  wallet: "M2 7h20v10H2z M16 11h4",
  building: "M3 21h18M6 21V3h12v18M9 9h6M9 13h6M9 17h6",
  religion: "M12 2v20 M5 12h14",
  badge: "M12 2l3 5 5 1-3 4 1 5-6-3-6 3 1-5-3-4 5-1z",
  receipt: "M4 2h16v20l-4-2-4 2-4-2-4 2z",
};

export default function ProviderCard({ provider }) {
  if (!provider || typeof provider !== "object") return null;

  const [showDetails, setShowDetails] = useState(false);

  const { ids, add, remove, isFull } = useCompareCart();
  const isCompared = ids.includes(provider.id);

  const overall = Number(provider?.reviews?.overall ?? 0);
  const count = Number(provider?.reviews?.count ?? 0);

  const reimbursements = Array.isArray(provider.reimbursements)
    ? provider.reimbursements
    : [];

  const reimbursementTypes = reimbursements
    .map((r) => r.type)
    .filter(Boolean)
    .join(", ");

  const openAppointment = () => {
    if (!window?.zfOpenAppointment) return;

    window.zfOpenAppointment({
      providerId: provider.id,
      title: `Request from ${provider.provider}`,
    });
  };

  return (
    <>
      <Card className="w-full p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <ProviderLogo
              name={provider.provider}
              logo={provider.logo}
              size={56}
            />
            <div className="leading-tight">
              <h3 className="text-xl font-semibold text-gray-900">
                {provider.provider}
              </h3>
              <div className="flex items-center gap-1 text-sm mt-0.5">
                <span className="text-indigo-600 font-semibold">
                  {overall}
                </span>
                <span className="text-gray-500">({count})</span>
              </div>
            </div>
          </div>

          <FavouriteButton providerId={provider.id} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-700">
          <InfoRow
            icon={<Icon d={ICONS.briefcase} />}
            label="Type of care"
            value={provider.type_of_care}
          />
          <InfoRow
            icon={<Icon d={ICONS.wallet} />}
            label="Indication"
            value={provider.indication_type}
          />
          <InfoRow
            icon={<Icon d={ICONS.building} />}
            label="Organization"
            value={provider.organization_type}
          />
          <InfoRow
            icon={<Icon d={ICONS.religion} />}
            label="Religion"
            value={provider.religion}
          />

          {provider.has_hkz === 1 && (
            <InfoRow
              icon={<Icon d={ICONS.badge} />}
              label="Certification"
              value="HKZ Certified"
            />
          )}

          {reimbursementTypes && (
            <InfoRow
              icon={<Icon d={ICONS.receipt} />}
              label="Reimbursement"
              value={reimbursementTypes}
            />
          )}
        </div>

        {/* Divider */}
        <hr className="mt-6 border-gray-100" />

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={isCompared}
              disabled={!isCompared && isFull}
              onChange={() =>
                isCompared ? remove(provider.id) : add(provider.id)
              }
            />
            Compare
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDetails(true)}
            >
              More info
            </Button>
            <Button variant="primary" onClick={openAppointment}>
              Request
            </Button>
          </div>
        </div>
      </Card>

      <ProviderDetailsDrawer
        provider={provider}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-500">{icon}</span>
      <div>
        <span className="font-medium text-gray-900">
          {label}:
        </span>{" "}
        <span className="text-gray-700">{value}</span>
      </div>
    </div>
  );
}
