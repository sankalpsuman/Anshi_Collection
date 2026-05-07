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
    <div className="mt-12 space-y-8 border-t luxury-border pt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo flex items-center gap-2">
          <MessageSquare size={14} />
          Guest Experiences
        </h3>
        <div className="px-3 py-1 bg-maroon/5 rounded-full">
          <span className="text-[10px] font-bold text-maroon uppercase tracking-widest">
            {feedbacks.length} Thoughts
          </span>
        </div>
      </div>

      {/* Add Feedback Form */}
      <form onSubmit={handleSubmit} className="bg-cream/30 p-6 rounded-2xl border border-gold/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/50 border border-gold/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose transition-all font-sans font-medium"
              required
            />
          </div>
          <div className="flex items-center gap-2 bg-white/50 border border-gold/10 rounded-xl px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/30 mr-2">Rating</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform active:scale-95"
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
            className="w-full bg-white/50 border border-gold/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose transition-all font-sans min-h-[80px] resize-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-maroon transition-all flex items-center justify-center gap-2 shadow-xl shadow-ink/10 disabled:opacity-50"
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
              className="group bg-white p-5 rounded-2xl border border-gold/5 hover:border-maroon/20 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-maroon border border-gold/10">
                    <User size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-ink uppercase tracking-wider">{fb.userName}</h4>
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
                    className="p-2 text-ink/20 hover:text-rose hover:bg-rose/5 rounded-lg transition-all"
                    title="Remove Feedback (Admin)"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-ink/60 font-sans leading-relaxed pl-11">
                {fb.comment}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {feedbacks.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gold/10 rounded-2xl">
            <p className="text-ink/20 font-serif italic italic text-sm">
              Be the first to share your experience with this masterpiece.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
