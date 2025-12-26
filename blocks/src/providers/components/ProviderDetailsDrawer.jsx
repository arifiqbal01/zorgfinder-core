import Drawer from "../../ui/Drawer";
import { Stars, ProviderLogo, Button, Card } from "../../ui";
import FavouriteButton from "./FavouriteButton";

export default function ProviderDetailsDrawer({ provider, open, onClose }) {
  if (!provider) return null;

  const overall = Number(provider?.reviews?.overall ?? 0) || 0;
  const count = Number(provider?.reviews?.count ?? 0) || 0;
  const details = provider?.reviews?.details ?? {};

  const reimbursements = Array.isArray(provider.reimbursements)
    ? provider.reimbursements.filter(
        (r) => r && (r.type || r.description || r.coverage_details)
      )
    : [];

  const hasAbout =
    provider.type_of_care ||
    provider.indication_type ||
    provider.organization_type ||
    provider.religion ||
    provider.has_hkz === 1;

  const hasContact =
    provider.address ||
    provider.email ||
    provider.phone ||
    provider.website;

  const hasRatings =
    count > 0 &&
    (details.staff ||
      details.communication ||
      details.cleanliness ||
      details.facilities ||
      details.professionalism);

  const openAppointment = () => {
    if (!window?.zfOpenAppointment) return;

    window.zfOpenAppointment({
      providerId: provider.id,
      title: `Request from ${provider.provider}`,
    });
  };

  const shareProvider = async () => {
  const base = window?.zorgFinderApp?.providersPageUrl;
  if (!base) return;

  await navigator.clipboard.writeText(
    `${base}?open_provider=${provider.id}`
  );
};


  return (
    <Drawer open={open} onClose={onClose} title={provider.provider}>
      <div className="space-y-5">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderLogo name={provider.provider} size={56} />
            {count > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Stars value={overall} size={16} />
                <span className="text-indigo-600 font-medium">
                  {overall}
                </span>
                <span className="text-gray-500">
                  ({count} reviews)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FavouriteButton providerId={provider.id} />

            <Button
              variant="ghost"
              size="sm"
              onClick={shareProvider}
            >
              Share
            </Button>
          </div>
        </div>

        {/* ===== ABOUT ===== */}
        {hasAbout && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              About this provider
            </h3>
            <ul className="space-y-1 text-sm text-gray-700">
              {provider.type_of_care && (
                <li><b>Type of care:</b> {provider.type_of_care}</li>
              )}
              {provider.indication_type && (
                <li><b>Indication:</b> {provider.indication_type}</li>
              )}
              {provider.organization_type && (
                <li><b>Organization:</b> {provider.organization_type}</li>
              )}
              {provider.religion && (
                <li><b>Religion:</b> {provider.religion}</li>
              )}
              {provider.has_hkz === 1 && (
                <li><b>HKZ:</b> Certified</li>
              )}
            </ul>
          </Card>
        )}

        {/* ===== REIMBURSEMENTS ===== */}
        {reimbursements.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              Reimbursements
            </h3>

            <ul className="space-y-3 text-sm text-gray-700">
              {reimbursements.map((r, i) => (
                <li key={i}>
                  {r.type && (
                    <div className="font-medium text-gray-900">
                      {r.type}
                    </div>
                  )}

                  {r.description && <div>{r.description}</div>}

                  {r.coverage_details && (
                    <div className="text-xs text-gray-500">
                      {r.coverage_details}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ===== CONTACT ===== */}
        {hasContact && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              Contact
            </h3>
            <div className="space-y-1 text-sm text-gray-700">
              {provider.address && (
                <p><b>Address:</b> {provider.address}</p>
              )}
              {provider.email && (
                <p><b>Email:</b> {provider.email}</p>
              )}
              {provider.phone && (
                <p><b>Phone:</b> {provider.phone}</p>
              )}
              {provider.website && (
                <p>
                  <b>Website:</b>{" "}
                  <a
                    href={provider.website}
                    className="text-indigo-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {provider.website}
                  </a>
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ===== RATINGS ===== */}
        {hasRatings && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              Detailed Ratings
            </h3>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-bold text-indigo-600">
                {overall}
              </span>
              <Stars value={overall} size={18} />
              <span className="text-gray-500">
                ({count} reviews)
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <RatingRow label="Staff" value={details.staff} />
              <RatingRow label="Communication" value={details.communication} />
              <RatingRow label="Cleanliness" value={details.cleanliness} />
              <RatingRow label="Facilities" value={details.facilities} />
              <RatingRow label="Professionalism" value={details.professionalism} />
            </div>
          </Card>
        )}

        {/* ===== ACTION ===== */}
        <div className="flex gap-3">
          <Button
            full
            variant="primary"
            onClick={openAppointment}
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function RatingRow({ label, value }) {
  if (value === undefined || value === null || Number(value) <= 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <Stars value={Number(value)} size={14} />
        <span className="text-gray-600">{value}</span>
      </div>
    </div>
  );
}
