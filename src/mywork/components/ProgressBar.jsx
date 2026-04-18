export default function ProgressBar({ percent, label }) {
  return (
    <div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {label ? <p className="text-xs text-slate-600 mt-1">{label}</p> : null}
    </div>
  );
}
