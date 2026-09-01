import React from 'react'
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa";

function Footer() {
  return (
    <footer className='w-full p-6 bg-panel text-mist rounded-card border border-slate mt-auto'>
      <div className='w-full'>
        <h2 className="font-display text-[1.35rem] text-mist">I'M SAFE</h2>
        <p className='text-body text-mist-soft mt-3 md:w-[60%]'>
          Empowering people with a calm instrument that stays ready — your guardian that does not sleep.
        </p>
      </div>
      <div className='w-full mt-6 flex flex-col md:flex-row md:gap-6'>
        <a className='text-caption text-mist-soft hover:text-amber min-h-touch flex items-center' href="#testimony">Testimonials</a>
        <a className='text-caption text-mist-soft hover:text-amber min-h-touch flex items-center' href="mailto:abdullahmukadam21@gmail.com">Contact</a>
      </div>
      <div className='w-full mt-4 flex items-center justify-between gap-3 md:w-[420px]'>
        <input
          type="text"
          className='flex-1 min-h-touch rounded-btn border border-slate bg-ink-raised px-3 text-caption text-mist placeholder:text-mist-soft/50 focus:outline-none focus:border-amber'
          placeholder='Subscribe to notes'
        />
        <button type="button" className='min-h-touch rounded-btn bg-amber text-ink px-4 text-caption font-medium hover:brightness-110 transition-all duration-page'>
          Subscribe
        </button>
      </div>
      <div className='w-full mt-6'>
        <p className='mono-readout text-mist-soft/60 text-center md:text-left'>CONNECT</p>
        <div className='flex items-center justify-center md:justify-start gap-4 mt-3 text-mist-soft'>
          <FaInstagram className='w-5 h-5' />
          <FaFacebook className='w-5 h-5' />
          <FaLinkedin className='w-5 h-5' />
          <FaTwitter className='w-5 h-5' />
        </div>
      </div>
      <div className='w-full mt-6 p-3 bg-ink-raised text-mist rounded-card flex items-center justify-between flex-col md:flex-row gap-2 border border-slate'>
        <div className='flex items-center gap-4 text-caption text-mist-soft'>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Disclaimer</span>
        </div>
        <p className='text-caption text-mist-soft'>Copyright © 2024 I'M SAFE. All rights reserved</p>
      </div>
    </footer>
  )
}

export default Footer