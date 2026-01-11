"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StorySubmissionModal from "./StorySubmissionModal";

interface Submission {
  id: string;
  title: string;
  summary: string | null;
  body: any;
  category: string | null;
  location: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface MySubmissionsProps {
  locale: string;
}

export default function MySubmissions({ locale }: MySubmissionsProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/citizen-submissions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch submissions");
      }

      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );
      case "rejected":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ta-in" ? "ta-IN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="my-submissions-section">
        <h3 className="submissions-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          My Story Submissions
        </h3>
        <div className="submissions-loading">
          <div className="loading-spinner"></div>
          <span>Loading your submissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-submissions-section">
        <h3 className="submissions-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          My Story Submissions
        </h3>
        <div className="submissions-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="my-submissions-section">
      <h3 className="submissions-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        My Story Submissions
        {submissions.length > 0 && (
          <span className="submissions-count">{submissions.length}</span>
        )}
      </h3>

      {submissions.length === 0 ? (
        <div className="submissions-empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <p>You haven't submitted any stories yet.</p>
          <a href={`/${locale}/user-stories`} className="submissions-cta">
            Browse Community Stories
          </a>
        </div>
      ) : (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <span className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                  {getStatusIcon(submission.status)}
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
                <span className="submission-date">{formatDate(submission.created_at)}</span>
              </div>

              <h4 className="submission-title">{submission.title}</h4>

              {submission.summary && (
                <p className="submission-summary">
                  {submission.summary.substring(0, 100)}
                  {submission.summary.length > 100 ? "..." : ""}
                </p>
              )}

              <div className="submission-meta">
                {submission.category && (
                  <span className="submission-category">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {submission.category.replace("-", " ")}
                  </span>
                )}
                {submission.location && (
                  <span className="submission-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {submission.location}
                  </span>
                )}
              </div>

              {submission.status === "pending" && (
                <div className="submission-actions">
                  <button
                    className="edit-submission-btn"
                    onClick={() => setEditingSubmission(submission)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
              )}

              {submission.status === "approved" && (
                <a
                  href={`/${locale}/user-stories`}
                  className="view-published-btn"
                >
                  View Published
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingSubmission && (
        <StorySubmissionModal
          locale={locale}
          editData={{
            id: editingSubmission.id,
            title: editingSubmission.title,
            summary: editingSubmission.summary || "",
            body: editingSubmission.body,
            category: editingSubmission.category || "",
            location: editingSubmission.location || "",
          }}
          onClose={() => {
            setEditingSubmission(null);
            fetchSubmissions(); // Refresh list
          }}
        />
      )}
    </div>
  );
}

