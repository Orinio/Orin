'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Link, Smile, Globe, Users, Lock, Send } from 'lucide-react';
import { useCreatePost } from '@/lib/social-posts';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
  { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see this' },
  { value: 'private', label: 'Only me', icon: Lock, description: 'Only you can see this post' },
] as const;

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { user: authUser } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [showVisibility, setShowVisibility] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: currentDbUser } = useQuery({
    queryKey: ['current-db-user', authUser?.id],
    queryFn: async () => {
      if (!supabase || !authUser?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      return data;
    },
    enabled: !!authUser?.id,
  });

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || !currentDbUser?.id) return;

    await createPost.mutateAsync({
      userId: currentDbUser.id,
      content: content.trim(),
      postType: 'text',
      visibility,
    });

    setContent('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    setContent(e.target.value);
  };

  const selectedVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility);
  const VisIcon = selectedVisibility?.icon || Globe;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
          >
            <div className="mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                  Create a post
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* User info */}
                <div className="flex items-start gap-3 mb-4">
                  {currentDbUser?.avatar_url ? (
                    <img
                      src={currentDbUser.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
                    >
                      {(currentDbUser?.full_name || currentDbUser?.username || 'U')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                      {currentDbUser?.full_name || currentDbUser?.username || 'You'}
                    </p>
                    <button
                      onClick={() => setShowVisibility(!showVisibility)}
                      className="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors hover:bg-black/[0.04]"
                      style={{ 
                        color: 'var(--color-text-tertiary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <VisIcon className="w-3 h-3" />
                      {selectedVisibility?.label}
                    </button>
                  </div>
                </div>

                {/* Visibility dropdown */}
                <AnimatePresence>
                  {showVisibility && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="p-2 rounded-xl bg-gray-50 space-y-1">
                        {VISIBILITY_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setVisibility(option.value);
                                setShowVisibility(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                visibility === option.value ? 'bg-[var(--color-bloom)]10' : 'hover:bg-black/[0.04]'
                              }`}
                            >
                              <OptionIcon
                                className="w-4 h-4"
                                style={{
                                  color: visibility === option.value ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                                }}
                              />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                  {option.label}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                  {option.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?"
                  className="w-full min-h-[120px] max-h-[300px] resize-none bg-transparent text-base leading-relaxed focus:outline-none placeholder:text-gray-400"
                  style={{ color: 'var(--color-ink)' }}
                />

                {/* Character count */}
                {content.length > 0 && (
                  <div className="mt-2 text-right">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: content.length > 280 ? 'var(--color-pulse)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {content.length}/280
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-black/[0.06] bg-gray-50/50">
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
                    title="Add image"
                  >
                    <Image className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                  <button
                    className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
                    title="Add link"
                  >
                    <Link className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                  <button
                    className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    ⌘ + Enter to post
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || content.length > 280 || createPost.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    style={{
                      background: content.trim() && content.length <= 280
                        ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)'
                        : 'var(--color-surface-dim)',
                    }}
                  >
                    {createPost.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
