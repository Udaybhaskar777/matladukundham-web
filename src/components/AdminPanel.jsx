import React, { useState, useEffect } from 'react';
import { Zap, MessageSquare, AlertTriangle, RotateCw, Trash2, Eye, Ban, Check, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPanel() {
  const [tab, setTab] = useState('logs');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [bans, setBans] = useState([]);

  const loadRooms = async () => {
    const { data } = await supabase.from('chat_logs').select('room_id').order('created_at', { ascending: false });
    if (data) {
      const unique = [...new Set(data.map((r) => r.room_id))];
      setRooms(unique);
      if (!activeRoom && unique.length > 0) selectRoom(unique[0]);
    }
  };

  const selectRoom = async (roomId) => {
    setActiveRoom(roomId);
    const { data } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setLogs(data || []);
  };

  const loadReports = async () => {
    const { data } = await supabase.from('user_reports').select('*').order('created_at', { ascending: false });
    setReports(data || []);
  };

  const loadBans = async () => {
    const { data } = await supabase
      .from('banned_ips')
      .select('*')
      .gt('banned_until', new Date().toISOString())
      .order('created_at', { ascending: false });
    setBans(data || []);
  };

  const refreshAll = () => {
    loadRooms();
    loadReports();
    loadBans();
  };

  useEffect(() => {
    refreshAll();
    const sub = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_logs' }, (payload) => {
        if (payload.new.room_id === activeRoom) {
          setLogs((prev) => [...prev, payload.new]);
        } else {
          loadRooms();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_reports' }, loadReports)
      .subscribe();

    return () => supabase.removeChannel(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom]);

  const banIp = async (ip, name) => {
    if (!ip || ip === '0.0.0.0') return alert('Cannot ban empty IP.');
    if (!window.confirm(`Ban network ${ip} for 24 hours?`)) return;

    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('banned_ips').upsert({
      ip_address: ip,
      banned_until: expiry,
      reason: `Banned for misconduct (${name})`
    });
    if (error) alert('Ban failed: ' + error.message);
    else {
      alert(`Network ${ip} restricted for 24 hours!`);
      loadBans();
    }
  };

  const unbanIp = async (ip) => {
    await supabase.from('banned_ips').delete().eq('ip_address', ip);
    loadBans();
  };

  const cleanOldLogs = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('chat_logs').delete().lt('created_at', cutoff);
    await supabase.from('user_reports').delete().lt('created_at', cutoff);
    alert('Logs older than 24h cleaned!');
    refreshAll();
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-50 flex flex-col overflow-hidden font-mono">
      <header className="h-15 border-b border-zinc-800 flex items-center justify-between px-5 bg-zinc-900 shrink-0">
        <div className="font-black text-sm text-rose-500 flex items-center gap-2">
          <Zap className="w-4 h-4 fill-rose-500" /> Matladukundham Vault
        </div>

        <div className="flex gap-1.5 bg-black p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              tab === 'logs' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat Logs
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              tab === 'reports' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Reports & Bans ({reports.length})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={cleanOldLogs}
            className="bg-black border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 cursor-pointer"
          >
            Clean &gt;24h
          </button>
          <button
            onClick={refreshAll}
            className="bg-black border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-800 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Sync
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Wipe all logs?')) {
                await supabase.from('chat_logs').delete().neq('id', 0);
                setLogs([]);
                setRooms([]);
              }
            }}
            className="bg-black border border-zinc-800 text-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-800 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Wipe
          </button>
        </div>
      </header>

      {tab === 'logs' ? (
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-72 border-r border-zinc-800 bg-zinc-900 overflow-y-auto shrink-0">
            <div className="p-3.5 text-[11px] font-extrabold text-zinc-400 border-b border-zinc-800 tracking-wider">
              CONVERSATION ROOMS
            </div>
            {rooms.length === 0 ? (
              <p className="p-4 text-xs text-zinc-500">No chat logs yet.</p>
            ) : (
              rooms.map((r) => (
                <div
                  key={r}
                  onClick={() => selectRoom(r)}
                  className={`p-3.5 border-b border-zinc-800/60 cursor-pointer text-xs ${
                    activeRoom === r ? 'bg-rose-500/15 border-l-4 border-l-rose-500' : 'hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold break-all">{r}</div>
                </div>
              ))
            )}
          </aside>

          <main className="flex-1 flex flex-col bg-black min-w-0">
            <div className="p-3.5 border-b border-zinc-800 text-xs font-bold flex justify-between bg-zinc-900/40">
              <span>{activeRoom || 'Select a Room'}</span>
              <span className="text-zinc-400">{logs.length} Messages</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {logs.map((m) => (
                <div key={m.id} className="flex gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="text-zinc-500 shrink-0">{new Date(m.created_at).toLocaleTimeString()}</span>
                  <span className="text-rose-500 font-bold shrink-0">[{m.sender_name}]:</span>
                  <span className="break-words">{m.message_text}</span>
                </div>
              ))}
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-black">
          <h3 className="text-sm font-extrabold mb-3">Reported Users Queue ({reports.length})</h3>
          <table className="w-full text-left text-xs border-collapse mb-8">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <th className="p-3">Time</th>
                <th className="p-3">User</th>
                <th className="p-3">IP</th>
                <th className="p-3">Snippet</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800">
                  <td className="p-3 text-zinc-400">{new Date(r.created_at).toLocaleTimeString()}</td>
                  <td className="p-3 font-bold">{r.reported_name}</td>
                  <td className="p-3"><code>{r.reported_ip}</code></td>
                  <td className="p-3 text-rose-300 max-w-xs break-words">{r.last_snippet}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => {
                        setTab('logs');
                        selectRoom(r.room_id);
                      }}
                      className="bg-zinc-800 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button
                      onClick={() => banIp(r.reported_ip, r.reported_name)}
                      className="bg-red-500/20 text-red-400 border border-red-500 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3 h-3" /> Ban 24h
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-extrabold">Active 24-Hr IP Bans ({bans.length})</h3>
            <button
              onClick={async () => {
                if (window.confirm('Unban all IPs?')) {
                  await supabase.from('banned_ips').delete().neq('id', 0);
                  loadBans();
                }
              }}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Unlock className="w-3 h-3" /> Reset All Bans
            </button>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <th className="p-3">IP Address</th>
                <th className="p-3">Banned Until</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((b) => (
                <tr key={b.ip_address} className="border-b border-zinc-800">
                  <td className="p-3"><code>{b.ip_address}</code></td>
                  <td className="p-3 text-rose-400 font-bold">{new Date(b.banned_until).toLocaleString()}</td>
                  <td className="p-3">{b.reason}</td>
                  <td className="p-3">
                    <button
                      onClick={() => unbanIp(b.ip_address)}
                      className="bg-emerald-500/20 text-emerald-400 border border-emerald-500 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}