import React, { useState } from 'react';

interface RecipeActionsProps {
  recipeTitle: string;
  recipeUrl?: string;
}

const RecipeActions: React.FC<RecipeActionsProps> = ({ recipeTitle, recipeUrl }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = (platform: string) => {
    const url = recipeUrl || window.location.href;
    const text = `Check out this amazing recipe: ${recipeTitle}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };

    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recipeUrl || window.location.href);
    setShowShareMenu(false);
    // You could add a toast notification here
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setIsFavorited(!isFavorited)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
          isFavorited 
            ? 'bg-red-100 text-red-600 border-2 border-red-200' 
            : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-red-200 hover:text-red-600'
        }`}
      >
        <span className={`text-lg ${isFavorited ? '❤️' : '🤍'}`}>
          {isFavorited ? '❤️' : '🤍'}
        </span>
        <span className="font-medium">
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      </button>

      <button
        onClick={() => setIsBookmarked(!isBookmarked)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
          isBookmarked 
            ? 'text-white border-2' 
            : 'bg-white text-gray-600 border-2 border-gray-200 hover:text-white'
        }`}
        style={{ 
          backgroundColor: isBookmarked ? 'var(--primary1)' : undefined,
          borderColor: isBookmarked ? 'var(--primary1)' : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isBookmarked) {
            e.currentTarget.style.backgroundColor = 'var(--primary1)';
            e.currentTarget.style.borderColor = 'var(--primary1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isBookmarked) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }
        }}
      >
        <span className="text-lg">📌</span>
        <span className="font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      </button>

      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 border-2 border-gray-200 hover:text-white transition-all duration-200"
          style={{ backgroundColor: 'var(--primary2)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary2)';
          }}
        >
          <span className="text-lg">📤</span>
          <span className="font-medium text-white">Share</span>
        </button>

        {showShareMenu && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
            <button
              onClick={() => handleShare('facebook')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-blue-600">📘</span>
              Facebook
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-blue-400">🐦</span>
              Twitter
            </button>
            <button
              onClick={() => handleShare('pinterest')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-red-600">📌</span>
              Pinterest
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-green-600">💬</span>
              WhatsApp
            </button>
            <hr className="my-1" />
            <button
              onClick={copyToClipboard}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
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


export default RecipeActions ; 