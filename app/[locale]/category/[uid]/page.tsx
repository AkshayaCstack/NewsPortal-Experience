import { getCategoryByUid, getArticlesByCategory, getAllCategories } from "@/helper";
import ArticlesSection from "@/components/home/ArticlesSection";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ uid: string; locale: string }>;
}

// Generate static params for all categories in all locales
export async function generateStaticParams() {
  const params: { locale: string; uid: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const categories = await getAllCategories(locale);
    categories.forEach((category: any) => {
      params.push({ locale, uid: category.uid });
    });
  }
  
  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { uid, locale } = await params;
  const category = await getCategoryByUid(uid, locale);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - News`,
    description: `Latest news and articles in ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { uid, locale } = await params;
  
  const [category, articles] = await Promise.all([
    getCategoryByUid(uid, locale),
    getArticlesByCategory(uid, locale)
  ]);

  if (!category) {
    notFound();
  }

  // Transform articles for ArticlesSection
  const articlesData = articles.map((article: any) => ({
    referenced_article: article,
  }));

  return (
    <main>
      {/* Category Hero Section */}
      <section className="category-hero-section">
        <div className="container">
          <Link href={`/${locale}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
          
          <div className="category-hero">
            {category.icon?.url && (
              <img 
                src={category.icon.url} 
                alt={category.name}
                className="category-hero-icon"
              />
            )}
            <h1>{category.name}</h1>
            <p className="category-count">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </section>

      {/* Category Articles */}
      {articlesData.length > 0 ? (
        <ArticlesSection
          data={articlesData}
          title={`Latest in ${category.name}`}
          locale={locale}
        />
      ) : (
        <section className="section">
          <div className="container text-center">
            <p className="text-muted">No articles in this category yet.</p>
          </div>
        </section>
      )}
    </main>
  );
}

