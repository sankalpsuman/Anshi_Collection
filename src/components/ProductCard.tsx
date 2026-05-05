import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { MessageCircle, Share2, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  key?: React.Key;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      className="group cursor-pointer glass-card p-0 overflow-hidden hover:-translate-y-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100">
          <button 
            onClick={handleShare}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-maroon hover:bg-rose hover:text-white shadow-xl transition-all"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4 z-10 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
           <span className="bg-saffron text-ink text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1 rounded-sm shadow-lg">
            {product.category || 'Limited Edition'}
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-2xl font-serif text-ink group-hover:text-maroon transition-colors leading-tight">
            {product.name}
          </h2>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/30 mb-1">Price</span>
            <p className="text-indigo font-display font-bold text-lg whitespace-nowrap">₹{product.price.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <button
          onClick={handleWhatsAppOrder}
          className="wa-button w-full rounded-none group-hover:shadow-[0_0_20px_rgba(114,28,36,0.3)]"
        >
          <MessageCircle size={14} className="group-hover:animate-bounce" />
          <span>Inquire & Reserve</span>
        </button>
      </div>
    </motion.div>
  );
}
