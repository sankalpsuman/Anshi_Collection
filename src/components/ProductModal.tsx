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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-cream overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row max-h-[95vh] rounded-3xl"
        >
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-20 p-3 bg-white/20 hover:bg-rose hover:text-white backdrop-blur-xl rounded-full text-white transition-all shadow-2xl"
          >
            <X size={24} />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-3/5 overflow-hidden h-80 sm:h-[450px] md:h-auto relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/20 to-transparent pointer-events-none" />
          </div>

          {/* Content Section */}
          <div className="w-full md:w-2/5 p-8 sm:p-10 md:p-16 flex flex-col bg-white overflow-y-auto">
            <div className="space-y-8">
              <div>
                <span className="inline-block bg-saffron/10 text-saffron text-[10px] font-display font-bold uppercase tracking-[0.3em] px-4 py-1 rounded-full mb-6">
                  {product.category || 'Luxury Collection'}
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-ink leading-[0.9] font-bold">
                  {product.name}
                </h2>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-widest text-ink/30 font-bold">Offer Price</span>
                  <p className="text-3xl font-display font-black text-maroon">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 border-t luxury-border pt-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo rounded-full"></span>
                  Craftsmanship Detail
                </h3>
                <p className="text-ink/60 leading-relaxed font-sans text-base">
                  {product.description || "Every thread tells a story of heritage and passion. This masterpiece from Anshi Collection combines traditional weaving techniques with contemporary silhouettes."}
                </p>
              </div>

              <div className="space-y-6 bg-cream/50 p-6 rounded-2xl border border-gold/10">
                 <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-ink/40">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   Artisan Available for Consultation
                 </div>
              </div>
            </div>

            <div className="mt-auto pt-10 space-y-4">
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWhatsAppOrder}
                  className="wa-button flex-1 !bg-indigo !py-6 !rounded-xl shadow-indigo/20 shadow-2xl"
                >
                  <MessageCircle size={22} className="animate-pulse" />
                  <span className="font-black">Inquire on WhatsApp</span>
                </motion.button>
                <motion.button
                  whileHover={{ rotate: 10 }}
                  onClick={handleShare}
                  className="p-6 bg-white border-2 border-indigo/10 text-indigo hover:border-maroon hover:text-maroon transition-all flex items-center justify-center rounded-xl shadow-lg"
                  title="Share product"
                >
                  {copied ? <Check size={24} className="text-rose" /> : <Share2 size={24} />}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
