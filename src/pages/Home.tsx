import React from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { Product } from '../types';
import { productService } from '../services/productService';
import { motion } from 'motion/react';
import { MessageCircle, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

// No temporary mock data - fetching directly from Firebase

export default function Home() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

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
        (p.description && p.description.toLowerCase().includes(lowerQuery))
      );
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  const categories = React.useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/30 font-sans">
      <div className="flex flex-col lg:flex-row min-h-screen silk-gradient">
        {/* Sidebar - Desktop Only sticky, Mobile Hero */}
        <aside className="lg:w-[480px] lg:border-r luxury-border lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between bg-white lg:bg-transparent z-20 overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-saffron/10 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-rose/5 rounded-full blur-3xl -z-10" />

          <div className="p-8 sm:p-12 md:p-16 space-y-12 md:space-y-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link to="/" className="brand-logo serif text-4xl tracking-[6px] text-maroon border-b-4 border-saffron pb-3 inline-block font-black">
                ANSHI COLLECTION
              </Link>
            </motion.div>
            
            <div className="space-y-8 md:space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="text-[10px] uppercase tracking-[0.4em] text-indigo font-bold block mb-4 border-l-2 border-indigo pl-3">
                  Est. 2024 — The Artisan Label
                </span>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif text-ink leading-[1] md:leading-[0.85] mb-8 font-bold">
                  Wear<br />
                  <span className="text-rose italic font-medium">Stories</span><br />
                  <span className="text-3xl md:text-5xl block mt-4 border-t luxury-border pt-4 text-ink/40 font-light">Not Just Silk.</span>
                </h1>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-base font-sans leading-relaxed text-ink/60 max-w-sm font-medium"
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
                  className="wa-button !bg-indigo !text-cream hover:!bg-maroon shadow-2xl w-full sm:w-auto text-center font-black tracking-[0.3em] py-5 px-10 text-xs"
                >
                  Explore Collection
                </motion.button>
                <div className="flex items-center space-x-6 pt-6">
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://instagram.com', '_blank') }} className="text-maroon/40 hover:text-rose transition-all hover:scale-125">
                    <Instagram size={22} />
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://wa.me/7979005226', '_blank') }} className="text-maroon/40 hover:text-indigo transition-all hover:scale-125">
                    <MessageCircle size={22} />
                  </a>
                  <span className="h-[1px] w-12 bg-gold/30"></span>
                  <span className="text-[10px] uppercase tracking-widest text-ink/30 font-bold">Social</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 md:p-16 pt-8 border-t luxury-border mt-12 lg:mt-0 bg-white/20 backdrop-blur-sm">
            <Link to="/admin" className="text-[10px] uppercase tracking-widest font-black text-rose hover:text-maroon transition-colors flex items-center gap-2">
              <span className="w-2 h-2 bg-rose rounded-full animate-pulse"></span>
              Artisan Access
            </Link>
            <p className="text-[10px] uppercase tracking-widest text-ink/20 mt-3 font-semibold tracking-[0.2em]">© 2024 Anshi Collection</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="collection" className="flex-1 p-6 sm:p-8 md:p-12 lg:pl-16">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col space-y-10 mb-16 sm:mb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white/40 p-6 rounded-2xl border border-white/60 backdrop-blur-xl shadow-xl shadow-indigo/5">
              <div className="w-full md:max-w-xl relative group">
                <input 
                  type="text" 
                  className="search-bar pl-14 rounded-xl border-none focus:ring-4 focus:ring-rose/5" 
                  placeholder="What captures your eye today?..." 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-rose transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-10 h-[2px] bg-saffron/30"></span>
                <div className="font-display font-bold text-indigo text-sm uppercase tracking-widest">
                  {filteredProducts.length} <span className="text-ink/30 font-medium">Pieces</span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-4 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat || 'All')}
                  className={`px-8 py-4 rounded-xl text-xs uppercase tracking-[0.2em] font-black transition-all whitespace-nowrap border-2 ${
                    activeCategory === (cat || 'All')
                      ? 'bg-ink text-white border-ink shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] -translate-y-1 scale-105'
                      : 'bg-white text-ink/40 border-transparent hover:border-saffron hover:text-ink'
                  }`}
                >
                  {cat || 'Originals'}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12">
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
              filteredProducts.map((product) => (
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

          {/* Legacy & User Guide Section */}
          <div className="mt-32 space-y-24 pb-20">
            {/* The Story */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-saffron">Our Legacy</span>
                  <h2 className="text-5xl font-serif font-bold text-ink leading-tight">The Soul of<br />Anshi Collection</h2>
                </div>
                <p className="text-ink/60 leading-relaxed font-medium">
                  Born from a deep passion for India's rich textile heritage, Anshi Collection was founded by <b>Richa Verma</b>. Our journey began with a vision to preserve the art of handcrafted ethnic wear, ensuring each piece resonates with timeless grace.
                </p>
                <div className="grid grid-cols-1 gap-8 py-6 border-y luxury-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo/5 flex items-center justify-center text-indigo flex-shrink-0">
                      <span className="text-xs font-black">01</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-indigo mb-1">100% Genuine</h4>
                      <p className="text-xs text-ink/40 leading-relaxed">Every piece is verified for authentic silk and superior artisan-grade craftsmanship.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo/5 flex items-center justify-center text-indigo flex-shrink-0">
                      <span className="text-xs font-black">02</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-indigo mb-1">Direct Trust</h4>
                      <p className="text-xs text-ink/40 leading-relaxed">No middlemen involved. You interact directly with the curator who brings these designs to life.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-12 lg:p-20 rounded-[40px] shadow-luxury border border-gold/10 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-20 h-[1px] bg-gold/30" />
                 <h3 className="text-2xl font-serif italic text-ink/60 leading-relaxed">"Every weave tells a story of heritage and passion."</h3>
                 <div className="space-y-1">
                   <p className="text-sm font-black uppercase tracking-widest text-maroon">Richa Verma</p>
                   <p className="text-[10px] uppercase tracking-tighter text-ink/30">Founder & Curator</p>
                 </div>
                 <div className="w-20 h-[1px] bg-gold/30" />
              </div>
            </section>

            {/* How to Order Guide */}
            <section className="bg-ink text-white p-10 md:p-20 rounded-[60px] shadow-2xl relative overflow-hidden">
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
        </main>
      </div>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Floating Action */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.open('https://wa.me/7979005226', '_blank')}
        className="fixed bottom-8 right-8 z-40 bg-[#25D366] text-white p-5 rounded-full shadow-2xl flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  );
}
