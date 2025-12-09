// src/providers/Filters.jsx
import { useEffect, useState } from "react";

export default function Filters({ onChange, initial = {} }) {
  const [search, setSearch] = useState(initial.search || "");
  const [typeOfCare, setTypeOfCare] = useState(initial.type_of_care || "");
  const [hasHkz, setHasHkz] = useState(initial.has_hkz || 0);
  const [religion, setReligion] = useState(initial.religion || "");
  const [ageGroup, setAgeGroup] = useState(initial.age_group || "");
  const [gender, setGender] = useState(initial.gender || "");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      onChange(f => ({ ...f, search }));
    }, 350);
    return () => clearTimeout(t);
  }, [search, onChange]);

  // other filters update immediately
  useEffect(() => {
    onChange(f => ({ ...f, type_of_care: typeOfCare || undefined }));
  }, [typeOfCare, onChange]);

  useEffect(() => {
    onChange(f => ({ ...f, has_hkz: hasHkz ? 1 : undefined }));
  }, [hasHkz, onChange]);

  useEffect(() => {
    onChange(f => ({ ...f, religion: religion || undefined }));
  }, [religion, onChange]);

  useEffect(() => {
    onChange(f => ({ ...f, age_group: ageGroup || undefined }));
  }, [ageGroup, onChange]);

  useEffect(() => {
    onChange(f => ({ ...f, gender: gender || undefined }));
  }, [gender, onChange]);

  return (
    <aside className="w-full max-w-xs">
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <input
          placeholder="Search providers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <div className="space-y-3 text-sm">
          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Type of care</div>
            <select value={typeOfCare} onChange={e => setTypeOfCare(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg">
              <option value="">Any</option>
              <option value="disability">Disability</option>
              <option value="ggz">GGZ</option>
              <option value="youth">Youth</option>
              <option value="elderly">Elderly</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasHkz === 1} onChange={e => setHasHkz(e.target.checked ? 1 : 0)} />
            <span className="text-sm">HKZ Certified only</span>
          </label>

          <label>
            <div className="text-xs text-gray-500 mb-1">Religion</div>
            <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Any</option>
              <option value="Islamic">Islamic</option>
              <option value="Christian">Christian</option>
              <option value="Jewish">Jewish</option>
              <option value="None">None</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Target age group</div>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Any</option>
              <option value="child">Child</option>
              <option value="adult">Adult</option>
              <option value="elderly">Elderly</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Gender focus</div>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              // clear
              setSearch("");
              setTypeOfCare("");
              setHasHkz(0);
              setReligion("");
              setAgeGroup("");
              setGender("");
              onChange(() => ({ search: "" }));
            }}
            className="w-full py-2 mt-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            Reset filters
          </button>
        </div>
      </div>
    </aside>
  );
}
