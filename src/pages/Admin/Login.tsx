import React from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

import { adminService } from '../../services/adminService';

export default function Login({ onBackToBoutique }: { onBackToBoutique?: () => void } = {}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleBoutiqueRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBackToBoutique) {
      onBackToBoutique();
      navigate('/');
    } else {
      window.location.href = window.location.origin + '/';
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        setLoading(true);
        try {
          const { authorized } = await adminService.checkAdminStatus(user.email || '');
          if (!isMounted) return;

          if (authorized) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            await signOut(auth);
            if (isMounted) {
              setError("You are not authorized to access this portal.");
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Admin check failed:", err);
          if (isMounted) {
            setError("Failed to verify access permissions.");
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    }, (err) => {
      console.error("Auth state error:", err);
      if (isMounted) {
        setError("Failed to verify authentication status.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Let onAuthStateChanged handle the navigation/status check seamlessly
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoading(false);
      if (error.code === 'auth/popup-blocked') {
        setError("Login popup was blocked. Please enable popups or try opening this app in a new tab.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError("Login was cancelled or another popup is already open.");
      } else {
        setError(error.message || "An unexpected error occurred during login.");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg">
      <Loader2 className="animate-spin text-theme-accent" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg px-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative full-screen background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-theme-accent/[0.01] skew-x-12 -z-10" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-rose/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-24 right-12 w-64 h-64 bg-theme-accent/5 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-theme-surface p-8 sm:p-12 md:p-16 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] space-y-8 sm:space-y-10 rounded-[30px] sm:rounded-[40px] border border-theme-border backdrop-blur-sm transition-colors"
      >
        <div className="space-y-3 sm:space-y-4">
          <Link 
            to="/" 
            onClick={handleBoutiqueRedirect}
            className="hover:opacity-95 block select-none"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="brand-logo serif text-2xl sm:text-4xl tracking-[4px] sm:tracking-[8px] text-theme-primary border-b-4 border-theme-accent pb-2 sm:pb-3 flex items-center justify-center gap-3 font-black"
            >
              <Sparkles className="text-theme-accent w-8 h-8 sm:w-10 sm:h-10 shrink-0" fill="currentColor" />
              ANSHI COLLECTION
            </motion.div>
          </Link>
          <h2 className="text-[10px] sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] text-theme-accent font-black">Authorized Artisan Portal</h2>
        </div>
        
        <div className="py-4 sm:py-8 relative">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-theme-bg rounded-2xl sm:rounded-[30px] flex items-center justify-center text-theme-primary mb-4 sm:mb-6 rotate-6 shadow-xl border border-theme-border transition-colors">
            <ShoppingBag size={32} className="sm:hidden" />
            <ShoppingBag size={40} className="hidden sm:block" />
          </div>
          <p className="text-theme-text-muted font-sans tracking-wide leading-relaxed text-xs sm:text-sm font-medium">
            Secure gateway reserved for the curators of elegance. Access your dashboard to manage the collection.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose/5 text-rose p-4 text-[10px] font-black uppercase tracking-widest border border-rose/10 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full h-16 bg-theme-primary text-theme-primary-text flex items-center justify-center space-x-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all rounded-2xl group cursor-pointer"
        >
          <div className="bg-theme-surface/20 p-2 rounded-xl group-hover:bg-theme-accent/20 group-hover:rotate-12 transition-all">
            <LogIn size={20} />
          </div>
          <span className="font-display uppercase tracking-[0.2em] font-black text-xs">Verify Identity via Google</span>
        </motion.button>

        <div className="pt-8 flex flex-col space-y-6">
          <Link 
            to="/" 
            onClick={handleBoutiqueRedirect}
            className="text-xs text-theme-text-secondary hover:text-theme-accent transition-colors flex items-center justify-center gap-3"
          >
             <span className="w-10 h-[1px] bg-theme-border"></span>
             Boutique View
             <span className="w-10 h-[1px] bg-theme-border"></span>
          </Link>
          <p className="text-[10px] text-theme-text-muted/40 uppercase tracking-[0.3em] font-bold leading-loose">
            System monitored for integrity.<br />All sessions are encrypted.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
