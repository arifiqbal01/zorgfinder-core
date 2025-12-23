import Drawer from "../../ui/Drawer";
import { Stars, ProviderLogo, Button, Card } from "../../ui";
import FavouriteButton from "./FavouriteButton";

export default function ProviderDetailsDrawer({ provider, open, onClose }) {
  if (!provider) return null;

  const overall = Number(provider?.reviews?.overall ?? 0) || 0;
  const count = Number(provider?.reviews?.count ?? 0) || 0;
  const details = provider?.reviews?.details ?? {};
  const reimbursements = Array.isArray(provider.reimbursements)
    ? provider.reimbursements
    : [];

  const openAppointment = () => {
    if (!window?.zfOpenAppointment) return;

    window.zfOpenAppointment({
      providerId: provider.id,
      title: `Request from ${provider.provider}`,
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title={provider.provider}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderLogo name={provider.provider} size={56} />
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Stars value={overall} size={16} />
                <span className="text-indigo-600 font-medium">
                  {overall}
                </span>
                <span className="text-gray-500">
                  ({count} reviews)
                </span>
              </div>
            </div>
          </div>

          <FavouriteButton providerId={provider.id} />
        </div>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">
            About this provider
          </h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {provider.type_of_care && (
              <li>
                <b>Type of care:</b> {provider.type_of_care}
              </li>
            )}
            {provider.indication_type && (
              <li>
                <b>Indication:</b> {provider.indication_type}
              </li>
            )}
            {provider.organization_type && (
              <li>
                <b>Organization:</b> {provider.organization_type}
              </li>
            )}
            {provider.religion && (
              <li>
                <b>Religion:</b> {provider.religion}
              </li>
            )}
            {provider.has_hkz === 1 && (
              <li>
                <b>HKZ:</b> Certified
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Contact</h3>
          <div className="space-y-1 text-sm text-gray-700">
            {provider.address && (
              <p>
                <b>Address:</b> {provider.address}
              </p>
            )}
            {provider.email && (
              <p>
                <b>Email:</b> {provider.email}
              </p>
            )}
            {provider.phone && (
              <p>
                <b>Phone:</b> {provider.phone}
              </p>
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

        {reimbursements.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              Reimbursements
            </h3>
            <div className="space-y-2">
              {reimbursements.map((item, idx) => (
                <div key={item.id ?? idx} className="border-b pb-2">
                  <div className="font-medium">
                    {item.type}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-700 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

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
            <RatingRow
              label="Communication"
              value={details.communication}
            />
            <RatingRow
              label="Cleanliness"
              value={details.cleanliness}
            />
            <RatingRow
              label="Facilities"
              value={details.facilities}
            />
            <RatingRow
              label="Professionalism"
              value={details.professionalism}
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            full
            variant="secondary"
            onClick={() =>
              provider.website &&
              window.open(provider.website, "_blank")
            }
            disabled={!provider.website}
          >
            Contact Provider
          </Button>

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
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <Stars value={Number(value) || 0} size={14} />
        <span className="text-gray-600">
          {value ?? "-"}
        </span>
      </div>
    </div>
  );
}
