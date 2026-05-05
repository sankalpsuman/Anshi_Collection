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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={() => onClick(product)}
      className="group cursor-pointer bg-white p-4 border border-black/5 hover:shadow-xl transition-all duration-500"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ink/5 mb-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={handleShare}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-maroon hover:bg-maroon hover:text-white shadow-xl transition-all"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>
        <div className="absolute top-4 left-4 bg-gold text-white text-[9px] uppercase tracking-widest px-2 py-1 shadow-md">
          {product.category || 'Collection'}
        </div>
      </div>
      
      <div className="flex flex-col">
        <h2 className="text-xl font-serif text-ink mb-1">{product.name}</h2>
        <p className="text-maroon font-bold text-sm tracking-widest">₹{product.price.toLocaleString('en-IN')}</p>
        
        <button
          onClick={handleWhatsAppOrder}
          className="wa-button mt-6 group-hover:bg-gold transition-colors"
        >
          <MessageCircle size={14} />
          <span>Order via WhatsApp</span>
        </button>
      </div>
    </motion.div>
  );
}
