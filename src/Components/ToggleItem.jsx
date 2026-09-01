import React from 'react'

const ToggleItem = ({ icon: Icon, label, enabled, onToggle }) => (
    <div className="flex items-center gap-3 p-4 border-b border-slate last:border-none">
        <Icon className="w-5 h-5 text-mist-soft" />
        <span className="flex-1 text-body text-mist">{label}</span>
        <button
            type="button"
            onClick={onToggle}
            className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${enabled ? 'bg-teal' : 'bg-slate'}`}
            aria-pressed={enabled}
        >
            <div className={`w-4 h-4 rounded-full bg-panel-raised transition-transform ${enabled ? 'translate-x-5' : ''}`} />
        </button>
    </div>
)

export default ToggleItem
