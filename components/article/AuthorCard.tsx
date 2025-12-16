interface AuthorCardProps {
  author: any;
}

export default function AuthorCard({ author }: AuthorCardProps) {
  // Handle both array and single object
  const authorData = Array.isArray(author) ? author[0] : author;
  
  if (!authorData) return null;

  return (
    <div className="container">
      <div className="author-card-large">
        <img
          src={authorData.profile_image?.url || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100" rx="50"/><text x="50" y="58" text-anchor="middle" fill="%236b7280" font-size="32">${encodeURIComponent(authorData.name?.charAt(0) || 'A')}</text></svg>`}
          alt={authorData.name}
        />
        <div className="author-card-info">
          <h4>{authorData.name}</h4>
          {authorData.bio && (
            <p className="author-card-bio">{authorData.bio}</p>
          )}
          
          {/* Social Links */}
          {authorData.social_apps && authorData.social_apps.length > 0 && (
            <div className="author-card-social">
              {authorData.social_apps.map((social: any, index: number) => (
                <a 
                  key={index}
                  href={social.link?.href || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title={social.platform}
                >
                  {social.platform === 'Twitter' || social.platform === 'X' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ) : social.platform === 'LinkedIn' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
