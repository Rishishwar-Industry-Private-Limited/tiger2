import React, { useEffect, useState } from 'react'
import { fetchWithAuth } from '../services/auth'

export default function Users(){
  const [users, setUsers] = useState<any[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [bot, setBot] = useState('')
  const [chat, setChat] = useState('')

  useEffect(()=>{ fetchUsers() }, [])
  async function fetchUsers(){ try{ const res = await fetchWithAuth('/users'); setUsers(await res.json()) }catch(e){ console.warn(e) } }

  async function save(){ try{ const res = await fetchWithAuth('/users',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ deviceId, telegramBotToken: bot||null, telegramChatId: chat||null }) }); if (res.ok){ alert('Saved'); fetchUsers() } else alert('Save failed') }catch(e){ alert('Save failed') } }

  return (
    <div>
      <h2 className="text-xl text-primary font-bold mb-4">Users & Devices</h2>
      <div className="bg-surface-dark rounded-xl border border-border-dark p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={deviceId} onChange={e=>setDeviceId(e.target.value)} placeholder="Device ID" className="bg-background-dark border border-border-dark rounded px-3 py-2" />
          <input value={bot} onChange={e=>setBot(e.target.value)} placeholder="Telegram Bot Token" className="bg-background-dark border border-border-dark rounded px-3 py-2" />
          <input value={chat} onChange={e=>setChat(e.target.value)} placeholder="Telegram Chat ID" className="bg-background-dark border border-border-dark rounded px-3 py-2" />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={save} className="btn-primary bg-primary text-background-dark px-4 py-2 rounded font-bold">Save</button>
          <button onClick={()=>{ setDeviceId(''); setBot(''); setChat('') }} className="btn-primary bg-border-dark text-white px-4 py-2 rounded font-bold">Clear</button>
        </div>
      </div>

      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="p-4">
          <h4 className="text-sm text-white/80 mb-3">Existing Users</h4>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u._id} className="p-3 border border-border-dark rounded flex items-center justify-between">
                <div>
                  <div className="font-bold">{u.deviceId}</div>
                  <div className="text-xs text-white/40">{u.telegramChatId ? 'TG: '+u.telegramChatId : 'No TG'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-primary" onClick={()=>{ setDeviceId(u.deviceId); setBot(u.telegramBotToken||''); setChat(u.telegramChatId||'')}}>Edit</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-white/40">No users</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
