import { useState } from "react";
import ReviewsStars from "./ReviewsStars";
import FavouriteButton from "./FavouriteButton";
import AppointmentModal from "./AppointmentModal";
import ProviderDetailsDrawer from "./ProviderDetailsDrawer";

export default function ProviderCard({ provider }) {
    const [showDetails, setShowDetails] = useState(false);
    const [showAppointment, setShowAppointment] = useState(false);

    const logoText = provider.name ? provider.name.charAt(0) : "?";

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col gap-4 border border-gray-100">
            
            {/* Top row */}
            <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-indigo-700">
                    {logoText}
                </div>

                <FavouriteButton providerId={provider.id} />
            </div>

            {/* Provider name */}
            <h3 className="text-lg font-semibold text-gray-900">
                {provider.name}
            </h3>

            {/* Address */}
            <p className="text-sm text-gray-500">
                {provider.address || "—"}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
                {provider.type_of_care && (
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {provider.type_of_care}
                    </span>
                )}
                {provider.indication_type && (
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {provider.indication_type}
                    </span>
                )}
                {provider.organization_type && (
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {provider.organization_type}
                    </span>
                )}
                {provider.religion && (
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {provider.religion}
                    </span>
                )}
                {provider.has_hkz == 1 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        HKZ Certified
                    </span>
                )}
            </div>

            {/* Rating */}
            <div className="mt-1 text-sm">
                <ReviewsStars providerId={provider.id} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                    View Details
                </button>

                <button
                    onClick={() => setShowAppointment(true)}
                    className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Book Appointment
                </button>
            </div>

            {showDetails && (
                <ProviderDetailsDrawer
                    provider={provider}
                    onClose={() => setShowDetails(false)}
                />
            )}

            {showAppointment && (
                <AppointmentModal
                    provider={provider}
                    onClose={() => setShowAppointment(false)}
                />
            )}
        </div>
    );
}
