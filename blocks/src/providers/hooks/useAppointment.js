import { useState } from "react";
import { getCache, setCache } from "../utils/cache";

export function useAppointment(providerId) {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(getCache(`appt:${providerId}`) || null);

    const submit = async ({ date, slot, notes }) => {
        setLoading(true);

        const res = await fetch(`/wp-json/zorg/v1/appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": window.zorgFinderApp?.nonce || "",
            },
            body: JSON.stringify({
                provider_id: providerId,
                preferred_date: date,
                time_slot: slot,
                notes,
            }),
        });

        const json = await res.json();

        const msg = json.success ? "Appointment submitted!" : "Submission failed.";
        setSuccessMsg(msg);
        setCache(`appt:${providerId}`, msg, 180);

        setLoading(false);
    };

    return { loading, successMsg, submit };
}
