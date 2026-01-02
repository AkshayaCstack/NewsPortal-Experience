import Link from "next/link";
import { getHeader, jsonRteToText } from "@/helper";
import HeaderActions from "@/components/layout/HeaderActions";

interface HeaderProps {
  locale?: string;
}

export default async function Header({ locale = 'en-us' }: HeaderProps) {
  const header = await getHeader(locale);

  if (!header) {
    return (
      <header className="header">
        <div className="container">
          <div className="header-main">
            <Link href={`/${locale}`} className="header-logo">
              <span className="header-logo-text">NewzHub</span>
            </Link>
            <HeaderActions locale={locale} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Notification Bar */}
      {header.notification_bar?.[0]?.show_announcement && header.notification_bar?.[0]?.announcement && (() => {
        const notif = header.notification_bar[0];
        const announcement = typeof notif.announcement === 'string' 
          ? notif.announcement 
          : jsonRteToText(notif.announcement);
        
        if (!announcement) return null;
        
        return (
          <div className="ticker-wrap">
            <div className="container">
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
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
            <Link href={`/${locale}`} className="header-logo">
              {header.logo?.image?.url && (
                <img
                  src={header.logo.image.url}
                  alt={header.logo?.label || header.title || "Logo"}
                />
              )}
              <span className="header-logo-text">{header.title}</span>
            </Link>

            {/* Navigation - from CMS navigation_menu */}
            <nav className="header-nav">
              {header.navigation_menu?.map((item: any, index: number) => {
                // Prepend locale to internal links
                const href = item.link?.href || "#";
                const localizedHref = href.startsWith('/') && !href.startsWith(`/${locale}`) 
                  ? `/${locale}${href}` 
                  : href;
                
                return (
                  <Link 
                    key={item._metadata?.uid || index}
                    href={localizedHref}
                    className="header-nav-link"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions with Auth */}
            <HeaderActions locale={locale} />
          </div>
        </div>
      </header>
    </>
  );
}
