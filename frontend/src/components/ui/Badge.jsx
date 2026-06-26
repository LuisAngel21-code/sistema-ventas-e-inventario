const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  neutral: 'bg-gray-100 text-gray-600 ring-1 ring-gray-400/20',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
}
