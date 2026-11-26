import React, { useState, useEffect, useRef } from 'react';
import { Zap, Gamepad2, Smile, Flame, CheckCircle2, Gift, X } from 'lucide-react';

export default function LandingPage({ onStartChat, setupRef }) {
  const [nickname, setNickname] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [countdown, setCountdown] = useState('--:--');
  const [isPartyLive, setIsPartyLive] = useState(false);

  // Troll meme modal state (loaded strictly on click so preview scrapers never see it)
  const [showTrollMeme, setShowTrollMeme] = useState(false);
  const trollTimerRef = useRef(null);

  // Legal modal state
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);

      if (now.getHours() === 21) {
        setIsPartyLive(true);
        setCountdown('LIVE NOW!');
        return;
      }
      setIsPartyLive(false);
      const diff = target - now;
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown(`${h < 10 ? '0' : ''}${h}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTag = (raw) => {
    const val = raw.trim().toLowerCase().replace(/,/g, '');
    if (val && !tags.includes(val) && tags.length < 4) {
      setTags([...tags, val]);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const triggerTrollMeme = () => {
    if (trollTimerRef.current) clearTimeout(trollTimerRef.current);
    setShowTrollMeme(true);
    trollTimerRef.current = setTimeout(() => {
      setShowTrollMeme(false);
    }, 2000);
  };

  const handleLaunch = () => {
    onStartChat(nickname.trim() || 'Cool Stranger', tags);
  };

  return (
    <div className="relative">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[650px] bg-[radial-gradient(circle_at_20%_30%,rgba(225,29,72,0.1),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(99,102,241,0.08),transparent_40%)] -z-10 pointer-events-none" />

      {/* 2-Second Troll Meme Flash Overlay */}
      {showTrollMeme && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-5 animate-fadeIn">
          <img
            src="/wedontdothathere.jpg"
            alt="We Don't Do That Here"
            className="max-w-[90vw] max-h-[65vh] rounded-2xl border-2 border-zinc-800 shadow-[0_0_40px_rgba(225,29,72,0.4)]"
          />
          <p className="mt-4 text-sm font-bold text-rose-400 tracking-wide">
            I forgot to mention that spiderman 🕷️🕸️
          </p>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 text-center max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
          Real talk.<br />Zero trace.
        </h1>
        <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-10">
          The premium anonymous chat experience for Telugu & Global users. Drop in, connect through interests, play mini-games, and leave no history behind.
        </p>

        {/* Setup Card */}
        <div
          ref={setupRef}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl max-w-md mx-auto rounded-4xl p-7 md:p-8 shadow-xl border border-zinc-200/80 dark:border-zinc-800 text-left"
        >
          <div
            className={`px-4 py-3 rounded-2xl text-xs font-bold mb-6 flex justify-between items-center ${
              isPartyLive
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
            }`}
          >
            <span>🔥 9 PM Mass Chat Party</span>
            <span className="font-mono">{countdown}</span>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold block mb-2">Display Name</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Cool Stranger"
              maxLength={15}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm outline-none focus:border-rose-600 transition"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold block mb-2">Topics or Campus Tags (Max 4)</label>
            <div className="flex flex-wrap gap-2 p-2.5 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[52px] items-center">
              {tags.map((t, idx) => (
                <span
                  key={t}
                  className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                >
                  {t}
                  <X className="w-3 h-3 cursor-pointer opacity-75 hover:opacity-100" onClick={() => removeTag(idx)} />
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length < 4 ? 'Add tag (Enter)...' : ''}
                className="border-none outline-none bg-transparent text-sm flex-1 min-w-[100px]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Telugu', 'BTech', 'Movies', 'LateNight', 'Vizag', 'Hyd'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addTag(preset)}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-500/15 hover:text-rose-600 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLaunch}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-base font-extrabold cursor-pointer mt-2 shadow-lg shadow-rose-600/25 hover:-translate-y-0.5 transition"
          >
            Connect Now
          </button>

          {/* Clickbait Troll Pill Button */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={triggerTrollMeme}
              className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md hover:-translate-y-0.5 transition cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" /> viral videos 🔞
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Capabilities */}
      <section id="bento" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Engineered for connection.</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg">
            Zero ads, zero data tracking. Real-time Tic-Tac-Toe, RPS clash, Vibe Polls, and instant WebSockets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 min-h-[240px] bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-900 dark:to-zinc-800/70 rounded-4xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
            <Gamepad2 className="w-8 h-8 text-rose-600" />
            <div>
              <h4 className="text-xl font-extrabold mb-1.5">Two-Player Challenges & Vibe Polls</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Challenge strangers to real-time Tic-Tac-Toe, 15-second Rock-Paper-Scissors, or instant Vibe Check Polls to break any silence.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 min-h-[240px] bg-rose-600 text-white rounded-4xl p-8 flex flex-col justify-between shadow-lg">
            <Zap className="w-8 h-8" />
            <div>
              <h4 className="text-xl font-extrabold mb-1.5">Sub-50ms Latency</h4>
              <p className="text-sm text-rose-100">
                Powered by Supabase WebSockets. Instant real-time message broadcasting and game state sync.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 min-h-[240px] bg-white dark:bg-zinc-900 rounded-4xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
            <Smile className="w-8 h-8 text-rose-600" />
            <div>
              <h4 className="text-xl font-extrabold mb-1.5">Telugu Meme Vault</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Direct pre-cached reaction memes (Brahmi, Ali, Sunil) and icebreaker prompt generator.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 min-h-[240px] bg-white dark:bg-zinc-900 rounded-4xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
            <Flame className="w-8 h-8 text-rose-600" />
            <div>
              <h4 className="text-xl font-extrabold mb-1.5">Strict Ephemeral Memory & Ghost Protection</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Once you disconnect, messages vanish. Inactive strangers are auto-skipped so you never stay stuck in dead rooms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section id="compare" className="py-20 px-4 bg-zinc-100/80 dark:bg-zinc-900/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">The Matladukundham Standard</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10">Built to provide authentic, fun, and family-friendly interactions.</p>

          <div className="space-y-4">
            {[
              '100% Free Forever',
              'Zero Registration Required',
              'Interactive Mini-Games & Vibe Polls',
              'Smart Profanity Shield & Auto Ghost-Skip'
            ].map((item) => (
              <div
                key={item}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-7 py-4 rounded-full flex items-center justify-between font-bold text-sm md:text-base"
              >
                <span>{item}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="my-16 mx-4 max-w-6xl lg:mx-auto bg-zinc-950 text-zinc-50 dark:bg-zinc-900 rounded-4xl py-16 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Ready to drop in?</h2>
        <p className="text-zinc-400 mb-7">Join active users right now. No strings attached.</p>
        <button
          onClick={() => setupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-full font-extrabold cursor-pointer transition"
        >
          Launch Chat Session
        </button>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 max-w-6xl mx-auto border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <div className="text-xl font-black flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-rose-600 fill-rose-600" /> Matladukundham
            </div>
            <p className="text-xs text-zinc-500">The premium anonymous networking layer for the modern web.</p>
          </div>

          <div className="flex gap-12">
            <div>
              <h5 className="text-xs font-extrabold uppercase text-zinc-400 mb-3 tracking-wider">Platform</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#bento" className="hover:text-rose-600">Capabilities</a></li>
                <li><a href="#compare" className="hover:text-rose-600">Standards</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-extrabold uppercase text-zinc-400 mb-3 tracking-wider">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setActiveLegalModal('privacy')} className="hover:text-rose-600 cursor-pointer">Privacy Protocol</button></li>
                <li><button onClick={() => setActiveLegalModal('terms')} className="hover:text-rose-600 cursor-pointer">Terms of Use</button></li>
                <li><button onClick={() => setActiveLegalModal('safety')} className="hover:text-rose-600 cursor-pointer">Safety Guidelines</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-500 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div>&copy; 2026 Matladukundham. Grievance / Support: <span className="font-semibold">support@ukwebs.in</span></div>
          <div>Architected by <strong className="text-zinc-900 dark:text-zinc-100">ukwebs</strong></div>
        </div>
      </footer>

      {/* Legal Modal */}
      {activeLegalModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setActiveLegalModal(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold capitalize">{activeLegalModal} Protocol</h3>
              <button onClick={() => setActiveLegalModal(null)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {activeLegalModal === 'privacy' && 'We honor absolute privacy. Messages vanish once the WebSocket connection drops.'}
              {activeLegalModal === 'terms' && 'You must be at least 18 years old. Abusive conduct, hate speech, or harassment results in an immediate 24-hour IP ban.'}
              {activeLegalModal === 'safety' && '1. Be respectful to fellow humans. 2. No spam or links. 3. Report bad actors immediately to keep rooms clean.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}