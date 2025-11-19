import { useState } from 'react';
import { useAppointment } from '../hooks/useAppointment';

export default function AppointmentModal({ provider, onClose }) {
    const { submit, loading, successMsg } = useAppointment(provider.id);
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const [notes, setNotes] = useState('');

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
                
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                >
                    ×
                </button>

                <h2 className="text-lg font-semibold mb-4">
                    Book Appointment – {provider.name}
                </h2>

                <div className="flex flex-col gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    />

                    <input
                        placeholder="Time Slot"
                        value={slot}
                        onChange={e => setSlot(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    />

                    <textarea
                        placeholder="Notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="px-4 py-2 border rounded-lg h-28"
                    />

                    <button
                        disabled={loading}
                        onClick={() => submit({ date, slot, notes })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
                    >
                        {loading ? 'Sending...' : 'Submit'}
                    </button>

                    {successMsg && (
                        <p className="text-green-600 text-sm">{successMsg}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
