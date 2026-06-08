import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, MessageCircle, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ensureHttps, handleImageError } from '../lib/securityUtils';

interface InquiryItem {
  cartId: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface InlineCartProps {
  onBackToGallery: () => void;
}

export default function InlineCart({ onBackToGallery }: InlineCartProps) {
  const [items, setItems] = React.useState<InquiryItem[]>([]);
  const [customNotes, setCustomNotes] = React.useState('');

  const loadItems = () => {
    const raw = localStorage.getItem('boutiqueInquiryCart');
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse inline cart:", e);
      }
    } else {
      setItems([]);
    }
  };

  React.useEffect(() => {
    loadItems();
    const handleUpdate = () => {
      loadItems();
    };
    window.addEventListener('inquiryUpdated', handleUpdate);
    return () => window.removeEventListener('inquiryUpdated', handleUpdate);
  }, []);

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

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('boutiqueInquiryCart');
    window.dispatchEvent(new Event('inquiryUpdated'));
  };

  const totalEstimate = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSendInquiry = () => {
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
      messageText += `   *Image Source*: ${item.product.imageUrl}\n\n`;
    });

    if (customNotes.trim()) {
      messageText += `----------------------------------------\n`;
      messageText += `*Custom Sizing/Delivery notes*:\n${customNotes}\n\n`;
    }

    messageText += `----------------------------------------\n\n`;
    messageText += `*Total Approximate Inquiry Estimate*: ₹${totalEstimate.toLocaleString('en-IN')}\n\n`;
    messageText += `Please let me know if these pieces can be curated and customized. Thank you!`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center py-24 sm:py-32 border border-dashed luxury-border bg-theme-surface/30 rounded-3xl"
      >
        <div className="max-w-md mx-auto space-y-6 px-4">
          <div className="w-16 h-16 rounded-full bg-theme-accent/5 flex items-center justify-center text-theme-accent/60 border border-theme-border mx-auto">
            <Heart size={24} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-black text-2xl text-theme-text-primary">Your curation bag is empty</h3>
            <p className="text-xs sm:text-sm text-theme-text-secondary leading-relaxed font-medium">
              Take your time to browse through our active collection of pure, artisanal weaves and select your favorites to formulate a custom consultation order.
            </p>
          </div>
          <button
            onClick={onBackToGallery}
            className="wa-button w-full sm:w-max mx-auto text-center font-black tracking-[0.25em] py-4 px-8 text-xs shadow-glow cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Browse Selection</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 text-left"
    >
      <div className="border-b border-theme-border pb-4">
        <h2 className="text-3xl font-serif font-bold text-theme-text-primary tracking-tight">Curation Consultation Bag</h2>
        <p className="text-xs text-theme-text-muted mt-1 uppercase font-semibold tracking-wider">Configure your reserved items before speaking directly with our founding curator.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left columns: Items list */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">{items.length} Selected Creations</span>
            <button 
              onClick={clearCart}
              className="text-[10px] font-black uppercase tracking-widest text-rose hover:underline"
            >
              Clear Bag
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.cartId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-4 sm:p-5 rounded-3xl bg-theme-surface border border-theme-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:shadow-glow transition-all"
                >
                  {/* Saree thumbnail */}
                  <div className="w-24 aspect-[4/5] sm:w-20 sm:aspect-[4/5] rounded-xl overflow-hidden shrink-0 bg-theme-bg">
                    <img 
                      src={ensureHttps(item.product.imageUrl)} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-cover" 
                      onError={handleImageError}
                    />
                  </div>

                  {/* Saree descriptions */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-black text-sm text-theme-text-primary flex flex-wrap items-center gap-1.5">
                          <span>{item.product.name}</span>
                          {item.product.stockStatus === 'out_of_stock' && (
                            <span className="inline-block bg-rose/10 border border-rose/30 text-rose text-[8px] font-display font-black p-1 px-2 rounded-md uppercase tracking-wider">
                              Out of Stock
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] font-mono font-bold text-theme-text-muted mt-0.5 uppercase tracking-wide">Code: {item.product.code || 'ANS'}</p>
                      </div>
                      <p className="text-sm font-display font-black text-theme-primary sm:hidden">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Sizing tags */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] uppercase font-black">
                      <span className="bg-theme-bg text-theme-primary px-3 py-1 rounded-md border border-theme-border">Size: {item.size}</span>
                      <span className="bg-theme-bg text-theme-primary px-3 py-1 rounded-md border border-theme-border">Color: {item.color}</span>
                    </div>

                    {/* Quantity controller action row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-theme-bg rounded-xl p-0.5 border border-theme-border">
                        <button
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="p-1.5 hover:text-rose text-theme-text-secondary rounded transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-xs font-display font-black text-theme-text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="p-1.5 hover:text-green-500 text-theme-text-secondary rounded transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartId)}
                        className="text-xs uppercase tracking-wider font-extrabold text-rose/75 hover:text-rose flex items-center gap-1.5 p-1"
                        title="Remove piece"
                      >
                        <Trash2 size={13} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Price */}
                  <div className="hidden sm:block text-right min-w-[100px] pr-2">
                    <p className="text-md font-display font-black text-theme-primary">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-theme-text-muted font-bold uppercase mt-1">₹{item.product.price.toLocaleString('en-IN')} / item</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: Dynamic Order Summary billing */}
        <div className="space-y-6">
          <div className="p-6 bg-theme-surface border border-theme-border rounded-[32px] shadow-sm space-y-6">
            <h3 className="font-serif font-black text-xl text-theme-text-primary uppercase tracking-wider border-b border-theme-border pb-3">Consultation billing</h3>
            
            <div className="space-y-3 pb-4 border-b border-theme-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-theme-text-secondary font-bold uppercase tracking-wider">Subtotal Items</span>
                <span className="text-theme-text-primary font-black">{items.reduce((sum, item) => sum + item.quantity, 0)} Pcs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-theme-text-secondary font-bold uppercase tracking-wider">Artisan Consultation</span>
                <span className="text-theme-accent font-black">Complimentary (Free)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-theme-text-secondary font-bold uppercase tracking-wider">Estimated Subtotal</span>
                <span className="text-theme-text-primary font-bold">₹{totalEstimate.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-theme-bg/10 p-3 rounded-2xl">
              <span className="font-serif font-bold text-theme-text-primary text-sm">Estimated Total</span>
              <span className="text-2xl font-display font-black text-theme-primary">₹{totalEstimate.toLocaleString('en-IN')}</span>
            </div>

            {/* Custom Notes builder */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted block">Customization Sizing Notes (Optional)</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Examples: Custom borders request, sleeve styling queries, delivery timeframes, alternative colors needed..."
                className="w-full text-xs bg-theme-bg/50 border border-theme-border p-3.5 rounded-xl text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/5 h-20 resize-none font-sans font-medium"
              />
            </div>

            <div className="bg-theme-bg border border-theme-border p-4.5 rounded-2xl flex items-start gap-3">
              <ShieldCheck size={18} className="text-theme-accent shrink-0 mt-0.5" />
              <p className="text-[9.5px] text-theme-text-secondary font-semibold uppercase leading-relaxed">
                Direct Handloom Trust. We verify fitting and authentic silk hallmark certificates before accepting any deposits.
              </p>
            </div>

            <button
              onClick={handleSendInquiry}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white hover:opacity-90 active:scale-95 py-4.5 rounded-2xl text-xs tracking-widest uppercase font-black transition-all shadow-md cursor-pointer"
            >
              <MessageCircle size={17} fill="currentColor" />
              <span>Inquire on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
