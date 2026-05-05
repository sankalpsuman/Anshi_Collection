import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Share2, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  if (!product) return null;

  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber = "7979005226";
    const message = encodeURIComponent(`Hi, I want to order ${product.name} for ₹${product.price}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-cream overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-white/80 rounded-full text-charcoal hover:bg-white"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-1/2 overflow-hidden h-72 sm:h-96 md:h-auto">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Content Section */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col bg-cream">
            <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-none pr-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                {product.category || 'Luxury Collection'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif text-ink leading-tight">
                {product.name}
              </h2>
              <p className="mt-4 sm:mt-6 text-xl sm:text-2xl font-bold text-maroon">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
              
              <div className="mt-8 sm:mt-10 border-t luxury-border pt-6 sm:pt-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-3 sm:mb-4">Description</h3>
                <p className="text-ink/80 leading-relaxed font-sans text-sm sm:text-base">
                  {product.description || "Indulge in the timeless elegance of Anshi Collections. A masterpiece crafted for your special moments."}
                </p>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 space-y-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="wa-button flex-1 !py-4 sm:!py-5 !text-xs sm:!text-sm"
                >
                  <MessageCircle size={20} />
                  <span>Order on WhatsApp</span>
                </button>
                <button
                  onClick={handleShare}
                  className="px-6 border border-gold/30 text-gold hover:bg-gold/5 transition-all flex items-center justify-center rounded-sm"
                  title="Share product"
                >
                  {copied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} />}
                </button>
              </div>
              
              <p className="text-center text-[10px] text-ink/30 uppercase tracking-[0.2em]">
                Direct Artisan Consultation Available
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
