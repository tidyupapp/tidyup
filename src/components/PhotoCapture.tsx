import { useRef } from 'react';

interface Props {
  onPhoto: (dataUrl: string) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onPhoto, disabled }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file).then(onPhoto).catch(() => {
      const reader = new FileReader();
      reader.onload = () => onPhoto(reader.result as string);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  return (
    <div className="photo-capture">
      <button
        className="primary-button"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
      >
        <span aria-hidden>📷</span> Take a photo
      </button>
      <button
        className="secondary-button"
        disabled={disabled}
        onClick={() => libraryRef.current?.click()}
      >
        <span aria-hidden>🖼️</span> Choose from library
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}

async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  const img = await fileToImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
