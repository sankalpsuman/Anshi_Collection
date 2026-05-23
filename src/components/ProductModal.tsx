import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Share2, ShoppingBag, Eye, Award, Truck, Check, Minus, Plus, Play, Sparkles } from 'lucide-react';
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
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1); // -1 for main product.imageUrl, 0+ for extra images
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
    setActiveImageIndex(-1);
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
  const currentShowcaseImageUrl = activeImageIndex === -1 ? product.imageUrl : galleryImages[activeImageIndex] || product.imageUrl;

  // Custom coordinate-based zoom on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(1.75)',
      transformOrigin: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center'
    });
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar">
        {/* Backdrop Blurred Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-colors"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          className="relative w-full max-w-6xl bg-theme-bg overflow-hidden shadow-luxury flex flex-col max-h-[92vh] rounded-[40px] border border-theme-border z-50 mt-4 md:mt-0"
        >
          {/* Close Trigger Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-50 p-3 bg-theme-surface/90 hover:bg-rose hover:text-white rounded-full text-theme-text-primary shadow-xl transition-all hover:scale-110 active:scale-95 duration-300"
          >
            <X size={18} />
          </button>

          {/* Core Body Container - Splittable Scrollable area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 md:p-12 lg:p-16 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14">
              
              {/* LEFT COMBINED SECTION: Showcase Media & Selectors */}
              <div className="md:col-span-7 space-y-6 flex flex-col justify-start">
                
                {/* Media frame with Zoom Container */}
                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-theme-surface border border-theme-border shadow-inner">
                  
                  {/* Badge & Discounts Overlay */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-30">
                      <span className="bg-theme-primary text-theme-primary-text text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full shadow-2xl">
                        {badgeLabels[product.badge] || product.badge.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {product.offerPercent && product.offerPercent > 0 ? (
                    <div className="absolute top-4 right-16 z-30">
                      <span className="bg-rose text-white text-[9px] sm:text-[10px] font-display font-black uppercase tracking-widest px-3.5 py-2 rounded-full shadow-2xl animate-pulse">
                        {product.offerPercent}% OFF
                      </span>
                    </div>
                  ) : null}

                  {/* Standard Display Toggles */}
                  {activeMediaTab === 'image' ? (
                    <div 
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className="w-full h-full cursor-zoom-in overflow-hidden relative"
                    >
                      <motion.img
                        src={currentShowcaseImageUrl}
                        alt={product.name}
                        style={zoomStyle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black/95 flex items-center justify-center">
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
                          <Play size={44} className="text-saffron mx-auto animate-bounce" />
                          <p className="text-xs uppercase font-black text-white/50 tracking-wider">Preview reel walkthrough</p>
                          <button
                            onClick={() => window.open(product.videoUrl, '_blank')}
                            className="px-6 py-2.5 bg-saffron text-ink font-bold text-[10px] tracking-wider rounded-xl uppercase"
                          >
                            Open Reel Video &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media Switch tabs (Toggles when product has video URL available) */}
                  {product.videoUrl && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/55 backdrop-blur-xl p-1.5 rounded-full border border-theme-border shadow-2xl">
                      <button
                        onClick={() => setActiveMediaTab('image')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          activeMediaTab === 'image' ? 'bg-theme-surface text-theme-text-primary shadow' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() => setActiveMediaTab('video')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          activeMediaTab === 'video' ? 'bg-rose text-white shadow' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Artisan Reel
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails list */}
                {galleryImages.length > 1 && activeMediaTab === 'image' && (
                  <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar scroll-smooth">
                    {/* Primary Image Thumbnail */}
                    <button
                      onClick={() => setActiveImageIndex(-1)}
                      className={`relative w-20 aspect-square rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImageIndex === -1 ? 'border-theme-accent scale-105' : 'border-theme-border hover:border-theme-accent/50'
                      }`}
                    >
                      <img src={product.imageUrl} alt="Thumbnail Main" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>

                    {/* Extra Images */}
                    {product.imageUrls?.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx + 1)}
                        className={`relative w-20 aspect-square rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeImageIndex === idx + 1 ? 'border-theme-accent scale-105' : 'border-theme-border hover:border-theme-accent/50'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COMBINED SECTION: Product information & Customizing options */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-8">
                <div className="space-y-6 sm:space-y-8">
                  
                  {/* Category, views count & Title */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-theme-accent uppercase tracking-[0.3em]">
                        {product.category || 'Luxury Original'}
                      </span>
                      <div className="flex items-center gap-1.5 text-rose">
                        <svg className="animate-pulse w-3 h-3 block fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {viewersCount} Interested
                        </span>
                      </div>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-theme-text-primary leading-tight font-bold">
                      {product.name}
                    </h2>

                    <div className="flex items-baseline gap-3 mt-4 sm:mt-5">
                      <p className="text-3xl font-display font-black text-theme-primary">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                      {product.offerPercent && product.offerPercent > 0 ? (
                        <p className="text-sm line-through text-theme-text-muted font-bold">
                          ₹{Math.round(product.price * (1 + product.offerPercent/100)).toLocaleString('en-IN')}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-[10px] font-mono font-black text-theme-text-muted uppercase tracking-widest mt-2">
                      CODE: {product.code || 'ANS-N/A'}
                    </p>
                  </div>

                  {/* Stock and specifications parameters in table */}
                  <div className="grid grid-cols-2 gap-4 bg-theme-surface/50 p-5 rounded-3xl border border-theme-border text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-theme-text-muted block">Availability</span>
                      {product.stockStatus === 'out_of_stock' ? (
                        <span className="text-rose text-[10px] uppercase font-black tracking-wider block">🔴 Out of Stock</span>
                      ) : product.stockStatus === 'low_stock' ? (
                        <span className="text-orange-500 text-[10px] uppercase font-black tracking-wider block">🟡 Low Stock</span>
                      ) : (
                        <span className="text-green-500 text-[10px] uppercase font-black tracking-wider block">🟢 In Stock</span>
                      )}
                    </div>

                    <div className="space-y-1 border-l border-theme-border pl-4">
                      <span className="text-[9px] uppercase tracking-widest text-theme-text-muted block">Fabric / Material</span>
                      <span className="text-theme-text-primary text-[11px] uppercase tracking-tighter block truncate" title={product.fabric || 'Heritage Weave'}>
                        {product.fabric || 'Heritage Weave'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-3.5 border-t border-theme-border">
                      <span className="text-[9px] uppercase tracking-widest text-theme-text-muted block">Est. Delivery</span>
                      <span className="text-theme-text-primary text-[11px] block">
                        {product.deliveryTime || '3-5 Working Days'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-3.5 border-t border-theme-border border-l pl-4">
                      <span className="text-[9px] uppercase tracking-widest text-theme-text-muted block">Shipping Cost</span>
                      <span className="text-green-500 text-[11px] uppercase font-bold tracking-tight block">🟢 Free Across India</span>
                    </div>
                  </div>

                  {/* SELECTORS ENGINE */}
                  <div className="space-y-6 pt-4 border-t luxury-border">
                    {/* Sizes Selection */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">
                          Select Size
                        </label>
                        <span className="text-[9px] text-theme-text-muted/60 font-black uppercase">Tailored fit available</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-11 h-11 px-3 flex items-center justify-center font-mono text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
                              selectedSize === size
                                ? 'bg-theme-primary border-theme-primary text-theme-primary-text shadow-md'
                                : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors Selection */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">
                        Select Craft Color
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2.5 text-xs font-bold rounded-full border-2 transition-all cursor-pointer flex items-center gap-2 ${
                              selectedColor === color
                                ? 'bg-theme-primary border-theme-primary text-theme-primary-text shadow-sm'
                                : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-theme-accent shrink-0 border border-white/10" style={{
                              backgroundColor: color.toLowerCase().includes('black') ? '#000000' :
                                              color.toLowerCase().includes('white') ? '#ffffff' :
                                              color.toLowerCase().includes('red') ? '#ef4444' :
                                              color.toLowerCase().includes('gold') ? '#d97706' :
                                              color.toLowerCase().includes('saffron') ? '#f97316' : '#C5A059'
                            }} />
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-theme-surface/50 border border-theme-border rounded-2xl p-1 shrink-0">
                          <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="w-10 h-10 flex items-center justify-center text-theme-text-primary hover:bg-rose/5 hover:text-rose rounded-xl transition-all font-black cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-12 text-center text-sm font-display font-black text-theme-text-primary">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(prev => Math.min(20, prev + 1))}
                            className="w-10 h-10 flex items-center justify-center text-theme-text-primary hover:bg-green-500/5 hover:text-green-500 rounded-xl transition-all font-black cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] uppercase text-theme-text-muted font-bold tracking-wider">pieces in order</span>
                      </div>
                    </div>
                  </div>

                  {/* Narrative details */}
                  <div className="space-y-3 border-t luxury-border pt-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-primary flex items-center gap-2">
                      <Eye size={12} fill="currentColor" className="text-theme-accent shrink-0" />
                      Artisan Narrative
                    </h3>
                    <p className="text-theme-text-secondary leading-relaxed font-sans text-xs sm:text-sm font-medium">
                      {product.description || "Every thread tells a story of heritage and passion. This masterpiece from Anshi Collection combines traditional weaving techniques with contemporary silhouettes."}
                    </p>
                  </div>
                </div>

                {/* PURCHASE TRIGGERS */}
                <div className="pt-6 border-t luxury-border space-y-3.5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Instant Order */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWhatsAppOrder}
                      className="flex-1 select-none flex items-center justify-center gap-2.5 bg-[#25D366] text-white py-4.5 rounded-2xl shadow-xl shadow-green-500/10 cursor-pointer text-center text-xs uppercase font-black tracking-widest"
                    >
                      <MessageCircle size={18} fill="currentColor" />
                      <span>Inquire Instantly</span>
                    </motion.button>

                    {/* Add to Multi-product inquiry list */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCartAdd}
                      className={`flex-1 select-none flex items-center justify-center gap-2.5 py-4.5 rounded-2xl cursor-pointer text-xs uppercase font-black tracking-widest border border-theme-primary/20 transition-all ${
                        addedSuccess 
                          ? 'bg-theme-primary text-theme-primary-text border-theme-primary shadow-glow' 
                          : 'bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-theme-primary-text'
                      }`}
                    >
                      {addedSuccess ? <Check size={18} /> : <ShoppingBag size={18} />}
                      <span>{addedSuccess ? 'Added to Enquiries' : 'Add to Inquiry List'}</span>
                    </motion.button>
                  </div>

                  {/* Share option */}
                  <button
                    onClick={handleShare}
                    className="w-full justify-center flex items-center gap-2 py-3 bg-theme-surface border border-theme-border text-theme-text-secondary hover:text-theme-text-primary text-[9px] uppercase tracking-[0.2em] font-black rounded-xl transition-all"
                  >
                    <Share2 size={13} />
                    <span>Share With Beloved</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RELATED PRODUCTS ENGINE */}
            <div className="pt-10 border-t luxury-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose">Curator suggestions</span>
                  <h3 className="text-xl sm:text-2xl font-serif text-theme-text-primary font-bold">Related Masterpieces</h3>
                </div>
                <div className="w-16 h-[1px] bg-theme-border"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((relProduct) => (
                  <div 
                    key={relProduct.id}
                    onClick={() => onSelectProduct(relProduct)}
                    className="group cursor-pointer glass-card p-0 rounded-2xl overflow-hidden border border-theme-border flex flex-row items-center gap-4 bg-theme-surface hover:shadow-glow hover:border-theme-accent/50 transition-all"
                  >
                    <div className="w-20 aspect-square overflow-hidden shrink-0">
                      <img src={relProduct.imageUrl} alt={relProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-3 overflow-hidden text-left flex-1 space-y-1">
                      <h4 className="text-xs font-serif font-black text-theme-text-primary group-hover:text-theme-accent transition-colors truncate">{relProduct.name}</h4>
                      <p className="text-[10px] font-mono tracking-widest text-theme-primary font-black">₹{relProduct.price.toLocaleString('en-IN')}</p>
                      <span className="text-[8px] uppercase tracking-widest font-black text-theme-text-muted block truncate">{relProduct.category || 'Silhouettes'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ARTISAN FEEDBACK REVIEWS */}
            <div className="pt-10 border-t luxury-border">
              <FeedbackSection productId={product.id} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
