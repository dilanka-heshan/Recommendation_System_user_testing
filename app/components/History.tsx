"use client";
import React from "react";
import Image from "next/image";
import { CircleCheck } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

interface HistoryProps {
  history: string[];
  setHistory: (history: string[]) => void;
  suggestedVideos: Video[];
}

export default function History({
  history,
  setHistory,
  suggestedVideos,
}: HistoryProps) {
  return (
    <div className="w-full h-full flex flex-col gap-12 items-center overflow-y-scroll mb-8 pb-8">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-center sticky top-0 bg-white z-10 font-playfair">
          Pick some videos you may want to watch now.
        </h2>

        {suggestedVideos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {suggestedVideos.map((video) => (
              <div
                key={crypto.randomUUID()}
                className="border aspect-video rounded-lg overflow-hidden "
              >
                <button
                  onClick={() => {
                    if (history.includes(video.id)) {
                      setHistory(history.filter((id) => id !== video.id));
                    } else {
                      setHistory([...history, video.id]);
                    }
                  }}
                  className="w-full h-full bg-red-400 relative cursor-pointer"
                >
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition-all duration-300 hover:scale-105"
                    unoptimized
                    onError={(e) => {
                      // Fallback to background color if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  {history.includes(video.id) && (
                    <div className=" absolute w-full h-full bg-black/50 top-0 flex justify-center items-center">
                      <p className=" text-4xl scale-200 text-green-400">
                        <CircleCheck />
                      </p>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {suggestedVideos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No videos available.
          </div>
        )}
      </div>
    </div>
  );
}
