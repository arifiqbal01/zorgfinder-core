export default function ProviderDetailsDrawer({ provider, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">

                <button
                    className="text-2xl text-gray-500 hover:text-gray-700 mb-4"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold mb-4">{provider.name}</h2>

                <div className="space-y-2 text-gray-600">
                    <p><strong>Care Type:</strong> {provider.type_of_care}</p>
                    <p><strong>Address:</strong> {provider.address}</p>
                    <p><strong>Phone:</strong> {provider.phone}</p>
                    <p><strong>Email:</strong> {provider.email}</p>
                    {provider.website && (
                        <a href={provider.website} target="_blank" className="text-indigo-600 underline">
                            Visit Website
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
