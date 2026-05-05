import React from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import ProductForm from '../../components/Admin/ProductForm';
import { Plus, LogOut, Edit2, Trash2, LayoutGrid, List, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [user, setUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const navigate = useNavigate();

  const loadingRef = React.useRef(loading);
  loadingRef.current = loading;
  const productsRef = React.useRef(products);
  productsRef.current = products;

  React.useEffect(() => {
    let isMounted = true;

    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (!isMounted) return;
      
      if (!authUser) {
        navigate('/admin');
      } else {
        setUser(authUser);
        if (!authUser.emailVerified) {
          console.warn("User email not verified. Writes might fail.");
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
        if (productsRef.current.length === 0) {
          if (auth.currentUser) {
            setError("The catalog connection is taking longer than expected. Please check your network or try refreshing.");
          }
        }
      }
    }, 15000); // 15 seconds safely timeout

    return () => {
      isMounted = false;
      authUnsubscribe();
      productsUnsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [navigate]);

  const handleLogout = () => signOut(auth).then(() => navigate('/admin'));

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this piece from the collection?")) {
      await productService.deleteProduct(id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
       <div className="flex flex-col items-center">
         <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
         <h1 className="text-xl font-serif text-maroon tracking-widest uppercase animate-pulse">Entering Vault</h1>
         <p className="text-xs text-ink/40 mt-2 uppercase tracking-widest">Synchronizing catalog...</p>
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
    <div className="min-h-screen bg-cream">
      {/* Sidebar/Header */}
      <nav className="bg-white border-b border-gold/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:h-20 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-maroon hover:text-gold transition-colors">
                <h1 className="text-xl font-serif tracking-widest uppercase">Anshi Admin</h1>
              </Link>
              <span className="hidden md:block h-6 w-px bg-gold/20" />
              <div className="flex items-center space-x-2">
                <span className="hidden md:block text-xs uppercase tracking-widest text-charcoal/40 font-bold">Catalog Management</span>
                {isSyncing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-1.5 px-2 py-0.5 bg-gold/10 rounded-full"
                  >
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                    <span className="text-[10px] text-gold uppercase tracking-tighter font-bold">Cloud Syncing</span>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }}
                className="luxury-gradient text-white px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-widest font-bold flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Piece</span>
              </button>
              <button onClick={handleLogout} className="text-charcoal/60 hover:text-maroon transition-colors p-2">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-serif text-charcoal">Active Collection</h2>
            <p className="text-charcoal/40 text-sm font-sans mt-2">Manage your luxury fashion inventory in real-time.</p>
          </div>
          <div className="bg-white p-1 rounded-full border border-gold/20 flex shadow-sm">
            <button className="p-2 bg-cream text-gold rounded-full"><LayoutGrid size={18} /></button>
            <button className="p-2 text-charcoal/40 hover:text-gold"><List size={18} /></button>
          </div>
        </div>

        {/* Product List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
              className="bg-white p-4 shadow-sm border border-gold/10 group relative"
            >
              <div className="aspect-[3/4] overflow-hidden mb-4 bg-cream">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-widest text-gold font-bold">{product.category || 'Collection'}</h3>
                <h4 className="text-lg font-serif text-charcoal truncate">{product.name}</h4>
                <p className="text-maroon font-bold">₹{product.price.toLocaleString('en-IN')}</p>
              </div>

              {/* Action Buttons Overlay - visible on hover for desktop, always for mobile */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-white/95 p-3 rounded-full text-ink hover:bg-gold hover:text-white shadow-xl transition-all border border-gold/10"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-white/95 p-3 rounded-full text-ink hover:bg-maroon hover:text-white shadow-xl transition-all border border-gold/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
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
