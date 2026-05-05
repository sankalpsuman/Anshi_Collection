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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin/dashboard');
      }
      setLoading(false);
    }, (err) => {
      console.error("Auth state error:", err);
      setError("Failed to verify authentication status.");
      setLoading(false);
    });
    return () => unsubscribe();
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white p-12 text-center shadow-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-sm uppercase tracking-[0.5em] text-gold font-bold">Anshi Collections</h1>
          <h2 className="text-4xl font-serif text-charcoal">Admin Portal</h2>
        </div>
        
        <div className="py-8">
          <div className="w-20 h-20 mx-auto bg-cream rounded-full flex items-center justify-center text-maroon mb-6">
            <ShoppingBag size={32} />
          </div>
          <p className="text-charcoal/60 font-sans tracking-wide">
            Secure access for product management and catalog synchronization.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 text-xs font-sans border border-red-100 mb-4 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full h-14 luxury-gradient text-white flex items-center justify-center space-x-3 group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
        >
          <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-sans uppercase tracking-[0.2em] font-bold text-sm">Login with Google</span>
        </button>

        <div className="pt-8 flex flex-col space-y-4">
          <Link to="/" className="text-xs text-gold hover:text-maroon uppercase tracking-widest font-bold font-sans">
            &larr; Back to Boutique
          </Link>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Authorized personnel only. Access is tracked and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
