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
      className="mt-20 border-t border-gold/15 pt-12 space-y-6 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose">Recently Visited Collections</span>
        <div className="h-[1px] flex-1 bg-gold/10"></div>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0">
        {viewedProducts.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelectProduct(p)}
            className="group cursor-pointer bg-white dark:bg-dark-card border border-gold/10 dark:border-white/5 rounded-3xl p-3 w-40 hover:-translate-y-1.5 transition-all duration-350 shadow-sm hover:shadow-lg flex-shrink-0"
          >
            <div className="aspect-[4/5] rounded-2.5xl overflow-hidden bg-ink/5 dark:bg-white/5">
              <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="mt-3.5 space-y-1 overflow-hidden">
              <h4 className="font-serif font-black text-xs text-ink dark:text-dark-text group-hover:text-gold transition-colors truncate">{p.name}</h4>
              <p className="text-[10px] font-mono font-black text-[#6366f1] dark:text-gold">₹{p.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [gridCols, setGridCols] = React.useState(4);

  // Inquiry Cart States
  const [isInquiryOpen, setIsInquiryOpen] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  const [isAdminUser, setIsAdminUser] = React.useState(false);

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
      },
      (err) => {
        console.error("Subscription error:", err);
        setError("Unable to connect to the gallery. Please try again later.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

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
    const productId = params.get('product');
    if (productId && products.length > 0 && !selectedProduct) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
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
    <div className="min-h-screen bg-cream dark:bg-dark-surface selection:bg-gold/30 font-sans transition-colors duration-300">
      <div className="flex flex-col lg:flex-row min-h-screen silk-gradient">
        {/* Sidebar - Desktop Only sticky, Mobile Hero */}
        <aside className="lg:w-[420px] xl:w-[480px] lg:border-r luxury-border lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between bg-white dark:bg-dark-surface/50 lg:bg-transparent z-20 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-12 -left-12 lg:-top-24 lg:-left-24 w-48 h-48 lg:w-64 lg:h-64 bg-saffron/10 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/2 -right-16 lg:-right-32 w-64 h-64 lg:w-80 lg:h-80 bg-rose/5 rounded-full blur-3xl -z-10" />

          <div className="p-6 sm:p-10 lg:p-12 xl:p-16 space-y-10 lg:space-y-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between"
            >
              <Link to="/" className="brand-logo serif text-3xl sm:text-4xl tracking-[4px] sm:tracking-[6px] text-maroon dark:text-saffron border-b-4 border-saffron dark:border-rose pb-2 sm:pb-3 flex items-center gap-3 font-black">
                <Sparkles className="text-saffron w-8 h-8 sm:w-10 sm:h-10 shrink-0" fill="currentColor" />
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
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo dark:text-gold font-bold block mb-3 sm:mb-4 border-l-2 border-indigo dark:border-gold pl-3">
                  Est. 2026 — The Artisan Label
                </span>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif text-ink dark:text-dark-text leading-[1] lg:leading-[0.85] mb-6 sm:mb-8 font-bold">
                  Wear<br />
                  <span className="text-rose italic font-medium">Stories</span><br />
                  <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl block mt-4 border-t luxury-border pt-4 text-ink/40 dark:text-dark-muted font-light">Not Just Silk.</span>
                </h1>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-sm sm:text-base font-sans leading-relaxed text-ink/60 dark:text-dark-text/60 max-w-sm font-medium"
              >
                A sanctuary of handcrafted ethnic silhouettes. We curate threads of heritage into modern masterpieces for the discerning soul.
              </motion.p>

              <div className="flex flex-col space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const el = document.getElementById('collection');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="wa-button !bg-indigo !text-cream hover:!bg-maroon shadow-2xl w-full lg:w-max text-center font-black tracking-[0.3em] py-4 sm:py-5 px-8 sm:px-10 text-xs"
                >
                  Explore Collection
                </motion.button>
                <div className="flex items-center space-x-6 pt-4 sm:pt-6">
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://instagram.com', '_blank') }} className="text-maroon/40 hover:text-rose transition-all hover:scale-125 p-2 -ml-2">
                    <Instagram size={20} />
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://wa.me/7979005226', '_blank') }} className="text-maroon/40 hover:text-indigo transition-all hover:scale-125 p-2">
                    <MessageCircle size={20} />
                  </a>
                  <span className="h-[1px] w-8 sm:w-12 bg-gold/30"></span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/30 font-bold">Social</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12 xl:p-16 pt-8 border-t luxury-border mt-8 lg:mt-0 bg-white/20 backdrop-blur-sm self-end w-full">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/20 font-semibold tracking-[0.2em]">{`© 2026 Anshi Collection`}</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="collection" className="flex-1 p-4 sm:p-8 md:p-10 lg:p-12 lg:pl-16">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col space-y-6 sm:space-y-10 mb-12 sm:mb-20">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 luxury-border bg-white/60 dark:bg-dark-card/60 p-4 sm:p-6 rounded-3xl border border-white/80 dark:border-white/5 backdrop-blur-2xl shadow-2xl shadow-indigo/5">
              <div className="w-full lg:max-w-2xl relative group">
                <input 
                  type="text" 
                  className="w-full bg-cream/50 dark:bg-dark-surface/50 backdrop-blur-sm border-2 border-gold/10 dark:border-gold/5 rounded-2xl pl-14 sm:pl-16 pr-6 py-4 sm:py-5 text-sm sm:text-base outline-none focus:border-rose/50 dark:focus:border-gold focus:ring-4 focus:ring-rose/5 transition-all placeholder:text-ink/20 dark:placeholder:text-white/10 font-medium dark:text-dark-text"
                  placeholder="Masterpiece name, silhouette, or product code... (e.g. Kurta)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-rose dark:group-focus-within:text-gold transition-colors">
                  <Search size={24} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="flex items-center gap-4 self-center lg:self-center pr-2">
                <div className="hidden lg:flex items-center gap-2 bg-cream/50 dark:bg-dark-surface/50 p-1 rounded-xl border border-gold/10 dark:border-gold/5 mr-4">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setGridCols(num)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                        gridCols === num 
                          ? 'bg-ink text-white dark:bg-gold dark:text-ink shadow-lg' 
                          : 'text-indigo/30 dark:text-dark-muted hover:text-indigo hover:bg-white dark:hover:text-dark-text dark:hover:bg-dark-card'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="hidden lg:block h-10 w-[1px] bg-gold/10"></div>
                <div className="flex flex-col items-center lg:items-end">
                  <div className="font-display font-black text-indigo dark:text-gold text-xl sm:text-2xl tracking-tighter leading-none">
                    {filteredProducts.length}
                  </div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-ink/20 dark:text-dark-muted">
                    Pieces Curated
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo/30 dark:text-gold/30">Collections</span>
                <div className="h-[1px] flex-1 bg-gold/10"></div>
              </div>
              <div className="flex overflow-x-auto pb-4 sm:pb-2 gap-3 sm:gap-4 px-1 no-scrollbar -mx-4 px-4 sm:mx-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat || 'All')}
                    className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-[10px] sm:text-xs uppercase tracking-[0.2em] font-black transition-all whitespace-nowrap border-2 ${
                      activeCategory === (cat || 'All')
                        ? 'bg-ink text-white border-ink dark:bg-gold dark:text-ink dark:border-gold shadow-2xl -translate-y-1 scale-105'
                        : 'bg-white text-ink/40 border-gold/5 dark:bg-dark-card dark:text-dark-muted dark:border-white/5 hover:border-saffron hover:text-ink hover:shadow-lg dark:hover:text-dark-text'
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
                    <div className="aspect-[3/4] bg-gold/5 rounded-sm" />
                    <div className="h-4 w-2/3 bg-gold/5" />
                    <div className="h-4 w-1/3 bg-gold/5" />
                  </div>
               ))
            ) : error ? (
              <div className="col-span-full py-20 text-center border border-rose/10 bg-rose/5 rounded-2xl">
                <p className="text-rose font-serif italic">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-xs font-black uppercase tracking-widest text-ink border-b border-ink/20"
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
            <div className="text-center py-32 border border-dashed luxury-border bg-ink/[0.02]">
              <p className="text-ink/30 font-serif text-2xl italic">The collection awaits its next masterpiece.</p>
            </div>
          )}

          {/* Persistent Recently Viewed section */}
          {!loading && products.length > 0 && (
            <RecentlyViewed products={products} onSelectProduct={setSelectedProduct} />
          )}

          {/* Legacy & User Guide Section */}
          <div className="mt-32 space-y-24 pb-20">
            {/* The Story */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-saffron">Our Legacy</span>
                  <h2 className="text-5xl font-serif font-bold text-ink dark:text-dark-text leading-tight">The Soul of<br />Anshi Collection</h2>
                </div>
                <p className="text-ink/60 dark:text-dark-text/60 leading-relaxed font-medium">
                  Born from a deep passion for India's rich textile heritage, Anshi Collection was founded by <b>Richa Verma</b>. Our journey began with a vision to preserve the art of handcrafted ethnic wear, ensuring each piece resonates with timeless grace.
                </p>
                <div className="grid grid-cols-1 gap-8 py-6 border-y luxury-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo/5 dark:bg-gold/5 flex items-center justify-center text-indigo dark:text-gold flex-shrink-0">
                      <span className="text-xs font-black">01</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-indigo dark:text-gold mb-1">100% Genuine</h4>
                      <p className="text-xs text-ink/40 dark:text-dark-muted leading-relaxed">Every piece is verified for authentic silk and superior artisan-grade craftsmanship.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo/5 dark:bg-gold/5 flex items-center justify-center text-indigo dark:text-gold flex-shrink-0">
                      <span className="text-xs font-black">02</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-indigo dark:text-gold mb-1">Direct Trust</h4>
                      <p className="text-xs text-ink/40 dark:text-dark-muted leading-relaxed">No middlemen involved. You interact directly with the curator who brings these designs to life.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-card p-12 lg:p-20 rounded-[40px] shadow-luxury border border-gold/10 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-20 h-[1px] bg-gold/30" />
                 <h3 className="text-2xl font-serif italic text-ink/60 dark:text-dark-text/60 leading-relaxed">"Every weave tells a story of heritage and passion."</h3>
                 <div className="space-y-1">
                   <p className="text-sm font-black uppercase tracking-widest text-maroon dark:text-gold">Richa Verma</p>
                   <p className="text-[10px] uppercase tracking-tighter text-ink/30 dark:text-dark-muted">Founder & Curator</p>
                 </div>
                 <div className="w-20 h-[1px] bg-gold/30" />
              </div>
            </section>

            {/* How to Order Guide */}
            <section className="bg-ink dark:bg-dark-card text-white p-10 md:p-20 rounded-[60px] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-rose/[0.03] -skew-x-12" />
               
               <div className="relative z-10">
                 <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose">Order Process</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold">How to Order</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                      { step: '01', title: 'Curate', desc: 'Browse the digital boutique and click on any piece to view its specific craftsmanship details.' },
                      { step: '02', title: 'Inquire', desc: 'Click "Reserve on WhatsApp" to initiate a direct consultation with Richa Verma regarding size and availability.' },
                      { step: '03', title: 'Confirm', desc: 'Once your selection is finalized, we will provide payment details for a secure transaction through WhatsApp.' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-6 group p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <span className="text-4xl font-serif text-saffron/40 font-bold block">{item.step}</span>
                        <h4 className="text-xl font-serif font-bold text-saffron">{item.title}</h4>
                        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                 </div>
               </div>
            </section>
          </div>

          <footer className="mt-20 pt-10 pb-20 border-t border-gold/10 text-center space-y-6">
            <div className="brand-logo serif text-2xl tracking-[4px] text-maroon dark:text-gold font-black opacity-30 flex items-center justify-center gap-2">
              <Sparkles size={24} fill="currentColor" className="text-saffron" />
              ANSHI COLLECTION
            </div>
            <div className="flex flex-col items-center gap-4">
              <Link to="/admin" className="text-[10px] uppercase tracking-[0.4em] font-black text-rose hover:text-maroon dark:hover:text-gold transition-colors flex items-center gap-2" id="artisan-access-btn">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdminUser ? 'bg-indigo dark:bg-gold' : 'bg-rose'} animate-pulse`}></span>
                {isAdminUser ? 'Collector Dashboard' : 'Artisan Access'}
              </Link>
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/40 dark:text-dark-muted max-w-xs mx-auto">
                  102 AITA TOWER, AVILALA, TIRUPATI
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-ink/20 dark:text-white/10">
                    Crafting Elegance Since 2026
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-tighter text-ink/10 dark:text-white/5">
                    &copy; 2026 Anshi Collection. All Rights Reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
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

      {/* FLOATING ACTION DOCK MENU */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3.5">
        
        {/* Toggle Cart List */}
        <AnimatePresence>
          {cartCount > 0 ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsInquiryOpen(true)}
              className="flex items-center gap-2.5 px-6 py-4.5 bg-indigo dark:bg-gold text-white dark:text-ink font-sans text-xs uppercase font-black tracking-widest rounded-full shadow-[0_15px_30px_rgba(99,102,241,0.25)] relative border border-gold/15 dark:border-white/5 cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>Inquiry List</span>
              <span className="bg-rose text-white text-[9.5px] font-black w-5.5 h-5.5 flex items-center justify-center rounded-full ml-1 animate-pulse">
                {cartCount}
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* General Consult WhatsApp Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.open('https://wa.me/7979005226', '_blank')}
          className="bg-[#25D366] text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center border border-white/10 hover:shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition-all cursor-pointer"
          title="Direct Consultation"
        >
          <MessageCircle size={22} fill="currentColor" />
        </motion.button>
      </div>

      {/* Inquiry Cart Drawer Panel */}
      <InquiryCart 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
      />
    </div>
  );
}
