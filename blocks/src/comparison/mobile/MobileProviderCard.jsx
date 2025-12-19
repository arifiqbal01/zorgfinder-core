import { Card, Button, ProviderLogo, Stars } from '../../ui';

export default function MobileProviderCard({ provider }) {
  if (!provider) return null;

  return (
    <Card className="p-4 space-y-4">
      {/* PROVIDER IDENTITY */}
      <div className="flex gap-3 items-center">
        <ProviderLogo
          name={provider.provider}
          logo={provider.logo}
          size={44}
        />

        <div>
          <h3 className="text-base font-semibold text-indigo-900 leading-tight">
            {provider.provider}
          </h3>

          <div className="flex items-center gap-1.5 mt-0.5">
            <Stars value={provider.reviews?.overall || 0} size={14} />
            <span className="text-xs text-gray-500">
              {provider.reviews?.overall || 0}
              <span className="mx-0.5">•</span>
              {provider.reviews?.count || 0} reviews
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        full
        className="bg-yellow-400 text-gray-900 hover:bg-yellow-500"
      >
        Request
      </Button>

      {/* TAGLINE */}
      <div className="text-center text-xs text-gray-500">
        We arrange your transfer for free
      </div>
    </Card>
  );
}
