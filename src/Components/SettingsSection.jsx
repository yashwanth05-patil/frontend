import React from 'react'

const SettingsSection = ({ title, children }) => (
    <div className="card-surface overflow-hidden">
        <h2 className="text-heading text-mist p-4 border-b border-slate">{title}</h2>
        {children}
    </div>
)

export default SettingsSection
