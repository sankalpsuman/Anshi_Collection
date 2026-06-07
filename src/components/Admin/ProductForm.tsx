import React from 'react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Video, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { imageService } from '../../services/imageService';
import ImageLibraryModal from './ImageLibraryModal';

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

  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);

  const [validationModal, setValidationModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    suggestedSize: string;
  } | null>(null);

  const validateAndProcessFile = async (file: File): Promise<{ valid: boolean; fileToUpload: File | Blob }> => {
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';
    const isHeic = fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';

    if (isHeic) {
      setValidationModal({
        isOpen: true,
        title: "Apple HEIC Format Detected",
        message: "HEIC/HEIF images from modern Apple iPhones cannot be rendered natively inside web browsers. Please save, convert, or export your photo as JPEG/PNG first to ensure it displays perfectly for your boutique customers.",
        suggestedSize: "Save photo as JPEG or PNG (under 5MB recommended)"
      });
      return { valid: false, fileToUpload: file };
    }

    // Supported formats check
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const acceptedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!acceptedTypes.includes(file.type) && !acceptedExts.includes(fileExt)) {
      setValidationModal({
        isOpen: true,
        title: "Unsupported File Format",
        message: "To maintain the luxury collection's high visual quality, please select portrait masterpieces in JPEG, PNG, or WebP format.",
        suggestedSize: "Use standard image formats (JPEG / PNG)"
      });
      return { valid: false, fileToUpload: file };
    }

    // Limit maximum raw file size to 10MB
    const limitBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > limitBytes) {
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationModal({
        isOpen: true,
        title: "Product Image Exceeds 10MB",
        message: `Your selected photo is ${currentSizeMB}MB, which exceeds the stable boutique upload limit of 10MB. Transmitting extremely large image files over standard networks can stall and cause upload failures.`,
        suggestedSize: "Under 5MB for fast processing and optimal performance"
      });
      return { valid: false, fileToUpload: file };
    }

    // Smooth compression
    let fileToUpload: File | Blob = file;
    if (file.size > 200 * 1024) {
      try {
        fileToUpload = await compressImage(file);
      } catch (err) {
        console.warn("Fast canvas compression failed, defaulting to original file:", err);
        // Fallback to original, non-compressed file to prevent failure
        fileToUpload = file;
      }
    }

    return { valid: true, fileToUpload };
  };

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

  // General XML upload logic for Cloudinary / Fallback Base64 for zero-config trials
  const uploadFileToCloudinary = async (
    file: File | Blob, 
    onProgress: (p: number) => void
  ): Promise<{ url: string; publicId: string }> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      // Return a seamless, zero-config local Base64 fallback so the application is fully functional!
      return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
        const reader = new FileReader();
        onProgress(30);
        reader.onloadend = () => {
          onProgress(100);
          resolve({
            url: reader.result as string,
            publicId: `local-base64-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          });
        };
        reader.onerror = () => {
          reject(new Error('Local file reader conversion failed'));
        };
        reader.readAsDataURL(file);
      });
    }

    const data = new FormData();
    const fileName = (file instanceof File) ? file.name : 'image.jpg';
    data.append('file', file, fileName);
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

    // Reset input value so same file can be selected again
    e.target.value = '';

    setUploadError(null);
    const { valid, fileToUpload } = await validateAndProcessFile(file);
    if (!valid) return;

    // Set Instant Preview Local URL
    const objectUrl = URL.createObjectURL(fileToUpload);
    setPreviewUrl(objectUrl);
    
    setIsUploadingPrimary(true);
    setPrimaryUploadProgress(10);

    try {
      const res = await uploadFileToCloudinary(fileToUpload, setPrimaryUploadProgress);
      setUploadedUrl(res.url);
      setUploadedPublicId(res.publicId);
      setPrimaryUploadProgress(100);
      try {
        await imageService.saveUserImage(res.url, res.publicId || '');
      } catch (saveErr) {
        console.warn("Failed to automatically record image in portfolio:", saveErr);
      }
    } catch (err: any) {
      console.error("Primary upload failed:", err);
      setUploadError(err.message || "Failed to upload primary masterpiece.");
      setPreviewUrl(initialData?.imageUrl || '');
    } finally {
      setIsUploadingPrimary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUploadingPrimary) {
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
        imageUrls: [],
        publicIds: [],
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
    <>
      <form onSubmit={handleSubmit} className="space-y-8 pb-4 text-left">
      {!hasConfig && (
        <div className="bg-rose/5 border border-rose/20 p-5 rounded-2xl mb-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-rose" />
            </div>
            <div className="ml-4 text-left">
              <p className="text-xs text-rose font-black uppercase tracking-widest">
                Configuration Required
              </p>
              <p className="text-[11px] text-rose/85 mt-2 leading-relaxed font-semibold">
                1. Add <code className="bg-rose/10 px-1.5 py-0.5 rounded text-rose font-mono">VITE_CLOUDINARY_CLOUD_NAME</code> and <code className="bg-rose/10 px-1.5 py-0.5 rounded text-rose font-mono">VITE_CLOUDINARY_UPLOAD_PRESET</code> in <b>Settings</b>.
                <br />
                2. In Cloudinary Settings: Create an <b>Unsigned</b> upload preset.
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-rose bg-rose/5 p-4 rounded-2xl border border-rose/15 mb-6"
        >
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{uploadError}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Visual Media Portfolio (Symmetric card) */}
        <div className="md:col-span-5 space-y-6 md:sticky md:top-4">
          <div className="glass-card p-6 md:p-8 rounded-[32px] space-y-6">
            <div className="border-b border-theme-border/40 pb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-accent">
                Masterpiece Showcase (Primary)
              </span>
            </div>

            <div 
              className={`relative group aspect-[4/5] border border-dashed transition-all duration-500 rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-theme-bg/35 ${
                previewUrl ? 'border-transparent' : 'border-theme-accent/25 hover:border-theme-primary/50'
              }`}
            >
              {previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isUploadingPrimary ? 'opacity-40 grayscale' : ''}`} 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                    {!isUploadingPrimary && (
                      <button
                        type="button"
                        onClick={() => { 
                          setPreviewUrl(''); 
                          setUploadedUrl(''); 
                          setUploadedPublicId('');
                          setPrimaryUploadProgress(0);
                        }}
                        className="p-3 bg-rose text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer"
                        title="Remove Showcase Image"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {isUploadingPrimary && (
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[9px] text-white font-black uppercase tracking-widest animate-pulse">Uploading Showcase...</span>
                         <span className="text-xs text-theme-accent font-display font-black">{Math.round(primaryUploadProgress)}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${primaryUploadProgress}%` }}
                          className="h-full bg-theme-accent"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <label 
                  htmlFor="showcase-photo-uploader"
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 space-y-4"
                >
                  <input 
                    id="showcase-photo-uploader"
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePrimaryImageChange} 
                    required={!initialData} 
                  />
                  <div className="w-14 h-14 bg-theme-bg rounded-2xl flex items-center justify-center text-theme-primary border border-theme-border/50 group-hover:rotate-6 transition-transform shadow-sm">
                    <Upload size={20} className="text-theme-accent" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-theme-text-primary font-serif text-sm font-bold">Select Masterpiece</p>
                    <p className="text-[8px] text-theme-text-muted uppercase tracking-widest font-black">PNG, JPG up to 10MB</p>
                  </div>
                  <div className="px-3.5 py-1.5 bg-theme-accent/15 text-theme-accent text-[8px] font-black uppercase tracking-widest rounded-full border border-theme-accent/20 transition-all group-hover:bg-theme-accent group-hover:text-theme-accent-text">
                    Browse Files
                  </div>
                </label>
              )}
            </div>

            {/* Auxiliary Library Reuse Selector Button */}
            {!previewUrl && (
              <div className="border-t border-theme-border/20 pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="w-full h-11 flex items-center justify-center gap-1.5 bg-theme-surface hover:bg-theme-accent/10 hover:text-theme-accent border border-theme-border hover:border-theme-accent/40 rounded-xl transition-all duration-300 shadow-sm cursor-pointer text-theme-text-secondary"
                >
                  <Sparkles size={13} className="text-theme-accent animate-pulse shrink-0" />
                  <span className="uppercase text-[9px] font-black tracking-widest">Choose From My Images</span>
                </button>
              </div>
            )}

            <div className="border-t border-theme-border/40 pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Video className="text-rose shrink-0" size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent">
                  Reel / Video URL (Optional)
                </span>
              </div>
              <input
                type="url"
                placeholder="e.g. https://instagram.com/reel/... "
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted/40 transition-all duration-300 outline-none"
              />
              <span className="text-[8px] uppercase font-black text-theme-text-muted mt-1 block leading-normal">
                Inserts seamless video playbacks in the catalog.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Specifications & Details (Symmetric card) */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-[32px] space-y-6">
            <div className="border-b border-theme-border/40 pb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-accent">
                Product Specifications
              </span>
            </div>

            {/* Artisan Model Name */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                Artisan Model Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Maharani Crimson Silk Jhumka"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide outline-none placeholder:text-theme-text-muted/40 text-theme-text-primary transition-all duration-300"
              />
            </div>

            {/* Specifications Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Product Code
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ANS102"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Price (INR ₹)
                </label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 1999"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-mono font-bold text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Category / Silhouette
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Saree, Kurta"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-medium text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Offer Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 20 for 20% Off"
                  value={formData.offerPercent || ''}
                  onChange={(e) => setFormData({ ...formData, offerPercent: Number(e.target.value) })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-mono font-medium text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Sizes
                </label>
                <input
                  type="text"
                  placeholder="S, M, L, XL"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-mono font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Colors
                </label>
                <input
                  type="text"
                  placeholder="e.g. Black, Silk Red, Ivory"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Fabric Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% Pure Organza Silk"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Delivery Estimate
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3-5 Working Days"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl px-4 py-3 text-xs font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Badge Status
                </label>
                <div className="relative flex items-center">
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value as 'new_arrival' | 'trending' | 'fast_selling' | 'limited_stock' | 'sale' | '' })}
                    className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl pl-4 pr-10 py-3 text-xs text-theme-text-primary font-semibold transition-all duration-300 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-theme-surface text-theme-text-primary">No Badge Selected</option>
                    <option value="new_arrival" className="bg-theme-surface text-theme-text-primary">✨ New Arrival</option>
                    <option value="trending" className="bg-theme-surface text-theme-text-primary">🔥 Trending Now</option>
                    <option value="fast_selling" className="bg-theme-surface text-theme-text-primary">⚡ Fast Selling</option>
                    <option value="limited_stock" className="bg-theme-surface text-theme-text-primary">⚠️ Limited Stock</option>
                    <option value="sale" className="bg-theme-surface text-theme-text-primary">🏷️ On Sale</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 pointer-events-none text-theme-accent/60" />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Stock Availability
                </label>
                <div className="relative flex items-center">
                  <select
                    value={formData.stockStatus}
                    onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as 'in_stock' | 'low_stock' | 'out_of_stock' })}
                    className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl pl-4 pr-10 py-3 text-xs text-theme-text-primary font-semibold transition-all duration-300 outline-none appearance-none cursor-pointer"
                  >
                    <option value="in_stock" className="bg-theme-surface text-theme-text-primary">🟢 In Stock (Ready to ship)</option>
                    <option value="low_stock" className="bg-theme-surface text-theme-text-primary">🟡 Low Stock (Hurry up)</option>
                    <option value="out_of_stock" className="bg-theme-surface text-theme-text-primary">🔴 Out Of Stock</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 pointer-events-none text-theme-accent/60" />
                </div>
              </div>
            </div>

            {/* Stories and Override Textareas */}
            <div className="border-t border-theme-border/40 pt-4 space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80">
                  Artisan Story / Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Give details about the craftsmanship, materials, care instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl p-4 text-xs font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-accent/80 flex items-center gap-1.5">
                    Custom WhatsApp message override
                    <span className="cursor-help text-theme-primary inline-flex" title="Optional custom text client sends initially via WhatsApp.">
                      <HelpCircle size={12} />
                    </span>
                  </label>
                  <span className="text-[8px] bg-theme-accent/10 text-theme-accent border border-theme-accent/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    Optional Override
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Hi, I'm absolutely loving this handloom saree! Can you confirm availability and customize length for me?"
                  value={formData.customMessage}
                  onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                  className="w-full bg-theme-bg/60 border border-theme-border/60 hover:border-theme-accent/40 focus:border-theme-primary/95 focus:ring-1 focus:ring-theme-primary/20 rounded-xl p-4 text-xs font-medium tracking-wide text-theme-text-primary placeholder:text-theme-text-muted/40 outline-none transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-theme-border/40">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || isUploadingPrimary}
                className="flex-1 w-full h-12 flex items-center justify-center gap-2 bg-theme-primary text-theme-primary-text rounded-xl shadow-md disabled:opacity-40 disabled:scale-100 transition-all uppercase text-[10px] tracking-[0.15em] font-black cursor-pointer hover:opacity-90 animate-none"
              >
                {loading ? <Loader2 className="animate-spin shrink-0" size={14} /> : <CheckCircle2 className="shrink-0" size={14} />}
                <span>{initialData ? 'Archive Modified Piece' : 'Commit to Boutique Collection'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onCancel}
                className="flex-1 w-full h-12 flex items-center justify-center border border-theme-border text-theme-text-secondary font-black uppercase tracking-widest text-[10px] hover:bg-rose/5 hover:text-rose hover:border-rose/20 transition-all rounded-xl cursor-pointer"
              >
                Discard Changes
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </form>

      {/* Dynamic Image Size & Formatting Safes Dialog/Modal */}
      <AnimatePresence>
        {validationModal && validationModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setValidationModal(null)}
              className="fixed inset-0 bg-ink/70 dark:bg-ink/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white dark:bg-dark-card border border-gold/10 dark:border-white/5 rounded-[32px] p-8 shadow-2xl overflow-hidden text-center space-y-6 z-50"
            >
              <div className="w-16 h-16 bg-rose/10 text-rose rounded-2xl flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={32} />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xl font-serif text-ink dark:text-dark-text font-bold leading-tight">
                  {validationModal.title}
                </h3>
                <p className="text-xs text-ink/60 dark:text-dark-muted leading-relaxed font-semibold">
                  {validationModal.message}
                </p>
              </div>

              {/* Suggestions / Demands Box */}
              <div className="bg-cream/45 dark:bg-dark-surface/40 p-4 rounded-2xl border border-gold/5 text-left space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#a855f7] dark:text-[#c084fc] font-black">
                  Recommended Configuration
                </span>
                <p className="text-xs text-ink dark:text-dark-text font-sans font-bold leading-relaxed">
                  📐 Limit: Under 10MB per file
                </p>
                <p className="text-xs text-ink dark:text-dark-text font-sans font-medium leading-relaxed">
                  ✨ Suggested: <span className="text-[#a855f7] dark:text-[#c084fc] font-bold">{validationModal.suggestedSize}</span>
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setValidationModal(null)}
                className="w-full py-4 bg-ink dark:bg-gold text-white dark:text-ink font-sans uppercase tracking-[0.2em] font-black text-xs rounded-2xl cursor-pointer shadow-lg hover:opacity-95"
              >
                Acknowledge and Select Another Image
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(imageUrl, publicId) => {
          setPreviewUrl(imageUrl);
          setUploadedUrl(imageUrl);
          setUploadedPublicId(publicId || '');
          setUploadError(null);
        }}
      />
    </>
  );
}
