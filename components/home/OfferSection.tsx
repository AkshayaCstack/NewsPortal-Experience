"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";

interface OfferSectionProps {
  title?: string;
  description?: string;
  discountPercent?: number;
  price?: number;
}

export default function OfferSection({ 
  title = "Special Offer!", 
  description = "Exclusive offer for you",
  discountPercent = 20,
  price = 199
}: OfferSectionProps) {
  const { user, setShowAuthModal } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Variant-driven: If this component renders, the variant decided to show it
  // We just need to handle the click action appropriately
  const handleClaimOffer = () => {
    if (!user) {
      // If not logged in, show auth modal first
      setShowAuthModal(true);
    } else {
      setShowSubscriptionModal(true);
    }
  };

  // Calculate discounted price
  const originalPrice = price;
  const discountedPrice = Math.round(price * (1 - discountPercent / 100));

  return (
    <>
      <section className="offer-section">
        <div className="container">
          <div className="offer-card">
            <div className="offer-badge">
              <span>{discountPercent}% OFF</span>
            </div>
            
            <div className="offer-content">
              <div className="offer-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              
              <div className="offer-text">
                <h2>{title}</h2>
                <p>{description}</p>
              </div>

              <div className="offer-pricing">
                <div className="original-price">
                  <span className="strikethrough">${originalPrice}</span>
                  <span className="label">/year</span>
                </div>
                <div className="discounted-price">
                  <span className="price">${discountedPrice}</span>
                  <span className="label">/year</span>
                </div>
              </div>

              <button 
                className="offer-cta-btn"
                onClick={handleClaimOffer}
              >
                Claim Your Offer
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <div className="offer-decoration">
              <div className="sparkle sparkle-1">✨</div>
              <div className="sparkle sparkle-2">⭐</div>
              <div className="sparkle sparkle-3">✨</div>
            </div>
          </div>
        </div>
      </section>

      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onAuthRequired={() => {
          setShowSubscriptionModal(false);
          setShowAuthModal(true);
        }}
      />
    </>
  );
}

