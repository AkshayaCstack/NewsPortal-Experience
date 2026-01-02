"use client";

import VideoCard from './VideoCard';

interface Video {
  uid: string;
  title: string;
  description?: string;
  thumbnail?: { url: string };
  video_url?: { href: string };
  is_featured?: boolean;
  category?: any;
}

interface VideoGridProps {
  videos: Video[];
}

// YouTube ID extraction function (client-side)
function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="videos-grid">
      {videos.map((video) => (
        <VideoCard 
          key={video.uid} 
          video={video}
          youtubeId={getYouTubeId(video.video_url?.href)}
        />
      ))}
    </div>
  );
}

