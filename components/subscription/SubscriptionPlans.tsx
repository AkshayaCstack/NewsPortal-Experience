"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/lytics';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Access to breaking news',
      'Limited articles per month',
      'Basic categories',
      'Email newsletter'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited articles',
      'All podcast episodes',
      'Premium magazines',
      'Ad-free experience',
      'Exclusive content',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$99',
    period: 'per year',
    features: [
      'Everything in Premium',
      'Save 17%',
      'Early access to features',
      'Offline reading',
      'VIP events access'
    ]
  }
];

interface SubscriptionPlansProps {
  onAuthRequired?: () => void;
  onClose?: () => void;
}

export default function SubscriptionPlans({ onAuthRequired, onClose }: SubscriptionPlansProps) {
  const { user, subscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (planId === 'free') return;

    setLoading(planId);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          plan: planId
        })
      });

      if (response.ok) {
        await refreshSubscription();
        
        // Track subscription event for Lytics audience segmentation
        trackEvent("subscription_started", {
          plan: planId,
          plan_name: plans.find(p => p.id === planId)?.name,
          price: plans.find(p => p.id === planId)?.price,
          user_id: user.id,
        });
        
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }

    setLoading(null);
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscription && planId === 'free') return true;
    return subscription?.plan === planId;
  };

  return (
    <div className="subscription-plans">
      <div className="plans-header">
        <h2>Choose Your Plan</h2>
        <p>Unlock premium content and features</p>
      </div>

      {success && (
        <div className="subscription-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Successfully subscribed!
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan(plan.id) ? 'current' : ''}`}
          >
            {plan.popular && <span className="popular-badge">Most Popular</span>}
            {isCurrentPlan(plan.id) && <span className="current-badge">Current Plan</span>}
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              className={`plan-btn ${plan.popular ? 'primary' : ''}`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id || isCurrentPlan(plan.id)}
            >
              {loading === plan.id ? (
                'Processing...'
              ) : isCurrentPlan(plan.id) ? (
                'Current Plan'
              ) : plan.id === 'free' ? (
                'Free Forever'
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

