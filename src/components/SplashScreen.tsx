import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import { Product } from '../types';

interface SplashScreenProps {
  onComplete: (products: Product[], isAdmin: boolean, userId: string | null) => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = React.useState(0);
  const [loadingText, setLoadingText] = React.useState('Initializing Boutique Hub...');
  
  // High-fidelity luxurious loading steps
  const loadingStages = [
    { threshold: 10, text: 'Connecting Secure Artisan Database...' },
    { threshold: 30, text: 'Retrieving Royal Weaves & Silhouettes...' },
    { threshold: 55, text: 'Caching Saree Collections...' },
    { threshold: 75, text: 'Preloading High-Resolution Lookbook...' },
    { threshold: 90, text: 'Synchronizing Safe Collector Identity...' },
    { threshold: 98, text: 'Entering Masterpiece Gallery...' }
  ];

  React.useEffect(() => {
    let active = true;
    let productsList: Product[] = [];
    let isAdminUser = false;
    let loggedInUserId: string | null = null;
    let authChecked = false;
    let productsChecked = false;

    // Fast Cache check (read immediately from local storage)
    let hasLocalCache = false;
    try {
      const cached = localStorage.getItem('ansi_cached_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          productsList = parsed;
          productsChecked = true;
          hasLocalCache = true;
        }
      }
    } catch (cacheErr) {
      console.warn("Fast Cache preloading skipped:", cacheErr);
    }

    // Modern snappiest non-blocking initialization schedule (keep duration short)
    const startTime = Date.now();
    const duration = hasLocalCache ? 150 : 350; 

    // Handle authentication in parallel (fail-safe and non-blocking)
    let unsubscribeAuth = () => {};
    try {
      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            loggedInUserId = user.uid;
            const { authorized } = await adminService.checkAdminStatus(user.email || '');
            isAdminUser = authorized;
          } else {
            loggedInUserId = null;
            isAdminUser = false;
          }
        } catch (e) {
          console.error("Auth status sync error inside silent splash logic:", e);
        } finally {
          authChecked = true;
        }
      });
    } catch (authSetupErr) {
      console.error("Auth listener registration failed:", authSetupErr);
      authChecked = true;
    }

    // Fetch and sync products in the background
    const loadProductsBackground = async () => {
      try {
        const fetched = await productService.getProducts();
        if (active) {
          productsList = fetched;
          productsChecked = true;
        }
        
        try {
          localStorage.setItem('ansi_cached_products', JSON.stringify(fetched));
        } catch (err) {
          console.error("Local caching sync error inside background task:", err);
        }

        // Preload preview imagery purely in the background (100% NON-BLOCKING)
        const priorityImages = fetched.slice(0, 4).map(p => p.imageUrl);
        priorityImages.forEach(url => {
          const img = new Image();
          img.src = url;
          img.referrerPolicy = "no-referrer";
        });
      } catch (err) {
        console.error("Products background task failed:", err);
        if (active) {
          productsChecked = true; // Mark as done to avoid hanging
        }
      }
    };

    // Trigger non-blocking catalog query
    loadProductsBackground();

    // Visual loading progress ticks
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const computedPercentage = Math.min(Math.round((elapsed / duration) * 100), 99);
      
      // Absolute hard fallback boundary to guarantee visual transition dismissal after 1.5s max
      const forceComplete = elapsed >= 1500;
      
      if ((elapsed >= duration && authChecked && productsChecked) || forceComplete) {
        clearInterval(interval);
        setProgress(100);
        setLoadingText('Secured Premium Gateway Active.');
        
        setTimeout(() => {
          if (active) {
            try {
              unsubscribeAuth();
            } catch (unsubErr) {
              console.warn("Unsubscribe auth error during splash dismissal:", unsubErr);
            }
            onComplete(productsList, isAdminUser, loggedInUserId);
          }
        }, 50);
      } else {
        setProgress(computedPercentage);
        const currentStage = loadingStages.find(stage => computedPercentage <= stage.threshold);
        if (currentStage) {
          setLoadingText(currentStage.text);
        }
      }
    }, 20);

    return () => {
      active = false;
      clearInterval(interval);
      try {
        unsubscribeAuth();
      } catch (err) {
        // Silent catch
      }
    };
  }, [onComplete]);

  // Circle path mathematics
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-bg select-none transition-colors duration-500 overflow-hidden text-left" id="brand-splash-container">
      {/* Absolute royal background design filters */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-theme-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-rose/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-md w-full px-8 text-center space-y-12 relative flex flex-col items-center">
        {/* Luxury Top Header - Brand Crest */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5 flex flex-col items-center"
        >
          <div className="p-3.5 bg-theme-accent/8 border border-theme-border rounded-full shadow-glow mb-2 flex items-center justify-center text-theme-accent animate-pulse">
            <Sparkles size={26} fill="currentColor" />
          </div>
          <span className="text-[9px] uppercase tracking-[0.45em] text-theme-text-muted font-black">
            EST. 2026 — THE ARTISAN LABEL
          </span>
        </motion.div>

        {/* Brand Display Typography Focus */}
        <div className="space-y-3 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '4px' }}
            animate={{ opacity: 1, letterSpacing: '8px' }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl font-serif text-theme-accent tracking-[8px] font-black uppercase text-center"
            id="splash-title"
          >
            ANSHI
          </motion.h1>
          
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
            className="h-[1px] w-28 bg-theme-accent/35 my-1"
          />
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-sm font-sans uppercase font-bold tracking-[0.2em] text-theme-text-primary"
          >
            Boutique Collection
          </motion.h2>
        </div>

        {/* Unique Circular Golden Progress Loader Widget */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circular Ring Track */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="text-theme-border/25"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Circular Accent Loop */}
            <motion.circle
              cx="56"
              cy="56"
              r={radius}
              className="text-theme-primary"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </svg>
          
          {/* Internal Progress Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5">
            <span className="text-xl font-display font-bold text-theme-text-primary">
              {progress}%
            </span>
            <span className="text-[7px] uppercase font-black tracking-wider text-theme-accent">
              LOOM
            </span>
          </div>
        </div>

        {/* Dynamic Descriptive Preloading Logs */}
        <div className="h-10 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-[10px] font-sans font-black uppercase tracking-[0.16em] text-theme-text-secondary leading-relaxed max-w-xs text-center"
              id="splash-loading-indicator"
            >
              {loadingText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Humble Luxury Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-[9px] uppercase tracking-widest text-theme-text-muted/40 font-bold flex items-center gap-1.5"
        >
          <span>Authentic Handlooms</span>
          <span className="w-1 h-1 rounded-full bg-theme-accent/45"></span>
          <span>Richa Verma Curator</span>
        </motion.div>
      </div>
    </div>
  );
}
