export default function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-sm text-slate-700">
      <span>{label}</span>
      <button
        id={id}
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? "bg-tikun-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
