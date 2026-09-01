import React from 'react';

function Loader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-ink/60">
            <div className="w-16 h-16 border-2 border-slate border-t-amber animate-spin rounded-full" />
        </div>
    );
}

export default Loader;