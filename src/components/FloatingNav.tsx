import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Compass, ShoppingBag, Sliders, Shield } from 'lucide-react';

export type AppModule = 'gallery' | 'heritage' | 'cart' | 'artisan';

interface FloatingNavProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
  cartCount: number;
  isAdminUser: boolean;
}

export default function FloatingNav({ 
  activeModule, 
  onModuleChange, 
  cartCount,
  isAdminUser 
}: FloatingNavProps) {
  
  const navItems = [
    {
      id: 'gallery' as AppModule,
      label: 'Boutique',
      icon: Sparkles,
      badge: 0
    },
    {
      id: 'heritage' as AppModule,
      label: 'Heritage',
      icon: Compass,
      badge: 0
    },
    {
      id: 'cart' as AppModule,
      label: 'My Bag',
      icon: ShoppingBag,
      badge: cartCount
    }
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-max max-w-[95vw] px-1 md:px-0">
      <nav 
        className="glass-card flex items-center justify-around gap-1.5 md:gap-3 p-2 rounded-[24px] border border-theme-border/60 bg-theme-surface/75 backdrop-blur-xl shadow-luxury md:px-4"
        id="floating-navigation-bar"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`relative px-4 py-3 md:px-5 md:py-3.5 flex items-center gap-2 font-display text-[10px] md:text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-theme-primary' 
                  : 'text-theme-text-secondary/60 hover:text-theme-text-primary hover:scale-[1.03] active:scale-[0.98]'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Slidable background back-indicator mapping tab changes */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavGlowPill"
                  className="absolute inset-0 bg-theme-accent/12 border border-theme-accent/25 rounded-xl -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              <div className="relative flex items-center justify-center">
                <Icon size={16} className={`shrink-0 transition-transform ${isActive ? 'rotate-[-6deg] scale-110' : ''}`} />
                
                {/* Visual live notifications indicators */}
                {item.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-2.5 -right-3 text-[8.5px] font-mono leading-none bg-rose text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-theme-surface font-black shadow-lg animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>

              {/* Text label gets hidden on extreme mobile views to keep spatial cleanliness */}
              <span className={`transition-all duration-300 font-extrabold ${isActive ? 'inline-block' : 'hidden sm:inline-block'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
