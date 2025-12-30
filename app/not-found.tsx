import Link from "next/link";

export default function NotFound() {
  return (
    <main 
      className="container" 
      style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 20px'
      }}
    >
      <h1 style={{ fontSize: '6rem', margin: 0, color: 'var(--color-accent)' }}>404</h1>
      <h2 style={{ marginTop: 16 }}>Page Not Found</h2>
      <p className="text-muted" style={{ maxWidth: 400, marginTop: 8 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        style={{
          marginTop: 24,
          padding: '12px 24px',
          background: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-full)',
          fontWeight: 600,
        }}
      >
        Back to Home
      </Link>
    </main>
  );
}

