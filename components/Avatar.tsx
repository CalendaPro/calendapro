'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { generateAvatarSVG, getColorFromName, svgToDataURI } from '@/lib/avatar/avatar-generator';

export interface AvatarProps {
  /** Photo URL - if provided and loads successfully, shows photo instead of generated avatar */
  src?: string | null;
  /** User/Pro name for generating initials */
  name: string;
  /** Accent color for avatar background - if not provided, derived from name */
  accentColor?: string;
  /** Avatar size preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Avatar style - defaults to 'initials' */
  style?: 'initials' | 'gradient' | 'custom';
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
  '2xl': 128,
};

export function Avatar({
  src,
  name,
  accentColor,
  size = 'md',
  style = 'initials',
  className = '',
  alt,
  onLoad,
  onError,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizePixels = sizeMap[size];
  const effectiveColor = accentColor || getColorFromName(name);

  // Generate avatar data URI
  const avatarDataURI = useMemo(() => {
    const svg = generateAvatarSVG({
      name,
      accentColor: effectiveColor,
      size: sizePixels,
      style,
    });
    return svgToDataURI(svg);
  }, [name, effectiveColor, sizePixels, style]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // If photo exists and loads ok → show photo
  if (src && !imageError) {
    return (
      <div
        className={`relative inline-block rounded-full overflow-hidden ${className}`}
        style={{ width: sizePixels, height: sizePixels }}
      >
        <Image
          src={src}
          alt={alt || name}
          fill
          className={`object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes={`${sizePixels}px`}
        />
        {/* Placeholder while loading or if error occurs */}
        {!imageLoaded && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `url(${avatarDataURI})`,
              backgroundSize: 'cover',
            }}
          />
        )}
      </div>
    );
  }

  // No photo or photo failed to load → show generated avatar
  return (
    <div
      className={`inline-block rounded-full overflow-hidden ${className}`}
      style={{
        width: sizePixels,
        height: sizePixels,
        backgroundImage: `url(${avatarDataURI})`,
        backgroundSize: 'cover',
      }}
      role="img"
      aria-label={alt || name}
    />
  );
}

// Avatar with hover effects for interactive use
export interface InteractiveAvatarProps extends AvatarProps {
  /** Show ring/highlight on hover */
  hoverable?: boolean;
  /** Active/selected state */
  isActive?: boolean;
  /** Show online indicator */
  isOnline?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function InteractiveAvatar({
  hoverable = true,
  isActive = false,
  isOnline = false,
  onClick,
  className = '',
  ...avatarProps
}: InteractiveAvatarProps) {
  const baseClasses = 'relative inline-block';
  const hoverClasses = hoverable
    ? 'hover:ring-2 hover:ring-offset-2 hover:ring-primary/50 cursor-pointer transition-all duration-200'
    : '';
  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-primary' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${activeClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      <Avatar {...avatarProps} />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

// Avatar group for showing multiple avatars
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name: string;
    id: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className = '',
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const sizePixels = sizeMap[size];

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.id}
          className="relative -ml-2 first:ml-0"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
            className="border-2 border-white shadow-sm"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="relative -ml-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-white text-gray-600 text-sm font-medium"
          style={{ width: sizePixels, height: sizePixels }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export default Avatar;
