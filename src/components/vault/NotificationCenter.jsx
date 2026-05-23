/**
 * NotificationCenter — Smart expiration & renewal notifications
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, AlertTriangle, Clock, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { getExpiryInfo } from './ExpirationBadge';
import { DOC_TYPES } from './docTypes';
import { Link } from 'react-router-dom';

function buildNotifications(docs) {
  const notes = [];
  const now = new Date();

  docs.forEach(doc => {
    if (!doc.expiry_date) return;
    const info = getExpiryInfo(doc.expiry_date);
    if (!info) return;
    const meta = DOC_TYPES[doc.document_type] || DOC_TYPES.other;
    const title = doc.document_title || meta.label;

    if (info.status === 'expired') {
      notes.push({
        id: `expired-${doc.id}`,
        type: 'expired',
        icon: '🔴',
        color: '#ef4444',
        title: `${meta.emoji} ${title} has expired`,
        body: `Expired ${Math.abs(info.days)} days ago. Renew immediately.`,
        docId: doc.id,
        docType: doc.document_type,
        urgency: 0,
      });
    } else if (info.status === 'expiring_soon') {
      notes.push({
        id: `expiring-${doc.id}`,
        type: 'expiring_soon',
        icon: '🟡',
        color: '#facc15',
        title: `${meta.emoji} ${title} expires soon`,
        body: `Only ${info.days} days remaining. Start renewal process.`,
        docId: doc.id,
        docType: doc.document_type,
        urgency: 1,
      });
    } else if (info.status === 'soon') {
      notes.push({
        id: `soon-${doc.id}`,
        type: 'soon',
        icon: '🟠',
        color: '#fb923c',
        title: `${meta.emoji} ${title} expires in ${info.days} days`,
        body: 'Plan your renewal in advance to avoid queues.',
        docId: doc.id,
        docType: doc.document_type,
        urgency: 2,
      });
    }
  });

  return notes.sort((a, b) => a.urgency - b.urgency);
}

export default function NotificationCenter({ docs }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [open, setOpen] = useState(false);

  const notifications = buildNotifications(docs).filter(n => !dismissed.has(n.id));

  if (notifications.length === 0) return null;

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 glass-card rounded-xl hover:bg-white/5 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center relative">
          <Bell className="w-3.5 h-3.5 text-warning" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[8px] text-white flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        </div>
        <span className="text-xs font-semibold text-white flex-1 text-left">
          {notifications.length} alert{notifications.length > 1 ? 's' : ''} require attention
        </span>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2">
              {notifications.map(note => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: `${note.color}08`, border: `1px solid ${note.color}20` }}
                >
                  <span className="text-base shrink-0 mt-0.5">{note.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{note.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{note.body}</div>
                    <Link
                      to={`/start?procedure=${note.docType}&from_vault=1`}
                      className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                      style={{ color: note.color, background: `${note.color}15` }}
                    >
                      Start renewal <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                  <button
                    onClick={() => setDismissed(s => new Set([...s, note.id]))}
                    className="text-slate-600 hover:text-slate-400 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}