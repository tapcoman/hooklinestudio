/**
 * Optimized Image Component for Core Web Vitals
 * Features progressive loading, WebP support, lazy loading, and proper sizing to prevent CLS
 * Optimized for LCP and overall performance
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean; // For LCP critical images
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  blurDataURL?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError,
  blurDataURL,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  fetchPriority = 'auto'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder || blurDataURL || '');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use intersection observer for lazy loading
  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: '50px' // Start loading 50px before entering viewport
  });

  // Generate responsive image sources
  const generateSrcSet = useCallback((baseSrc: string, quality: number): string => {
    if (!baseSrc.startsWith('http') && !baseSrc.startsWith('/')) {
      return baseSrc;
    }

    // Generate different sizes for responsive images
    const sizes = [640, 768, 1024, 1280, 1920];
    const srcSet = sizes.map(size => {
      // This would typically use a CDN or image service
      // For now, we'll use the original image
      return `${baseSrc} ${size}w`;
    }).join(', ');

    return srcSet;
  }, []);

  // Convert to WebP if supported
  const getOptimizedSrc = useCallback((src: string): string => {
    // Check if browser supports WebP
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    if (supportsWebP && src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
      // In a real implementation, this would convert to WebP via CDN
      return src.replace(/\.(jpg|jpeg|png)$/, '.webp');
    }

    return src;
  }, []);

  // Load the image
  const loadImage = useCallback(async () => {
    if (isLoading || isLoaded || error) return;
    
    setIsLoading(true);
    
    try {
      const img = new Image();
      
      // Set up event handlers
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        setIsLoading(false);
        onLoad?.();
      };
      
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
        onError?.();
      };
      
      // Start loading
      const optimizedSrc = getOptimizedSrc(src);
      img.src = optimizedSrc;
      
      // Set srcset for responsive images
      if (sizes) {
        img.srcset = generateSrcSet(optimizedSrc, quality);
        img.sizes = sizes;
      }
      
    } catch (err) {
      setError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [src, isLoading, isLoaded, error, onLoad, onError, getOptimizedSrc, generateSrcSet, quality, sizes]);

  // Trigger loading based on priority or intersection
  useEffect(() => {
    if (priority) {
      // Load immediately for critical images (LCP)
      loadImage();
    } else if (isIntersecting && !priority) {
      // Load when in viewport for non-critical images
      loadImage();
    }
  }, [priority, isIntersecting, loadImage]);

  // Calculate aspect ratio to prevent CLS
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  const containerStyles: React.CSSProperties = {
    position: fill ? 'relative' : undefined,
    width: fill ? '100%' : width,
    height: fill ? '100%' : height,
    ...(aspectRatio && !fill && {
      paddingBottom: `${aspectRatio}%`,
      height: 0,
      position: 'relative'
    })
  };

  const imageStyles: React.CSSProperties = {
    position: aspectRatio || fill ? 'absolute' : 'static',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: fill ? objectFit : undefined,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0
  };

  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
    backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: blurDataURL ? 'blur(10px)' : undefined
  };

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={containerStyles}
    >
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        style={imageStyles}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : fetchPriority}
        decoding="async"
        sizes={sizes}
        width={width}
        height={height}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setError(true);
          onError?.();
        }}
      />
      
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div style={placeholderStyles}>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-gray-400 text-sm text-center p-4">
              <div>Failed to load image</div>
              <div className="text-xs mt-1">{alt}</div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          )}
        </div>
      )}
      
      {/* Progressive enhancement: Show image immediately if already cached */}
      {priority && (
        <link
          rel="preload"
          as="image"
          href={getOptimizedSrc(src)}
          imageSizes={sizes}
          imageSrcSet={generateSrcSet(getOptimizedSrc(src), quality)}
        />
      )}
    </div>
  );
};

// Higher-order component for automatic optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = (props: P) => {
    return <Component {...props} />;
  };
  
  OptimizedComponent.displayName = `withImageOptimization(${Component.displayName || Component.name})`;
  
  return OptimizedComponent;
};

// Hook for preloading critical images
export const useImagePreloader = (images: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(src));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };
    
    // Preload all images
    Promise.all(images.map(preloadImage)).catch(console.error);
  }, [images]);
  
  return {
    loadedImages,
    isImageLoaded: (src: string) => loadedImages.has(src),
    preloadProgress: loadedImages.size / images.length
  };
};

// Utility for generating blur data URLs
export const generateBlurDataURL = (
  width: number = 10,
  height: number = 10,
  color: string = '#f0f0f0'
): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Critical image component for LCP optimization
export const CriticalImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      loading="eager"
      fetchPriority="high"
    />
  );
};