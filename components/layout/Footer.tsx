import Link from "next/link";
import { getFooter, getAllCategories, jsonRteToText } from "@/helper";
import { getEditTagProps } from "@/lib/editTags";

interface FooterProps {
  locale?: string;
}

export default async function Footer({ locale = 'en-us' }: FooterProps) {
  const [footer, categories] = await Promise.all([
    getFooter(locale),
    getAllCategories(locale)
  ]);

  if (!footer) {
    return (
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            © {new Date().getFullYear()} NewzHub. Built with Contentstack & Next.js
          </div>
        </div>
      </footer>
    );
  }

  // Helper to localize internal links
  const localizeHref = (href: string) => {
    if (!href) return '#';
    return href.startsWith('/') && !href.startsWith(`/${locale}`) 
      ? `/${locale}${href}` 
      : href;
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column - With Edit Tags */}
          <div className="footer-brand">
            <Link href={`/${locale}`} className="header-logo">
              {footer.logo?.image?.url && (
                <img
                  src={footer.logo.image.url}
                  alt={footer.logo?.label || footer.title || "Logo"}
                  {...getEditTagProps(footer, 'logo.image', 'footer', locale)}
                />
              )}
              <span 
                className="footer-logo-text"
                {...getEditTagProps(footer, 'title', 'footer', locale)}
              >
                {footer.title}
              </span>
            </Link>
            {footer.description && (
              <p 
                className="footer-desc"
                {...getEditTagProps(footer, 'description', 'footer', locale)}
              >
                {footer.description}
              </p>
            )}
          </div>

          {/* Quick Links - from navigation_menu */}
          {footer.navigation_menu && footer.navigation_menu.length > 0 && (
            <div>
              <h4 className="footer-title">
                {locale === 'ta-in' ? 'விரைவு இணைப்புகள்' : 'Quick Links'}
              </h4>
              <ul className="footer-links">
                {footer.navigation_menu.map((item: any, index: number) => (
                  <li key={item._metadata?.uid || index}>
                    <Link href={localizeHref(item.link?.href)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories - dynamically fetched */}
          {categories && categories.length > 0 && (
            <div>
              <h4 className="footer-title">
                {locale === 'ta-in' ? 'வகைகள்' : 'Categories'}
              </h4>
              <ul className="footer-links">
                {categories.slice(0, 5).map((category: any) => (
                  <li key={category.uid}>
                    <Link href={`/${locale}/category/${category.uid}`}>
                      {category.title || category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Apps */}
          {footer.social_apps && footer.social_apps.length > 0 && (
            <div>
              <h4 className="footer-title">
                {locale === 'ta-in' ? 'எங்களை பின்தொடரவும்' : 'Follow Us'}
              </h4>
              <div className="footer-social">
                {footer.social_apps.map((social: any, index: number) => (
                  <a 
                    key={social._metadata?.uid || index}
                    href={social.link?.href || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={social.label}
                  >
                    {social.icon?.url ? (
                      <img src={social.icon.url} alt={social.label} />
                    ) : (
                      <span style={{ fontSize: '0.8rem' }}>{social.label?.charAt(0)}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          {(() => {
            if (!footer.copyright_text) {
              return `© ${new Date().getFullYear()} ${footer.title || 'NewzHub'}. ${locale === 'ta-in' ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : 'All rights reserved.'}`;
            }
            return typeof footer.copyright_text === 'string' 
              ? footer.copyright_text 
              : jsonRteToText(footer.copyright_text);
          })()}
        </div>
      </div>
    </footer>
  );
}
