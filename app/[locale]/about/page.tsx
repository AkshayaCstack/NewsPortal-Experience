import Link from "next/link";
import { getPageByURL } from "@/helper";
import { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageByURL("/about", locale);
  
  return {
    title: page?.title || "About Us",
    description: "Learn more about our news portal and mission.",
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const page = await getPageByURL("/about", locale);

  if (!page) {
    return (
      <main className="about-empty">
        <div className="about-empty-content">
          <div className="about-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          </div>
          <h1>About Us</h1>
          <p>Please create a Page entry in Contentstack with URL "/about" to get started.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="about-page">
      {/* Decorative background elements */}
      <div className="about-bg-orb about-bg-orb-1" aria-hidden="true"></div>
      <div className="about-bg-orb about-bg-orb-2" aria-hidden="true"></div>
      <div className="about-bg-grid" aria-hidden="true"></div>
      
      {page.components?.map((block: any, i: number) => {
        // Hero Section
        if (block.hero_section) {
          const hero = block.hero_section;
          return (
            <section key={`hero-${i}`} className="about-hero">
              <div className="about-hero-inner">
                <div className="about-hero-badge">
                  <span className="about-hero-badge-dot"></span>
                  About Us
                </div>
                <h1 className="about-hero-title">
                  <span className="about-hero-title-line">{hero.title}</span>
                </h1>
                {hero.text_area && (
                  <p className="about-hero-description">{hero.text_area}</p>
                )}
                {hero.image?.url && (
                  <div className="about-hero-image-wrapper">
                    <div className="about-hero-image-glow"></div>
                    <div className="about-hero-image">
                      <img src={hero.image.url} alt={hero.title} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        }

        // Rich Text Section
        if (block.rich_text_section) {
          const section = block.rich_text_section;
          return (
            <section key={`richtext-${i}`} className="about-content-section">
              <div className="about-content-wrapper">
                <div className="about-content-label">
                  <span className="about-content-label-line"></span>
                  Our Story
                </div>
                <h2 className="about-content-title">{section.title}</h2>
                <div 
                  className="about-content-text"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            </section>
          );
        }

        // Features Section
        if (block.features_section) {
          const features = block.features_section;
          return (
            <section key={`features-${i}`} className="about-features-section">
              <div className="about-features-wrapper">
                <div className="about-features-header">
                  <h2 className="about-features-title">{features.features_intro_title}</h2>
                  <div className="about-features-decoration">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="about-features-grid">
                  {features.features_instance?.map((feature: any, fi: number) => (
                    <article 
                      key={feature._metadata?.uid || fi} 
                      className="about-feature-card"
                      style={{ animationDelay: `${fi * 100}ms` }}
                    >
                      <div className="about-feature-number">
                        {String(fi + 1).padStart(2, '0')}
                      </div>
                      <div className="about-feature-content">
                        <h3 className="about-feature-title">{feature.title}</h3>
                        <div 
                          className="about-feature-description"
                          dangerouslySetInnerHTML={{ __html: feature.description }}
                        />
                        {feature.explore_here?.href && (
                          <Link 
                            href={feature.explore_here.href.startsWith('/') ? `/${locale}${feature.explore_here.href}` : feature.explore_here.href} 
                            className="about-feature-link"
                          >
                            <span>{feature.explore_here.title || "Explore"}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </Link>
                        )}
                      </div>
                      <div className="about-feature-glow"></div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </main>
  );
}
