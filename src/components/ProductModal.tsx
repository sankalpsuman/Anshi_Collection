import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Share2, ShoppingBag, Eye, Check, Minus, Plus, Play, ChevronLeft, ChevronRight, Bookmark, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import FeedbackSection from './FeedbackSection';

interface ProductModalProps {
  product: Product | null;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
  onAddToInquiry: (item: { product: Product; size: string; color: string; quantity: number }) => void;
}

interface ProductModalContentProps extends Omit<ProductModalProps, 'product'> {
  product: Product;
}

export default function ProductModal(props: ProductModalProps) {
  if (!props.product) return null;
  return <ProductModalContent {...props} product={props.product} />;
}

function ProductModalContent({ 
  product, 
  allProducts, 
  onSelectProduct, 
  onClose,
  onAddToInquiry
}: ProductModalContentProps) {
  // Image Gallery States
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('image');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0); // 0 is main product image
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  
  // Variant States
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
  const availableColors = product.colors && product.colors.length > 0 ? product.colors : ['Classic Gold', 'Pearl White', 'Crimson Saffron'];
  
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'Free Size');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || 'Default');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Interest Counter
  const [viewersCount, setViewersCount] = useState<number>(12);

  // Reset indices on product change
  useEffect(() => {
    setActiveImageIndex(0);
    setActiveMediaTab('image');
    setSelectedSize(availableSizes[0] || 'Free Size');
    setSelectedColor(availableColors[0] || 'Default');
    setQuantity(1);
    setAddedSuccess(false);

    // Track recently viewed local store
    const viewed = localStorage.getItem('recentlyViewed');
    let viewedArr: string[] = viewed ? JSON.parse(viewed) : [];
    viewedArr = viewedArr.filter(id => id !== product.id);
    viewedArr.unshift(product.id);
    localStorage.setItem('recentlyViewed', JSON.stringify(viewedArr.slice(0, 10)));
    window.dispatchEvent(new Event('recentlyViewedUpdated'));

    // Deterministic active viewers counter based on product hash code
    const baseValue = (product.name.charCodeAt(0) % 15) + 6;
    setViewersCount(baseValue);
  }, [product]);

  // Gallery Array Builder
  const galleryImages = [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean);
  const currentShowcaseImageUrl = galleryImages[activeImageIndex] || product.imageUrl || '';

  // Custom coordinate-based zoom on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(1.5)',
      transformOrigin: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center'
    });
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev + 1) % galleryImages.length);
  };

  // Direct WhatsApp Inquiry trigger
  const handleWhatsAppOrder = () => {
    const phoneNumber = "7979005226";
    let messageText = "";

    if (product.customMessage) {
      // Overridden customized message
      messageText = `${product.customMessage}\n\n`;
    } else {
      messageText = `Hello, I'm interested in this product:\n\n`;
    }

    messageText += `*Product*: ${product.name}\n`;
    messageText += `*Code*: ${product.code || 'ANS'}\n`;
    messageText += `*Price*: ₹${product.price.toLocaleString('en-IN')}\n`;
    messageText += `*Size*: ${selectedSize}\n`;
    messageText += `*Color*: ${selectedColor}\n`;
    messageText += `*Quantity*: ${quantity}\n\n`;
    messageText += `*Product Image*:\n${currentShowcaseImageUrl}`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    const shareText = `Check out this beautiful piece from Anshi Collection:\n\n*${product.name}*\nPrice: ₹${product.price.toLocaleString('en-IN')}\nCode: ${product.code || 'ANS'}\n\nView details here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  // Add Item to Inquiry Cart
  const handleCartAdd = () => {
    onAddToInquiry({
      product,
      size: selectedSize,
      color: selectedColor,
      quantity
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  // Get Related Collections
  const related = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || !product.category))
    .slice(0, 3);

  // If category related is less than 3, fill with other latest items
  if (related.length < 3) {
    const extraItems = allProducts
      .filter(p => p.id !== product.id && !related.find(r => r.id === p.id))
      .slice(0, 3 - related.length);
    related.push(...extraItems);
  }

  // Handle format of badge texts
  const badgeLabels = {
    new_arrival: '✨ New Arrival',
    trending: '🔥 Trending Now',
    fast_selling: '⚡ Fast Selling',
    limited_stock: '⚠️ Limited Stock',
    sale: '🏷️ Special Sale'
  };

  // Parse if video is mp4
  const isDirectVideo = product.videoUrl?.endsWith('.mp4') || product.videoUrl?.endsWith('.webm') || product.videoUrl?.includes('/video/upload/');

  return (
    <AnimatePresence>
      <div 
        id="product-modal-viewport"
        className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden no-scrollbar bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 md:p-10 lg:p-16"
      >
        {/* Backdrop Trigger */}
        <div className="absolute inset-0 z-0" onClick={onClose} />

        {/* Modal Window Sheet */}
        <motion.div
          id="product-modal-panel"
          initial={{ scale: 0.97, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 26, stiffness: 210 }}
          className="relative w-full max-w-5xl bg-theme-bg text-theme-text-primary overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-theme-border rounded-[28px] sm:rounded-[36px] md:rounded-[44px] z-10 my-auto flex flex-col"
        >
          {/* Header Close Trigger (Positioned so it doesn't overlap text) */}
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="absolute right-4 top-4 s:right-6 s:top-6 z-50 p-3 bg-theme-surface/90 hover:bg-rose hover:text-white rounded-full text-theme-text-primary shadow-lg border border-theme-border/20 transition-all hover:scale-110 active:scale-95 duration-300"
            aria-label="Close modal"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Core Scroll Area with Generous Paddings */}
          <div className="p-5 sm:p-8 md:p-12 lg:p-14 space-y-12 sm:space-y-16">
            
            {/* Primary Grid Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 items-start">
              
              {/* LEFT MEDIA COLUMN - Sticky on Desktop Viewports */}
              <div 
                id="modal-media-showcase" 
                className="w-full md:col-span-6 lg:col-span-7 space-y-5 md:sticky md:top-0"
              >
                {/* Image Frame Wrapper */}
                <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-theme-surface border border-theme-border/60 shadow-inner group/preview">
                  
                  {/* Floating Badges */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-30">
                      <span className="bg-theme-primary text-theme-primary-text text-[9px] sm:text-[10px] uppercase font-display font-bold tracking-widest px-4 py-2 rounded-full shadow-lg border border-theme-border/10">
                        {badgeLabels[product.badge] || product.badge.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {product.offerPercent && product.offerPercent > 0 ? (
                    <div className="absolute top-4 right-14 sm:right-16 z-30">
                      <span className="bg-rose text-white text-[9px] sm:text-[10px] font-display font-black uppercase tracking-widest px-3.5 py-2 rounded-full shadow-lg animate-pulse">
                        {product.offerPercent}% OFF
                      </span>
                    </div>
                  ) : null}

                  {/* Standard Display Toggles */}
                  {activeMediaTab === 'image' ? (
                    <div 
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className="w-full h-full cursor-zoom-in overflow-hidden relative flex items-center justify-center"
                    >
                      <motion.img
                        src={currentShowcaseImageUrl}
                        alt={product.name}
                        style={zoomStyle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-200"
                      />

                      {/* Navigation Chevrons inside presentation, visible on hover */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 pointer-events-auto border border-white/10"
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 pointer-events-auto border border-white/10"
                            aria-label="Next image"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {isDirectVideo ? (
                        <video 
                          src={product.videoUrl} 
                          controls 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-8 text-center space-y-4">
                          <Play size={40} className="text-theme-accent mx-auto animate-bounce-slow" />
                          <p className="text-[10px] uppercase font-display font-bold text-white/60 tracking-wider">Preview reel walkthrough</p>
                          <button
                            onClick={() => window.open(product.videoUrl, '_blank')}
                            className="px-6 py-2.5 bg-theme-accent text-theme-accent-text font-display font-bold text-[10px] tracking-widest rounded-xl uppercase hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>Open Reel Video</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media Switch tabs (Toggles when product has video URL available) */}
                  {product.videoUrl && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#141414]/80 backdrop-blur-xl p-1 rounded-full border border-theme-border shadow-xl">
                      <button
                        onClick={() => setActiveMediaTab('image')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-display font-black uppercase tracking-widest transition-all ${
                          activeMediaTab === 'image' ? 'bg-theme-primary text-theme-primary-text shadow-sm' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() => setActiveMediaTab('video')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-display font-black uppercase tracking-widest transition-all ${
                          activeMediaTab === 'video' ? 'bg-rose text-white shadow-sm' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Artisan Reel
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail Galleries */}
                {galleryImages.length > 1 && activeMediaTab === 'image' && (
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto py-1.5 px-0.5 no-scrollbar scroll-smooth justify-start md:justify-center">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 sm:w-16 md:w-20 aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                          activeImageIndex === idx 
                            ? 'border-theme-accent scale-105 shadow-md shadow-theme-accent/10' 
                            : 'border-theme-border hover:border-theme-accent/40'
                        }`}
                        aria-label={`View image thumbnail ${idx + 1}`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT PRODUCT DETAILS PANEL */}
              <div id="modal-product-details" className="w-full md:col-span-6 lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8">
                
                {/* Meta details Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display font-bold text-theme-accent uppercase tracking-[0.25em]">
                      {product.category || 'Luxury Original'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-rose/5 px-3 py-1 rounded-full border border-rose/10">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose"></span>
                      </span>
                      <span className="text-[9px] font-display font-bold uppercase tracking-widest text-rose">
                        {viewersCount} Interested
                      </span>
                    </div>
                  </div>

                  <h2 className="text-[26px] sm:text-[34px] lg:text-[42px] font-serif text-theme-text-primary leading-[1.15] font-bold tracking-tight">
                    {product.name}
                  </h2>

                  <div className="flex items-baseline gap-3 pt-1">
                    <p className="text-[24px] sm:text-[28px] font-display font-extrabold text-theme-primary">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    {product.offerPercent && product.offerPercent > 0 ? (
                      <p className="text-xs sm:text-sm line-through text-theme-text-muted font-bold font-display">
                        ₹{Math.round(product.price * (1 + product.offerPercent/100)).toLocaleString('en-IN')}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-[9px] font-mono font-bold text-theme-text-muted uppercase tracking-[0.2em] pt-1">
                    PIECE CODE: {product.code || 'ANS-N/A'}
                  </p>
                </div>

                {/* Specs Bento-Grid Matrix */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-theme-surface/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-theme-border/65">
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-theme-text-muted font-display font-semibold block">Store Stock</span>
                    <div className="flex items-center gap-1.5">
                      {product.stockStatus === 'out_of_stock' ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-rose relative" />
                          <span className="text-rose text-[9px] sm:text-[10px] uppercase font-display font-bold tracking-wider">Out of Stock</span>
                        </>
                      ) : product.stockStatus === 'low_stock' ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 relative flex">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60"></span>
                          </span>
                          <span className="text-orange-500 text-[9px] sm:text-[10px] uppercase font-display font-bold tracking-wider">Low Stock</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-500 text-[9px] sm:text-[10px] uppercase font-display font-bold tracking-wider">In Stock</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 border-l border-theme-border pl-3 sm:pl-4">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-theme-text-muted font-display font-semibold block">Fabric Details</span>
                    <span className="text-theme-text-primary text-[10px] sm:text-[11px] font-bold uppercase tracking-tight block truncate" title={product.fabric || 'Heritage Weave'}>
                      {product.fabric || 'Heritage Weave'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-theme-border">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-theme-text-muted font-display font-semibold block">Est. Delivery</span>
                    <span className="text-theme-text-primary text-[10px] sm:text-[11px] font-bold block">
                      {product.deliveryTime || '3-5 Working Days'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-theme-border border-l pl-3 sm:pl-4">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-theme-text-muted font-display font-semibold block">Shipping cost</span>
                    <span className="text-emerald-500 text-[10px] sm:text-[11px] uppercase font-display font-bold tracking-wide block">
                      Free Across India
                    </span>
                  </div>
                </div>

                {/* SELECTION FORMS & VARIANT CONTROLS */}
                <div className="space-y-6 pt-2 border-t luxury-border">
                  
                  {/* SIZES CONTROLS */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-display uppercase tracking-[0.2em] font-bold text-theme-text-muted">
                      <label>Select Size</label>
                      <span className="text-[9px] text-[#8a5cf5]/85 normal-case font-semibold">Tailored requests supported</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[44px] h-[44px] px-3.5 flex items-center justify-center font-mono text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedSize === size
                              ? 'bg-theme-primary border-theme-primary text-theme-primary-text shadow-md scale-105'
                              : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent hover:text-theme-text-primary'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* COLORS CONTROLS */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-display uppercase tracking-[0.2em] font-bold text-theme-text-muted">
                      Select Craft Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => {
                        const isSelected = selectedColor === color;
                        return (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-3.5 py-2 text-xs font-bold rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-theme-primary border-theme-primary text-theme-primary-text shadow-sm ring-1 ring-theme-primary/30'
                                : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent hover:text-theme-text-primary'
                            }`}
                          >
                            <span 
                              className={`w-2.5 h-2.5 rounded-full shrink-0 border border-white/10 transition-transform duration-200 ${
                                isSelected ? 'scale-125' : 'scale-100'
                              }`} 
                              style={{
                                backgroundColor: color.toLowerCase().includes('black') ? '#000000' :
                                                color.toLowerCase().includes('white') ? '#ffffff' :
                                                color.toLowerCase().includes('red') ? '#ef4444' :
                                                color.toLowerCase().includes('gold') ? '#d97706' :
                                                color.toLowerCase().includes('saffron') ? '#f97316' : '#C5A059'
                              }} 
                            />
                            <span className="text-[11px]">{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QUANTITY SECTION */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-display uppercase tracking-[0.2em] font-bold text-theme-text-muted">
                      Desired Quantity
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-theme-surface/60 border border-theme-border/70 rounded-xl p-1 shrink-0">
                        <button
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="w-9 h-9 flex items-center justify-center text-theme-text-primary hover:bg-rose/5 hover:text-rose rounded-lg transition-all font-black cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 text-center text-xs font-display font-black text-theme-text-primary">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(prev => Math.min(20, prev + 1))}
                          className="w-9 h-9 flex items-center justify-center text-theme-text-primary hover:bg-emerald-500/5 hover:text-emerald-500 rounded-lg transition-all font-black cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-[10px] uppercase text-theme-text-muted/75 font-semibold font-display tracking-widest">Pieces Selected</span>
                    </div>
                  </div>
                </div>

                {/* ARTISAN STORY WRITING */}
                <div className="space-y-2.5 border-t luxury-border pt-5">
                  <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-theme-primary flex items-center gap-1.5">
                    <Bookmark size={11} className="text-theme-accent shrink-0 fill-current" />
                    Artisan Narrative
                  </h3>
                  <p className="text-theme-text-secondary leading-relaxed font-sans text-xs sm:text-[13px] font-medium leading-[1.6]">
                    {product.description || "Every thread tells a story of heritage and passion. This masterpiece from Anshi Collection combines traditional weaving techniques with contemporary silhouettes."}
                  </p>
                </div>

                {/* BUYING ACTION CALLS */}
                <div className="pt-5 border-t luxury-border space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Primary Button: WhatsApp */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleWhatsAppOrder}
                      className="flex-1 flex items-center justify-center gap-2.5 bg-[#25D366] text-white py-4 px-6 rounded-2xl shadow-md hover:bg-[#20bd59] transition-colors cursor-pointer text-center text-xs font-display font-black uppercase tracking-[0.16em]"
                    >
                      <MessageCircle size={17} fill="currentColor" />
                      <span>Inquire Instantly</span>
                    </motion.button>

                    {/* Secondary Button: Inquiry list */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleCartAdd}
                      className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl cursor-pointer text-xs font-display font-black uppercase tracking-[0.16em] border transition-all duration-300 ${
                        addedSuccess 
                          ? 'bg-theme-primary text-theme-primary-text border-theme-primary shadow-glow' 
                          : 'bg-theme-primary/10 text-theme-primary border-theme-primary/30 hover:bg-theme-primary hover:text-theme-primary-text'
                      }`}
                    >
                      {addedSuccess ? <Check size={16} /> : <ShoppingBag size={16} />}
                      <span>{addedSuccess ? 'Added to Cart' : 'Add to Inquiry List'}</span>
                    </motion.button>
                  </div>

                  {/* Share Trigger */}
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-theme-surface hover:bg-theme-surface/75 border border-theme-border/60 text-theme-text-secondary hover:text-theme-text-primary text-[9px] uppercase font-display font-black tracking-[0.18em] rounded-xl transition-all"
                  >
                    <Share2 size={12} />
                    <span>Share With Beloved</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CURATOR SUGGESTIONS AREA */}
            <div className="pt-8 border-t luxury-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-display font-bold uppercase tracking-[0.3em] text-rose">Curator suggestions</span>
                  <h3 className="text-xl sm:text-2xl font-serif text-theme-text-primary font-bold">Related Masterpieces</h3>
                </div>
                <div className="w-12 h-[1px] bg-theme-border/40" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {related.map((relProduct) => (
                  <div 
                    key={relProduct.id}
                    onClick={() => onSelectProduct(relProduct)}
                    className="group cursor-pointer p-0 rounded-2xl overflow-hidden border border-theme-border flex flex-row items-center gap-3 sm:gap-4 bg-theme-surface/50 hover:bg-theme-surface hover:shadow-luxury hover:border-theme-accent/50 transition-all duration-300"
                  >
                    <div className="w-20 sm:w-24 aspect-square overflow-hidden shrink-0">
                      <img src={relProduct.imageUrl} alt={relProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-3 overflow-hidden text-left flex-1 space-y-1">
                      <h4 className="text-xs sm:text-sm font-serif font-bold text-theme-text-primary group-hover:text-theme-accent transition-colors truncate">{relProduct.name}</h4>
                      <p className="text-[10px] sm:text-xs font-display font-extrabold text-theme-primary">₹{relProduct.price.toLocaleString('en-IN')}</p>
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-theme-text-muted block truncate">{relProduct.category || 'Silhouettes'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FEEDBACK SECTION */}
            <div className="pt-8 border-t luxury-border">
              <FeedbackSection productId={product.id} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
