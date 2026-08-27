import React from 'react';

function Loader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-ink/30">
            <div className="w-16 h-16 border-2 border-slate border-t-dusk animate-spin rounded-full" />
        </div>
    );
}

export default Loader;
