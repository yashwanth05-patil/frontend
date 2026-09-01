import React from 'react'

const SettingsSection = ({ title, children }) => (
    <div className="card-surface overflow-hidden">
        <h2 className="text-heading text-ink p-4 border-b border-slate-line">{title}</h2>
        {children}
    </div>
)

export default SettingsSection
