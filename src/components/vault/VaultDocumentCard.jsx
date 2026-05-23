/**
 * VaultDocumentCard — Redesigned document card with Apple Wallet aesthetic
 * Includes smart actions, expiration intelligence, and contextual AI guidance
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Trash2, Download, ChevronDown, ChevronUp, Building2, Zap, X } from 'lucide-react';
import ExpirationBadge, { getExpiryInfo } from './ExpirationBadge';
import DocumentActionPanel from './DocumentActionPanel';
import { DOC_TYPES } from './docTypes';

export default function VaultDocumentCard({ doc, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const meta = DOC_TYPES[doc.document_type] || DOC_TYPES.other;
  const expiryInfo = getExpiryInfo(doc.expiry_date);

  // Card accent color based on expiry urgency
  const accentColor = expiryInfo?.status === 'expired' ? '#ef4444'
    : expiryInfo?.status === 'expiring_soon' ? '#facc15'
    : expiryInfo?.status === 'soon' ? '#fb923c'
    : meta.color;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl overflow-hidden transition-all relative"
      style={{
        background: `linear-gradient(135deg, hsl(222 40% 10%) 0%, hsl(222 40% 8%) 100%)`,
        border: `1px solid ${accentColor}25`,
        boxShadow: `0 0 20px ${accentColor}08`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
          >
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: meta.color }}>
              {meta.label}
            </div>
            <h3 className="text-sm font-bold text-white leading-snug truncate">
              {doc.document_title || meta.label}
            </h3>
            {doc.institution && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                <Building2 className="w-2.5 h-2.5" />
                {doc.institution}
              </div>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {doc.expiry_date && <ExpirationBadge expiryDate={doc.expiry_date} compact />}
          {doc.ocr_document_number && (
            <span className="text-[9px] text-slate-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">
              #{doc.ocr_document_number}
            </span>
          )}
          {doc.ocr_full_name && (
            <span className="text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full truncate max-w-[120px]">
              {doc.ocr_full_name}
            </span>
          )}
        </div>

        {/* Smart Actions button */}
        <button
          onClick={e => { e.stopPropagation(); setShowActions(x => !x); }}
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all w-full justify-center"
          style={{
            background: showActions ? `${meta.color}20` : `${meta.color}0A`,
            color: meta.color,
            border: `1px solid ${meta.color}${showActions ? '40' : '20'}`,
          }}
        >
          <Zap className="w-3 h-3" />
          {showActions ? 'Hide Actions' : 'Smart Actions'}
        </button>

        {/* Smart Actions Panel */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-white/5"
            >
              <DocumentActionPanel doc={doc} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-2"
            >
              {[
                ['Name', doc.ocr_full_name],
                ['Document #', doc.ocr_document_number],
                ['CNP', doc.ocr_cnp],
                ['Issued', doc.issue_date],
                ['Expires', doc.expiry_date],
                ['Address', doc.ocr_address],
                ['Notes', doc.notes],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 text-xs">
                  <span className="text-slate-600 w-20 shrink-0">{label}</span>
                  <span className="text-slate-300 break-all">{value}</span>
                </div>
              ))}

              <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                {doc.file_url && (
                  <>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </a>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </>
                )}
                <button
                  onClick={() => onDelete(doc.id)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}