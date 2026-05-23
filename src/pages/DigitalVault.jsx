/**
 * DigitalVault — Redesigned AI-powered Civic Operating System
 * Apple Wallet + Revolut + Government Portal + AI Assistant
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Zap, Clock, Grid3X3, List, ArrowLeft } from 'lucide-react';

import Navbar from '@/components/noqueue/Navbar';
import VaultDashboardStats from '@/components/vault/VaultDashboardStats';
import VaultSearch from '@/components/vault/VaultSearch';
import VaultAIAssistant from '@/components/vault/VaultAIAssistant';
import RenewalAlert from '@/components/vault/RenewalAlert';
import NotificationCenter from '@/components/vault/NotificationCenter';
import WorkflowLauncher from '@/components/vault/WorkflowLauncher';
import VaultDocumentCard from '@/components/vault/VaultDocumentCard';
import CivicTimeline from '@/components/vault/CivicTimeline';
import UploadModal from '@/components/vault/UploadModal';
import { getExpiryInfo } from '@/components/vault/ExpirationBadge';
import { DOC_TYPES } from '@/components/vault/docTypes';

const FILTERS = [
  { key: 'all',        label: 'All Docs' },
  { key: 'expiring',   label: '⚠️ Expiring' },
  { key: 'expired',    label: '🔴 Expired' },
  { key: 'id_card',    label: '🪪 ID' },
  { key: 'passport',   label: '🛂 Passport' },
  { key: 'driver_license', label: '🚗 License' },
  { key: 'health_insurance', label: '🏥 Health' },
  { key: 'tax_form',   label: '💰 Tax' },
  { key: 'vehicle_registration', label: '🚙 Vehicle' },
  { key: 'criminal_record', label: '⚖️ Cazier' },
  { key: 'other',      label: '📁 Other' },
];

const TABS = [
  { key: 'vault',    label: 'My Documents',    icon: Grid3X3 },
  { key: 'timeline', label: 'Civic Timeline',  icon: Clock },
];

export default function DigitalVault() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('vault');
  const [showUpload, setShowUpload] = useState(false);
  const [highlightDoc, setHighlightDoc] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['gov-documents', user?.email],
    queryFn: () => base44.entities.GovDocument.filter({ user_id: user.email }, '-created_date'),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GovDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gov-documents'] }),
  });

  const enriched = docs.map(doc => ({
    ...doc,
    _expiryInfo: getExpiryInfo(doc.expiry_date),
  }));

  const stats = {
    total: docs.length,
    valid: enriched.filter(d => !d._expiryInfo || d._expiryInfo.status === 'valid').length,
    expiring: enriched.filter(d => d._expiryInfo?.status === 'expiring_soon' || d._expiryInfo?.status === 'soon').length,
    expired: enriched.filter(d => d._expiryInfo?.status === 'expired').length,
  };

  const filtered = enriched.filter(doc => {
    if (highlightDoc) return doc.id === highlightDoc;
    const matchFilter =
      filter === 'all' ||
      (filter === 'expiring' && (doc._expiryInfo?.status === 'expiring_soon' || doc._expiryInfo?.status === 'soon')) ||
      (filter === 'expired' && doc._expiryInfo?.status === 'expired') ||
      doc.document_type === filter;
    return matchFilter;
  });

  function handleSearchSelect(doc) {
    setHighlightDoc(doc.id);
    setTab('vault');
    setTimeout(() => {
      document.getElementById(`doc-${doc.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Stats header */}
          <VaultDashboardStats stats={stats} onUpload={() => setShowUpload(true)} />

          {/* Notifications */}
          <NotificationCenter docs={docs} />

          {/* Renewal Alerts */}
          <RenewalAlert docs={docs} />

          {/* AI Assistant */}
          <VaultAIAssistant docs={docs} />

          {/* Quick Workflows */}
          <WorkflowLauncher />

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 glass-card rounded-2xl mb-5">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setHighlightDoc(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-primary text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'vault' && (
            <>
              {/* Search */}
              <VaultSearch docs={docs} onSelect={handleSearchSelect} />

              {/* Clear highlight */}
              {highlightDoc && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setHighlightDoc(null)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Show all documents
                  </button>
                </div>
              )}

              {/* Filter chips (hidden when searching) */}
              {!highlightDoc && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-3 py-1.5 text-[10px] font-medium rounded-full border transition-all ${
                        filter === f.key
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white/5 text-slate-500 border-white/8 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Document Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="text-5xl mb-4">🗂️</div>
                  <p className="text-base font-semibold text-white mb-2">
                    {docs.length === 0 ? 'Your vault is empty' : 'No documents match'}
                  </p>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs">
                    {docs.length === 0
                      ? 'Upload your first government document. AI will extract all fields and unlock smart actions.'
                      : 'Try a different filter.'}
                  </p>
                  {docs.length === 0 && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 transition-all"
                    >
                      Upload First Document
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {filtered.map(doc => (
                      <div key={doc.id} id={`doc-${doc.id}`}>
                        <VaultDocumentCard
                          doc={doc}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {tab === 'timeline' && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-white">Civic Timeline</h2>
                <span className="text-[10px] text-slate-500">Your government document history</span>
              </div>
              <CivicTimeline docs={docs} />
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            user={user}
            onClose={() => setShowUpload(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['gov-documents'] });
              setShowUpload(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}