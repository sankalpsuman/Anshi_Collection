import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Loader2, Sparkles, Check, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { imageService, UserImage } from '../../services/imageService';
import { productService } from '../../services/productService';

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, publicId: string) => void;
}

export default function ImageLibraryModal({ isOpen, onClose, onSelect }: ImageLibraryModalProps) {
  const [images, setImages] = React.useState<UserImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState<UserImage | null>(null);
  const [lastDoc, setLastDoc] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  // Load and sync images
  const loadImages = React.useCallback(async (isInitial: boolean = true, queryStr: string = '') => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const cursor = isInitial ? null : lastDoc;
      const result = await imageService.getUserImages(12, cursor, queryStr);
      
      if (isInitial) {
        setImages(result.images);
      } else {
        setImages(prev => [...prev, ...result.images]);
      }
      setLastDoc(result.lastDoc);
    } catch (err: any) {
      console.error("Failed to load user images:", err);
      setError(err.message || 'Failed to retrieve your image library');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  // Initial Sync from Active Catalog Products to populate library on first use
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const initialSyncAndLoad = async () => {
      setSyncing(true);
      try {
        const activeProducts = await productService.getProducts();
        if (isMounted) {
          await imageService.syncProductsToLibrary(activeProducts);
          await loadImages(true, searchQuery);
        }
      } catch (err) {
        console.warn("Library proactive sync skipped:", err);
        // Fallback to direct load
        if (isMounted) {
          await loadImages(true, searchQuery);
        }
      } finally {
        if (isMounted) setSyncing(false);
      }
    };

    initialSyncAndLoad();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle Search Input Change with simple debounce feel
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  const executeSearch = () => {
    loadImages(true, searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const handleSelectConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage.imageUrl, selectedImage.publicId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/70 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl h-[85vh] bg-theme-surface p-6 sm:p-8 md:p-10 shadow-luxury overflow-hidden rounded-[32px] sm:rounded-[40px] border border-theme-border flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-5 border-b border-theme-border/40">
            <div className="space-y-1.5 text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-accent flex items-center gap-1.5">
                <Sparkles size={12} className="text-theme-accent animate-pulse" />
                Artisan Assets
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-theme-text-primary font-black leading-none">
                My Image Portfolio
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-theme-bg/60 rounded-xl transition-colors cursor-pointer text-theme-text-secondary hover:text-theme-primary outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar section */}
          <div className="py-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                placeholder="Search images by name or publicId..."
                className="w-full bg-theme-bg/50 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl pl-11 pr-4 py-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted/40 transition-all outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted/50" size={16} />
            </div>
            <button
              onClick={executeSearch}
              className="bg-theme-primary text-theme-primary-text px-6 py-3 font-semibold uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-all cursor-pointer h-11 flex items-center justify-center shrink-0"
            >
              Search
            </button>
          </div>

          {/* Body Gallery Area */}
          <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1 scrollbar-thin scrollbar-thumb-theme-border">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-theme-accent" size={36} />
                <p className="text-xs font-black uppercase tracking-widest text-theme-text-muted">
                  {syncing ? 'Scanning active pieces...' : 'Opening Portfolio...'}
                </p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3">
                <p className="text-rose text-sm font-bold uppercase tracking-wider">{error}</p>
                <button
                  onClick={() => loadImages(true, searchQuery)}
                  className="text-xs uppercase font-black text-theme-accent underline decoration-dotted"
                >
                  Retry Loading
                </button>
              </div>
            ) : images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                <ImageIcon className="text-theme-accent/20" size={48} />
                <div className="space-y-2">
                  <p className="text-theme-text-muted font-serif text-lg italic">Your personal gallery is empty.</p>
                  <p className="text-[10px] text-theme-text-muted/60 uppercase tracking-widest max-w-xs mx-auto">
                    Any product images you upload via files will automatically show up here for easy future reuse.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                  {images.map((image) => {
                    const isSelected = selectedImage?.id === image.id;
                    return (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className={`group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 bg-theme-bg select-none ${
                          isSelected 
                            ? 'border-theme-accent shadow-lg shadow-theme-accent/25 ring-2 ring-theme-accent/15' 
                            : 'border-theme-border/50 hover:border-theme-accent/50'
                        }`}
                      >
                        <img
                          src={image.imageUrl}
                          alt="Historical asset"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <p className="text-[8px] text-white/70 uppercase tracking-widest line-clamp-1">
                            {image.publicId || 'No Cloudinary ID'}
                          </p>
                        </div>

                        {/* Top checkmark ring for absolute confirmation */}
                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all border duration-300 ${
                          isSelected 
                            ? 'bg-theme-accent border-theme-accent text-white scale-110' 
                            : 'bg-black/30 backdrop-blur-sm border-white/30 text-transparent scale-90'
                        }`}>
                          <Check size={12} className="font-bold stroke-[3px]" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {lastDoc && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => loadImages(false, searchQuery)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 border border-theme-border/80 hover:border-theme-accent/40 text-theme-text-secondary px-8 py-3.5 rounded-xl uppercase text-[10px] tracking-widest font-black transition-all cursor-pointer disabled:opacity-40"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="animate-spin" size={12} />
                          <span>Streaming assets...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Portfolio Images</span>
                          <ChevronRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="pt-6 border-t border-theme-border/45 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-theme-border text-theme-text-secondary font-black uppercase tracking-widest text-[9px] rounded-xl cursor-pointer hover:bg-theme-surface/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectConfirm}
              disabled={!selectedImage}
              className="bg-theme-primary text-theme-primary-text px-8 py-3 font-black uppercase tracking-widest text-[9px] rounded-xl cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all uppercase"
            >
              Add Selected Piece
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
