import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function TicTacToe({
  mySymbol,
  strangerName,
  board,
  turn,
  onMakeMove,
  onTimeoutSwitch,
  onGameEnd,
  onClose
}) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [winLine, setWinLine] = useState([]);
  const [statusText, setStatusText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setTimeLeft(15);
  }, [turn]);

  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (turn === mySymbol) {
            onTimeoutSwitch(mySymbol === 'X' ? 'O' : 'X');
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [turn, isDone, mySymbol, onTimeoutSwitch]);

  useEffect(() => {
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinLine([a, b, c]);
        setIsDone(true);
        const iWon = board[a] === mySymbol;
        const msg = iWon ? '🎉 You Won!' : `${strangerName} Won!`;
        setStatusText(msg);
        setTimeout(() => onGameEnd(iWon ? 'You won! 🎉' : `${strangerName} won!`), 1500);
        return;
      }
    }

    if (!board.includes(null)) {
      setIsDone(true);
      setStatusText('🤝 Game Draw!');
      setTimeout(() => onGameEnd('It was a draw!'), 1500);
      return;
    }

    setStatusText(turn === mySymbol ? `Your Turn (${mySymbol})` : `${strangerName}'s Turn (${turn})`);
  }, [board, turn, mySymbol, strangerName, onGameEnd]);

  const handleCellClick = (idx) => {
    if (isDone || board[idx] || turn !== mySymbol) return;
    onMakeMove(idx);
  };

  return (
    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center max-w-xs w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h4 className="text-lg font-extrabold mb-1">Tic-Tac-Toe</h4>
        <div className="inline-block text-xs font-bold bg-rose-500/15 text-rose-600 px-3 py-0.5 rounded-full mb-1">
          {isDone ? 'Done' : `⏱ ${timeLeft}s`}
        </div>
        <p className="text-xs font-bold text-rose-600 mb-3">{statusText}</p>

        <div className="grid grid-cols-3 gap-2 w-56 mx-auto">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`h-16 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-2xl font-black flex items-center justify-center cursor-pointer transition ${
                winLine.includes(idx)
                  ? 'bg-rose-500/20 border-rose-500'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/10'
              }`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}