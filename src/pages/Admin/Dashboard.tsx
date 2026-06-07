import React from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import ProductForm from '../../components/Admin/ProductForm';
import AdminControlPanel from '../../components/Admin/AdminControlPanel';
import ThemeToggle from '../../components/ThemeToggle';
import { Plus, LogOut, Edit2, Trash2, LayoutGrid, List, ShoppingBag, Sparkles, Users, UserRoundCog, ShieldCheck, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../../services/adminService';

interface DashboardProps {
  onViewBoutique?: () => void;
}

export default function Dashboard({ onViewBoutique }: DashboardProps = {}) {
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
  const [layoutMode, setLayoutMode] = React.useState<'grid' | 'list'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
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

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await productService.deleteProduct(deleteConfirmId);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleBoutiqueRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewBoutique) {
      onViewBoutique();
    } else {
      navigate('/');
    }
  };

  if (!authInitialized || (loading && products.length === 0)) return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg transition-colors duration-300">
       <div className="flex flex-col items-center">
         <div className="relative w-20 h-20 mb-8">
           <div className="absolute inset-0 border-2 border-theme-border rounded-full" />
           <div className="absolute inset-0 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
             <ShoppingBag className="text-theme-accent/30" size={24} />
           </div>
         </div>
         <h1 className="text-xs font-sans text-theme-accent tracking-[0.4em] uppercase font-bold">Secure Access</h1>
         <div className="mt-4 flex space-x-1">
           <div className="w-1 h-1 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
           <div className="w-1 h-1 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
           <div className="w-1 h-1 bg-theme-accent rounded-full animate-bounce" />
         </div>
       </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-theme-surface p-12 text-center shadow-xl border border-theme-border rounded-[40px]">
        <h2 className="text-2xl font-serif text-theme-primary mb-4">Access Issue</h2>
        <p className="text-theme-text-secondary mb-8 font-sans">{error}</p>
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-theme-primary text-theme-primary-text py-4 font-bold uppercase tracking-widest text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all"
          >
            Retry Connection
          </button>
          <button 
            onClick={handleLogout}
            className="w-full border border-theme-border text-theme-accent py-4 font-bold uppercase tracking-widest text-xs rounded-xl cursor-pointer hover:bg-theme-accent/5 transition-all"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-bg selection:bg-rose/20 transition-colors duration-300">
      {/* Dynamic Deletion Modal Overlay */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-theme-bg p-8 rounded-[32px] border border-theme-border shadow-luxury max-w-sm w-full text-center space-y-6 z-10"
            >
              <Trash2 className="mx-auto text-rose animate-bounce" size={40} />
              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-theme-text-primary">Remove Masterpiece</h4>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  Are you sure you want to remove this piece from the active gallery collection? This action is permanent.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 border border-theme-border rounded-xl text-[10px] uppercase tracking-widest font-black text-theme-text-secondary cursor-pointer hover:bg-theme-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-rose text-white rounded-xl text-[10px] uppercase tracking-widest font-black cursor-pointer hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation - Glassmorphism */}
      <nav className="bg-theme-surface/70 backdrop-blur-2xl border-b luxury-border sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center py-4 md:h-24 gap-4">
            {/* Logo/AppName and Mobile Controls Row */}
            <div className="flex flex-row justify-between items-center w-full md:w-auto">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <Link 
                  to="/" 
                  onClick={handleBoutiqueRedirect}
                  className="brand-logo serif text-lg sm:text-2xl tracking-[2px] sm:tracking-[4px] text-theme-primary font-black whitespace-nowrap flex items-center gap-2"
                >
                  <Sparkles size={24} fill="currentColor" className="text-theme-accent shrink-0" />
                  ANSHI
                </Link>
                <div className="h-6 w-[1px] bg-theme-border" />
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-theme-text-muted bg-theme-accent/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">Dashboard</span>
                </div>
              </div>

              {/* Mobile utilities (rendered inside logo row for maximum space efficiency) */}
              <div className="flex md:hidden items-center gap-2">
                <Link
                  to="/"
                  onClick={handleBoutiqueRedirect}
                  className="p-3 bg-theme-primary/10 text-theme-primary rounded-xl hover:bg-theme-primary hover:text-theme-primary-text transition-all shadow-lg shrink-0 cursor-pointer flex items-center justify-center animate-premium-glow"
                  title="Boutique View"
                >
                  <ShoppingBag size={16} />
                </Link>
                <ThemeToggle />
                <button 
                  onClick={handleLogout} 
                  className="p-3 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all shadow-lg shrink-0 cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
            
            {/* Tabs and Actions Row */}
            <div className="flex flex-row items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto">
              {isSuperAdmin && (
                <div className="flex items-center bg-theme-bg/50 p-1 rounded-2xl border border-theme-border shrink-0">
                  <button
                    onClick={() => setActiveTab('collection')}
                    className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'collection' ? 'bg-theme-primary text-theme-primary-text shadow-lg' : 'text-theme-text-secondary/60 hover:text-theme-primary'
                    }`}
                  >
                    <ShoppingBag size={14} className="shrink-0" />
                    <span>Collection</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('personnel')}
                    className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'personnel' ? 'bg-theme-primary text-theme-primary-text shadow-lg' : 'text-theme-text-secondary/60 hover:text-theme-primary'
                    }`}
                  >
                    <UserRoundCog size={14} className="shrink-0" />
                    <span>Personnel</span>
                  </button>
                </div>
              )}
              {activeTab === 'collection' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }}
                  className="wa-button !bg-theme-primary !text-theme-primary-text shadow-2xl !py-2.5 rounded-xl !px-4 text-[9px] sm:text-xs whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={16} className="font-black shrink-0" />
                  <span>Add Piece</span>
                </motion.button>
              )}
              {/* Desktop-only utilities */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/"
                  onClick={handleBoutiqueRedirect}
                  className="px-5 py-3 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-theme-primary-text rounded-xl transition-all shadow-lg shrink-0 cursor-pointer flex items-center gap-2 text-xs font-black uppercase tracking-wider animate-premium-glow"
                  title="Boutique View"
                >
                  <ShoppingBag size={14} className="shrink-0" />
                  <span>Boutique View</span>
                </Link>
                <ThemeToggle />
                <button 
                  onClick={handleLogout} 
                  className="p-3 sm:p-4 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all shadow-lg shadow-rose/5 shrink-0 cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
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
                <h2 className="text-4xl sm:text-6xl font-serif text-theme-text-primary font-bold tracking-tight">Active <span className="text-theme-accent italic font-medium">Collection</span></h2>
                <p className="text-theme-text-muted text-base sm:text-lg font-medium max-w-xl">Curate your legacy. Add, refine, or archive pieces from your global boutique.</p>
              </div>
              <div className="flex items-center gap-2 bg-theme-surface/50 p-2 rounded-2xl border luxury-border self-start">
                <button 
                  onClick={() => setLayoutMode('grid')}
                  className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                    layoutMode === 'grid' 
                      ? 'bg-theme-primary text-theme-primary-text shadow-xl' 
                      : 'text-theme-text-muted/60 hover:text-theme-primary'
                  }`}
                  aria-label="Grid Layout"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setLayoutMode('list')}
                  className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                    layoutMode === 'list' 
                      ? 'bg-theme-primary text-theme-primary-text shadow-xl' 
                      : 'text-theme-text-muted/60 hover:text-theme-primary'
                  }`}
                  aria-label="List Layout"
                >
                  <List size={18} />
                </button>
              </div>
            </motion.div>

            {/* Product List Renderers */}
            {layoutMode === 'grid' ? (
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
                        className="glass-card p-0 group flex flex-col h-full rounded-3xl overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(45,62,80,0.15)] bg-theme-surface border border-theme-border animate-premium-glow"
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
                            <h3 className="text-[10px] uppercase tracking-[0.3em] text-theme-accent font-black mb-3">{product.category || 'Legacy'}</h3>
                            <h4 className="text-2xl font-serif text-theme-text-primary font-bold leading-tight group-hover:text-theme-accent transition-colors line-clamp-2">{product.name}</h4>
                          </div>
                          <div className="mt-8 flex items-center justify-between">
                            <p className="text-theme-primary font-display font-black text-xl">₹{product.price.toLocaleString('en-IN')}</p>
                            <div className="flex gap-2">
                               <button
                                onClick={() => handleEdit(product)}
                                className="p-3 bg-theme-accent/5 text-theme-accent rounded-xl hover:bg-theme-accent hover:text-theme-accent-text transition-all cursor-pointer shadow-lg"
                                title="Edit Details"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product.id)}
                                className="p-3 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all cursor-pointer shadow-xl"
                                title="Archive Piece"
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
            ) : (
              /* Beautiful table row list view */
              <div className="bg-theme-surface rounded-[24px] sm:rounded-[32px] border border-theme-border overflow-hidden shadow-luxury">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-theme-border text-theme-text-secondary/75 uppercase text-[9px] tracking-[0.2em] font-black bg-theme-bg/30">
                        <th className="py-6 px-8">Piece Information</th>
                        <th className="py-6 px-6">Category</th>
                        <th className="py-6 px-6">Price</th>
                        <th className="py-6 px-8 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {(products || []).map((product) => {
                          const stableKey = product.publicId || product.id;
                          return (
                            <motion.tr
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              key={stableKey}
                              className="border-b border-theme-border/60 hover:bg-theme-accent/5 transition-colors group"
                            >
                              <td className="py-5 px-8">
                                <div className="flex items-center gap-5">
                                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-theme-bg border border-theme-border flex-shrink-0 shadow-inner">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm sm:text-base font-serif font-bold text-theme-text-primary group-hover:text-theme-accent transition-colors">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-theme-text-secondary line-clamp-1">
                                      {product.description || 'No custom description provided.'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-sans tracking-widest bg-theme-accent/15 text-theme-accent px-3 py-1 rounded-full inline-block uppercase font-black">
                                    {product.category || 'Legacy'}
                                  </span>
                                  <p className="text-[10px] text-theme-text-muted font-mono tracking-tighter">
                                    ID: {product.id.substring(0, 8)}
                                  </p>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <span className="font-display font-black text-base text-theme-primary">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td className="py-5 px-8 text-right">
                                <div className="flex gap-2 justify-end items-center">
                                  {/* View in Boutique/Storefront Button */}
                                  <button
                                    onClick={() => {
                                      navigate(`/?product=${product.id}`);
                                    }}
                                    className="px-4 py-2.5 bg-theme-primary/10 text-theme-primary text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-theme-primary hover:text-theme-primary-text transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    title="View Piece Details"
                                  >
                                    <Eye size={12} className="stroke-[3]" />
                                    <span>View</span>
                                  </button>
                                  {/* Edit details */}
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2.5 bg-theme-accent/5 text-theme-accent rounded-xl hover:bg-theme-accent hover:text-theme-accent-text transition-all cursor-pointer shadow-sm"
                                    title="Edit details"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {/* Delete detail */}
                                  <button
                                    onClick={() => handleDeleteClick(product.id)}
                                    className="p-2.5 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all cursor-pointer shadow-sm"
                                    title="Archive item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

             {products.length === 0 && (
               <div className="text-center py-32 border-2 border-dashed border-theme-border rounded-xl bg-theme-surface/50">
                 <div className="max-w-xs mx-auto space-y-6">
                   <ShoppingBag size={48} className="mx-auto text-theme-accent/30" />
                   <p className="text-theme-text-muted font-serif text-xl italic">The collection is currently empty.</p>
                   <button
                     onClick={() => setIsFormOpen(true)}
                     className="text-theme-accent font-bold uppercase tracking-widest text-xs border-b border-theme-accent/40 pb-1 cursor-pointer hover:text-theme-primary transition-colors"
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
              <h2 className="text-4xl sm:text-6xl font-serif text-theme-text-primary font-bold tracking-tight">Admin <span className="text-theme-accent italic font-medium">Control</span></h2>
              <p className="text-theme-text-muted text-base sm:text-lg font-medium leading-relaxed">
                Manage the curators and artisans who breathe life into Anshi Collection. Ensure the security of your heritage boutique.
              </p>
            </div>
            <AdminControlPanel />
          </motion.div>
        )}
      </main>

      {/* Symmetrical footer link to walk back to public boutique */}
      <div className="pb-20 pt-8 flex flex-col items-center justify-center space-y-4">
        <Link 
          to="/" 
          onClick={handleBoutiqueRedirect}
          className="text-xs text-theme-text-secondary hover:text-theme-accent transition-colors flex items-center justify-center gap-3"
        >
           <span className="w-10 h-[1px] bg-theme-border"></span>
           Boutique View
           <span className="w-10 h-[1px] bg-theme-border"></span>
        </Link>
        <p className="text-[10px] text-theme-text-muted/40 uppercase tracking-[0.3em] font-bold text-center">
          Artisan Panel Secure Session Active
        </p>
      </div>

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
              className="relative w-full max-w-4xl bg-theme-surface p-5 sm:p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-[40px] border border-theme-border"
            >
              <h3 className="text-3xl font-serif text-theme-primary mb-8 pb-4 border-b border-theme-border">
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
