"use client";

import { useAuth } from "@/contexts/AuthContext";

interface CardData {
  title?: string;
  description?: string;
  button_text?: string;
}

interface NewsletterProps {
  signinCard?: CardData;
  newsletterCard?: CardData;
  onGetStarted?: () => void;
  onUpgrade?: () => void;
}

export default function Newsletter({ signinCard, newsletterCard, onGetStarted, onUpgrade }: NewsletterProps) {
  const { user, setShowAuthModal } = useAuth();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    // For now, could open subscription modal or navigate to subscription page
  };

  return (
    <section className="home-newsletter-section">
      <div className="container">
        <div className="newsletter-cards-grid">
          {/* Get Started Card - Show for non-logged-in users */}
          {!user && signinCard && (
            <div className="home-newsletter-card signin-card">
              <div className="home-newsletter-content">
                <div className="home-newsletter-icon signin">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="home-newsletter-text">
                  <h3>{signinCard.title}</h3>
                  <p>{signinCard.description}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="home-newsletter-btn signin-btn"
                onClick={handleGetStarted}
              >
                {signinCard.button_text}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}

          {/* Newsletter/Premium Card */}
          {newsletterCard && (
            <div className="home-newsletter-card premium-card">
              <div className="home-newsletter-content">
                <div className="home-newsletter-icon premium">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="home-newsletter-text">
                  <h3>{newsletterCard.title}</h3>
                  <p>{newsletterCard.description}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="home-newsletter-btn premium-btn"
                onClick={handleUpgrade}
              >
                {newsletterCard.button_text}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

