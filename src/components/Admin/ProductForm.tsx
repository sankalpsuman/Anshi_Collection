import React from 'react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
          // Fill background with white (for transparent PNGs converted to JPEG)
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
            0.75 // Balance between quality and size (targets ~300KB)
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
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState(initialData?.imageUrl || '');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState(initialData?.imageUrl || '');
  const [uploadedPublicId, setUploadedPublicId] = React.useState(initialData?.publicId || '');
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    description: initialData?.description || '',
    category: initialData?.category || '',
  });

  // Requirement 4: Separate logic - uploadImage returns Cloudinary data
  const uploadImage = async (file: File | Blob): Promise<{ url: string; publicId: string }> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      const msg = "Cloudinary config missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in the Settings menu.";
      setUploadError(msg);
      setIsUploading(false);
      throw new Error(msg);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'products');

    try {
      return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.min(progress * 0.9, 90)); 
          }
        };

        xhr.onload = () => {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            const url = response.secure_url;
            const publicId = response.public_id;
            setUploadedUrl(url);
            setUploadedPublicId(publicId);
            setUploadProgress(100);
            setIsUploading(false);
            resolve({ url, publicId });
          } else {
            console.error("Cloudinary Detailed Error:", response);
            let errorMessage = response.error?.message || 'Cloudinary upload failed';
            reject(new Error(errorMessage));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      setUploadError("Upload failed: " + (error.message || "Unknown error"));
      setIsUploading(false);
      throw error;
    }
  };

  // Requirement 4: Separate logic - saveProduct saves to Firestore
  const saveProduct = async (imageUrl: string, publicId: string) => {
    const productData = {
      ...formData,
      price: Number(formData.price),
      imageUrl,
      publicId
    };

    if (initialData) {
      await productService.updateProduct(initialData.id, productData);
    } else {
      await productService.addProduct(productData);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Requirement 3: Instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    try {
      let fileToUpload: File | Blob = file;
      
      // Requirement 3: Skip compression if image < 200KB
      if (file.size > 200 * 1024) {
        // Requirement 3: Upload immediately after selection (compressed if needed)
        fileToUpload = await compressImage(file);
      }
      
      await uploadImage(fileToUpload);
    } catch (err) {
      console.error("Upload init failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Requirement 5: Prevent saving product if image upload fails or is in progress
    if (isUploading) return;
    if (!uploadedUrl) {
      setUploadError("Image is required. Please wait for upload to complete.");
      return;
    }
    
    setLoading(true);

    try {
      await saveProduct(uploadedUrl, uploadedPublicId);
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const hasConfig = !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {!hasConfig && (
        <div className="bg-rose/5 border-l-4 border-rose p-6 rounded-2xl mb-10 shadow-xl shadow-rose/5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-rose" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-rose font-black uppercase tracking-[0.2em]">
                Configuration Required
              </p>
              <p className="text-xs text-rose/60 mt-2 leading-relaxed font-medium">
                1. Add <code className="bg-rose/10 px-2 py-0.5 rounded text-rose font-black">VITE_CLOUDINARY_CLOUD_NAME</code> and <code className="bg-rose/10 px-2 py-0.5 rounded text-rose font-black">VITE_CLOUDINARY_UPLOAD_PRESET</code> in <b>Settings</b>.
                <br />
                2. In Cloudinary: <b>Upload presets</b>, create an <b className="underline">Unsigned</b> preset.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* Image Upload Area */}
        <div className="space-y-4 sm:space-y-6">
          <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo/40 mb-2">Visual Representation</label>
          <div 
            className={`relative group aspect-[4/5] border-2 border-dashed transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col items-center justify-center bg-cream/30 ${
              previewUrl ? 'border-transparent' : 'border-gold/20 hover:border-maroon/40'
            }`}
          >
            {previewUrl ? (
              <>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isUploading ? 'opacity-40 grayscale' : ''}`} 
                />
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => { 
                        setPreviewUrl(''); 
                        setImageFile(null); 
                        setUploadedUrl(''); 
                        setUploadedPublicId('');
                        setUploadError(null);
                        setUploadProgress(0);
                      }}
                      className="p-3 sm:p-4 bg-rose text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-gradient-to-t from-ink/80 to-transparent">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[8px] sm:text-[10px] text-white font-black uppercase tracking-widest animate-pulse">Uploading Artifact...</span>
                       <span className="text-[10px] sm:text-xs text-saffron font-display font-black">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full saffron-gradient"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 sm:p-8 space-y-4 sm:space-y-6">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required={!initialData} />
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center text-maroon shadow-xl border border-gold/10 group-hover:rotate-12 transition-transform">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-ink font-serif text-lg sm:text-xl font-bold">Select Masterpiece</p>
                  <p className="text-[9px] sm:text-[10px] text-ink/30 uppercase tracking-widest mt-2 font-black">PNG, JPG up to 10MB</p>
                </div>
                <div className="px-4 sm:px-6 py-2 bg-indigo/5 text-indigo text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo/10">
                  Browse Files
                </div>
              </label>
            )}
          </div>
          {uploadError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 sm:gap-3 text-rose bg-rose/5 p-3 sm:p-4 rounded-xl border border-rose/10"
            >
              <AlertCircle size={14} className="shrink-0" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-relaxed">{uploadError}</p>
            </motion.div>
          )}
        </div>

        {/* Form Details */}
        <div className="space-y-8 sm:space-y-10">
          <div className="space-y-6 sm:space-y-8">
            <div className="relative">
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo/40 mb-2 sm:mb-3">Model Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Royal Indigo Saree"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b-2 border-gold/20 focus:border-maroon py-3 sm:py-4 font-serif text-xl sm:text-2xl outline-none placeholder:text-ink/10 transition-all font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="relative">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo/40 mb-2 sm:mb-3">Price (₹)</label>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-transparent border-b-2 border-gold/20 focus:border-maroon py-3 sm:py-4 font-display font-black text-xl sm:text-2xl outline-none placeholder:text-ink/10 transition-all"
                />
              </div>
              <div className="relative">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo/40 mb-2 sm:mb-3">Sillhouette</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Saree"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-gold/20 focus:border-maroon py-3 sm:py-4 font-serif italic text-xl sm:text-2xl outline-none placeholder:text-ink/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo/40 mb-2 sm:mb-3">Artisan Narrative</label>
              <textarea
                rows={3}
                placeholder="Describe the craftsmanship..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/50 backdrop-blur-sm border-2 border-gold/10 focus:border-maroon p-4 sm:p-6 rounded-2xl font-sans text-sm sm:text-base outline-none resize-none placeholder:text-ink/10 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || isUploading}
              className="flex-1 wa-button !bg-indigo !py-4 lg:!py-6 !rounded-2xl shadow-indigo/20 shadow-2xl disabled:opacity-50 disabled:grayscale transition-all disabled:scale-100 text-[10px] sm:text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span className="font-black uppercase tracking-[0.2em]">{initialData ? 'Archive Changes' : 'Commit to Collection'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-8 sm:px-10 py-4 lg:py-6 border-2 border-ink/5 text-ink/40 font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-rose/5 hover:text-rose hover:border-rose/10 transition-all rounded-2xl"
            >
              Discard
            </motion.button>
          </div>
        </div>
      </div>
    </form>
  );
}
