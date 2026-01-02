"use client";

import ContentInteractions from '@/components/interactions/ContentInteractions';

interface ArticleInteractionsProps {
  articleUid: string;
  author?: {
    uid: string;
    name: string;
  } | null;
  category?: {
    uid: string;
    name: string;
  } | null;
}

export default function ArticleInteractions({ 
  articleUid, 
  author, 
  category 
}: ArticleInteractionsProps) {
  return (
    <ContentInteractions 
      contentType="article"
      contentUid={articleUid}
      author={author}
      category={category}
      showComments={true}
    />
  );
}

