import React, { useState } from 'react'
import { ChevronRight, Save, Loader } from "lucide-react"

const MenuItem = ({
    icon: Icon,
    label,
    onUpdate,
    initialValue = "",
    isLoading = false,
    error = "",
    validation = () => ""
}) => {
    const [value, setValue] = useState(initialValue)
    const [isEditing, setIsEditing] = useState(false)
    const [validationError, setValidationError] = useState("")

    const handleSubmit = () => {
        const validationResult = validation(value);
        if (validationResult) {
            setValidationError(validationResult);
            return;
        }

        setValidationError("");
        onUpdate(value);
        setIsEditing(false);
    }

    return (
        <div className="w-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-slate-line last:border-none">
                <Icon className="w-5 h-5 text-ink-soft" />
                <span className="flex-1 text-left text-body text-ink">{label}</span>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <input
                                className={`field-input py-1 text-caption ${
                                    (error || validationError) ? 'border-dusk' : ''
                                }`}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    setValidationError("");
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                autoFocus
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="btn-secondary !min-h-8 !px-3 !py-1 text-caption"
                            >
                                {isLoading ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={`text-caption ${error ? 'text-dusk' : 'text-ink-soft'}`}
                                onClick={() => !isLoading && setIsEditing(true)}
                            >
                                {value || "Tap to edit"}
                            </button>
                            <ChevronRight className="w-5 h-5 text-ink-soft" />
                        </>
                    )}
                </div>
            </div>
            {(error || validationError) && (
                <div className="px-4 py-1 text-caption text-dusk">
                    {error || validationError}
                </div>
            )}
        </div>
    )
}

export default MenuItem
