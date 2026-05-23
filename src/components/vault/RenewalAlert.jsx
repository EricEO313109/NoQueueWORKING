/**
 * RenewalAlert — Urgency-aware renewal banner shown when docs expire soon
 */
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, Zap } from 'lucide-react';
import { getExpiryInfo } from './ExpirationBadge';
import { getRenewalUrgency } from '@/lib/data/vaultActions';
import { DOC_TYPES } from './docTypes';
import { Link } from 'react-router-dom';

function RenewalCard({ doc }) {
  const info = getExpiryInfo(doc.expiry_date);
  if (!info || info.status === 'valid') return null;
  const urgency = getRenewalUrgency(info.days);
  const meta = DOC_TYPES[doc.document_type] || DOC_TYPES.other;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: `${urgency.color}0D`, border: `1px solid ${urgency.color}30` }}
    >
      <div className="text-xl shrink-0">{meta.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white truncate">{doc.document_title || meta.label}</div>
        <div className="text-[10px] mt-0.5" style={{ color: urgency.color }}>
          {info.days < 0 ? `Expired ${Math.abs(info.days)} days ago` : `Expires in ${info.days} days`}
        </div>
      </div>
      <Link
        to={`/start?procedure=${doc.document_type}&from_vault=1`}
        className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-90"
        style={{ background: urgency.color, color: '#000' }}
      >
        Renew →
      </Link>
    </motion.div>
  );
}

export default function RenewalAlert({ docs }) {
  const urgent = docs
    .filter(d => d.expiry_date)
    .map(d => ({ ...d, _info: getExpiryInfo(d.expiry_date) }))
    .filter(d => d._info && d._info.days <= 90)
    .sort((a, b) => a._info.days - b._info.days);

  if (urgent.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 mb-6 border-warning/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Documents Needing Attention</div>
          <div className="text-[10px] text-slate-500">{urgent.length} document{urgent.length > 1 ? 's' : ''} expiring soon</div>
        </div>
      </div>
      <div className="space-y-2">
        {urgent.slice(0, 4).map(doc => <RenewalCard key={doc.id} doc={doc} />)}
      </div>
    </motion.div>
  );
}