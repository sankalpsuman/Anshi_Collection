import React from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let checkInProgress = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && checkInProgress) {
        checkInProgress = false;
        navigate('/admin/dashboard', { replace: true });
      }
      setLoading(false);
    }, (err) => {
      console.error("Auth state error:", err);
      setError("Failed to verify authentication status.");
      setLoading(false);
    });
    return () => {
      checkInProgress = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      // Trying to fix common iframe issues with popup
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error("Login failed:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Loader2 className="animate-spin text-gold" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 relative overflow-hidden">
      {/* Decorative full-screen background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo/[0.02] skew-x-12 -z-10" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-rose/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-24 right-12 w-64 h-64 bg-saffron/5 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 sm:p-12 md:p-16 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] space-y-8 sm:space-y-10 rounded-[30px] sm:rounded-[40px] border border-white/50 backdrop-blur-sm"
      >
        <div className="space-y-3 sm:space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="brand-logo serif text-2xl sm:text-4xl tracking-[4px] sm:tracking-[8px] text-maroon border-b-4 border-saffron pb-2 sm:pb-3 inline-block font-black"
          >
            ANSHI COLLECTION
          </motion.div>
          <h2 className="text-[10px] sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo font-black">Authorized Artisan Portal</h2>
        </div>
        
        <div className="py-4 sm:py-8 relative">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-cream rounded-2xl sm:rounded-[30px] flex items-center justify-center text-maroon mb-4 sm:mb-6 rotate-6 shadow-xl border border-gold/10">
            <ShoppingBag size={32} className="sm:hidden" />
            <ShoppingBag size={40} className="hidden sm:block" />
          </div>
          <p className="text-ink/40 font-sans tracking-wide leading-relaxed text-xs sm:text-sm font-medium">
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
          className="w-full h-16 bg-ink text-white flex items-center justify-center space-x-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all rounded-2xl group"
        >
          <div className="bg-white/10 p-2 rounded-lg group-hover:bg-rose group-hover:rotate-12 transition-all">
            <LogIn size={20} />
          </div>
          <span className="font-display uppercase tracking-[0.2em] font-black text-xs">Verify Identity via Google</span>
        </motion.button>

        <div className="pt-8 flex flex-col space-y-6">
          <Link to="/" className="text-xs text-indigo hover:text-rose font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3">
             <span className="w-10 h-[1px] bg-indigo/20"></span>
             Boutique View
             <span className="w-10 h-[1px] bg-indigo/20"></span>
          </Link>
          <p className="text-[10px] text-ink/20 uppercase tracking-[0.3em] font-bold leading-loose">
            System monitored for integrity.<br />All sessions are encrypted.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
