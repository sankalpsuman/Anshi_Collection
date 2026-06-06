import React from 'react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon, Video, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductFormProps {
  initialData?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper to compress image
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Optimized for mobile/web viewing
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Compressed: ${file.size / 1024}KB -> ${blob.size / 1024}KB`);
                resolve(blob);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.75
          );
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = React.useState(false);
  
  // Primary Image States
  const [previewUrl, setPreviewUrl] = React.useState(initialData?.imageUrl || '');
  const [uploadedUrl, setUploadedUrl] = React.useState(initialData?.imageUrl || '');
  const [uploadedPublicId, setUploadedPublicId] = React.useState(initialData?.publicId || '');
  const [isUploadingPrimary, setIsUploadingPrimary] = React.useState(false);
  const [primaryUploadProgress, setPrimaryUploadProgress] = React.useState(0);

  // Extra Portfolio Images States (Multi-image)
  const [extraImages, setExtraImages] = React.useState<string[]>(initialData?.imageUrls || []);
  const [extraPublicIds, setExtraPublicIds] = React.useState<string[]>(initialData?.publicIds || []);
  const [isUploadingExtra, setIsUploadingExtra] = React.useState(false);
  const [extraUploadProgress, setExtraUploadProgress] = React.useState(0);

  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    description: initialData?.description || '',
    category: initialData?.category || '',
    code: initialData?.code || '',
    sizes: initialData?.sizes?.join(', ') || 'S, M, L, XL',
    colors: initialData?.colors?.join(', ') || 'Black, White',
    fabric: initialData?.fabric || '',
    deliveryTime: initialData?.deliveryTime || '3-5 Working Days',
    offerPercent: initialData?.offerPercent || 0,
    customMessage: initialData?.customMessage || '',
    stockStatus: initialData?.stockStatus || 'in_stock',
    badge: initialData?.badge || '',
    videoUrl: initialData?.videoUrl || '',
  });

  // Unique Code Generator
  React.useEffect(() => {
    if (!initialData && !formData.code) {
      const rand = Math.floor(100 + Math.random() * 900);
      setFormData(prev => ({ ...prev, code: `ANS${rand}` }));
    }
  }, [initialData]);

  // General XML upload logic for Cloudinary
  const uploadFileToCloudinary = async (
    file: File | Blob, 
    onProgress: (p: number) => void
  ): Promise<{ url: string; publicId: string }> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      const msg = "Cloudinary config missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in the Settings menu.";
      setUploadError(msg);
      throw new Error(msg);
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);
    data.append('folder', 'products');

    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.min(progress * 0.95, 95)); 
        }
      };

      xhr.onload = () => {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: response.secure_url,
            publicId: response.public_id
          });
        } else {
          console.error("Cloudinary Detailed Error:", response);
          reject(new Error(response.error?.message || 'Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(data);
    });
  };

  // Upload Primary Image
  const handlePrimaryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set Instant Preview Local URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    setIsUploadingPrimary(true);
    setUploadError(null);
    setPrimaryUploadProgress(10);

    try {
      let fileToUpload: File | Blob = file;
      if (file.size > 200 * 1024) {
        fileToUpload = await compressImage(file);
      }
      
      const res = await uploadFileToCloudinary(fileToUpload, setPrimaryUploadProgress);
      setUploadedUrl(res.url);
      setUploadedPublicId(res.publicId);
      setPrimaryUploadProgress(100);
    } catch (err: any) {
      console.error("Primary upload failed:", err);
      setUploadError(err.message || "Failed to upload primary masterpiece.");
      setPreviewUrl(initialData?.imageUrl || '');
    } finally {
      setIsUploadingPrimary(false);
    }
  };

  // Upload Extra Portfolio Images (Multiple images support)
  const handleExtraImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingExtra(true);
    setUploadError(null);
    setExtraUploadProgress(15);

    try {
      const newUrls = [...extraImages];
      const newPublicIds = [...extraPublicIds];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileToUpload: File | Blob = file;
        
        if (file.size > 200 * 1024) {
          fileToUpload = await compressImage(file);
        }

        // Mini step progress
        const stepProgress = (p: number) => {
          const currentTotal = ((i / files.length) * 100) + (p / files.length);
          setExtraUploadProgress(currentTotal);
        };

        const res = await uploadFileToCloudinary(fileToUpload, stepProgress);
        newUrls.push(res.url);
        newPublicIds.push(res.publicId);
      }

      setExtraImages(newUrls);
      setExtraPublicIds(newPublicIds);
      setExtraUploadProgress(100);
    } catch (err: any) {
      console.error("Extra upload failed:", err);
      setUploadError(err.message || "Failed to upload extra images.");
    } finally {
      setIsUploadingExtra(false);
    }
  };

  const removeExtraImage = (indexToRemove: number) => {
    setExtraImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setExtraPublicIds(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUploadingPrimary || isUploadingExtra) {
      setUploadError("Assets are uploading in background. Please wait.");
      return;
    }

    if (!uploadedUrl) {
      setUploadError("Primary image is required to curate the piece.");
      return;
    }
    
    setLoading(true);

    try {
      const parsedSizes = formData.sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
        
      const parsedColors = formData.colors
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const productData = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        code: formData.code.toUpperCase() || `ANS-${Math.floor(100 + Math.random() * 900)}`,
        sizes: parsedSizes,
        colors: parsedColors,
        fabric: formData.fabric,
        deliveryTime: formData.deliveryTime,
        offerPercent: Number(formData.offerPercent) || 0,
        customMessage: formData.customMessage,
        stockStatus: formData.stockStatus as any,
        badge: formData.badge as any,
        videoUrl: formData.videoUrl,
        imageUrl: uploadedUrl,
        publicId: uploadedPublicId,
        imageUrls: extraImages,
        publicIds: extraPublicIds,
      };

      if (initialData) {
        await productService.updateProduct(initialData.id, productData);
      } else {
        await productService.addProduct(productData);
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(`Failed to save product in collection: ${error.message || 'Check connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const hasConfig = !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  return (
    <form onSubmit={handleSubmit} className="space-y-12 pb-10">
      {!hasConfig && (
        <div className="bg-rose/5 border border-rose/20 p-6 rounded-3xl mb-10 shadow-xl shadow-rose/5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-rose" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-rose font-black uppercase tracking-[0.2em]">
                Configuration Required
              </p>
              <p className="text-xs text-rose/70 mt-2 leading-relaxed font-medium">
                1. Add <code className="bg-rose/10 px-2 py-0.5 rounded text-rose font-black">VITE_CLOUDINARY_CLOUD_NAME</code> and <code className="bg-rose/10 px-2 py-0.5 rounded text-rose font-black">VITE_CLOUDINARY_UPLOAD_PRESET</code> in <b>Settings</b>.
                <br />
                2. In Cloudinary Settings: Under <b>Upload presets</b>, create an <b>Unsigned</b> upload preset.
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-rose bg-rose/5 p-4 rounded-2xl border border-rose/10"
        >
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{uploadError}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
        {/* LEFT COLUMN: Visual Media Portfolio */}
        <div className="space-y-8">
          {/* Main Showcase Image */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-indigo/50 dark:text-gold/50 mb-3">
              Masterpiece Showcase (Primary)
            </label>
            <div 
              className={`relative group aspect-[4/5] border-2 border-dashed transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col items-center justify-center bg-cream/30 dark:bg-dark-surface/40 ${
                previewUrl ? 'border-transparent' : 'border-gold/20 dark:border-gold/10 hover:border-maroon/40 dark:hover:border-gold/30'
              }`}
            >
              {previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isUploadingPrimary ? 'opacity-45 grayscale' : ''}`} 
                  />
                  <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    {!isUploadingPrimary && (
                      <button
                        type="button"
                        onClick={() => { 
                          setPreviewUrl(''); 
                          setUploadedUrl(''); 
                          setUploadedPublicId('');
                          setPrimaryUploadProgress(0);
                        }}
                        className="p-4 bg-rose text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
                        title="Remove"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  {isUploadingPrimary && (
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-gradient-to-t from-ink/90">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[9px] text-white font-black uppercase tracking-widest animate-pulse">Uploading Showcase...</span>
                         <span className="text-xs text-saffron font-display font-black">{Math.round(primaryUploadProgress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${primaryUploadProgress}%` }}
                          className="h-full bg-saffron"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-8 space-y-6">
                  <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageChange} required={!initialData} />
                  <div className="w-20 h-20 bg-white dark:bg-dark-card rounded-[24px] flex items-center justify-center text-maroon dark:text-gold shadow-xl border border-gold/10 dark:border-white/5 group-hover:rotate-12 transition-transform">
                    <Upload size={28} />
                  </div>
                  <div className="text-center">
                    <p className="text-ink dark:text-dark-text font-serif text-lg font-bold">Select Masterpiece</p>
                    <p className="text-[10px] text-ink/40 dark:text-dark-muted uppercase tracking-widest mt-2 font-black">Primary Image (PNG, JPG up to 10MB)</p>
                  </div>
                  <div className="px-5 py-2.5 bg-indigo/5 dark:bg-gold/5 text-indigo dark:text-gold text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo/15 dark:border-gold/15">
                    Browse Files
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Multiple Extra Portfolio Images */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo/50 dark:text-gold/50">
                Extra Portfolio Gallery ({extraImages.length} Saved)
              </label>
              <span className="text-[9px] uppercase tracking-widest text-[#a855f7] font-black">Multi-Select Supported</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {extraImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border dark:border-white/5 shadow-md">
                  <img src={img} alt={`Extra ${index}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExtraImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-rose text-white rounded-full hover:scale-110 active:scale-95 transition-transform shadow-lg"
                    title="Remove Image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {extraImages.length < 12 && (
                <label className="relative aspect-square border-2 border-dashed border-gold/25 hover:border-gold rounded-2xl cursor-pointer flex flex-col items-center justify-center bg-cream/10 dark:bg-dark-card/20 group transition-all duration-300">
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleExtraImageChange} />
                  {isUploadingExtra ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 size={18} className="animate-spin text-gold" />
                      <span className="text-[9px] font-black text-gold">{Math.round(extraUploadProgress)}%</span>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <ImageIcon size={20} className="text-gold/50 group-hover:text-gold transition-colors" />
                      <span className="text-[8px] font-black uppercase tracking-wider text-indigo/50 dark:text-gold/50 mt-1 block">Add More</span>
                    </div>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Video or Reels URL */}
          <div className="bg-theme-surface p-6 rounded-[28px] border border-theme-border shadow-luxury">
            <div className="flex items-center gap-2.5 mb-3">
              <Video className="text-rose shrink-0" size={18} />
              <label className="block text-[10px] font-black uppercase tracking-widest text-theme-accent">
                Reel / Video showcase url (Optional)
              </label>
            </div>
            <input
              type="url"
              placeholder="e.g. https://instagram.com/p/reel_url or CDN mp4 link"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full bg-theme-surface border border-theme-border rounded-2xl px-4 py-3.5 text-xs outline-none focus:border-theme-primary transition-all text-theme-text-primary font-medium"
            />
            <span className="text-[8px] sm:text-[9px] uppercase font-black text-theme-text-muted block mt-2 ml-1">
              Provides direct video reels or walk-throughs in the product layout.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Specifications & Logic */}
        <div className="space-y-8">
          {/* E-Commerce Metrics section */}
          <div className="space-y-6">
            <div className="relative border-b border-theme-border pb-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-2">Artisan Model Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Maharani Crimson Silk Jhumka"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent py-2.5 font-serif text-2xl outline-none placeholder:text-theme-text-muted/40 transition-all font-bold text-theme-text-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Product Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ANS102"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-transparent py-2 uppercase font-mono font-bold text-lg outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>

              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Price (INR ₹)</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 1999"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-transparent py-2 font-display font-black text-lg outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Category / Silhouette</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Saree, Kurta"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-transparent py-2 font-serif italic text-base outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>

              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Offer Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 20 for 20% Off"
                  value={formData.offerPercent || ''}
                  onChange={(e) => setFormData({ ...formData, offerPercent: Number(e.target.value) })}
                  className="w-full bg-transparent py-2 font-mono font-semibold text-base outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Sizes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="S, M, L, XL"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  className="w-full bg-transparent py-2 font-mono text-xs font-semibold outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>

              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Colors (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Black, Silk Red, Ivory"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  className="w-full bg-transparent py-2 font-sans text-xs font-semibold outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Fabric Details</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Pure Organza Silk"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full bg-transparent py-2 font-sans text-xs font-semibold outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>

              <div className="relative border-b border-theme-border pb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-1">Delivery Estimate</label>
                <input
                  type="text"
                  placeholder="e.g. 3-5 Working Days"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full bg-transparent py-2 font-sans text-xs font-semibold outline-none placeholder:text-theme-text-muted/40 transition-all text-theme-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-2">Badge Status</label>
                <select
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 text-xs outline-none focus:border-theme-primary transition-all text-theme-text-primary font-bold"
                >
                  <option value="" className="bg-theme-surface text-theme-text-primary">No Badge Selected</option>
                  <option value="new_arrival" className="bg-theme-surface text-theme-text-primary">✨ New Arrival</option>
                  <option value="trending" className="bg-theme-surface text-theme-text-primary">🔥 Trending Now</option>
                  <option value="fast_selling" className="bg-theme-surface text-theme-text-primary">⚡ Fast Selling</option>
                  <option value="limited_stock" className="bg-theme-surface text-theme-text-primary">⚠️ Limited Stock</option>
                  <option value="sale" className="bg-theme-surface text-theme-text-primary">🏷️ On Sale</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-2">Stock Availability</label>
                <select
                  value={formData.stockStatus}
                  onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}
                  className="w-full bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 text-xs outline-none focus:border-theme-primary transition-all text-theme-text-primary font-bold"
                >
                  <option value="in_stock" className="bg-theme-surface text-theme-text-primary">🟢 In Stock (Ready to ship)</option>
                  <option value="low_stock" className="bg-theme-surface text-theme-text-primary">🟡 Low Stock (Hurry up)</option>
                  <option value="out_of_stock" className="bg-theme-surface text-theme-text-primary">🔴 Out Of Stock (Curated on order)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Textareas */}
          <div className="space-y-6 bg-theme-surface p-6 rounded-[28px] border border-theme-border shadow-luxury">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent mb-2">
                Artisan Story / Description
              </label>
              <textarea
                rows={3}
                required
                placeholder="Give details about the craftsmanship, the dye process, materials, or special care instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-theme-surface border border-theme-border p-4 rounded-2xl text-xs outline-none resize-none placeholder:text-theme-text-muted/40 transition-all font-medium text-theme-text-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-accent flex items-center gap-1.5">
                  Custom WhatsApp message override
                  <span className="cursor-help text-theme-primary" title="Optional: Customizes the initial text that users send to you on WhatsApp. Leaves details tags in context automatically.">
                    <HelpCircle size={12} />
                  </span>
                </label>
                <span className="text-[8px] text-theme-text-muted font-bold uppercase tracking-wider">Optional override</span>
              </div>
              <textarea
                rows={3}
                placeholder="Hi, I'm absolutely loving this handloom saree! Can you confirm availability and customize length for me?"
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                className="w-full bg-theme-surface border border-theme-border p-4 rounded-2xl text-xs outline-none resize-none placeholder:text-theme-text-muted/40 transition-all font-medium text-theme-text-primary"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || isUploadingPrimary || isUploadingExtra}
              className="flex-1 flex items-center justify-center gap-2.5 bg-theme-primary text-theme-primary-text py-4 sm:py-5 rounded-2xl shadow-xl disabled:opacity-40 disabled:scale-100 transition-all uppercase text-[10px] tracking-wider sm:tracking-[0.2em] font-black cursor-pointer hover:opacity-90"
            >
              {loading ? <Loader2 className="animate-spin shrink-0" size={18} /> : <CheckCircle2 className="shrink-0" size={18} />}
              <span>{initialData ? 'Archive Modified Piece' : 'Commit to Boutique Collection'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-8 py-4 sm:py-5 border border-theme-border text-theme-text-secondary font-black uppercase tracking-wider sm:tracking-widest text-[10px] hover:bg-rose/5 hover:text-rose hover:border-rose/20 transition-all rounded-2xl cursor-pointer"
            >
              Discard Changes
            </motion.button>
          </div>
        </div>
      </div>
    </form>
  );
}
