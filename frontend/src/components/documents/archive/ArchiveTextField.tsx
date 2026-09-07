"use client";

interface ArchiveTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function ArchiveTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: ArchiveTextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-extrabold text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
      />
    </div>
  );
}
