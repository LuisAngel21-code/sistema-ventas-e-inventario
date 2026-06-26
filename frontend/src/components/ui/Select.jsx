import { ChevronDown } from 'lucide-react';

export default function Select({ label, error, options = [], placeholder = 'Seleccionar...', className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        <select
          className={`input-field appearance-none ${error ? 'border-red-300' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
