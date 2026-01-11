"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClass = "skeleton-loader";
  
  const getVariantClass = () => {
    switch (variant) {
      case "circular": return "skeleton-circular";
      case "rectangular": return "skeleton-rectangular";
      case "card": return "skeleton-card";
      default: return "skeleton-text";
    }
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${getVariantClass()} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

// Card Skeleton
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-card-wrapper ${className}`}>
      <Skeleton variant="rectangular" height={200} className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton width="30%" height={16} />
        <Skeleton height={24} />
        <Skeleton height={24} width="80%" />
        <div className="skeleton-card-footer">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton width={100} height={14} />
        </div>
      </div>
    </div>
  );
}

// Article List Skeleton
export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item" style={{ animationDelay: `${i * 100}ms` }}>
          <Skeleton variant="rectangular" width={120} height={80} />
          <div className="skeleton-list-content">
            <Skeleton width="60%" height={18} />
            <Skeleton height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Hero Skeleton
export function HeroSkeleton() {
  return (
    <div className="skeleton-hero">
      <div className="skeleton-hero-image">
        <Skeleton variant="rectangular" height="100%" width="100%" />
      </div>
      <div className="skeleton-hero-content">
        <Skeleton width={100} height={24} className="skeleton-badge" />
        <Skeleton height={48} width="80%" />
        <Skeleton height={48} width="60%" />
        <Skeleton height={20} width="90%" />
        <Skeleton height={20} width="70%" />
        <div className="skeleton-hero-meta">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton width={120} height={16} />
        </div>
      </div>
    </div>
  );
}

// Grid Skeleton
export function GridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div 
      className="skeleton-grid"
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '24px'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Page Loading Overlay
export function PageLoadingOverlay({ isLoading = true }: { isLoading?: boolean }) {
  if (!isLoading) return null;
  
  return (
    <div className={`page-loading-overlay ${!isLoading ? 'hidden' : ''}`}>
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

// Inline Loading Spinner
export function LoadingSpinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`loading-spinner-inline ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

