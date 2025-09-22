import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

interface RecipeActionsProps {
  recipeTitle: string;
  recipeUrl?: string;
}

const RecipeActions: React.FC<RecipeActionsProps> = ({ recipeTitle, recipeUrl }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  const getShareUrl = useCallback(() => {
    if (recipeUrl) return recipeUrl;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  }, [recipeUrl]);

  type SharePlatform = 'facebook' | 'twitter' | 'pinterest' | 'whatsapp' | 'native';

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      const url = getShareUrl();
      if (!url) return;
      const text = `Check out this amazing recipe: ${recipeTitle}`;

      if (platform === 'native') {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          try {
            await navigator.share({ title: recipeTitle, text, url });
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Native share cancelled or failed', error);
            }
          }
        }
        setShowShareMenu(false);
        return;
      }

      const shareUrls: Record<Exclude<SharePlatform, 'native'>, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      };

      if (typeof window !== 'undefined') {
        const shareTarget = shareUrls[platform];
        if (shareTarget) {
          window.open(shareTarget, '_blank', 'width=600,height=400');
        }
      }

      setShowShareMenu(false);
    },
    [getShareUrl, recipeTitle]
  );

  const copyToClipboard = useCallback(async () => {
    const url = getShareUrl();
    if (!url) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to copy link', error);
      }
    } finally {
      setShowShareMenu(false);
    }
  }, [getShareUrl]);

  const shareTargets = useMemo(
    () => (
      [
        { id: 'facebook' as SharePlatform, label: 'Facebook', icon: '📘', color: 'text-blue-600' },
        { id: 'twitter' as SharePlatform, label: 'Twitter', icon: '🐦', color: 'text-blue-400' },
        { id: 'pinterest' as SharePlatform, label: 'Pinterest', icon: '📌', color: 'text-red-600' },
        { id: 'whatsapp' as SharePlatform, label: 'WhatsApp', icon: '💬', color: 'text-green-600' },
        { id: 'native' as SharePlatform, label: 'Share...', icon: '📱', color: 'text-gray-600', hidden: !canNativeShare },
      ] as Array<{ id: SharePlatform; label: string; icon: string; color: string; hidden?: boolean }>
    ).filter(item => !item.hidden),
    [canNativeShare]
  );

  const basePill = 'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const favoriteClasses = cn(
    basePill,
    isFavorited
      ? 'bg-red-100 text-red-600 border-red-200'
      : 'bg-white text-gray-600 border-gray-200 hover:border-red-200 hover:text-red-600'
  );
  const bookmarkClasses = cn(
    basePill,
    'bg-white text-gray-600 border-gray-200 hover:bg-[color:var(--primary1)] hover:text-white',
    isBookmarked && 'bg-[color:var(--primary1)] text-white border-[color:var(--primary1)]'
  );
  const shareTriggerClasses = cn(
    basePill,
    'bg-[color:var(--primary2)] text-white border-[color:var(--primary2)] hover:bg-[color:var(--primary3)] focus-visible:ring-[color:var(--primary3)]'
  );

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setIsFavorited(prev => !prev)}
        className={favoriteClasses}
        type="button"
      >
        <span className={`text-lg ${isFavorited ? '❤️' : '🤍'}`}>
          {isFavorited ? '❤️' : '🤍'}
        </span>
        <span className="font-medium">
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      </button>

      <button
        onClick={() => setIsBookmarked(prev => !prev)}
        className={bookmarkClasses}
        type="button"
      >
        <span className="text-lg">📌</span>
        <span className="font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      </button>

      <div className="relative">
        <button
          onClick={() => setShowShareMenu(prev => !prev)}
          className={shareTriggerClasses}
          type="button"
          aria-haspopup="menu"
          aria-expanded={showShareMenu}
        >
          <span className="text-lg">📤</span>
          <span className="font-medium text-white">Share</span>
        </button>

        {showShareMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48" role="menu">
            {shareTargets.map(target => (
              <button
                key={target.id}
                onClick={() => handleShare(target.id)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                role="menuitem"
                type="button"
              >
                <span className={target.color}>{target.icon}</span>
                {target.label}
              </button>
            ))}
            <hr className="my-1" />
            <button
              onClick={copyToClipboard}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              role="menuitem"
              type="button"
            >
              <span className="text-gray-600">📋</span>
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


export default RecipeActions;
