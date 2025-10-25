import * as React from 'react';

interface ImageUploadProps {
  label: string;
  onImageSelect: (image: { file: File; base64: string; mimeType: string } | null) => void;
}

const compressImage = (file: File, maxSize: number, quality: number): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const mimeType = 'image/jpeg';
        resolve({ base64: dataUrl.split(',')[1], mimeType });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


export const ImageUpload: React.FC<ImageUploadProps> = ({ label, onImageSelect }) => {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit file size before compression attempt to avoid browser crashing on huge files.
      if (file.size > 10 * 1024 * 1024) { 
        alert("File is too large. Please select an image under 10MB.");
        onImageSelect(null);
        setPreview(null);
        setFileName(null);
        return;
      }
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      try {
        const compressedData = await compressImage(file, 600, 0.7); // Resize to max 600px and 70% JPEG quality
        onImageSelect({ file, ...compressedData });
      } catch (error) {
        console.error("Image compression failed:", error);
        alert("Could not process image. Please try a different one.");
        onImageSelect(null);
        setPreview(null);
        setFileName(null);
      }
    }
  }, [onImageSelect]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-celo-green mb-1">{label} Satellite Image</label>
      <div
        onClick={handleClick}
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-light-purple border-dashed rounded-md cursor-pointer hover:border-celo-green transition-colors duration-300"
      >
        <div className="space-y-1 text-center">
          {preview ? (
            <img src={preview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
          ) : (
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div className="flex text-sm text-gray-400">
            <p className="pl-1">{fileName ? fileName : 'Upload a file'}</p>
            <input ref={fileInputRef} id={label} name={label} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>
    </div>
  );
};