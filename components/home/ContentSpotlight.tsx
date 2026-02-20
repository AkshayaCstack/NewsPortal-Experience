"use client";

import Link from "next/link";

interface SpotlightItem {
  uid: string;
  title: string;
  thumbnail?: { url: string };
  cover_image?: { url: string };
  published_date?: string;
  publish_date?: string;
  description?: string;
  category?: { name?: string; title?: string }[];
}

interface ContentSpotlightProps {
  spotlightType: "podcast" | "video" | "sports" | "politics" | "technology" | string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  items: SpotlightItem[];
  locale: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; route: string; label: string }> = {
  podcast:    { icon: "🎙️", color: "#10b981", bg: "rgba(16,185,129,0.08)",  route: "podcasts",    label: "Podcast"    },
  video:      { icon: "🎬", color: "#3b82f6", bg: "rgba(59,130,246,0.08)",   route: "videos",      label: "Video"      },
  sports:     { icon: "⚡", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   route: "news",        label: "Sports"     },
  politics:   { icon: "🏛️", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  route: "news",        label: "Politics"   },
  technology: { icon: "💻", color: "#06b6d4", bg: "rgba(6,182,212,0.08)",    route: "news",        label: "Technology" },
  premium:    { icon: "⭐", color: "#f59e0b", bg: "rgba(245,158,11,0.10)",   route: "magazine",    label: "Premium"    },
};

export default function ContentSpotlight({
  spotlightType,
  title,
  description,
  ctaText,
  ctaUrl,
  items,
  locale,
}: ContentSpotlightProps) {
  if (!items || items.length === 0) return null;

  const config = TYPE_CONFIG[spotlightType] ?? TYPE_CONFIG.podcast;
  const spotlightItems = items.slice(0, 4);

  function getItemUrl(item: SpotlightItem): string {
    if (spotlightType === "podcast") return `/${locale}/podcasts/${item.uid}`;
    if (spotlightType === "video")   return `/${locale}/videos`;
    if (spotlightType === "premium") return `/${locale}/magazine/${item.uid}`;
    return `/${locale}/news/${item.uid}`;
  }

  function getItemImage(item: SpotlightItem): string | undefined {
    return item.thumbnail?.url ?? item.cover_image?.url;
  }

  return (
    <section
      className="content-spotlight-section"
      style={{ "--spotlight-color": config.color, "--spotlight-bg": config.bg } as React.CSSProperties}
    >
      <div className="container">
        {/* Header */}
        <div className="spotlight-header">
          <div className="spotlight-badge">
            <span className="spotlight-icon">{config.icon}</span>
            <span className="spotlight-label">{config.label}</span>
          </div>
          <div className="spotlight-titles">
            <h2 className="spotlight-title">
              {title ?? `Top ${config.label}s For You`}
            </h2>
            {description && (
              <p className="spotlight-description">{description}</p>
            )}
          </div>
          {(ctaUrl || ctaText) && (
            <Link
              href={ctaUrl ?? `/${locale}/${config.route}`}
              className="spotlight-cta"
            >
              {ctaText ?? `See all ${config.label}s`}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Items grid */}
        <div className="spotlight-grid">
          {spotlightItems.map((item) => {
            const img = getItemImage(item);
            return (
              <Link key={item.uid} href={getItemUrl(item)} className="spotlight-card">
                {img && (
                  <div className="spotlight-card-img">
                    <img src={img} alt={item.title} loading="lazy" />
                    <div className="spotlight-card-overlay">
                      <span className="spotlight-play-icon">{config.icon}</span>
                    </div>
                  </div>
                )}
                <div className="spotlight-card-body">
                  <span className="spotlight-card-type">{config.label}</span>
                  <h3 className="spotlight-card-title">{item.title}</h3>
                  {item.description && (
                    <p className="spotlight-card-desc">
                      {item.description.substring(0, 80)}…
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
