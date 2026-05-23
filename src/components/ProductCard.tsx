import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { MessageCircle, Share2, Star } from 'lucide-react';
import { feedbackService } from '../services/feedbackService';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  key?: React.Key;
}

function RatingSummary({ productId }: { productId: string }) {
  const [stats, setStats] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    return feedbackService.subscribeToFeedback(productId, (feedbacks) => {
      if (feedbacks.length > 0) {
        const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        setStats({
          avg: Math.round((sum / feedbacks.length) * 10) / 10,
          count: feedbacks.length
        });
      } else {
        setStats({ avg: 0, count: 0 });
      }
    });
  }, [productId]);

  if (stats.count === 0) {
    return (
      <div className="flex items-center gap-1 opacity-20">
        <Star size={10} className="text-gold" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">No reviews</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={10} 
            fill={s <= Math.round(stats.avg) ? "#C5A059" : "none"} 
            className={s <= Math.round(stats.avg) ? "text-gold" : "text-gold/20"} 
          />
        ))}
      </div>
      <span className="text-[10px] font-black text-gold uppercase tracking-tighter">
        {stats.avg} ({stats.count})
      </span>
    </div>
  );
}

export default function ProductCard({ product, onClick }: ProductCardProps) {

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?product=${product.id}`;
    const message = `Check out this beautiful piece from Anshi Collection: *${product.name}*\nPrice: *₹${product.price.toLocaleString('en-IN')}*\n\nView details here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneNumber = "7979005226";
    const message = encodeURIComponent(`Hi, I want to order ${product.name} for ₹${product.price}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => onClick(product)}
      className="group cursor-pointer glass-card p-0 overflow-hidden hover:-translate-y-2 dark:bg-dark-card dark:border-white/5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/5 dark:bg-white/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Custom Visual Badges */}
        {product.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`text-[8px] sm:text-[9px] font-display font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg ${
              product.badge === 'new_arrival' ? 'bg-[#6366f1] text-white' :
              product.badge === 'trending' ? 'bg-orange-500 text-white animate-pulse' :
              product.badge === 'fast_selling' ? 'bg-indigo text-white' :
              product.badge === 'limited_stock' ? 'bg-amber-600 text-white' :
              'bg-rose text-white'
            }`}>
              {product.badge === 'new_arrival' ? '✨ New' :
               product.badge === 'trending' ? '🔥 Hot' :
               product.badge === 'fast_selling' ? '⚡ Fast' :
               product.badge === 'limited_stock' ? '⚠️ Low Stock' : '🏷️ Sale'}
            </span>
          </div>
        )}

        {product.offerPercent && product.offerPercent > 0 ? (
          <div className="absolute top-4 right-4 z-10 md:hidden group-hover:block transition-all duration-300">
            <span className="bg-rose text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-lg">
              {product.offerPercent}% OFF
            </span>
          </div>
        ) : null}
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-40 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 translate-x-0 opacity-100 md:translate-x-12 md:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100">
          <button 
            onClick={handleShare}
            className="p-3 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-full text-maroon dark:text-saffron hover:bg-rose hover:text-white dark:hover:bg-gold dark:hover:text-ink shadow-xl transition-all"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4 z-10 translate-y-0 opacity-100 md:translate-y-8 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
           <span className="bg-saffron text-ink text-[8px] sm:text-[10px] font-display font-bold uppercase tracking-widest px-2 sm:px-3 py-1 rounded-sm shadow-lg">
            {product.category || 'Limited Edition'}
          </span>
        </div>
      </div>
      
      <div className="p-5 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex justify-between items-start gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-serif text-ink dark:text-dark-text group-hover:text-maroon dark:group-hover:text-gold transition-colors leading-tight line-clamp-2">
            {product.name}
          </h2>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-ink/30 dark:text-dark-muted mb-1 font-bold">Price</span>
            <p className="text-indigo dark:text-gold font-display font-bold text-base sm:text-lg whitespace-nowrap">₹{product.price.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <RatingSummary productId={product.id} />
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(product);
          }}
          className="wa-button w-full rounded-xl !py-4 group-hover:shadow-[0_0_20px_rgba(114,28,36,0.2)] text-[10px] sm:text-xs"
        >
          <MessageCircle size={14} className="group-hover:animate-bounce" />
          <span>Curate & Inquire</span>
        </button>
      </div>
    </motion.div>
  );
}
