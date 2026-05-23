/**
 * VaultSearch — Smart global search with instant results
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText } from 'lucide-react';
import { DOC_TYPES } from './docTypes';
import ExpirationBadge from './ExpirationBadge';
import { debounce } from 'lodash';

export default function VaultSearch({ docs, onSelect }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = query.trim().length < 2 ? [] : docs.filter(doc => {
    const q = query.toLowerCase();
    return (
      doc.document_title?.toLowerCase().includes(q) ||
      doc.document_type?.toLowerCase().includes(q) ||
      doc.institution?.toLowerCase().includes(q) ||
      doc.ocr_full_name?.toLowerCase().includes(q) ||
      doc.ocr_cnp?.includes(q) ||
      doc.notes?.toLowerCase().includes(q) ||
      doc.tags?.some(t => t.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  return (
    <div className="relative mb-5">
      <div className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl border transition-all ${
        focused ? 'border-primary/40 bg-primary/5' : 'border-white/10 bg-white/5'
      }`}>
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search documents, institutions, names, CNP…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{ background: 'hsl(222 40% 9%)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {results.map((doc, i) => {
              const meta = DOC_TYPES[doc.document_type] || DOC_TYPES.other;
              return (
                <button
                  key={doc.id}
                  onClick={() => { onSelect?.(doc); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{doc.document_title || meta.label}</div>
                    <div className="text-[10px] text-slate-500">{doc.institution || meta.label}</div>
                  </div>
                  {doc.expiry_date && <ExpirationBadge expiryDate={doc.expiry_date} compact />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}