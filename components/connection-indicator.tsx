"use client";

import { useEffect, useState } from "react";
import { detectConnectionSpeed } from "@/lib/model-loader-optimized";
import { Wifi, WifiOff, Signal } from "lucide-react";

export function ConnectionIndicator() {
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Initial detection
    setSpeed(detectConnectionSpeed());
    setIsOnline(navigator.onLine);
    
    // Update on connection change
    const handleOnline = () => {
      setIsOnline(true);
      setSpeed(detectConnectionSpeed());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    const handleConnectionChange = () => {
      setSpeed(detectConnectionSpeed());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);
  
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-yellow-400/20 flex items-center gap-2 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Offline Mode</span>
      </div>
    );
  }
  
  // Only show indicator on slow connections
  if (speed !== 'slow') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-orange-400/20 flex items-center gap-2 text-sm">
      <Signal className="w-4 h-4" />
      <span>Slow Connection - Loading optimized models</span>
    </div>
  );
}
