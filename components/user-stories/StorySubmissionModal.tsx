"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "./RichTextEditor";

interface StorySubmissionModalProps {
  locale: string;
  onClose: () => void;
  editData?: {
    id: string;
    title: string;
    summary: string;
    body: any;
    category: string;
    location: string;
  };
}

const CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "personal-experience", label: "Personal Experience" },
  { value: "community-news", label: "Community News" },
  { value: "opinion", label: "Opinion" },
  { value: "success-story", label: "Success Story" },
  { value: "local-event", label: "Local Event" },
  { value: "human-interest", label: "Human Interest" },
  { value: "technology", label: "Technology" },
  { value: "environment", label: "Environment" },
  { value: "health-wellness", label: "Health & Wellness" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

export default function StorySubmissionModal({ locale, onClose, editData }: StorySubmissionModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: editData?.title || "",
    summary: editData?.summary || "",
    body: editData?.body || null,
    category: editData?.category || "",
    location: editData?.location || "",
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isSubmitting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Please enter a title for your story");
      return;
    }
    
    if (!formData.body) {
      setError("Please write your story");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const method = editData ? "PUT" : "POST";
      const response = await fetch("/api/citizen-submissions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editData && { id: editData.id }),
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit story");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.title.trim().length >= 5;
    }
    return true;
  };

  if (submitted) {
    return (
      <div className="story-modal-overlay" onClick={onClose}>
        <div className="story-modal story-modal-success" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Story Submitted!</h2>
          <p>
            Thank you for sharing your story. Our editorial team will review it and publish it once approved.
          </p>
          <p className="success-note">
            You can track your submission status in your profile.
          </p>
          <button className="success-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="story-modal-header">
          <div className="modal-title-row">
            <div className="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div>
              <h2>{editData ? "Edit Your Story" : "Write Your Story"}</h2>
              <p>Share your experience with our community</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="story-steps">
          <div className={`step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <span className="step-number">1</span>
            <span className="step-label">Details</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <span className="step-number">2</span>
            <span className="step-label">Write</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            <span className="step-number">3</span>
            <span className="step-label">Review</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="story-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="story-form">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="story-step-content story-step-left">
              <div className="form-group">
                <label htmlFor="title">
                  Story Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Enter a compelling title for your story..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={150}
                />
                <span className="char-count">{formData.title.length}/150</span>
              </div>

              <div className="form-group">
                <label htmlFor="summary">
                  Summary <span className="optional">(optional)</span>
                </label>
                <textarea
                  id="summary"
                  placeholder="A brief summary of your story (this will be shown in previews)..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  maxLength={300}
                  rows={3}
                />
                <span className="char-count">{formData.summary.length}/300</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">
                    Location <span className="optional">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Write */}
          {step === 2 && (
            <div className="story-step-content story-step-left story-editor-step">
              <div className="form-group editor-group">
                <label>
                  Your Story <span className="required">*</span>
                </label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(content) => setFormData({ ...formData, body: content })}
                  placeholder="Start writing your story here..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="story-step-content story-step-left story-review-step">
              <div className="review-section">
                <h4>Title</h4>
                <p className="review-value">{formData.title}</p>
              </div>

              {formData.summary && (
                <div className="review-section">
                  <h4>Summary</h4>
                  <p className="review-value">{formData.summary}</p>
                </div>
              )}

              <div className="review-row">
                {formData.category && (
                  <div className="review-section">
                    <h4>Category</h4>
                    <p className="review-value">
                      {CATEGORIES.find((c) => c.value === formData.category)?.label}
                    </p>
                  </div>
                )}
                {formData.location && (
                  <div className="review-section">
                    <h4>Location</h4>
                    <p className="review-value">{formData.location}</p>
                  </div>
                )}
              </div>

              <div className="review-section">
                <h4>Story Content</h4>
                <div className="review-body-preview">
                  {formData.body ? (
                    <span className="preview-check">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Content ready
                    </span>
                  ) : (
                    <span className="preview-warning">No content</span>
                  )}
                </div>
              </div>

              <div className="review-disclaimer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p>
                  By submitting, you agree that your story may be edited for clarity and will be reviewed by our editorial team before publication.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="story-modal-footer">
            {step > 1 && (
              <button
                type="button"
                className="story-btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="story-btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="story-btn-submit"
                disabled={isSubmitting || !formData.body}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Story
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

