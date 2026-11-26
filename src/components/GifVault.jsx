import React, { useState } from 'react';
import { X } from 'lucide-react';

const MEME_VAULT = [
  { title: 'Brahmi Shock', url: 'https://media.tenor.com/images/2b7e199d9b6264627ef1a24d52e69fa8/tenor.gif' },
  { title: 'Brahmi Laugh', url: 'https://media.tenor.com/images/b2e2d86a6358dbb228b3a72df8924b1d/tenor.gif' },
  { title: 'Ali Confusion', url: 'https://media.tenor.com/images/15858cf09f1bf3cf869399eb2a0be766/tenor.gif' },
  { title: 'Sunil Dance', url: 'https://media.tenor.com/images/a6c6e75bbd3e6ba1812970a256a42232/tenor.gif' },
  { title: 'Fire Flame', url: 'https://media.tenor.com/images/7378734267272782e351897d26bbce93/tenor.gif' },
  { title: 'Clapping Clap', url: 'https://media.tenor.com/images/b18c644d67362a7153b6cb651e065538/tenor.gif' },
  { title: 'Heart Love', url: 'https://media.tenor.com/images/281fbf2fc4a19b6e828a2a4b8ee76a91/tenor.gif' },
  { title: 'Facepalm', url: 'https://media.tenor.com/images/993c14a84cebe58d4a6f87498c0b1154/tenor.gif' }
];

export default function GifVault({ onSelectGif, onClose }) {
  const [query, setQuery] = useState('');

  const filtered = MEME_VAULT.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 h-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-40 flex flex-col p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold">Trending Telugu Reactions</span>
        <button onClick={onClose} className="text-rose-600 p-1 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter memes (Brahmi, Ali, Laugh, Fire)..."
        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs outline-none mb-2"
      />

      <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2">
        {(filtered.length ? filtered : MEME_VAULT).map((g) => (
          <button
            key={g.title}
            type="button"
            onClick={() => onSelectGif(g.url)}
            className="text-center cursor-pointer group"
          >
            <img
              src={g.url}
              alt={g.title}
              loading="lazy"
              className="w-full h-20 object-cover rounded-lg group-hover:ring-2 ring-rose-600 transition"
            />
            <span className="text-[10px] font-semibold text-zinc-500 block mt-1 truncate">
              {g.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}