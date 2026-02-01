import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function TopNav(){
  const { token, setToken } = useAuth();
  const nav = useNavigate();
  const logout = () => { setToken(null); nav('/login'); }
  return (
    <header className="border-b border-border-dark bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl">shield_with_heart</span>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">Tiger V2 <span className="text-white font-normal not-italic opacity-80">Forensic Hub</span></h1>
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link className="hover:text-primary transition-colors flex items-center gap-2" to="/">Dashboard</Link>
            <Link className="text-primary flex items-center gap-2 border-b-2 border-primary py-5" to="/">Intelligence</Link>
            <Link className="hover:text-primary transition-colors flex items-center gap-2" to="/users">Users</Link>
            <Link className="hover:text-primary transition-colors flex items-center gap-2" to="/badge">Badge Generator</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {token ? <button onClick={logout} className="text-sm px-3 py-2 rounded border border-white/10 hover:bg-white/5">Logout</button> : <Link to="/login" className="text-sm px-3 py-2 rounded border border-white/10 hover:bg-white/5">Login</Link>}
        </div>
      </div>
    </header>
  )
}
