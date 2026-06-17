import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function ComboBox({ value, onChange, options = [], placeholder, onCreateOption }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  function selectValue(val) {
    setQuery(val);
    onChange(val);
    setOpen(false);
  }

  async function handleCreate() {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (onCreateOption) await onCreateOption(trimmed);
    selectValue(trimmed);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        className="w-full rounded-lg border border-primary-100 bg-canvas/40 px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:bg-white focus:border-primary-500 transition-colors"
      />
      {open && (query || filtered.length > 0) && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-primary-100 bg-white shadow-card">
          {filtered.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => selectValue(opt)}
              className="block w-full text-right px-3 py-2 text-sm hover:bg-primary-50 text-ink"
            >
              {opt}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm hover:bg-accent-400/10 text-accent-600 font-semibold border-t border-primary-100"
            >
              <Plus size={14} />
              إضافة نوع جديد: «{query.trim()}»
            </button>
          )}
          {!query.trim() && filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">ابدأ الكتابة لإضافة نوع عملية جديد</p>
          )}
        </div>
      )}
    </div>
  );
}
