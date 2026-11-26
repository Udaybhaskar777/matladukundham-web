import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Settings, Image, Hash, Hand, Dices, ArrowUp,
  AlertTriangle, Sparkles, Check
} from 'lucide-react';
import { supabase, getClientIpAndCheckBan, cleanMessageText } from '../lib/supabase';
import { playChime } from '../lib/audioHaptics';
import GifVault from './GifVault';
import TicTacToe from './TicTacToe';
import RpsGame from './RpsGame';

const ICEBREAKERS = [
  "What is the most memorable movie you watched in theaters?",
  "What's your biggest guilty pleasure song?",
  "Tell me about your favorite street food spot in your city!",
  "If you could travel anywhere right now for free, where would you go?",
  "What was your funniest or most awkward college memory?",
  "Tea or Coffee? And why is your choice superior?"
];

const VIBE_POLLS = [
  { q: "Biryani with Thums Up vs Biryani with Sprite?", a: "Thums Up 🥤", b: "Sprite 🍋" },
  { q: "Late Night Bike Ride vs Cozy Bed & Movie?", a: "Bike Ride 🏍️", b: "Bed & Movie 🎬" },
  { q: "Vizag Beach Road vs Hyderabad Tank Bund?", a: "Vizag 🌊", b: "Hyderabad 🏙️" },
  { q: "First Day First Show vs OTT Relaxed?", a: "FDFS Mass 🔥", b: "OTT Chill 🍿" },
  { q: "Tea at Tapri vs Cafe Cold Coffee?", a: "Tapri Chai ☕", b: "Cold Coffee 🧋" }
];

