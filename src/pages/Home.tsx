import React from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import InquiryCart from '../components/InquiryCart';
import ThemeToggle from '../components/ThemeToggle';
import { Product } from '../types';
import { productService } from '../services/productService';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Instagram, Search, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { adminService } from '../services/adminService';

// Branded Module Enhancements
import FloatingNav, { AppModule } from '../components/FloatingNav';
import InlineCart from '../components/InlineCart';
import Login from './Admin/Login';
import Dashboard from './Admin/Dashboard';


// Dedicated, modular Recently Viewed list component
function RecentlyViewed({ 
  products, 
  onSelectProduct 
}: { 
  products: Product[], 
  onSelectProduct: (product: Product) => void 
}) {
  const [viewedProducts, setViewedProducts] = React.useState<Product[]>([]);

  const loadViewed = React.useCallback(() => {
    const raw = localStorage.getItem('recentlyViewed');
    if (raw) {
      try {
        const ids: string[] = JSON.parse(raw);
        const list = ids
          .map(id => products.find(p => p.id === id))
          .filter((p): p is Product => !!p);
        setViewedProducts(list);
      } catch (e) {
        console.error("Failed to load viewed:", e);
      }
    }
  }, [products]);

  React.useEffect(() => {
    loadViewed();
    window.addEventListener('recentlyViewedUpdated', loadViewed);
    return () => window.removeEventListener('recentlyViewedUpdated', loadViewed);
  }, [loadViewed]);

  if (viewedProducts.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-20 border-t border-theme-border pt-12 space-y-6 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose">Recently Visited Collections</span>
        <div className="h-[1px] flex-1 bg-theme-border"></div>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0">
        {viewedProducts.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelectProduct(p)}
            className="group cursor-pointer bg-theme-surface border border-theme-border rounded-3xl p-3 w-40 hover:-translate-y-1.5 transition-all duration-350 shadow-sm hover:shadow-glow flex-shrink-0"
          >
            <div className="aspect-[4/5] rounded-2.5xl overflow-hidden bg-theme-bg/10">
              <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="mt-3.5 space-y-1 overflow-hidden">
              <h4 className="font-serif font-black text-xs text-theme-text-primary group-hover:text-theme-accent transition-colors truncate">{p.name}</h4>
              <p className="text-[10px] font-mono font-black text-theme-primary">₹{p.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home({ 
  initialProducts = [], 
  initialIsAdmin = false, 
  initialUserId = null 
}: { 
  initialProducts?: Product[]; 
  initialIsAdmin?: boolean; 
  initialUserId?: string | null; 
}) {
  const [products, setProducts] = React.useState<Product[]>(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    try {
      const cached = localStorage.getItem('ansi_cached_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(() => {
    if (initialProducts && initialProducts.length > 0) return false;
    try {
      const cached = localStorage.getItem('ansi_cached_products');
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });
  const [error, setError] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [gridCols, setGridCols] = React.useState(4);

  // Modular routing tab states
  const [activeModule, setActiveModule] = React.useState<AppModule>('gallery');

  // Inquiry Cart States
  const [isInquiryOpen, setIsInquiryOpen] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  const [isAdminUser, setIsAdminUser] = React.useState(initialIsAdmin);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { authorized } = await adminService.checkAdminStatus(user.email || '');
        setIsAdminUser(authorized);
      } else {
        setIsAdminUser(false);
      }
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const unsubscribe = productService.subscribeToProducts(
      (data) => {
        setProducts(data);
        setLoading(false);
        setError(null);
        try {
          localStorage.setItem('ansi_cached_products', JSON.stringify(data));
        } catch (e) {
          console.error("Failed to cache products:", e);
        }
      },
      (err) => {
        console.error("Subscription error:", err);
        // Only show error if we possess no cached data
        if (products.length === 0) {
          setError("Unable to connect to the gallery. Please try again later.");
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [products.length]);

  // Sync floating inquiry list item numbers reactive
  React.useEffect(() => {
    const updateCount = () => {
      const raw = localStorage.getItem('boutiqueInquiryCart');
      if (raw) {
        try {
          const items = JSON.parse(raw);
          setCartCount(items.reduce((sum: number, it: any) => sum + it.quantity, 0));
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('inquiryUpdated', updateCount);
    return () => window.removeEventListener('inquiryUpdated', updateCount);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let productId = params.get('product');
    
    // Also support hash-based query parameter formats for deep SPA routing (e.g. #/?product=XYZ)
    if (!productId && window.location.hash.includes('?')) {
      try {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          productId = hashParams.get('product');
        }
      } catch (err) {
        console.warn("Error parsing hash params:", err);
      }
    }

    if (productId && products.length > 0) {
      if (!selectedProduct || selectedProduct.id !== productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          setSelectedProduct(product);
        }
      }
    }
  }, [products, selectedProduct]);

  const filteredProducts = React.useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
        (p.code && p.code.toLowerCase().includes(lowerQuery))
      );
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  const categories = React.useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  // Handle addition of items into persistent Local Storage cart
  const handleAddToInquiry = (item: { product: Product; size: string; color: string; quantity: number }) => {
    const raw = localStorage.getItem('boutiqueInquiryCart');
    let cartItems = raw ? JSON.parse(raw) : [];
    const cartId = `${item.product.id}-${item.size}-${item.color}`;
    
    // Check if configuration already lives in cart
    const existingIdx = cartItems.findIndex((it: any) => it.cartId === cartId);
    if (existingIdx > -1) {
      cartItems[existingIdx].quantity += item.quantity;
    } else {
      cartItems.push({
        cartId,
        product: item.product,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      });
    }
    
    localStorage.setItem('boutiqueInquiryCart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('inquiryUpdated'));
    setIsInquiryOpen(true); // Direct, high-end visual feedback opens inquiry pane!
  };

  return (
    <div className="min-h-screen bg-theme-bg selection:bg-gold/30 font-sans transition-colors duration-500">
      <div className="flex flex-col lg:flex-row min-h-screen silk-gradient">
        {/* Sidebar - Desktop Only sticky, Mobile Hero */}
        {!(activeModule === 'artisan' && isAdminUser) && (
          <aside className={`lg:w-[420px] xl:w-[480px] lg:border-r luxury-border lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between bg-theme-surface/40 backdrop-blur-sm lg:bg-transparent z-20 overflow-hidden ${
            activeModule === 'gallery' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Decorative background elements */}
            <div className="absolute -top-12 -left-12 lg:-top-24 lg:-left-24 w-48 h-48 lg:w-64 lg:h-64 bg-theme-accent/5 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 -right-16 lg:-right-32 w-64 h-64 lg:w-80 lg:h-80 bg-rose/5 rounded-full blur-3xl -z-10" />

            <div className="p-6 sm:p-10 lg:p-12 xl:p-16 space-y-10 lg:space-y-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-between"
              >
                <Link to="/" className="brand-logo serif text-3xl sm:text-4xl tracking-[4px] sm:tracking-[6px] text-theme-primary border-b-4 border-theme-accent pb-2 sm:pb-3 flex items-center gap-3 font-black">
                  <Sparkles className="text-theme-accent w-8 h-8 sm:w-10 sm:h-10 shrink-0" fill="currentColor" />
                  ANSHI COLLECTION
                </Link>
                <div className="lg:hidden">
                  <ThemeToggle />
                </div>
              </motion.div>
              
              <div className="hidden lg:block absolute top-12 right-12 z-50">
                <ThemeToggle />
              </div>
              
              <div className="space-y-6 lg:space-y-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-theme-text-secondary font-bold block mb-3 sm:mb-4 border-l-2 border-theme-accent pl-3">
                    Est. 2026 — The Artisan Label
                  </span>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif text-theme-text-primary leading-[1] lg:leading-[0.85] mb-6 sm:mb-8 font-bold">
                    Wear<br />
                    <span className="text-rose italic font-medium">Stories</span><br />
                    <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl block mt-4 border-t luxury-border pt-4 text-theme-text-muted font-light">Not Just Silk.</span>
                  </h1>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="text-sm sm:text-base font-sans leading-relaxed text-theme-text-secondary max-w-sm font-medium"
                >
                  A sanctuary of handcrafted ethnic silhouettes. We curate threads of heritage into modern masterpieces for the discerning soul.
                </motion.p>

                <div className="flex flex-col space-y-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveModule('gallery');
                      const el = document.getElementById('collection');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="wa-button w-full lg:w-max text-center font-black tracking-[0.3em] py-4 sm:py-5 px-8 sm:px-10 text-xs shadow-glow"
                  >
                    Explore Collection
                  </motion.button>
                  <div className="flex items-center space-x-6 pt-4 sm:pt-6">
                    <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://instagram.com', '_blank') }} className="text-theme-text-secondary/50 hover:text-rose transition-all hover:scale-125 p-2 -ml-2">
                      <Instagram size={20} />
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://wa.me/7979005226', '_blank') }} className="text-theme-text-secondary/50 hover:text-theme-accent transition-all hover:scale-125 p-2">
                      <MessageCircle size={20} />
                    </a>
                    <span className="h-[1px] w-8 sm:w-12 bg-theme-border"></span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-theme-text-muted font-bold">Social</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-10 lg:p-12 xl:p-16 pt-8 border-t luxury-border mt-8 lg:mt-0 bg-theme-surface/10 backdrop-blur-sm self-end w-full">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-theme-text-muted/40 font-semibold tracking-[0.2em]">{`© 2026 Anshi Collection`}</p>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main id="collection" className={`flex-1 p-4 sm:p-8 md:p-10 lg:p-12 ${activeModule === 'artisan' && isAdminUser ? 'lg:pl-0 lg:p-0' : 'lg:pl-16'}`}>
          
          {/* ==================== 1. GALLERY TAB MODULE ==================== */}
          <div className={activeModule === 'gallery' ? 'block' : 'hidden'}>
            {/* Top Search & Filter Bar */}
            <div className="flex flex-col space-y-6 sm:space-y-10 mb-12 sm:mb-20">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 luxury-border bg-theme-surface/60 p-4 sm:p-6 rounded-3xl border border-theme-border backdrop-blur-2xl shadow-luxury">
                <div className="w-full lg:max-w-2xl relative group">
                  <input 
                    type="text" 
                    className="w-full bg-theme-bg/50 backdrop-blur-sm border-2 border-theme-border rounded-2xl pl-14 sm:pl-16 pr-6 py-4 sm:py-5 text-sm sm:text-base outline-none focus:border-theme-accent/50 focus:ring-4 focus:ring-theme-accent/5 transition-all placeholder:text-theme-text-muted/50 font-medium text-theme-text-primary"
                    placeholder="Masterpiece name, silhouette, or product code... (e.g. Kurta)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-theme-text-muted/50 group-focus-within:text-theme-accent transition-colors">
                    <Search size={24} strokeWidth={2.5} />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 self-center lg:self-center pr-2">
                  <div className="hidden lg:flex items-center gap-2 bg-theme-bg/50 p-1 rounded-xl border border-theme-border mr-4">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setGridCols(num)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                          gridCols === num 
                            ? 'bg-theme-primary text-theme-primary-text shadow-lg' 
                            : 'text-theme-text-secondary/55 hover:text-theme-text-primary hover:bg-theme-surface/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="hidden lg:block h-10 w-[1px] bg-theme-border"></div>
                  <div className="flex flex-col items-center lg:items-end">
                    <div className="font-display font-black text-theme-primary text-xl sm:text-2xl tracking-tighter leading-none">
                      {filteredProducts.length}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-theme-text-muted">
                      Pieces Curated
                    </div>
                  </div>
                </div>
              </div>
   
              {/* Category Filter */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-text-muted">Collections</span>
                  <div className="h-[1px] flex-1 bg-theme-border"></div>
                </div>
                <div className="flex overflow-x-auto pb-4 sm:pb-2 gap-3 sm:gap-4 px-1 no-scrollbar -mx-4 px-4 sm:mx-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat || 'All')}
                      className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-[10px] sm:text-xs uppercase tracking-[0.2em] font-black transition-all whitespace-nowrap border-2 ${
                        activeCategory === (cat || 'All')
                          ? 'bg-theme-primary text-theme-primary-text border-theme-primary shadow-glow -translate-y-0.5'
                          : 'bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent hover:text-theme-text-primary'
                      }`}
                    >
                      {cat || 'Originals'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`grid gap-6 sm:gap-10 md:gap-12 ${
              gridCols === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 
              gridCols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {loading ? (
                 Array(3).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-4">
                      <div className="aspect-[3/4] bg-theme-accent/5 rounded-xl" />
                      <div className="h-4 w-2/3 bg-theme-accent/5 rounded" />
                      <div className="h-4 w-1/3 bg-theme-accent/5 rounded" />
                    </div>
                 ))
              ) : error ? (
                <div className="col-span-full py-20 text-center border border-rose/15 bg-rose/5 rounded-2xl">
                  <p className="text-rose font-serif italic">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 text-xs font-black uppercase tracking-widest text-theme-text-primary border-b border-theme-border cursor-pointer hover:text-theme-accent transition-colors"
                  >
                    Retry &rarr;
                  </button>
                </div>
              ) : (
                (filteredProducts || []).map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product as Product}
                    onClick={setSelectedProduct}
                  />
                ))
              )}
            </div>

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-32 border border-dashed luxury-border bg-theme-surface/30 rounded-3xl">
                <p className="text-theme-text-muted font-serif text-2xl italic">The collection awaits its next masterpiece.</p>
              </div>
            )}

            {/* Persistent Recently Viewed section */}
            {!loading && products.length > 0 && (
              <RecentlyViewed products={products} onSelectProduct={setSelectedProduct} />
            )}
          </div>

          {/* ==================== 2. HERITAGE TAB MODULE ==================== */}
          <div className={activeModule === 'heritage' ? 'block' : 'hidden'}>
            <div className="space-y-24">
              {/* The Story */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 text-left">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent">Our Legacy</span>
                    <h2 className="text-5xl font-serif font-bold text-theme-text-primary leading-tight">The Soul of<br />Anshi Collection</h2>
                  </div>
                  <p className="text-theme-text-secondary leading-relaxed font-medium">
                    Born from a deep passion for India's rich textile heritage, Anshi Collection was founded by <b>Richa Verma</b>. Our journey began with a vision to preserve the art of handcrafted ethnic wear, ensuring each piece resonates with timeless grace.
                  </p>
                  <div className="grid grid-cols-1 gap-8 py-6 border-y luxury-border">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent flex-shrink-0">
                        <span className="text-xs font-black">01</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-theme-accent mb-1">100% Genuine</h4>
                        <p className="text-xs text-theme-text-muted leading-relaxed">Every piece is verified for authentic silk and superior artisan-grade craftsmanship.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent flex-shrink-0">
                        <span className="text-xs font-black">02</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-theme-accent mb-1">Direct Trust</h4>
                        <p className="text-xs text-theme-text-muted leading-relaxed">No middlemen involved. You interact directly with the curator who brings these designs to life.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-theme-surface border border-theme-border p-12 lg:p-20 rounded-[40px] shadow-luxury flex flex-col items-center justify-center text-center space-y-6">
                   <div className="w-20 h-[1px] bg-theme-border" />
                   <h3 className="text-2xl font-serif italic text-theme-text-secondary leading-relaxed">"Every weave tells a story of heritage and passion."</h3>
                   <div className="space-y-1">
                     <p className="text-sm font-black uppercase tracking-widest text-theme-primary">Richa Verma</p>
                     <p className="text-[10px] uppercase tracking-tighter text-theme-text-muted">Founder & Curator</p>
                   </div>
                   <div className="w-20 h-[1px] bg-theme-border" />
                </div>
              </section>

              {/* How to Order Guide */}
              <section className="bg-theme-surface border border-theme-border text-theme-text-primary p-10 md:p-18 rounded-[60px] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-theme-accent/[0.03] -skew-x-12" />
                 
                 <div className="relative z-10 text-left">
                   <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-theme-accent">Order Process</span>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-theme-text-primary">How to Order</h2>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      {[
                        { step: '01', title: 'Curate', desc: 'Browse the digital boutique and click on any piece to view its specific craftsmanship details.' },
                        { step: '02', title: 'Inquire', desc: 'Click "Reserve on WhatsApp" to initiate a direct consultation with Richa Verma regarding size and availability.' },
                        { step: '03', title: 'Confirm', desc: 'Once your selection is finalized, we will provide payment details for a secure transaction through WhatsApp.' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-6 group p-8 rounded-3xl border border-theme-border bg-theme-bg/50">
                          <span className="text-4xl font-serif text-theme-accent/40 font-bold block">{item.step}</span>
                          <h4 className="text-xl font-serif font-bold text-theme-accent">{item.title}</h4>
                          <p className="text-theme-text-secondary text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                   </div>
                 </div>
              </section>
            </div>
          </div>

          {/* ==================== 3. CART TAB MODULE ==================== */}
          <div className={activeModule === 'cart' ? 'block' : 'hidden'}>
            <InlineCart onBackToGallery={() => setActiveModule('gallery')} />
          </div>

          {/* ==================== 4. ARTISAN TAB MODULE ==================== */}
          <div className={activeModule === 'artisan' ? 'block' : 'hidden'}>
            {isAdminUser ? (
              <div className="w-full relative">
                <Dashboard onViewBoutique={() => {
                  setActiveModule('gallery');
                  // Smoothly scroll to top of collection
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                }} />
              </div>
            ) : (
              <div className="max-w-xl mx-auto py-4">
                <Login onBackToBoutique={() => setActiveModule('gallery')} />
              </div>
            )}
          </div>

          {/* Shared Universal Footer (Hides when active logged-in full screen Admin Dashboard is active) */}
          {!(activeModule === 'artisan' && isAdminUser) && (
            <footer className="mt-20 pt-10 pb-28 border-t border-theme-border text-center space-y-6">
              <div className="brand-logo serif text-2xl tracking-[4px] text-theme-primary font-black opacity-60 flex items-center justify-center gap-2">
                <Sparkles size={24} fill="currentColor" className="text-theme-accent animate-pulse" />
                ANSHI COLLECTION
              </div>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => {
                    setActiveModule('artisan');
                    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[10px] uppercase tracking-[0.4em] font-black text-theme-accent hover:text-theme-primary transition-colors flex items-center gap-2 cursor-pointer outline-none" 
                  id="artisan-access-btn"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAdminUser ? 'bg-theme-primary' : 'bg-rose'} animate-pulse`}></span>
                  {isAdminUser ? 'Collector Dashboard' : 'Artisan Access'}
                </button>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-text-muted max-w-xs mx-auto">
                    102 AITA TOWER, AVILALA, TIRUPATI
                  </p>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-theme-text-muted/55">
                      Crafting Elegance Since 2026
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-tighter text-theme-text-muted/30">
                      &copy; 2026 Anshi Collection. All Rights Reserved.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            allProducts={products}
            onSelectProduct={setSelectedProduct}
            onClose={() => setSelectedProduct(null)} 
            onAddToInquiry={handleAddToInquiry}
          />
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigation Bar */}
      <FloatingNav 
        activeModule={activeModule}
        onModuleChange={(mod) => {
          setActiveModule(mod);
          // Scroll up the right content pane on mobile to match view height
          if (window.innerWidth < 1024) {
            document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        cartCount={cartCount}
        isAdminUser={isAdminUser}
      />

      {/* General Consult WhatsApp Button (Offset on mobile to float perfectly above the bottom navigation bar) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => window.open('https://wa.me/7979005226', '_blank')}
        className="fixed bottom-[84px] right-5 lg:bottom-6 lg:right-6 z-40 bg-[#25D366] text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center border border-white/10 hover:shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition-all cursor-pointer"
        title="Direct Consultation"
      >
        <MessageCircle size={22} fill="currentColor" />
      </motion.button>

      {/* Inquiry Cart Drawer Panel (Keep intact for backwards compatibility actions) */}
      <InquiryCart 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
      />
    </div>
  );
}
