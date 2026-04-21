'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarProps } from '@/components/Avatar';
import { PREDEFINED_PALETTES } from '@/lib/avatar/avatar-generator';
import { Upload, X, ImageIcon } from 'lucide-react';

export interface AvatarStylePickerProps {
  /** Current photo URL (if any) */
  currentPhotoUrl?: string | null;
  /** User/Pro name for avatar generation */
  name: string;
  /** Current accent color */
  accentColor?: string;
  /** Current avatar style */
  currentStyle?: 'initials' | 'gradient' | 'custom';
  /** Callback when style changes */
  onStyleChange?: (style: 'initials' | 'gradient' | 'custom') => void;
  /** Callback when color changes */
  onColorChange?: (color: string) => void;
  /** Callback when photo uploads */
  onPhotoUpload?: (file: File) => Promise<void>;
  /** Callback when photo is removed */
  onPhotoRemove?: () => Promise<void>;
  /** Loading state */
  isUploading?: boolean;
  /** User type for API calls */
  userType?: 'pro' | 'client';
}

type AvatarStyle = 'initials' | 'gradient' | 'custom';

const styleLabels: Record<AvatarStyle, { label: string; description: string }> = {
  initials: { label: 'Initiales', description: 'Simple et élégant' },
  gradient: { label: 'Gradient', description: 'Moderne et coloré' },
  custom: { label: 'Minimaliste', description: 'Formes géométriques' },
};

export function AvatarStylePicker({
  currentPhotoUrl,
  name,
  accentColor = '#3B82F6',
  currentStyle = 'initials',
  onStyleChange,
  onColorChange,
  onPhotoUpload,
  onPhotoRemove,
  isUploading = false,
  userType = 'client',
}: AvatarStylePickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(currentStyle);
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStyleSelect = (style: AvatarStyle) => {
    setSelectedStyle(style);
    onStyleChange?.(style);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await onPhotoUpload?.(file);
  };

  const handleRemovePhoto = async () => {
    setPreviewPhoto(null);
    await onPhotoRemove?.();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Photo de profil</label>
        
        <div className="flex items-center gap-4">
          {/* Current Avatar/Photo Preview */}
          <div className="relative">
            <Avatar
              src={previewPhoto}
              name={name}
              accentColor={selectedColor}
              size="lg"
              style={selectedStyle}
            />
            
            {/* Remove button (only if photo exists) */}
            {previewPhoto && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Supprimer la photo"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Upload button */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={triggerFileInput}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {previewPhoto ? 'Changer la photo' : 'Ajouter une photo'}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP ou GIF. Max 5MB.
            </p>
          </div>
        </div>

        {/* Photo vs Avatar explanation */}
        {!previewPhoto && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <ImageIcon className="w-5 h-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-blue-700">
              Sans photo uploadée, un avatar sera automatiquement généré avec vos initiales. 
              Choisissez un style ci-dessous.
            </p>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Style d&apos;avatar</label>
        
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(styleLabels) as AvatarStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => handleStyleSelect(style)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                selectedStyle === style
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Preview */}
              <div className="flex justify-center mb-2">
                <Avatar
                  src={null}
                  name={name}
                  accentColor={selectedColor}
                  size="md"
                  style={style}
                />
              </div>
              
              <div className="text-sm font-medium text-gray-900">
                {styleLabels[style].label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {styleLabels[style].description}
              </div>

              {/* Selected indicator */}
              {selectedStyle === style && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Couleur d&apos;accent</label>
        
        <div className="grid grid-cols-4 gap-2">
          {PREDEFINED_PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => handleColorSelect(palette.colors[0])}
              className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedColor === palette.colors[0]
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-full h-8 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})`,
                }}
              />
              <div className="text-xs text-gray-600 mt-1 text-center">
                {palette.name}
              </div>

              {/* Selected indicator */}
              {selectedColor === palette.colors[0] && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom color input */}
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm text-gray-600">Couleur personnalisée:</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="#3B82F6"
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="border-t pt-4">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Aperçu</label>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Avatar
              src={previewPhoto}
              name={name}
              accentColor={selectedColor}
              size="sm"
              style={selectedStyle}
            />
            <span className="text-xs text-gray-500 mt-1 block">Petit</span>
          </div>
          <div className="text-center">
            <Avatar
              src={previewPhoto}
              name={name}
              accentColor={selectedColor}
              size="md"
              style={selectedStyle}
            />
            <span className="text-xs text-gray-500 mt-1 block">Moyen</span>
          </div>
          <div className="text-center">
            <Avatar
              src={previewPhoto}
              name={name}
              accentColor={selectedColor}
              size="lg"
              style={selectedStyle}
            />
            <span className="text-xs text-gray-500 mt-1 block">Grand</span>
          </div>
          <div className="text-center">
            <Avatar
              src={previewPhoto}
              name={name}
              accentColor={selectedColor}
              size="xl"
              style={selectedStyle}
            />
            <span className="text-xs text-gray-500 mt-1 block">Très grand</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarStylePicker;
