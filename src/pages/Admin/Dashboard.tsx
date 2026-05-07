import React from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import ProductForm from '../../components/Admin/ProductForm';
import AdminControlPanel from '../../components/Admin/AdminControlPanel';
import { Plus, LogOut, Edit2, Trash2, LayoutGrid, List, ShoppingBag, Sparkles, Users, UserRoundCog, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../../services/adminService';

export default function Dashboard() {
  const [user, setUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [authInitialized, setAuthInitialized] = React.useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'collection' | 'personnel'>('collection');
  const navigate = useNavigate();

  const loadingRef = React.useRef(loading);
  loadingRef.current = loading;
  const productsRef = React.useRef(products);
  productsRef.current = products;

  React.useEffect(() => {
    let isMounted = true;

    const authUnsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!isMounted) return;
      
      if (!authUser && isMounted) {
        setAuthInitialized(true);
        navigate('/admin', { replace: true });
        return;
      }

      if (authUser && isMounted) {
        try {
          const status = await adminService.checkAdminStatus(authUser.email || '');
          if (!status.authorized && isMounted) {
            await signOut(auth);
            navigate('/admin', { replace: true });
          } else if (isMounted) {
            setUser(authUser);
            setIsSuperAdmin(status.role === 'super_admin');
            setAuthInitialized(true);
          }
        } catch (err) {
          console.error("Authorization check failed:", err);
          if (isMounted) navigate('/admin', { replace: true });
        }
      }
    });

    const productsUnsubscribe = productService.subscribeToProducts(
      (data, metadata) => {
        if (!isMounted) return;
        setProducts(data);
        setLoading(false);
        setError(null);
        setIsSyncing(metadata.hasPendingWrites);
      },
      (err) => {
        if (!isMounted) return;
        console.error("Dashboard subscription error:", err);
        setError(`Connection failed: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    );

    // Safety timeout for loading
    const safetyTimeout = setTimeout(() => {
      if (!isMounted) return;
      if (loadingRef.current) {
        setLoading(false);
      }
    }, 10000); 

    return () => {
      isMounted = false;
      authUnsubscribe();
      productsUnsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [navigate]);

  const handleLogout = () => signOut(auth).then(() => navigate('/admin', { replace: true }));

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this piece from the collection?")) {
      await productService.deleteProduct(id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  if (!authInitialized || (loading && products.length === 0)) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
       <div className="flex flex-col items-center">
         <div className="relative w-20 h-20 mb-8">
           <div className="absolute inset-0 border-2 border-gold/10 rounded-full" />
           <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
             <ShoppingBag className="text-gold/30" size={24} />
           </div>
         </div>
         <h1 className="text-xs font-sans text-gold tracking-[0.4em] uppercase font-bold">Secure Access</h1>
         <div className="mt-4 flex space-x-1">
           <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
           <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
           <div className="w-1 h-1 bg-gold rounded-full animate-bounce" />
         </div>
       </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="max-w-md w-full bg-white p-12 text-center shadow-xl border border-red-100">
        <h2 className="text-2xl font-serif text-maroon mb-4">Access Issue</h2>
        <p className="text-ink/60 mb-8 font-sans">{error}</p>
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full luxury-gradient text-white py-4 font-bold uppercase tracking-widest text-xs"
          >
            Retry Connection
          </button>
          <button 
            onClick={handleLogout}
            className="w-full border border-gold/30 text-gold py-4 font-bold uppercase tracking-widest text-xs"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream selection:bg-rose/20">
      {/* Navigation - Glassmorphism */}
      <nav className="bg-white/70 backdrop-blur-2xl border-b luxury-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-row justify-between items-center py-4 h-20 sm:h-24">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link to="/" className="brand-logo serif text-lg sm:text-2xl tracking-[2px] sm:tracking-[4px] text-maroon font-black whitespace-nowrap flex items-center gap-2">
                <Sparkles size={20} fill="currentColor" className="text-saffron" />
                ANSHI
              </Link>
              <div className="h-6 w-[1px] bg-gold/20" />
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-indigo/40 bg-indigo/5 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">Dashboard</span>
                {isSyncing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-rose/5 rounded-full border border-rose/10"
                  >
                    <div className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                    <span className="text-[9px] text-rose uppercase tracking-widest font-black">Cloud Sync</span>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pr-1">
              {isSuperAdmin && (
                <div className="flex items-center bg-cream/50 p-1 rounded-2xl border border-gold/10 shrink-0">
                  <button
                    onClick={() => setActiveTab('collection')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === 'collection' ? 'bg-indigo text-white shadow-lg' : 'text-indigo/40 hover:text-indigo'
                    }`}
                  >
                    <ShoppingBag size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Collection</span>
                    <span className="sm:hidden">Items</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('personnel')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === 'personnel' ? 'bg-indigo text-white shadow-lg' : 'text-indigo/40 hover:text-indigo'
                    }`}
                  >
                    <UserRoundCog size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Personnel</span>
                    <span className="sm:hidden">Team</span>
                  </button>
                </div>
              )}
              {activeTab === 'collection' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }}
                  className="wa-button !bg-indigo !text-cream shadow-2xl !py-2.5 sm:!py-4 rounded-xl !px-3 sm:!px-8 text-[9px] sm:text-xs whitespace-nowrap shrink-0"
                >
                  <Plus size={16} className="font-black shrink-0" />
                  <span className="hidden sm:inline">Add Piece</span>
                  <span className="sm:hidden">Add</span>
                </motion.button>
              )}
              <button 
                onClick={handleLogout} 
                className="p-3 sm:p-4 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all shadow-lg shadow-rose/5 shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {activeTab === 'collection' ? (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-20 gap-8 sm:gap-10"
            >
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-4xl sm:text-6xl font-serif text-ink font-bold tracking-tight">Active <span className="text-rose italic font-medium">Collection</span></h2>
                <p className="text-ink/40 text-base sm:text-lg font-medium max-w-xl">Curate your legacy. Add, refine, or archive pieces from your global boutique.</p>
              </div>
              <div className="flex items-center gap-2 bg-white/50 p-2 rounded-2xl border luxury-border self-start">
                <button className="p-3 sm:p-4 bg-indigo text-white rounded-xl shadow-xl shadow-indigo/20"><LayoutGrid size={18} /></button>
                <button className="p-3 sm:p-4 text-ink/20 hover:text-indigo transition-colors"><List size={18} /></button>
              </div>
            </motion.div>

            {/* Product List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-10">
              <AnimatePresence mode="popLayout">
                {(products || []).map((product) => {
                  const stableKey = product.publicId || product.id;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={stableKey}
                      className="glass-card p-0 group flex flex-col h-full rounded-3xl overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(45,62,80,0.15)]"
                    >
                      <div className="aspect-[4/5] overflow-hidden relative">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                        
                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[8px] text-white font-black uppercase tracking-widest">
                          ID: {product.id.substring(0, 8)}
                        </div>
                      </div>

                      <div className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-[10px] uppercase tracking-[0.3em] text-saffron font-black mb-3">{product.category || 'Legacy'}</h3>
                          <h4 className="text-2xl font-serif text-ink font-bold leading-tight group-hover:text-maroon transition-colors line-clamp-2">{product.name}</h4>
                        </div>
                        <div className="mt-8 flex items-center justify-between">
                          <p className="text-indigo font-display font-black text-xl">₹{product.price.toLocaleString('en-IN')}</p>
                          <div className="flex gap-2">
                             <button
                              onClick={() => handleEdit(product)}
                              className="p-3 bg-indigo/5 text-indigo rounded-xl hover:bg-indigo hover:text-white transition-all shadow-xl shadow-indigo/5"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-3 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all shadow-xl shadow-rose/5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {products.length === 0 && (
              <div className="text-center py-32 border-2 border-dashed border-gold/20 rounded-xl bg-white/50">
                <div className="max-w-xs mx-auto space-y-6">
                  <ShoppingBag size={48} className="mx-auto text-gold/20" />
                  <p className="text-charcoal/40 font-serif text-xl italic">The collection is currently empty.</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold/40 pb-1"
                  >
                    Add your first piece
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl sm:text-6xl font-serif text-ink font-bold tracking-tight">Admin <span className="text-saffron italic font-medium">Control</span></h2>
              <p className="text-ink/40 text-base sm:text-lg font-medium leading-relaxed">
                Manage the curators and artisans who breathe life into Anshi Collection. Ensure the security of your heritage boutique.
              </p>
            </div>
            <AdminControlPanel />
          </motion.div>
        )}
      </main>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-3xl font-serif text-charcoal mb-8 pb-4 border-b border-gold/10">
                {editingProduct ? 'Edit Masterpiece' : 'New Collection Piece'}
              </h3>
              <ProductForm
                initialData={editingProduct}
                onSuccess={() => { setIsFormOpen(false); setEditingProduct(undefined); }}
                onCancel={() => { setIsFormOpen(false); setEditingProduct(undefined); }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
