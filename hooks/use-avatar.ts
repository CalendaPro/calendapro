'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export interface UseAvatarOptions {
  userType?: 'pro' | 'client';
}

export interface UseAvatarReturn {
  /** Upload a new avatar photo */
  uploadAvatar: (file: File) => Promise<{ url: string } | null>;
  /** Remove the current avatar photo */
  removeAvatar: () => Promise<boolean>;
  /** Update avatar style preference */
  updateAvatarStyle: (style: 'initials' | 'gradient' | 'custom') => Promise<boolean>;
  /** Update accent color */
  updateAccentColor: (color: string) => Promise<boolean>;
  /** Loading state for any operation */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

export function useAvatar(options: UseAvatarOptions = {}): UseAvatarReturn {
  const { user } = useUser();
  const { userType = 'client' } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(
    async (file: File): Promise<{ url: string } | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userType', userType);

        const response = await fetch('/api/avatar/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload avatar');
        }

        const data = await response.json();
        return { url: data.url };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload avatar';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, userType]
  );

  const removeAvatar = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/avatar/upload?userType=${userType}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove avatar');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove avatar';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, userType]);

  const updateAvatarStyle = useCallback(
    async (style: 'initials' | 'gradient' | 'custom'): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Update in Supabase based on user type
        const table = userType === 'pro' ? 'profiles' : 'client_profiles';
        const idField = userType === 'pro' ? 'id' : 'user_id';

        const response = await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table,
            idField,
            userId: user.id,
            data: { avatar_style: style },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update avatar style');
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update avatar style';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, userType]
  );

  const updateAccentColor = useCallback(
    async (color: string): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const table = userType === 'pro' ? 'profiles' : 'client_profiles';
        const idField = userType === 'pro' ? 'id' : 'user_id';
        const colorField = userType === 'pro' ? 'accent_color' : 'accent_color';

        const response = await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table,
            idField,
            userId: user.id,
            data: { [colorField]: color },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update accent color');
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update accent color';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, userType]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadAvatar,
    removeAvatar,
    updateAvatarStyle,
    updateAccentColor,
    isLoading,
    error,
    clearError,
  };
}

export default useAvatar;
