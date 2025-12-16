"use client";

import Link from "next/link";
import { useState, useRef } from "react";

interface AuthorsSectionProps {
  data: any[];
}

interface TooltipPosition {
  top: number;
  left: number;
}

export default function AuthorsSection({ data }: AuthorsSectionProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [activeAuthor, setActiveAuthor] = useState<any>(null);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, authorId: string, author: any) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 12,
      left: rect.left + rect.width / 2,
    });
    setActiveTooltip(authorId);
    setActiveAuthor(author);
  };

  const handleMouseLeave = () => {
    // Delay hiding to allow moving to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringTooltip) {
        setActiveTooltip(null);
        setActiveAuthor(null);
      }
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    // Clear hide timeout when entering tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHoveringTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setIsHoveringTooltip(false);
    setActiveTooltip(null);
    setActiveAuthor(null);
  };

  if (!data || data.length === 0) return null;

  return (
    <section className="section authors-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Top Writers</h2>
        </div>

        <div className="authors-scroll-row">
          {data.map((item: any) => {
            const author = item.reference?.[0] || item;
            const authorName = author.name || author.title || 'Unknown';
            const authorId = author.uid || authorName;
            
            return (
              <div 
                key={authorId}
                className="author-card-wrapper"
                onMouseEnter={(e) => handleMouseEnter(e, authorId, author)}
                onMouseLeave={handleMouseLeave}
              >
                <Link href={`/author/${author.uid}`}>
                  <div className="author-avatar-card">
                    <div className="author-avatar-image">
                      <img
                        src={author.profile_image?.url || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23252540" width="80" height="80" rx="40"/><text x="40" y="48" text-anchor="middle" fill="%23a78bfa" font-size="28" font-weight="bold">${encodeURIComponent(authorName.charAt(0) || 'A')}</text></svg>`}
                        alt={authorName}
                      />
                    </div>
                 
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Tooltip - interactive */}
      {activeTooltip && activeAuthor && (
        <div 
          className="author-tooltip-fixed"
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="author-tooltip-body">
            <strong>{activeAuthor.name || activeAuthor.title || 'Unknown'}</strong>
            {activeAuthor.bio && (
              <p>{activeAuthor.bio.length > 80 ? activeAuthor.bio.substring(0, 80) + '...' : activeAuthor.bio}</p>
            )}
            <Link href={`/author/${activeAuthor.uid}`} className="view-profile">
              View Profile →
            </Link>
          </div>
          <div className="author-tooltip-arrow" />
        </div>
      )}
    </section>
  );
}
