export default function Filters({ onChange }) {
    return (
        <div className="w-full mb-6">
            <input
                placeholder="Search providers…"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                onChange={(e) => onChange(f => ({ ...f, search: e.target.value }))}
            />
        </div>
    );
}
