import Link from "next/link";
import { getHeader, getAllCategories, jsonRteToText } from "@/helper";

export default async function Header() {
  const [header, categories] = await Promise.all([
    getHeader(),
    getAllCategories()
  ]);

  if (!header) {
    return (
      <header className="header">
        <div className="container">
          <div className="header-main">
            <Link href="/" className="header-logo">
              <span className="header-logo-text">NewsPortal</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Notification Bar */}
      {header.notification_bar?.show_announcement && header.notification_bar?.announcement && (() => {
        // Handle both string and JSON RTE announcement
        const announcement = typeof header.notification_bar.announcement === 'string' 
          ? header.notification_bar.announcement 
          : jsonRteToText(header.notification_bar.announcement);
        
        if (!announcement) return null;
        
        return (
          <div className="ticker-wrap">
            <div className="container">
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <span className="ticker-label">Breaking</span>
                <div className="ticker-content">
                  <span className="ticker-item">{announcement}</span>
                  <span className="ticker-dot" />
                  <span className="ticker-item">{announcement}</span>
                  <span className="ticker-dot" />
                  <span className="ticker-item">{announcement}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Header */}
      <header className="header">
        <div className="container">
          <div className="header-main">
            {/* Logo */}
            <Link href="/" className="header-logo">
              {header.logo?.image?.url && (
                <img
                  src={header.logo.image.url}
                  alt={header.logo?.label || header.title || "Logo"}
                />
              )}
              <span className="header-logo-text">{header.title}</span>
            </Link>

            {/* Navigation */}
            <nav className="header-nav">
              {/* Live Blogs Link with indicator */}
              <Link href="/live" className="header-nav-link header-live-link">
                <span className="live-dot"></span>
                Live
              </Link>
              
              {/* Category Navigation */}
              {categories?.slice(0, 5).map((category: any) => (
                <Link 
                  key={category.uid} 
                  href={`/category/${category.uid}`}
                  className="header-nav-link"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="header-actions">
              <div className="header-search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
