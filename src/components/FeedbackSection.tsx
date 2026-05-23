import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, Trash2, User, MessageSquare } from 'lucide-react';
import { feedbackService } from '../services/feedbackService';
import { Feedback } from '../types';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { adminService } from '../services/adminService';

interface FeedbackSectionProps {
  productId: string;
}

export default function FeedbackSection({ productId }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { authorized } = await adminService.checkAdminStatus(user.email || '');
        setIsAdmin(authorized);
      } else {
        setIsAdmin(false);
      }
    });

    // Subscribe to feedback updates
    const unsubscribeFeedback = feedbackService.subscribeToFeedback(
      productId,
      (data) => setFeedbacks(data)
    );

    return () => {
      unsubscribeAuth();
      unsubscribeFeedback();
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !comment) return;

    setIsSubmitting(true);
    try {
      await feedbackService.addFeedback({
        productId,
        userName,
        comment,
        rating,
      });
      setComment('');
      setUserName('');
      setRating(5);
    } catch (error) {
      console.error('Error adding feedback:', error);
      alert('Failed to add feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (window.confirm('Are you sure you want to remove this feedback?')) {
      try {
        await feedbackService.deleteFeedback(feedbackId);
      } catch (error) {
        console.error('Error deleting feedback:', error);
      }
    }
  };

  return (
    <div className="mt-12 space-y-8 border-t border-theme-border pt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-primary flex items-center gap-2">
          <MessageSquare size={14} />
          Guest Experiences
        </h3>
        <div className="px-3 py-1 bg-theme-primary/10 rounded-full">
          <span className="text-[10px] font-bold text-theme-primary uppercase tracking-widest">
            {feedbacks.length} Thoughts
          </span>
        </div>
      </div>

      {/* Add Feedback Form */}
      <form onSubmit={handleSubmit} className="bg-theme-surface/50 p-6 rounded-2xl border border-theme-border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text-primary placeholder:text-theme-text-muted/65 outline-none focus:border-theme-accent transition-all font-sans font-medium"
              required
            />
          </div>
          <div className="flex items-center gap-2 bg-theme-bg border border-theme-border rounded-xl px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted mr-2">Rating</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform active:scale-95 cursor-pointer"
              >
                <Star
                  size={16}
                  fill={star <= rating ? "#C5A059" : "none"}
                  className={star <= rating ? "text-gold" : "text-gold/30"}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <textarea
            placeholder="Share your experience with this piece..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text-primary placeholder:text-theme-text-muted/65 outline-none focus:border-theme-accent transition-all font-sans min-h-[80px] resize-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-theme-primary text-theme-primary-text py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-theme-primary/5 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={14} />
              Share Thought
            </>
          )}
        </button>
      </form>

      {/* Feedback List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {feedbacks.map((fb) => (
            <motion.div
              key={fb.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-theme-surface p-5 rounded-2xl border border-theme-border hover:shadow-glow transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-primary border border-theme-border">
                    <User size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-theme-text-primary uppercase tracking-wider">{fb.userName}</h4>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          fill={i < fb.rating ? "#C5A059" : "none"}
                          className={i < fb.rating ? "text-gold" : "text-gold/20"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(fb.id)}
                    className="p-2 text-theme-text-muted hover:text-rose hover:bg-rose/5 rounded-lg transition-all cursor-pointer"
                    title="Remove Feedback (Admin)"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-theme-text-secondary font-sans leading-relaxed pl-11">
                {fb.comment}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {feedbacks.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-theme-border rounded-2xl">
            <p className="text-theme-text-muted font-serif italic text-sm">
              Be the first to share your experience with this masterpiece.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
