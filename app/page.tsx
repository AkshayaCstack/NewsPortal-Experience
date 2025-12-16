import { getPageByURL } from "@/helper";

import CategorySection from "@/components/home/CategorySection";
import AuthorsSection from "@/components/home/AuthorsSection";
import BreakingNews from "@/components/home/BreakingNews";
import ArticlesSection from "@/components/home/ArticlesSection";

export const revalidate = 60; // ISR - revalidate every 60 seconds

export default async function HomePage() {
  const page = await getPageByURL("/home");

  if (!page) {
    return (
      <main className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Welcome to NewsPortal</h1>
        <p className="text-muted">
          Please create a Page entry in Contentstack with URL "/home" to get started.
        </p>
      </main>
    );
  }

  return (
    <main>
      {page.components?.map((block: any, i: number) => {
        // Category Section
        if (block.category_section) {
          return (
            <CategorySection
              key={`category-${i}`}
              data={block.category_section.category}
            />
          );
        }

        // Authors Section
        if (block.authors_section) {
          return (
            <AuthorsSection
              key={`authors-${i}`}
              data={block.authors_section.author}
            />
          );
        }

        // Breaking News Section
        if (block.breaking_news) {
          return (
            <BreakingNews 
              key={`breaking-${i}`} 
              data={block.breaking_news} 
            />
          );
        }

        // Articles Section
        if (block.articles) {
          return (
            <ArticlesSection
              key={`articles-${i}`}
              data={block.articles.article_card}
              title={block.articles.title}
              description={block.articles.description}
            />
          );
        }

        return null;
      })}
    </main>
  );
}
