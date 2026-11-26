import React, { useState, useEffect, useRef } from 'react';
import { Ban } from 'lucide-react';
import { supabase, getClientIpAndCheckBan } from './lib/supabase';
import { playChime, triggerHaptic } from './lib/audioHaptics';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ChatRoom from './components/ChatRoom';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  const [myUserId] = useState(() => 'usr_' + Math.random().toString(36).substring(2, 11));
  const [onlineCount, setOnlineCount] = useState(1);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('mk_sound') !== 'false');
  const [vibrateEnabled, setVibrateEnabled] = useState(() => localStorage.getItem('mk_vibrate') !== 'false');

  const [view, setView] = useState('landing'); // landing | chat | banned
  const [banDetails, setBanDetails] = useState({ ip: '', until: '' });
  const [sessionConfig, setSessionConfig] = useState({ nickname: 'Cool Stranger', tags: [] });

  const setupRef = useRef(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Verify IP ban status & track live presence
  useEffect(() => {
    if (isAdminRoute) return;

    (async () => {
      const check = await getClientIpAndCheckBan();
      if (check.isBanned) {
        setBanDetails({ ip: check.ip, until: check.bannedUntil });
        setView('banned');
      }
    })();

    const presenceChannel = supabase.channel('online-presence', {
      config: { presence: { key: myUserId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [isAdminRoute, myUserId]);

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  if (view === 'banned') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white text-center p-6">
        <Ban className="w-14 h-14 text-rose-600 mb-5" />
        <h2 className="text-2xl font-black tracking-tight">Network Access Suspended</h2>
        <p className="text-zinc-400 mt-2 max-w-md text-sm">
          Your network IP (<code>{banDetails.ip}</code>) has been temporarily restricted for 24 hours due to reported misconduct.
        </p>
        <div className="mt-5 px-4 py-2 rounded-full bg-rose-600/15 border border-rose-600 text-xs text-rose-400 font-bold">
          Suspension lifts at: {banDetails.until ? new Date(banDetails.until).toLocaleString() : 'in 24 hours'}
        </div>
      </div>
    );
  }

  const handleUpdateSettings = (key, val) => {
    if (key === 'sound') {
      setSoundEnabled(val);
      localStorage.setItem('mk_sound', String(val));
      if (val) playChime('message', true, false);
    } else if (key === 'vibrate') {
      setVibrateEnabled(val);
      localStorage.setItem('mk_vibrate', String(val));
      if (val) triggerHaptic(true);
    }
  };

  return (
    <div className="min-h-[100dvh]">
      {view === 'landing' ? (
        <>
          <Navbar
            onlineCount={onlineCount}
            darkMode={darkMode}
            toggleTheme={() => setDarkMode(!darkMode)}
            soundEnabled={soundEnabled}
            vibrateEnabled={vibrateEnabled}
            onUpdateSettings={handleUpdateSettings}
            onResetHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onScrollToSetup={() => setupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />
          <LandingPage
            setupRef={setupRef}
            onStartChat={(nickname, tags) => {
              setSessionConfig({ nickname, tags });
              setView('chat');
            }}
          />
        </>
      ) : (
        <ChatRoom
          myUserId={myUserId}
          myNickname={sessionConfig.nickname}
          tags={sessionConfig.tags}
          soundEnabled={soundEnabled}
          vibrateEnabled={vibrateEnabled}
          onLeaveHome={() => setView('landing')}
          onBanned={(ip, until) => {
            setBanDetails({ ip, until });
            setView('banned');
          }}
        />
      )}
    </div>
  );
}