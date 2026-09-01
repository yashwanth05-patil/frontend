import React from 'react'
import { Home, Map, Star, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/HomePage', label: 'Home', icon: Home },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/profile', label: 'Profile', icon: User },
]

function BottomNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <nav className="pointer-events-auto w-full max-w-md rounded-pill border border-slate bg-panel/95 shadow-nav backdrop-blur-sm px-2 py-2">
        <div className="flex items-center justify-between">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-0.5 rounded-pill px-2 py-1 text-caption transition-colors duration-page ${
                  isActive ? 'text-amber bg-amber-soft' : 'text-mist-soft hover:text-mist'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default BottomNav