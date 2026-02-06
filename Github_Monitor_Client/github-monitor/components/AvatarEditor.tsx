import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Upload, Move } from 'lucide-react';
import { Button } from './ui';
import { useLanguage } from '../services/languageContext';

interface AvatarEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string) => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setImageSrc(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
          setImageSrc(reader.result as string);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imageSrc || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const size = 200; // Output size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);

    const img = imageRef.current;
    
    // Center point of output canvas
    const cx = size / 2;
    const cy = size / 2;

    // Draw
    ctx.save();
    
    // Clip to circle
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // The visual container is 256px. The output is 200px. ratio = 200/256.
    const ratio = size / 256;
    
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    // Apply position offset scaled to canvas size
    ctx.translate(position.x * ratio, position.y * ratio); 
    
    // Draw image centered at origin
    // We assume natural dimensions for drawing
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.9));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background">
                <h3 className="font-bold text-txt-main">Edit Profile Picture</h3>
                <button onClick={onClose} className="text-txt-sec hover:text-txt-main"><X size={20}/></button>
            </div>
            
            <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto">
                {!imageSrc ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-64 h-64 rounded-full border-2 border-dashed border-border hover:border-primary bg-background flex flex-col items-center justify-center cursor-pointer transition-colors group"
                    >
                        <div className="p-4 rounded-full bg-surface mb-3 group-hover:scale-110 transition-transform shadow-sm border border-border">
                            <Upload size={32} className="text-txt-sec group-hover:text-primary" />
                        </div>
                        <p className="text-sm font-medium text-txt-sec group-hover:text-primary">Click to upload image</p>
                        <p className="text-xs text-txt-sec mt-1">JPG, PNG or GIF</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group select-none">
                            {/* Mask Overlay for Circle Crop Visualization */}
                            <div 
                                ref={containerRef}
                                className="w-64 h-64 rounded-full overflow-hidden border-4 border-surface shadow-xl bg-black/10 relative cursor-move"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <img 
                                    ref={imageRef}
                                    src={imageSrc} 
                                    alt="Upload preview" 
                                    className="max-w-none absolute left-1/2 top-1/2 origin-center pointer-events-none"
                                    style={{
                                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`
                                    }}
                                    draggable={false}
                                />
                                {/* Overlay grid for visual guide */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                     <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30"></div>
                                     <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30"></div>
                                </div>
                            </div>
                            
                            {/* Visual guide ring */}
                            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"></div>
                            
                            <button 
                                onClick={() => setImageSrc(null)} 
                                className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                title="Remove image"
                            >
                                <X size={16} />
                            </button>

                            <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-full pointer-events-none">
                                <Move size={14} />
                            </div>
                        </div>

                        <div className="w-full px-4 space-y-2">
                            <div className="flex justify-between text-xs text-txt-sec">
                                <span className="flex items-center gap-1"><ZoomOut size={14}/> 50%</span>
                                <span className="flex items-center gap-1">300% <ZoomIn size={14}/></span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="3" 
                                step="0.1" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-primary h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            <div className="p-4 border-t border-border bg-background flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={!imageSrc}>{t('save_prefs')}</Button>
            </div>
        </div>
    </div>
  );
};