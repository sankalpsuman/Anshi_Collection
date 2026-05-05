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
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [products]);

  React.useEffect(() => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredProducts(filtered);
  }, [products, activeCategory, searchQuery]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/30 font-sans">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - Desktop Only sticky, Mobile Hero */}
        <aside className="lg:w-[400px] lg:border-r luxury-border p-6 sm:p-8 md:p-12 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between bg-white lg:bg-transparent z-20">
          <div className="space-y-8 md:space-y-12">
            <Link to="/" className="brand-logo serif text-3xl md:text-4xl tracking-[4px] text-maroon border-b-2 border-gold pb-2 inline-block">
              ANSHI
            </Link>
            
            <div className="space-y-6 md:space-y-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-ink/50 block mb-3 md:mb-4">Est. 2024 — Handcrafted</span>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-ink leading-[1.1] md:leading-[0.9] mb-4 md:mb-6">
                  Timeless<br />
                  <i className="font-normal opacity-80">Elegance</i>
                </h1>
              </div>
              
              <p className="text-sm font-sans leading-relaxed text-ink/70 max-w-sm">
                Discover our curated collection of luxury ethnic wear, designed for the modern woman who values tradition and style.
              </p>

              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => {
                    const el = document.getElementById('collection');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="wa-button !bg-transparent border border-maroon !text-maroon hover:!bg-maroon hover:!text-cream transition-all w-full sm:w-auto text-center font-bold tracking-widest"
                >
                  View Collection
                </button>
                <div className="flex items-center space-x-4 pt-4">
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://instagram.com', '_blank') }} className="text-maroon/60 hover:text-maroon transition-colors">
                    <Instagram size={20} />
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://wa.me/7979005226', '_blank') }} className="text-maroon/60 hover:text-maroon transition-colors">
                    <MessageCircle size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t luxury-border mt-12 lg:mt-0">
            <Link to="/admin" className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-maroon transition-colors">Artisan Portal</Link>
            <p className="text-[10px] uppercase tracking-widest text-ink/30 mt-2">© 2024 Anshi Collections. All rights reserved.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="collection" className="flex-1 p-6 sm:p-8 md:p-12 lg:pl-16">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col space-y-8 mb-12 sm:mb-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-1 md:px-2">
              <div className="w-full md:max-w-md relative group">
                <input 
                  type="text" 
                  className="search-bar pl-10" 
                  placeholder="Find your aesthetic..." 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 group-focus-within:text-gold transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
              <div className="hidden md:block font-serif italic text-ink/60 text-sm">
                Showing {filteredProducts.length} unique pieces
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-3 px-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat || 'All')}
                  className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap border ${
                    activeCategory === (cat || 'All')
                      ? 'bg-maroon text-white border-maroon shadow-lg'
                      : 'bg-white text-ink/60 border-gold/20 hover:border-gold'
                  }`}
                >
                  {cat || 'Uncategorized'}
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
          <div className="mt-24 p-8 md:p-12 border border-dashed border-gold bg-gold/[0.03] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-maroon rounded-full flex-shrink-0" />
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
