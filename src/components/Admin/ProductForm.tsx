import React from 'react';
import { ref, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    description: initialData?.description || '',
    category: initialData?.category || '',
  });

  const uploadWithRetry = async (blob: Blob, fileName: string, attempt: number = 0): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `products/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // 20s Timeout
      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload timed out after 20 seconds.'));
      }, 20000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error: StorageError) => {
          clearTimeout(timeoutId);
          console.error(`Upload error (attempt ${attempt + 1}):`, error);
          if (attempt < 1) {
            console.log('Retrying upload...');
            uploadWithRetry(blob, fileName, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(error);
          }
        },
        async () => {
          clearTimeout(timeoutId);
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.time('Image Processing & Upload');
      console.log(`Initial file size: ${(file.size / 1024).toFixed(2)}KB`);
      
      setImageFile(file);
      setUploadError(null);
      setUploadProgress(0);
      
      // Instant preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      setIsUploading(true);
      try {
        let uploadBlob: Blob = file;
        
        // Skip compression for small files (< 200KB)
        if (file.size > 200 * 1024) {
          console.time('Compression');
          uploadBlob = await compressImage(file);
          console.timeEnd('Compression');
        } else {
          console.log('Skipping compression for small file');
        }

        const fileName = (file.name.split('.')[0] || 'image') + '.jpg';
        
        console.time('Upload');
        const url = await uploadWithRetry(uploadBlob, fileName);
        console.timeEnd('Upload');
        
        setUploadedUrl(url);
        console.timeEnd('Image Processing & Upload');
      } catch (error) {
        console.error("Image process failed:", error);
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }

      // Cleanup
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!uploadedUrl) {
      setUploadError("Please wait for the image to finish uploading or try re-uploading.");
      return;
    }
    
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        imageUrl: uploadedUrl
      };

      if (initialData) {
        await productService.updateProduct(initialData.id, productData);
      } else {
        await productService.addProduct(productData);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. This might be due to connection issues or security rules.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Upload Area */}
        <div className="space-y-4">
          <label className="block text-sm font-bold uppercase tracking-widest text-charcoal/60">Product Image</label>
          <div className="relative aspect-[3/4] border-2 border-dashed border-gold/30 rounded-lg flex flex-col items-center justify-center bg-cream/30 overflow-hidden group">
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className={`w-full h-full object-cover ${isUploading ? 'opacity-40 grayscale' : ''}`} />
                
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[2px]">
                    <div className="bg-white p-4 rounded-xl shadow-2xl flex flex-col items-center space-y-3 min-w-[160px]">
                      <div className="relative w-12 h-12">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-gold/10" strokeWidth="3" />
                          <circle 
                            cx="18" cy="18" r="16" fill="none" className="stroke-gold transition-all duration-300" 
                            strokeWidth="3" 
                            strokeDasharray={`${uploadProgress}, 100`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gold">
                          {Math.round(uploadProgress)}%
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold animate-pulse">Uploading...</span>
                    </div>
                  </div>
                )}

                {!isUploading && uploadedUrl && (
                  <div className="absolute top-2 left-2 p-1.5 bg-green-500 rounded-full text-white shadow-lg">
                    <CheckCircle2 size={14} />
                  </div>
                )}

                {uploadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 p-4 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="text-red-500" size={24} />
                      <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight leading-tight">{uploadError}</p>
                      <label className="cursor-pointer bg-red-600 text-white text-[10px] px-3 py-1.5 rounded uppercase font-bold tracking-widest mt-2">
                        Retry
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { 
                    setPreviewUrl(''); 
                    setImageFile(null); 
                    setUploadedUrl(''); 
                    setUploadError(null);
                    setUploadProgress(0);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-maroon hover:bg-white shadow-md z-10 transition-transform active:scale-95"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 p-12 w-full h-full hover:bg-gold/5 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-2">
                  <Upload size={32} className="text-gold" />
                </div>
                <span className="text-xs uppercase tracking-widest text-charcoal/40 font-bold">Choose Masterpiece</span>
                <span className="text-[9px] uppercase tracking-tighter text-charcoal/30">JPG, PNG up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} required={!initialData} />
              </label>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-charcoal/60 mb-2">Product Name</label>
            <input
              type="text"
              required
              className="w-full bg-cream border-gold/20 py-3 px-4 focus:ring-1 focus:ring-gold outline-none font-sans transition-all"
              placeholder="e.g. Royal Maroon Saree"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-charcoal/60 mb-2">Price (₹)</label>
              <input
                type="number"
                required
                className="w-full bg-cream border-gold/20 py-3 px-4 focus:ring-1 focus:ring-gold outline-none font-sans"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-charcoal/60 mb-2">Category</label>
              <input
                type="text"
                className="w-full bg-cream border-gold/20 py-3 px-4 focus:ring-1 focus:ring-gold outline-none font-sans"
                placeholder="e.g. Saree"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-charcoal/60 mb-2">Description</label>
            <textarea
              rows={4}
              className="w-full bg-cream border-gold/20 py-3 px-4 focus:ring-1 focus:ring-gold outline-none font-sans resize-none"
              placeholder="Tell your customers about this masterpiece..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || isUploading}
              className="flex-1 luxury-gradient text-white py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Finalizing...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Uploading {Math.round(uploadProgress)}%</span>
                </>
              ) : (
                <span>{initialData ? 'Update Masterpiece' : 'Add to Collection'}</span>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 border border-gold/30 text-gold hover:bg-gold/5 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
