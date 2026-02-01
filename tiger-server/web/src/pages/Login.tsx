import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const { setToken } = useAuth()
  const nav = useNavigate()

  const submit = async () => {
    setMsg('')
    if (!username || !password) { setMsg('Both fields required'); return }
    try {
      const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) })
      if (!res.ok) { const j = await res.json().catch(()=>({})); setMsg(j.error || 'Login failed'); return }
      const { token } = await res.json();
      setToken(token);
      nav('/');
    } catch (e) { setMsg('Network error') }
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="glass-container rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Tiger V2 Login</h2>
        <p className="text-white/60 text-sm mb-6">Enter your credentials to access the Dual Portal</p>
        <div className="space-y-4">
          <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full p-3 rounded bg-black/40 border border-white/10" placeholder="Username" />
          <input value={password} type="password" onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded bg-black/40 border border-white/10" placeholder="Password" />
          <div className="flex gap-2">
            <button onClick={submit} className="bg-primary px-4 py-2 rounded font-bold text-black">Sign In</button>
            <button onClick={()=>{ setUsername(''); setPassword('') }} className="bg-white/5 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
        <p className="text-sm text-emergency-orange mt-4">{msg}</p>
      </div>
    </div>
  )
}
