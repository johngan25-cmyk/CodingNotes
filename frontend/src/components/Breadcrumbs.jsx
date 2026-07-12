import { Monitor } from 'lucide-react';

export default function Breadcrumbs({ breadcrumbs, onBreadcrumbClick }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
      <Monitor size={15} className="text-slate-400 shrink-0" />
      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
        <span className="text-slate-400">Path:</span>
        {breadcrumbs.length === 0 ? (
          <span className="text-slate-400 italic ml-1">No active selection</span>
        ) : (
          breadcrumbs.map((crumb, idx) => (
            <div key={crumb.fullPath || idx} className="flex items-center gap-1">
              {idx > 0 && <span className="text-slate-300">/</span>}
              <button
                onClick={() => onBreadcrumbClick(crumb.id || crumb.fullPath)}
                className={`hover:text-blue-600 hover:underline cursor-pointer transition-colors ${
                  idx === breadcrumbs.length - 1 ? 'text-slate-800 font-bold' : ''
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}