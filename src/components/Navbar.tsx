import React from 'react';
import { ShoppingBag, Search, Menu, X, Instagram, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Navbar({ onSearch }: { onSearch: (query: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-theme-bg/85 backdrop-blur-md border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl md:text-3xl font-serif tracking-[0.2em] text-theme-primary border-b-2 border-theme-accent pb-1 pointer-events-none uppercase">
              ANSHI
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-theme-text-secondary hover:text-theme-accent transition-colors cursor-pointer"
            >
              <Search size={22} />
            </button>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-theme-text-secondary hover:text-theme-accent transition-colors">
              <Instagram size={22} />
            </a>
            <ShoppingBag size={22} className="text-theme-primary" />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-theme-text-secondary hover:text-theme-accent transition-colors cursor-pointer"
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-theme-text-secondary hover:text-theme-primary focus:outline-none cursor-pointer"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-theme-surface border-b border-theme-border overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search collections..."
                  className="w-full bg-theme-bg border border-theme-border rounded-xl py-4 px-12 focus:ring-1 focus:ring-theme-accent text-theme-text-primary font-sans text-lg placeholder:text-theme-text-muted/65 outline-none"
                  onChange={(e) => onSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-accent" size={20} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-theme-bg md:hidden"
          >
            <div className="flex flex-col h-full pt-20 px-8 space-y-8">
              <Link to="/" className="text-4xl font-serif text-theme-primary border-b border-theme-border pb-4" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <a href="#collection" className="text-4xl font-serif text-theme-primary border-b border-theme-border pb-4" onClick={() => setIsMenuOpen(false)}>Collections</a>
              <div className="pt-8 flex space-x-6">
                <a href="https://instagram.com" className="text-theme-primary hover:text-theme-accent"><Instagram size={28} /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
