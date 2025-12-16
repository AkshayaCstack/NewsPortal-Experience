import Link from "next/link";
import { getFooter, jsonRteToText } from "@/helper";

export default async function Footer() {
  const footer = await getFooter();

  if (!footer) {
    return (
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            © {new Date().getFullYear()} NewsPortal. Built with Contentstack & Next.js
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="header-logo">
              {footer.logo?.image?.url && (
                <img
                  src={footer.logo.image.url}
                  alt={footer.logo?.label || footer.title || "Logo"}
                />
              )}
              <span className="footer-logo-text">{footer.title}</span>
            </div>
            <p className="footer-desc">
              Your trusted source for breaking news, in-depth analysis, and 
              comprehensive coverage of the stories that matter most.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              {footer.navigation_menu?.map((item: any, index: number) => (
                <li key={item.uid || index}>
                  <Link href={item.link?.href || "#"}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="footer-title">Categories</h4>
            <ul className="footer-links">
              <li><Link href="#">World News</Link></li>
              <li><Link href="#">Politics</Link></li>
              <li><Link href="#">Business</Link></li>
              <li><Link href="#">Technology</Link></li>
              <li><Link href="#">Sports</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="footer-title">Follow Us</h4>
            <div className="footer-social">
              {footer.social_apps?.map((social: any, index: number) => (
                <a 
                  key={social.uid || index}
                  href={social.link?.href || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title={social.label}
                >
                  {social.icon?.url? (
                    <img src={social.icon.url} alt={social.label} />
                  ) : (
                    <span style={{ fontSize: '0.8rem' }}>{social.label?.charAt(0)}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          {(() => {
            if (!footer.copyright_text) {
              return `© ${new Date().getFullYear()} ${footer.title || 'NewsPortal'}. All rights reserved.`;
            }
            // Handle both string and JSON RTE
            return typeof footer.copyright_text === 'string' 
              ? footer.copyright_text 
              : jsonRteToText(footer.copyright_text);
          })()}
        </div>
      </div>
    </footer>
  );
}
