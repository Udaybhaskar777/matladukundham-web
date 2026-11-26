import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function RpsGame({
  strangerName,
  myChoice,
  strangerChoice,
  onSelectChoice,
  onGameEnd,
  onTimeout,
  onClose
}) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [status, setStatus] = useState('Pick your hand!');

  useEffect(() => {
    if (myChoice && strangerChoice) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [myChoice, strangerChoice, onTimeout]);

  useEffect(() => {
    if (myChoice && !strangerChoice) {
      setStatus(`Selected ${myChoice.toUpperCase()}! Waiting for ${strangerName}...`);
    } else if (myChoice && strangerChoice) {
      let outcome = "It's a Draw!";
      if (myChoice !== strangerChoice) {
        const win =
          (myChoice === 'rock' && strangerChoice === 'scissors') ||
          (myChoice === 'paper' && strangerChoice === 'rock') ||
          (myChoice === 'scissors' && strangerChoice === 'paper');
        outcome = win ? 'You Won! 🎉' : `${strangerName} Won!`;
      }
      setStatus(`Result: ${outcome}`);
      const t = setTimeout(() => {
        onGameEnd(`${outcome} (You: ${myChoice} | ${strangerName}: ${strangerChoice})`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [myChoice, strangerChoice, strangerName, onGameEnd]);

  return (
    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center max-w-xs w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h4 className="text-lg font-extrabold mb-1">Rock Paper Scissors</h4>
        <div className="inline-block text-xs font-bold bg-rose-500/15 text-rose-600 px-3 py-0.5 rounded-full mb-1">
          ⏱ {timeLeft}s
        </div>
        <p className="text-xs font-bold text-rose-600 mb-4">{status}</p>

        <div className="flex justify-center gap-3 my-4">
          {[
            { id: 'rock', icon: '🪨' },
            { id: 'paper', icon: '📄' },
            { id: 'scissors', icon: '✂️' }
          ].map((item) => (
            <button
              key={item.id}
              disabled={!!myChoice}
              onClick={() => onSelectChoice(item.id)}
              className="text-3xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 w-18 h-18 rounded-2xl hover:scale-105 hover:border-rose-600 transition cursor-pointer disabled:opacity-50"
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}