export default function ChatRoom({
  myUserId,
  myNickname,
  tags,
  soundEnabled,
  vibrateEnabled,
  onLeaveHome,
  onBanned
}) {
  const [status, setStatus] = useState('looking'); // looking | connected | disconnected
  const [strangerName, setStrangerName] = useState('Stranger');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Interactive panels
  const [showGifVault, setShowGifVault] = useState(false);
  const [activeGame, setActiveGame] = useState(null); // 'ttt' | 'rps' | null

  // Tic-Tac-Toe state
  const [mySymbol, setMySymbol] = useState('X');
  const [tttBoard, setTttBoard] = useState(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState('X');

  // RPS state
  const [myRps, setMyRps] = useState(null);
  const [strangerRps, setStrangerRps] = useState(null);

  // Vibe Poll state
  const [activePoll, setActivePoll] = useState(null);
  const [myPollPick, setMyPollPick] = useState(null);
  const [strangerPollPick, setStrangerPollPick] = useState(null);

  // Ghost Auto-Skip countdown
  const [ghostSeconds, setGhostSeconds] = useState(null);

  // Refs for stable closures
  const channelRef = useRef(null);
  const queueChannelRef = useRef(null);
  const roomIdRef = useRef(null);
  const myIpRef = useRef('0.0.0.0');
  const strangerIpRef = useRef('0.0.0.0');
  const strangerNameRef = useRef('Stranger');
  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const ghostTimerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activePoll]);

  // Reset Ghost Timer whenever stranger interacts
  const resetGhostTimer = () => {
    if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    setGhostSeconds(null);
    let idle = 0;
    ghostTimerRef.current = setInterval(() => {
      idle++;
      if (idle >= 35 && idle < 40) {
        setGhostSeconds(40 - idle);
      } else if (idle >= 40) {
        clearInterval(ghostTimerRef.current);
        setGhostSeconds(null);
        addSystemMsg('👻 Stranger was inactive for 40s. Auto-skipping to next active user...');
        setTimeout(() => handleNextStranger(), 800);
      }
    }, 1000);
  };

  const stopGhostTimer = () => {
    if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    setGhostSeconds(null);
  };

  const addSystemMsg = (htmlText) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), type: 'system', text: htmlText }]);
  };

  const cleanupChannels = async () => {
    stopGhostTimer();
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'disconnect', payload: {} });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current);
      queueChannelRef.current = null;
    }
    await supabase.from('stranger_queue').delete().eq('id', myUserId);
  };

  const startMatchmaking = async () => {
    const banCheck = await getClientIpAndCheckBan();
    myIpRef.current = banCheck.ip;
    if (banCheck.isBanned) {
      onBanned(banCheck.ip, banCheck.bannedUntil);
      return;
    }

    setStatus('looking');
    setStrangerName('Stranger');
    strangerNameRef.current = 'Stranger';
    strangerIpRef.current = '0.0.0.0';
    setMessages([{ id: 'init', type: 'system', text: 'Looking for a partner...' }]);
    setActiveGame(null);
    setShowGifVault(false);
    setActivePoll(null);

    const myInterest = tags.join(',');

    const { data: waitingUsers } = await supabase
      .from('stranger_queue')
      .select('*')
      .eq('status', 'waiting')
      .neq('id', myUserId)
      .order('created_at', { ascending: true })
      .limit(10);

    let matchedPartner = null;
    let sharedTag = null;

    if (waitingUsers && waitingUsers.length > 0) {
      if (tags.length > 0) {
        for (const u of waitingUsers) {
          const partnerTags = (u.interest || '').split(',');
          const common = tags.filter((t) => partnerTags.includes(t));
          if (common.length > 0) {
            matchedPartner = u;
            sharedTag = common.join(', ');
            break;
          }
        }
      }
      if (!matchedPartner) matchedPartner = waitingUsers[0];
    }

    if (matchedPartner) {
      setMySymbol('O');
      const newRoomId = `room_${matchedPartner.id}_${myUserId}`;
      roomIdRef.current = newRoomId;

      await supabase
        .from('stranger_queue')
        .update({ status: 'matched', room_id: newRoomId })
        .eq('id', matchedPartner.id);

      connectToRoom(newRoomId, sharedTag);
    } else {
      setMySymbol('X');
      await supabase
        .from('stranger_queue')
        .upsert({ id: myUserId, interest: myInterest, status: 'waiting', room_id: null });

      const qChan = supabase
        .channel(`queue-listener-${myUserId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'stranger_queue', filter: `id=eq.${myUserId}` },
          (payload) => {
            if (payload.new?.status === 'matched') {
              roomIdRef.current = payload.new.room_id;
              supabase.removeChannel(qChan);
              queueChannelRef.current = null;
              connectToRoom(payload.new.room_id, null);
            }
          }
        )
        .subscribe();

      queueChannelRef.current = qChan;
    }
  };

  const connectToRoom = (roomId, sharedTag) => {
    setStatus('connected');
    playChime('connect', soundEnabled, vibrateEnabled);
    resetGhostTimer();

    let initialMsg = 'Connected to a stranger! Say Hi.';
    if (sharedTag) {
      initialMsg += ` • Matched topic: #${sharedTag}`;
    }
    setMessages([{ id: 'conn', type: 'system', text: initialMsg }]);

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase.channel(roomId, { config: { broadcast: { self: false } } });

    ch.on('broadcast', { event: 'handshake' }, ({ payload }) => {
      if (payload?.nickname) {
        setStrangerName(payload.nickname);
        strangerNameRef.current = payload.nickname;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === 'conn'
              ? { ...m, text: `Connected to ${payload.nickname}!${sharedTag ? ` • Topic: #${sharedTag}` : ''}` }
              : m
          )
        );
      }
      if (payload?.ip) strangerIpRef.current = payload.ip;
    })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setIsTyping(false);
        resetGhostTimer();
        playChime('message', soundEnabled, vibrateEnabled);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: payload.isGif ? 'gif' : 'text',
            sender: 'stranger',
            senderName: payload.senderName || strangerNameRef.current,
            text: cleanMessageText(payload.text)
          }
        ]);
      })
      .on('broadcast', { event: 'typing' }, () => {
        setIsTyping(true);
        resetGhostTimer();
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 1500);
      })
      .on('broadcast', { event: 'vibe-poll' }, ({ payload }) => {
        resetGhostTimer();
        playChime('message', soundEnabled, vibrateEnabled);
        setActivePoll(payload.poll);
        setMyPollPick(null);
        setStrangerPollPick(null);
      })
      .on('broadcast', { event: 'vibe-vote' }, ({ payload }) => {
        resetGhostTimer();
        setStrangerPollPick(payload.choice);
      })
      .on('broadcast', { event: 'game-invite' }, ({ payload }) => {
        resetGhostTimer();
        playChime('message', soundEnabled, vibrateEnabled);
        setMessages((prev) => [
          ...prev,
          {
            id: `invite-${payload.type}-${Date.now()}`,
            type: 'invite',
            gameType: payload.type,
            senderName: strangerNameRef.current
          }
        ]);
      })
      .on('broadcast', { event: 'game-start' }, ({ payload }) => {
        if (payload.type === 'ttt') {
          setTttBoard(Array(9).fill(null));
          setTttTurn('X');
          setActiveGame('ttt');
        } else if (payload.type === 'rps') {
          setMyRps(null);
          setStrangerRps(null);
          setActiveGame('rps');
        }
      })
      .on('broadcast', { event: 'game-move' }, ({ payload }) => {
        resetGhostTimer();
        setTttBoard((prev) => {
          const copy = [...prev];
          copy[payload.index] = payload.symbol;
          return copy;
        });
        setTttTurn(payload.symbol === 'X' ? 'O' : 'X');
      })
      .on('broadcast', { event: 'game-timeout' }, ({ payload }) => {
        setTttTurn(payload.nextTurn);
      })
      .on('broadcast', { event: 'rps-move' }, ({ payload }) => {
        resetGhostTimer();
        setStrangerRps(payload.choice);
      })
      .on('broadcast', { event: 'game-exit' }, () => {
        setActiveGame(null);
        addSystemMsg(`🎮 Game closed by ${strangerNameRef.current}. Back in chat!`);
      })
      .on('broadcast', { event: 'disconnect' }, () => {
        stopGhostTimer();
        playChime('disconnect', soundEnabled, vibrateEnabled);
        setIsTyping(false);
        setActiveGame(null);
        setStatus('disconnected');
        addSystemMsg(`${strangerNameRef.current} has disconnected.`);
      })
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          ch.send({
            type: 'broadcast',
            event: 'handshake',
            payload: { nickname: myNickname, ip: myIpRef.current }
          });
        }
      });

    channelRef.current = ch;
  };

  useEffect(() => {
    startMatchmaking();
    return () => {
      cleanupChannels();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Escape shortcut to skip
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleNextStranger();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Evaluate Vibe Poll Match
  useEffect(() => {
    if (activePoll && myPollPick && strangerPollPick) {
      const matched = myPollPick === strangerPollPick;
      const chosenText = myPollPick === 'a' ? activePoll.a : activePoll.b;
      addSystemMsg(
        matched
          ? `🔥 100% Vibe Match! Both picked "${chosenText}"`
          : `⚡ Vibe Check: You picked "${myPollPick === 'a' ? activePoll.a : activePoll.b}" | ${strangerNameRef.current} picked "${strangerPollPick === 'a' ? activePoll.a : activePoll.b}"`
      );
      const t = setTimeout(() => {
        setActivePoll(null);
        setMyPollPick(null);
        setStrangerPollPick(null);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [activePoll, myPollPick, strangerPollPick]);

  const handleSendMessage = async (overrideText) => {
    const raw = typeof overrideText === 'string' ? overrideText : inputText;
    const clean = cleanMessageText(raw.trim());
    if (!clean || !channelRef.current || status !== 'connected') return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type: 'text', sender: 'me', senderName: myNickname, text: clean }
    ]);
    if (typeof overrideText !== 'string') setInputText('');

    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: { text: clean, sender: myUserId, senderName: myNickname }
    });

    try {
      await supabase.from('chat_logs').insert([
        {
          room_id: roomIdRef.current || 'unassigned_room',
          sender_id: myUserId,
          sender_name: myNickname,
          message_text: clean,
          is_gif: false
        }
      ]);
    } catch (e) {}
  };

  const handleSelectGif = async (url) => {
    if (!channelRef.current || status !== 'connected') return;
    setShowGifVault(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type: 'gif', sender: 'me', senderName: myNickname, text: url }
    ]);

    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: { text: url, isGif: true, sender: myUserId, senderName: myNickname }
    });

    try {
      await supabase.from('chat_logs').insert([
        {
          room_id: roomIdRef.current || 'unassigned_room',
          sender_id: myUserId,
          sender_name: myNickname,
          message_text: url,
          is_gif: true
        }
      ]);
    } catch (e) {}
  };

  const triggerVibePoll = () => {
    if (!channelRef.current || status !== 'connected') return;
    const poll = VIBE_POLLS[Math.floor(Math.random() * VIBE_POLLS.length)];
    setActivePoll(poll);
    setMyPollPick(null);
    setStrangerPollPick(null);
    channelRef.current.send({ type: 'broadcast', event: 'vibe-poll', payload: { poll } });
  };

  const voteVibePoll = (choice) => {
    if (myPollPick || !channelRef.current) return;
    setMyPollPick(choice);
    channelRef.current.send({ type: 'broadcast', event: 'vibe-vote', payload: { choice } });
  };

  const inviteGame = (type) => {
    if (!channelRef.current || status !== 'connected') return;
    const label = type === 'ttt' ? 'Tic-Tac-Toe' : 'Rock-Paper-Scissors';
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: 'text', sender: 'me', senderName: myNickname, text: `Sent ${label} challenge!` }
    ]);
    channelRef.current.send({ type: 'broadcast', event: 'game-invite', payload: { type } });
  };

  const acceptInvite = (msgId, type) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (type === 'ttt') {
      setTttBoard(Array(9).fill(null));
      setTttTurn('X');
      setActiveGame('ttt');
    } else {
      setMyRps(null);
      setStrangerRps(null);
      setActiveGame('rps');
    }
    channelRef.current?.send({ type: 'broadcast', event: 'game-start', payload: { type } });
  };

  const handleNextStranger = async () => {
    playChime('disconnect', soundEnabled, vibrateEnabled);
    await cleanupChannels();
    await startMatchmaking();
  };

  const handleReport = async () => {
    if (!roomIdRef.current) return;
    const snippet =
      messages
        .filter((m) => m.type === 'text')
        .slice(-4)
        .map((m) => `${m.senderName}: ${m.text}`)
        .join(' ➔ ') || 'Direct skip report';

    try {
      await supabase.from('user_reports').insert([
        {
          room_id: roomIdRef.current,
          reported_user_id: 'peer_user',
          reported_name: strangerNameRef.current,
          reported_ip: strangerIpRef.current,
          reporter_id: myUserId,
          last_snippet: snippet
        }
      ]);
      alert('Stranger reported to administration. Skipping...');
    } catch (e) {}

    await handleNextStranger();
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-3xl mx-auto bg-white dark:bg-zinc-900 border-x border-zinc-200 dark:border-zinc-800 relative">
      {/* Chat Header */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <button
          onClick={async () => {
            await cleanupChannels();
            onLeaveHome();
          }}
          className="text-base font-black text-rose-600 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-rose-600" /> Matladukundham
        </button>

        <div className="flex items-center gap-3">
          {ghostSeconds !== null && (
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse">
              👻 Auto-skip in {ghostSeconds}s
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : status === 'looking'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className={status === 'connected' ? 'text-emerald-500' : 'text-zinc-400'}>
              {status === 'connected' ? `With ${strangerName}` : status === 'looking' ? 'Searching...' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Vibe Check Poll Banner */}
      {activePoll && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0" /> {activePoll.q}
          </div>
          <div className="flex gap-2">
            {['a', 'b'].map((opt) => (
              <button
                key={opt}
                disabled={!!myPollPick}
                onClick={() => voteVibePoll(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                  myPollPick === opt
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-rose-500'
                }`}
              >
                {myPollPick === opt && <Check className="w-3 h-3" />}
                {opt === 'a' ? activePoll.a : activePoll.b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          if (m.type === 'system') {
            return (
              <div
                key={m.id}
                className="mx-auto w-fit max-w-md text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-1.5 rounded-full"
              >
                {m.text}
              </div>
            );
          }

          if (m.type === 'invite') {
            return (
              <div
                key={m.id}
                className="mx-auto w-fit text-center text-xs font-semibold bg-rose-500/10 border border-dashed border-rose-500 px-4 py-2.5 rounded-2xl"
              >
                <p className="mb-1.5">
                  <strong>{m.senderName}</strong> challenged you to{' '}
                  <strong>{m.gameType === 'ttt' ? 'Tic-Tac-Toe' : 'Rock-Paper-Scissors'}</strong>!
                </p>
                <button
                  onClick={() => acceptInvite(m.id, m.gameType)}
                  className="bg-rose-600 text-white px-3 py-1 rounded-lg font-bold cursor-pointer"
                >
                  Accept & Play
                </button>
              </div>
            );
          }

          const isMe = m.sender === 'me';
          return (
            <div key={m.id} className={`flex flex-col max-w-[78%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <span className="text-[11px] font-bold text-zinc-400 mb-0.5 px-1">{m.senderName}</span>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
                  isMe
                    ? 'bg-rose-600 text-white rounded-br-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs'
                }`}
              >
                {m.type === 'gif' ? (
                  <img src={m.text} alt="Reaction" className="max-w-[210px] rounded-xl" />
                ) : (
                  m.text
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-5 py-1 text-xs font-semibold text-zinc-400">{strangerName} is typing...</div>
      )}

      {/* GIF Vault Popover */}
      {showGifVault && <GifVault onSelectGif={handleSelectGif} onClose={() => setShowGifVault(false)} />}

      {/* Tic-Tac-Toe Modal */}
      {activeGame === 'ttt' && (
        <TicTacToe
          mySymbol={mySymbol}
          strangerName={strangerName}
          board={tttBoard}
          turn={tttTurn}
          onMakeMove={(idx) => {
            const next = [...tttBoard];
            next[idx] = mySymbol;
            setTttBoard(next);
            setTttTurn(mySymbol === 'X' ? 'O' : 'X');
            channelRef.current?.send({
              type: 'broadcast',
              event: 'game-move',
              payload: { index: idx, symbol: mySymbol }
            });
          }}
          onTimeoutSwitch={(nextTurn) => {
            setTttTurn(nextTurn);
            channelRef.current?.send({ type: 'broadcast', event: 'game-timeout', payload: { nextTurn } });
          }}
          onGameEnd={(summary) => {
            setActiveGame(null);
            addSystemMsg(`🎮 Tic-Tac-Toe Finished: ${summary}`);
          }}
          onClose={() => {
            setActiveGame(null);
            channelRef.current?.send({ type: 'broadcast', event: 'game-exit', payload: {} });
            addSystemMsg('🎮 You closed the game. Back in chat!');
          }}
        />
      )}

      {/* RPS Modal */}
      {activeGame === 'rps' && (
        <RpsGame
          strangerName={strangerName}
          myChoice={myRps}
          strangerChoice={strangerRps}
          onSelectChoice={(choice) => {
            setMyRps(choice);
            channelRef.current?.send({ type: 'broadcast', event: 'rps-move', payload: { choice } });
          }}
          onGameEnd={(summary) => {
            setActiveGame(null);
            addSystemMsg(`✊ RPS Match: ${summary}`);
          }}
          onTimeout={() => {
            setActiveGame(null);
            addSystemMsg('⏱ RPS timed out due to inactivity!');
          }}
          onClose={() => {
            setActiveGame(null);
            channelRef.current?.send({ type: 'broadcast', event: 'game-exit', payload: {} });
            addSystemMsg('🎮 You closed the game. Back in chat!');
          }}
        />
      )}

      {/* Bottom Interactive Deck */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5 shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setShowGifVault(!showGifVault)}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Image className="w-3.5 h-3.5" /> GIF
          </button>
          <button
            onClick={triggerVibePoll}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Vibe Poll
          </button>
          <button
            onClick={() => inviteGame('ttt')}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" /> Tic-Tac-Toe
          </button>
          <button
            onClick={() => inviteGame('rps')}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Hand className="w-3.5 h-3.5" /> RPS
          </button>
          <button
            onClick={() => {
              const q = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
              handleSendMessage(`🎲 ${q}`);
            }}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5" /> Prompt
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            disabled={status !== 'connected'}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: myUserId } });
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={status === 'connected' ? 'Type a message...' : 'Waiting for connection...'}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:border-rose-600 disabled:opacity-50"
          />
          <button
            disabled={status !== 'connected'}
            onClick={() => handleSendMessage()}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNextStranger}
            className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Next Stranger <span className="opacity-60">(Esc)</span>
          </button>
          <button
            onClick={handleReport}
            title="Report User"
            className="px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}