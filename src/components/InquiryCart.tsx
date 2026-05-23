import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Trash2, Plus, Minus, MessageCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types';

interface InquiryCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface InquiryItem {
  cartId: string; // Dynamic key based on id + size + color
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export default function InquiryCart({ isOpen, onClose }: InquiryCartProps) {
  const [items, setItems] = useState<InquiryItem[]>([]);

  // Synchronize cart loading from localStorage
  const loadInquiryItems = () => {
    const raw = localStorage.getItem('boutiqueInquiryCart');
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse inquiry cart:", e);
      }
    } else {
      setItems([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInquiryItems();
    }
    
    // Custom window events listener
    const handleUpdate = () => {
      loadInquiryItems();
    };

    window.addEventListener('inquiryUpdated', handleUpdate);
    return () => window.removeEventListener('inquiryUpdated', handleUpdate);
  }, [isOpen]);

  const updateQuantity = (cartId: string, delta: number) => {
    const updated = items.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, Math.min(20, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setItems(updated);
    localStorage.setItem('boutiqueInquiryCart', JSON.stringify(updated));
    window.dispatchEvent(new Event('inquiryUpdated'));
  };

  const removeItem = (cartId: string) => {
    const filtered = items.filter(item => item.cartId !== cartId);
    setItems(filtered);
    localStorage.setItem('boutiqueInquiryCart', JSON.stringify(filtered));
    window.dispatchEvent(new Event('inquiryUpdated'));
  };

  const clearInquiry = () => {
    setItems([]);
    localStorage.removeItem('boutiqueInquiryCart');
    window.dispatchEvent(new Event('inquiryUpdated'));
  };

  const totalEstimate = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Send consolidated Inquiry to WhatsApp
  const handleCheckout = () => {
    if (items.length === 0) return;

    const phoneNumber = "7979005226";
    let messageText = `Hello Anshi Collection, I'm interested in inquiring about multiple curated pieces:\n\n`;
    messageText += `----------------------------------------\n`;

    items.forEach((item, index) => {
      messageText += `${index + 1}) *Product*: ${item.product.name}\n`;
      messageText += `   *Code*: ${item.product.code || 'ANS'}\n`;
      messageText += `   *Size*: ${item.size}\n`;
      messageText += `   *Color*: ${item.color}\n`;
      messageText += `   *Quantity*: ${item.quantity}\n`;
      messageText += `   *Unit Price*: ₹${item.product.price.toLocaleString('en-IN')}\n`;
      messageText += `   *Image Code*: ${item.product.imageUrl}\n\n`;
    });

    messageText += `----------------------------------------\n\n`;
    messageText += `*Total Approximate Inquiry Estimate*: ₹${totalEstimate.toLocaleString('en-IN')}\n\n`;
    messageText += `Please let me know if these pieces can be curated and customized. Thank you!`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

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
            className="fixed inset-0 bg-ink/70 dark:bg-black/80 backdrop-blur-md z-40"
          />

          {/* Slide Over Drawer Frame */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream dark:bg-dark-surface border-l border-gold/15 dark:border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.4)] z-50 flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-6 border-b border-gold/10 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="text-maroon dark:text-gold" size={20} />
                <h3 className="font-serif font-black text-xl text-ink dark:text-dark-text uppercase tracking-wider">Inquiry List</h3>
                <span className="bg-rose text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{items.length}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-rose/10 hover:text-rose rounded-full text-ink/40 dark:text-dark-muted transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-gold/5 flex items-center justify-center text-gold/40 border border-gold/10 animate-bounce">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-lg text-ink dark:text-dark-text">Your list is empty</h4>
                    <p className="text-xs text-ink/40 dark:text-dark-muted mt-2 leading-relaxed">
                      Wander across the Anshi collection and select items to compose your curated inquiry list.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-indigo text-white dark:bg-gold dark:text-ink hover:scale-105 active:scale-95 transition-all outline-none rounded-xl text-[10px] font-black uppercase tracking-widest mt-4"
                  >
                    Start Curating
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div 
                    key={item.cartId}
                    className="relative p-4 rounded-3xl bg-white dark:bg-dark-card border border-gold/10 dark:border-white/5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="w-20 aspect-[4/5] rounded-xl overflow-hidden shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 space-y-2 text-left">
                      <div>
                        <h4 className="font-serif font-black text-xs text-ink dark:text-dark-text line-clamp-1">{item.product.name}</h4>
                        <p className="text-[10px] font-mono font-bold text-ink/30 dark:text-dark-muted mt-0.5 uppercase">CODE: {item.product.code}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px] uppercase font-black">
                        <span className="bg-cream dark:bg-dark-surface text-indigo dark:text-gold px-2.5 py-1 rounded-md border border-gold/10">Size: {item.size}</span>
                        <span className="bg-cream dark:bg-dark-surface text-indigo dark:text-gold px-2.5 py-1 rounded-md border border-gold/10">Color: {item.color}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Quantity edits */}
                        <div className="flex items-center bg-cream/50 dark:bg-dark-surface/50 rounded-xl p-0.5 border border-gold/10">
                          <button
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="p-1 hover:text-rose rounded transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-[11px] font-display font-black text-indigo dark:text-gold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="p-1 hover:text-green-500 rounded transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <p className="text-xs font-display font-black text-indigo dark:text-gold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.cartId)}
                      className="absolute top-2 right-2 p-1.5 bg-rose/5 text-rose hover:bg-rose hover:text-white rounded-lg transition-all"
                      title="Remove Piece"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-6 bg-white dark:bg-dark-card border-t border-gold/10 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-ink/30 dark:text-dark-muted font-bold">Inquiry total estimate</span>
                  <p className="text-xl font-display font-black text-indigo dark:text-gold">₹{totalEstimate.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-cream dark:bg-dark-surface border border-gold/10 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <ShieldCheck size={18} className="text-indigo dark:text-gold shrink-0 animate-pulse" />
                  <p className="text-[9px] text-ink/40 dark:text-dark-muted font-bold uppercase leading-relaxed text-left">
                    Direct Inquiry. Curated handloom sizing consultation provided on WhatsApp free of cost.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={clearInquiry}
                    className="px-4 py-4 border border-rose/10 text-rose hover:bg-rose/5 rounded-2xl text-[10px] tracking-widest uppercase font-black transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white hover:scale-[1.02] active:scale-95 py-4 rounded-2xl text-[10px] tracking-widest uppercase font-black transition-all shadow-lg cursor-pointer"
                  >
                    <MessageCircle size={16} fill="currentColor" />
                    <span>Inquire via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
