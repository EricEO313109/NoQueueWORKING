import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { DOC_TYPES } from './docTypes';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.heic';

export default function UploadModal({ user, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState('select'); // select | processing | review | saving
  const [docType, setDocType] = useState('other');
  const [title, setTitle] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }

  async function handleProcess() {
    if (!file) return;
    setStep('processing');
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const isImage = file.type.startsWith('image/');
      let ocrData = {};
      if (isImage) {
        try {
          ocrData = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a document OCR system. Extract all visible information from this government document image. Return structured JSON only. If a field is not visible, return null for that field.`,
            file_urls: [file_url],
            response_json_schema: {
              type: 'object',
              properties: {
                full_name: { type: 'string' },
                document_number: { type: 'string' },
                issue_date: { type: 'string' },
                expiry_date: { type: 'string' },
                address: { type: 'string' },
                cnp_or_personal_id: { type: 'string' },
                institution: { type: 'string' },
                detected_document_type: { type: 'string' },
                confidence: { type: 'string' },
              },
            },
          });
        } catch (_) { /* OCR optional */ }
      }
      setExtracted({ file_url, ...ocrData });
      if (ocrData.detected_document_type) {
        const matched = Object.keys(DOC_TYPES).find(k =>
          ocrData.detected_document_type?.toLowerCase().includes(k.replace(/_/g, ' '))
        );
        if (matched) setDocType(matched);
      }
      setStep('review');
    } catch (e) {
      setError('Upload failed. Please try again.');
      setStep('select');
    }
  }

  async function handleSave() {
    setStep('saving');
    await base44.entities.GovDocument.create({
      user_id: user?.email || 'anonymous',
      document_type: docType,
      document_title: title,
      file_url: extracted?.file_url,
      file_type: file?.type,
      ocr_full_name: extracted?.full_name || null,
      ocr_document_number: extracted?.document_number || null,
      ocr_cnp: extracted?.cnp_or_personal_id || null,
      ocr_address: extracted?.address || null,
      ocr_institution: extracted?.institution || null,
      institution: extracted?.institution || null,
      issue_date: extracted?.issue_date || null,
      expiry_date: extracted?.expiry_date || null,
      ocr_confidence: extracted?.confidence || null,
      status: 'active',
      tags: [],
    });
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'hsl(222 40% 8%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Upload Document</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {step === 'select' && (
            <>
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-all p-8 text-center cursor-pointer ${
                  dragging ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={e => handleFile(e.target.files[0])} capture="environment" />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <p className="text-sm text-slate-400">Drag & drop or tap to upload</p>
                    <p className="text-[10px] text-slate-600">PDF, JPG, PNG, HEIC · Camera supported on mobile</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <Button onClick={handleProcess} disabled={!file} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                <Sparkles className="w-4 h-4" /> Scan & Extract with AI
              </Button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Uploading & scanning document…</p>
              <p className="text-xs text-slate-500">AI is extracting document fields</p>
            </div>
          )}

          {step === 'review' && extracted && (
            <>
              <div className="rounded-xl bg-success/10 border border-success/20 px-3 py-2 flex items-center gap-2 text-xs text-success">
                <Check className="w-4 h-4 shrink-0" /> Document uploaded successfully. Review and save below.
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Document Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10 text-white rounded-xl" />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Document Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setDocType(k)}
                      className={`text-left px-3 py-2 rounded-xl text-xs transition-all ${
                        docType === k ? 'text-white border' : 'bg-white/5 text-slate-400 border border-transparent hover:border-white/10'
                      }`}
                      style={docType === k ? { background: `${v.color}20`, borderColor: `${v.color}40`, color: v.color } : {}}
                    >
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {(extracted.full_name || extracted.document_number || extracted.expiry_date || extracted.institution) && (
                <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-2">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-3">AI Extracted Fields</p>
                  {[
                    ['Full Name', extracted.full_name],
                    ['Doc Number', extracted.document_number],
                    ['Issued', extracted.issue_date],
                    ['Expires', extracted.expiry_date],
                    ['Institution', extracted.institution],
                    ['Address', extracted.address],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex items-start gap-3 text-xs">
                      <span className="text-slate-600 w-20 shrink-0">{label}</span>
                      <span className="text-slate-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                <Check className="w-4 h-4" /> Save to Vault
              </Button>
            </>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm text-slate-300">Saving to your vault…</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}