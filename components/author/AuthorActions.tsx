"use client";

import { useState } from 'react';
import FollowButton from '@/components/interactions/FollowButton';
import AuthModal from '@/components/auth/AuthModal';

interface AuthorActionsProps {
  authorUid: string;
  authorName: string;
}

export default function AuthorActions({ authorUid, authorName }: AuthorActionsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <FollowButton 
        targetType="author"
        targetEntryId={authorUid}
        targetName=""
        variant="default"
        size="lg"
        onAuthRequired={() => setShowAuthModal(true)}
      />

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

