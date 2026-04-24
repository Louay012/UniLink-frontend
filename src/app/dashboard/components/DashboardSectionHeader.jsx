import React from "react";

export default function DashboardSectionHeader({ title, kicker, meta, action }) {
  return (
    <div className="dashboard-section-header">
      <div>
        {kicker ? <p className="dashboard-section-kicker">{kicker}</p> : null}
        <h3>{title}</h3>
      </div>
      <div className="dashboard-section-meta">
        {meta ? <span>{meta}</span> : null}
        {action || null}
      </div>
    </div>
  );
}
