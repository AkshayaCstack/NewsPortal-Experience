"use client";

import { useState } from "react";
import StorySubmissionModal from "./StorySubmissionModal";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

interface WriteStoryButtonProps {
  locale: string;
  variant?: "default" | "primary" | "cta";
  buttonText?: string;
}

export default function WriteStoryButton({ locale, variant = "default", buttonText }: WriteStoryButtonProps) {
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    setShowStoryModal(true);
  };

  const getButtonClass = () => {
    switch (variant) {
      case "primary":
        return "write-story-btn-primary";
      case "cta":
        return "write-story-btn-cta";
      default:
        return "write-story-btn";
    }
  };

  const defaultText = buttonText || "Write Your Story";

  return (
    <>
      <button className={getButtonClass()} onClick={handleClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        <span>{defaultText}</span>
      </button>

      <AuthModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        reason="Please sign in to share your story with the community."
      />

      {showStoryModal && (
        <StorySubmissionModal
          locale={locale}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </>
  );
}

