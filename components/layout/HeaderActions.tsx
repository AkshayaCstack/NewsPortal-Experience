"use client";

import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserMenu from '@/components/auth/UserMenu';
import AuthModal from '@/components/auth/AuthModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import GlobalSearch from '@/components/search/GlobalSearch';

interface HeaderActionsProps {
  locale: string;
}

export default function HeaderActions({ locale }: HeaderActionsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <div className="header-actions">
        {/* Language Switcher */}
        <LanguageSwitcher currentLocale={locale} />
        
        {/* Search */}
        <button 
          className="header-search"
          onClick={() => setShowSearch(true)}
          aria-label="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        {/* User Menu */}
        <UserMenu 
          locale={locale}
          onLoginClick={() => setShowAuthModal(true)}
          onSubscribeClick={() => setShowSubscriptionModal(true)}
        />
      </div>

      {/* Global Search Modal */}
      <GlobalSearch 
        locale={locale}
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Subscription Modal */}
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

