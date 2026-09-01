import React from 'react'
import Testimony from './Testimony'

function HeroSection() {
    return (
        <div className='w-full p-2'>
            <div className='w-full py-6 flex flex-col text-center md:flex-row md:justify-center md:items-end md:gap-3'>
                <h1 className='font-display text-display-sm md:text-display-lg text-ink'>One instrument.</h1>
                <h2 className='font-display text-display-sm md:text-display-lg text-dusk'>Two modes.</h2>
            </div>
            <div className='w-full text-center flex flex-col items-center mt-2 md:flex-row md:text-left md:gap-6 md:items-center'>
                <p className='text-body text-ink-soft mb-4 md:mb-0'>
                    Calm while you move through the day. Unmistakable when you need help — a personal guardian that stays quiet until it should not.
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex -space-x-3">
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-dusk-soft">
                            <img src="/img1.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-sage-soft">
                            <img src="/img2.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-11 h-11 rounded-full border-2 border-paper overflow-hidden bg-dusk-soft">
                            <img src="/img3.png" alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full mt-6'>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="card-surface p-4 text-center">
                        <p className="text-heading text-ink">SOS Alert</p>
                        <p className="text-caption text-ink-soft mt-1">One tap sends your location to your Trusted Circle</p>
                    </div>
                    <div className="card-surface p-4 text-center">
                        <p className="text-heading text-ink">Evidence Recording</p>
                        <p className="text-caption text-ink-soft mt-1">Audio and video captured automatically during an alert</p>
                    </div>
                    <div className="card-surface p-4 text-center">
                        <p className="text-heading text-ink">Voice Activation</p>
                        <p className="text-caption text-ink-soft mt-1">Hands-free trigger with a spoken wake phrase</p>
                    </div>
                    <div className="card-surface p-4 text-center">
                        <p className="text-heading text-ink">Live Location</p>
                        <p className="text-caption text-ink-soft mt-1">Share your position in real time, for as long as you choose</p>
                    </div>
                </div>
            </div>
            <div className='w-full py-16 text-center flex items-center justify-center flex-col'>
                <p className="font-display text-display-sm text-ink">Quiet until it matters.</p>
                <p className='text-body text-ink-soft mt-3 max-w-xl'>
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
