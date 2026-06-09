'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  X,
  Download,
  Twitter,
  Linkedin,
  Link2,
  Check,
  ExternalLink,
  Shield,
} from 'lucide-react';
import type { Proof } from '@/lib/types';
import { getProofTypeColor } from '@/lib/utils';

interface ShareableProofCardProps {
  proof: Proof;
  username?: string;
  userFullName?: string;
}

function ProofCardImage({ proof, username, userFullName }: ShareableProofCardProps) {
  const verified = proof.verificationStatus === 'verified';

  return (
    <div
      ref={undefined}
      className="relative w-[600px] overflow-hidden rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #0BAB77 0%, #0A9A6A 40%, #067A52 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

      <div className="relative p-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <span className="text-xl font-bold text-white">O</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">ORIN</p>
              <p className="text-xs text-white/50">Career Proof</p>
            </div>
          </div>
          {verified && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-bold text-white">Verified</span>
            </div>
          )}
        </div>

        {/* Proof content */}
        <div className="mt-10">
          <h2
            className="text-3xl font-bold leading-tight text-white"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {proof.title}
          </h2>
          {proof.description && (
            <p className="mt-3 text-base text-white/70 line-clamp-3 leading-relaxed">
              {proof.description}
            </p>
          )}
        </div>

        {/* Skills */}
        {proof.skillsExtracted.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {proof.skillsExtracted.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
              >
                {skill}
              </span>
            ))}
            {proof.skillsExtracted.length > 6 && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                +{proof.skillsExtracted.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between border-t border-white/20 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <span className="text-sm font-bold text-white">
                {userFullName ? userFullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{userFullName || 'Orin User'}</p>
              <p className="text-xs text-white/60">@{username || 'username'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <span className="text-xs">{proof.sourceType}</span>
            <span className="text-xs">·</span>
            <span className="text-xs">
              {proof.viewCount.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShareableProofCard({ proof, username, userFullName }: ShareableProofCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${username}/proof/${proof.id}`
    : '';

  const shareText = `Check out my verified career proof: "${proof.title}" on ORIN`;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Use html2canvas-like approach — capture the card element
      const cardEl = document.getElementById('shareable-proof-card');
      if (!cardEl) return;

      // Dynamic import of html-to-image
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardEl, {
        width: 600,
        height: 400,
        pixelRatio: 2,
        backgroundColor: '#0BAB77',
      });

      const link = document.createElement('a');
      link.download = `orin-proof-${proof.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to download card:', e);
    } finally {
      setDownloading(false);
    }
  }, [proof.title]);

  const handleShareTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }, [shareText, shareUrl]);

  const handleShareLinkedIn = useCallback(() => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }, [shareUrl]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {/* Share modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[680px] overflow-hidden rounded-3xl shadow-2xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-black/10"
                style={{ backgroundColor: 'var(--color-surface-dim)' }}
              >
                <X className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </button>

              {/* Card preview */}
              <div className="flex justify-center overflow-hidden bg-gray-100 p-6" style={{ minHeight: 300 }}>
                <div id="shareable-proof-card">
                  <ProofCardImage
                    proof={proof}
                    username={username}
                    userFullName={userFullName}
                  />
                </div>
              </div>

              {/* Share actions */}
              <div className="p-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Share this proof</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Share your verified career proof on social media or copy the link.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {/* Twitter */}
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#1DA1F2' }}
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </button>

                  {/* LinkedIn */}
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#0077b5' }}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </button>

                  {/* Copy link */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{
                      border: '1px solid var(--color-border)',
                      color: copied ? 'var(--color-bloom)' : 'var(--color-ink)',
                      backgroundColor: copied ? 'var(--color-bloom)08' : 'transparent',
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
