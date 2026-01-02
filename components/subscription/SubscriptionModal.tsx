"use client";

import SubscriptionPlans from './SubscriptionPlans';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired?: () => void;
}

export default function SubscriptionModal({ isOpen, onClose, onAuthRequired }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        
        <SubscriptionPlans 
          onAuthRequired={onAuthRequired}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

