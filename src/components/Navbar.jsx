import React, { useState } from 'react';
import { Zap, Settings, Moon, Sun, X } from 'lucide-react';

export default function Navbar({
  onlineCount,
  darkMode,
  toggleTheme,
  soundEnabled,
  vibrateEnabled,
  onUpdateSettings,
  onResetHome,
  onScrollToSetup
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav className="h-18 bg-transparent flex items-center justify-between px-4 md:px-8 absolute top-0 w-full z-50">
        <button
          onClick={onResetHome}
          className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 cursor-pointer text-zinc-950 dark:text-zinc-50"
        >
          <Zap className="w-6 h-6 text-rose-600 fill-rose-600" />
          <span>Matladukundham</span>
        </button>

        <div className="hidden md:flex gap-8 items-center bg-white dark:bg-zinc-900 px-6 py-2.5 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800">
          <a href="#bento" className="text-zinc-500 dark:text-zinc-400 hover:text-rose-600 text-xs font-semibold transition">
            Capabilities
          </a>
          <a href="#compare" className="text-zinc-500 dark:text-zinc-400 hover:text-rose-600 text-xs font-semibold transition">
            Why Us
          </a>
          <button
            onClick={onScrollToSetup}
            className="text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer"
          >
            Join Chat &rarr;
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>{onlineCount} active</span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            title="Sensory Settings"
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            title="Toggle Theme"
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Sensory Preferences Modal */}
      {showSettings && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-extrabold">Sensory Preferences</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Tailor audio and tactile feedback for quiet night-time conversations.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <h5 className="text-sm font-bold">Sound Chimes</h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Subtle audio alerts on match & messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => onUpdateSettings('sound', e.target.checked)}
                  className="w-5 h-5 accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <h5 className="text-sm font-bold">Haptic Vibration</h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Tactile pulse on mobile devices</p>
                </div>
                <input
                  type="checkbox"
                  checked={vibrateEnabled}
                  onChange={(e) => onUpdateSettings('vibrate', e.target.checked)}
                  className="w-5 h-5 accent-rose-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}