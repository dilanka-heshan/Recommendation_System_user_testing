"use client";
import Image from "next/image";
import { useEffect } from "react";
import { trackVideoClick, trackVideoSelect, trackVideoDeselect, trackVideoView } from "@/lib/analytics";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
}

interface RecommendationsProps {
  selectedCategories?: string[];
  loading: boolean;
  videos?: Video[];
  onVideoSelect?: (videoId: string) => void;
  selectedVideos?: string[];
  userId?: string;
}

export default function Recommendations({
  loading,
  videos = [],
  onVideoSelect,
  selectedVideos = [],
  userId = "",
}: RecommendationsProps) {
  // Track video views when component mounts with videos
  useEffect(() => {
    if (videos.length > 0 && userId) {
      videos.forEach(video => {
        trackVideoView(userId, video.id, selectedVideos).catch(console.error);
      });
    }
  }, [videos, userId, selectedVideos]);

  const handleVideoClick = async (videoId: string) => {
    if (!userId) return;

    try {
      // Track the click
      await trackVideoClick(userId, videoId, selectedVideos);

      // Handle selection/deselection
      const isCurrentlySelected = selectedVideos.includes(videoId);

      if (isCurrentlySelected) {
        // Track deselection
        const newSelection = selectedVideos.filter(id => id !== videoId);
        await trackVideoDeselect(userId, videoId, newSelection);
      } else {
        // Track selection
        const newSelection = [...selectedVideos, videoId];
        await trackVideoSelect(userId, videoId, newSelection);
      }

      // Call the parent's selection handler
      onVideoSelect?.(videoId);

    } catch (error) {
      console.error('Error tracking video interaction:', error);
      // Still allow the selection to proceed even if analytics fails
      onVideoSelect?.(videoId);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-12 items-center">
        <h2 className="text-3xl font-bold mb-6 text-center sticky top-0 bg-white z-10 font-playfair">
          Hold on, we are generating recommendations for you...
        </h2>
        <div className="text-center py-8 aspect-square relative w-1/3">
          <Image
            src="/giphy.gif"
            alt="Loading"
            fill
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-8 items-center px-4">
      <h2 className="text-3xl font-bold text-center font-playfair">
        Recommended Videos for You
      </h2>

      {videos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No recommendations available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl w-full">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${selectedVideos.includes(video.id)
                  ? "ring-4 ring-green-400"
                  : "border border-gray-200"
                }`}
              onClick={() => handleVideoClick(video.id)}
            >
              {/* Video Thumbnail */}
              <div className="relative w-full h-40">
                <Image
                  src={video.thumbnail && video.thumbnail.startsWith('http') ? video.thumbnail : 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'}
                  alt={video.title || 'Video thumbnail'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  onError={(e) => {
                    console.warn('Image failed to load:', video.thumbnail);
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
                  }}
                />
                {selectedVideos.includes(video.id) && (
                  <div className="absolute top-2 right-2 bg-green-400 text-white rounded-full p-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Video Details */}
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-600 text-xs line-clamp-2">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length > 0 && selectedVideos.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
