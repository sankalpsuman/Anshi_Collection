import React from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { Product } from '../types';
import { productService } from '../services/productService';
import { motion } from 'motion/react';
import { MessageCircle, Instagram, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Temporary mock data for initial preview while Firebase connects
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Royal Maroon Saree',
    price: 12500,
    description: 'A masterpiece in fine silk, featuring intricate gold embroidery and a timeless silhouette.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
    category: 'Saree',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Golden Elegance Lehenga',
    price: 45000,
    description: 'Designed for the modern bride. Pure silk with hand-woven zardozi work.',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
    category: 'Lehenga',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Ivory Fusion Set',
    price: 18900,
    description: 'A contemporary take on traditional luxury. Perfect for evening soirées.',
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
    category: 'Fusion',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function Home() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
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

  React.useEffect(() => {
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
    setFilteredProducts(filtered);
  }, [products, activeCategory, searchQuery]);

  const categories = React.useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/30 font-sans noise-bg">
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

          {/* Editorial Promo Box */}
          <div className="mt-24 p-8 md:p-12 border border-dashed border-gold bg-gold/[0.03] flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-maroon rounded-full flex-shrink-0 flex items-center justify-center text-cream shadow-xl">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold">Custom Tailoring</h3>
                <p className="text-sm opacity-70 font-sans">Available for bespoke silhouette requests and sizing.</p>
              </div>
            </div>
            <button 
              onClick={() => window.open('https://wa.me/7979005226', '_blank')}
              className="text-xs uppercase tracking-[0.2em] font-bold text-maroon border-b border-maroon/40 pb-1 hover:border-maroon transition-all"
            >
              Consult an Artisan &rarr;
            </button>
          </div>

          {/* Legacy & User Guide Section */}
          <div className="mt-32 space-y-24 pb-20">
            {/* The Founders & Story */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                <div className="aspect-[4/5] overflow-hidden rounded-[40px] shadow-2xl relative">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" 
                    alt="Artisan Craftsmanship" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-maroon/10 mix-blend-multiply" />
                </div>
                <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-luxury max-w-[280px] border border-gold/10">
                   <p className="text-xs font-serif italic text-ink/60 mb-2">"We believe every weave is a bridge between our heritage and your future."</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-maroon">Richa Verma & Amit Kumar Verma</p>
                   <p className="text-[9px] uppercase tracking-tighter text-ink/30 mt-1">Founders, Anshi Collection</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-saffron">Our Legacy</span>
                  <h2 className="text-5xl font-serif font-bold text-ink leading-tight">The Soul of<br />Anshi Collection</h2>
                </div>
                <p className="text-ink/60 leading-relaxed font-medium">
                  Born from a shared passion for India's rich textile heritage, Anshi Collection was founded by <b>Richa Verma</b> and <b>Amit Kumar Verma</b>. Our journey began in a small workshop where we vowed to preserve the disappearing art of handcrafted ethnic wear.
                </p>
                <div className="grid grid-cols-2 gap-8 py-6 border-y luxury-border">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo mb-2">100% Genuine</h4>
                    <p className="text-xs text-ink/40 leading-relaxed">Every piece is verified for authentic silk and artisan-grade craftsmanship.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo mb-2">Direct Trust</h4>
                    <p className="text-xs text-ink/40 leading-relaxed">No middlemen. You interact directly with the curators who bring these dreams to life.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* How to Order Guide */}
            <section className="bg-ink text-white p-10 md:p-20 rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-rose/[0.03] -skew-x-12" />
               
               <div className="relative z-10">
                 <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose">Experience Luxury</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold">Acquiring an <span className="italic text-saffron">Anshi</span> Original</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                      { step: '01', title: 'Curate', desc: 'Browse our digital boutique and select the silhouette that resonates with your soul.' },
                      { step: '02', title: 'Inquire', desc: 'Click "Reserve" to connect with our artisan via WhatsApp for size and fabric consultation.' },
                      { step: '03', title: 'Craft & Receive', desc: 'Once confirmed, your masterpiece is prepared, quality-checked, and shipped to your doorstep.' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-6 group">
                        <span className="text-6xl font-serif text-white/5 group-hover:text-saffron/20 transition-colors duration-500 font-bold block">{item.step}</span>
                        <h4 className="text-xl font-serif font-bold text-saffron">{item.title}</h4>
                        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                 </div>

                 <div className="mt-16 pt-12 border-t border-white/10 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Personalized assistance is just a message away</p>
                    <button 
                      onClick={() => window.open('https://wa.me/7979005226', '_blank')}
                      className="wa-button !bg-saffron !text-ink hover:!bg-white shadow-[0_0_40px_rgba(244,196,48,0.3)] !py-6 !px-12 rounded-full"
                    >
                      <MessageCircle size={20} />
                      <span className="text-xs">Start Your Consultation</span>
                    </button>
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
