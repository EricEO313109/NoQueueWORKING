/**
 * CivicTimeline — Visual history of all civic documents and activity
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Upload, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import { DOC_TYPES } from './docTypes';
import { format } from 'date-fns';

function TimelineItem({ doc, index }) {
  const meta = DOC_TYPES[doc.document_type] || DOC_TYPES.other;
  const date = doc.created_date ? new Date(doc.created_date) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          {meta.emoji}
        </div>
        {index < 10 && <div className="w-px flex-1 bg-white/5 my-1" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-white">{doc.document_title || meta.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Upload className="w-2.5 h-2.5" />
              Added to vault
              {doc.institution && <span className="ml-1 text-slate-600">· {doc.institution}</span>}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 shrink-0">
            {date ? format(date, 'MMM d, yyyy') : ''}
          </div>
        </div>
        {doc.expiry_date && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600">
            <Clock className="w-2.5 h-2.5" />
            Expires: {doc.expiry_date}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CivicTimeline({ docs }) {
  if (!docs || docs.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Your civic timeline is empty</p>
        <p className="text-[10px] text-slate-600 mt-1">Upload documents to build your history</p>
      </div>
    );
  }

  const sorted = [...docs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-0 max-h-80 overflow-y-auto pr-1">
      {sorted.map((doc, i) => <TimelineItem key={doc.id} doc={doc} index={i} />)}
    </div>
  );
}