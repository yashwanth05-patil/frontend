import React from 'react'
import Testimony from './Testimony'

function HeroSection() {
    return (
        <div className='w-full p-2'>
            <div className='w-full py-6 flex flex-col text-center md:flex-row md:justify-center md:items-end md:gap-3'>
                <h1 className='font-display text-display-sm md:text-display-lg text-mist'>One instrument.</h1>
                <h2 className='font-display text-display-sm md:text-display-lg text-amber'>Two modes.</h2>
            </div>
            <div className='w-full text-center flex flex-col items-center mt-2 md:flex-row md:text-left md:gap-6 md:items-center'>
                <p className='text-body text-mist-soft mb-4 md:mb-0'>
                    Calm while you move through the day. Unmistakable when you need help — a personal guardian that stays quiet until it should not.
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex -space-x-3">
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-amber-soft">
                            <img src="/img1.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-teal-soft">
                            <img src="/img2.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-amber-soft">
                            <img src="/img3.png" alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full mt-6 md:flex flex-row items-center gap-4'>
                <div className='relative w-full mt-3 md:w-[49%]'>
                    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-card bg-panel/90 px-4 py-4 flex items-center justify-center gap-3 border border-slate">
                        <span className="mono-readout text-mist">LEARN MORE</span>
                    </div>
                    <img className="w-full object-contain rounded-card border border-slate" src="/img4.png" alt="" />
                </div>
                <div className='relative w-full mt-3 md:w-[49%]'>
                    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-card bg-panel/90 px-4 py-4 flex items-center justify-center gap-3 border border-slate">
                        <span className="mono-readout text-mist">LEARN MORE</span>
                    </div>
                    <img className="w-full object-contain rounded-card border border-slate" src="/img5.png" alt="" />
                </div>
            </div>
            <div className='w-full py-16 text-center flex items-center justify-center flex-col'>
                <p className="font-display text-display-sm text-mist">Quiet until it matters.</p>
                <p className='text-body text-mist-soft mt-3 max-w-xl'>
                    A commitment to being present — not a siren you learn to ignore.
                </p>
            </div>
            <div className='w-full' id='testimony'>
                <Testimony />
            </div>
        </div>
    )
}

export default HeroSection
