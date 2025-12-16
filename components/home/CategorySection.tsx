import Link from "next/link";

interface CategorySectionProps {
  data: any[];
}

export default function CategorySection({ data }: CategorySectionProps) {
  if (!data || data.length === 0) return null;

  return (
    <section className="section" style={{ paddingTop: 24, paddingBottom: 16 }}>
      <div className="container">
        <div className="scroll-row">
          {/* All Category - links to home */}
          <Link href="/">
            <div className="category-pill active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              All
            </div>
          </Link>

          {data.map((cat: any) => {
            // Handle both direct category objects and reference objects
            const category = cat.reference?.[0] || cat;
            
            return (
              <Link 
                key={category.uid || category.title} 
                href={`/category/${category.uid}`}
              >
                <div className="category-pill">
                  {category.icon?.url && (
                    <img 
                      src={category.icon.url} 
                      alt={category.name || category.title}
                      className="category-icon"
                    />
                  )}
                  {category.name || category.title}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
