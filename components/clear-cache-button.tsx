'use client';

import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClearCacheButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export function ClearCacheButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  showIcon = true 
}: ClearCacheButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);

    try {
      // Use the centralized cache clearing system
      const { forceClearCache } = await import('@/lib/auto-cache-clear');
      await forceClearCache();

      // Show success message
      alert('Cache cleared successfully! The page will now reload.');

      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try manually clearing your browser cache.');
      setClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearCache}
      disabled={clearing}
      variant={variant}
      size={size}
      className={className}
    >
      {clearing ? (
        <>
          {showIcon && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Clearing...
        </>
      ) : (
        <>
          {showIcon && <Trash2 className="w-4 h-4 mr-2" />}
          Clear Cache
        </>
      )}
    </Button>
  );
}
