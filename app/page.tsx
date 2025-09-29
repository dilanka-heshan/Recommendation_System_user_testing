"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { setRecommendedVideos as setAnalyticsRecommendedVideos, sendSessionSummary, resetAnalyticsSession } from "@/lib/analytics";
import AuthGuard from "./components/AuthGuard";
import CategorySelection from "./components/CategorySelection";
import Recommendations from "./components/Recommendations";
import ThankYou from "./components/ThankYou";
import History from "./components/History";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
}

interface CategoryResponse {
  user_id: string;
  video_list: Video[];
}

export default function Home() {
  const { user, signOut } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [pickedVideos, setPickedVideos] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [uniId, setUniId] = useState<string>(user?.email || "");
  const [userID, setUserID] = useState<string>("");

  // Function to handle video selection/deselection
  const handleVideoSelect = (videoId: string) => {
    setPickedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  async function handleNext() {
    if (step == 1) {
      if (selectedCategories.length == 0) {
        alert("Please select at least one category");
        return;
      }
      setLoading(true);
      setStep(2);
      try {
        // First call the original AB testing categories API
        const res = await fetch("/api/ab-testing/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keywords: selectedCategories }),
        });

        const data: CategoryResponse = await res.json();
        setVideos(data.video_list);
        setUserID(data.user_id);

        // Then call the recommendation API to get personalized recommendations
        try {
          const recRes = await fetch("/api/recommendations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user?.id || data.user_id,
              top_k: 4  // Microservice will return 4, API will add 4 more for total of 8
            }),
          });

          if (recRes.ok) {
            const recData = await recRes.json();
            setRecommendedVideos(recData.videos || []);

            // Set up analytics tracking for ONLY the actually recommended videos (not the random ones)
            const allVideos = recData.videos || [];
            const recommendedCount = recData.recommended_count || 4;
            const actuallyRecommendedVideos = allVideos.slice(0, recommendedCount);
            const videoIds = actuallyRecommendedVideos.map((v: Video) => v.id);
            setAnalyticsRecommendedVideos(videoIds);

            console.log("Recommended videos loaded:", recData.videos?.length || 0);
            console.log("Actually recommended (for analytics):", recommendedCount, videoIds);
          } else {
            console.error("Failed to fetch recommendations:", recRes.status);
            // Don't block the flow if recommendations fail
          }
        } catch (recError) {
          console.error("Error fetching recommendations:", recError);
          // Don't block the flow if recommendations fail
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
      setLoading(false);
    }
    if (step == 2) {
      if (pickedVideos.length == 0) {
        alert("Please select at least one video");
        return;
      }
      setStep(3);
    }
    if (step == 3) {
      try {
        // Send analytics session summary before submitting
        if (user?.id) {
          try {
            await sendSessionSummary(user.id, pickedVideos);
            console.log("Analytics session summary sent successfully");
          } catch (analyticsError) {
            console.error("Failed to send analytics:", analyticsError);
            // Don't block submission if analytics fails
          }
        }

        const dataToSubmit = {
          user_id: user?.id || userID,
          selected_videos: pickedVideos,
          email: user?.email || uniId,
        };
        await fetch("/api/ab-testing/selected-videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        });

        alert("Your response stored successfully");

        // Reset analytics session for next use
        resetAnalyticsSession();

        window.location.reload();
      } catch (err) {
        console.error("Error submitting response:", err);
      }
    }
  }
  return (
    <AuthGuard>
      <div className="w-full h-screen px-48 py-20 flex flex-col items-center">
        {/* User info and sign out */}
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sign Out
          </button>
        </div>

        {step == 1 && (
          <CategorySelection
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
        )}
        {step == 2 && loading && (
          <Recommendations
            loading={loading}
            selectedCategories={selectedCategories}
          />
        )}
        {step == 2 && !loading && recommendedVideos.length > 0 && (
          <Recommendations
            loading={false}
            selectedCategories={selectedCategories}
            videos={recommendedVideos}
            onVideoSelect={handleVideoSelect}
            selectedVideos={pickedVideos}
            userId={user?.id || userID}
          />
        )}
        {step == 2 && !loading && recommendedVideos.length === 0 && (
          <History
            history={pickedVideos}
            setHistory={setPickedVideos}
            suggestedVideos={videos}
          />
        )}
        {step == 3 && <ThankYou uniId={uniId} setUniId={setUniId} />}
        <button
          onClick={handleNext}
          className=" mb-3 w-[200px] outline-2 outline-green-400 rounded-full py-2 font-semibold transition-all duration-300 hover:bg-green-400 hover:text-white cursor-pointer"
        >
          {step == 3 ? "Submit" : "Next"}
        </button>
        <div className=" w-full h-2 grid grid-cols-3 gap-4 max-w-[200px] mx-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-full ${index < step ? "bg-green-400" : "bg-zinc-100"
                }`}
            ></div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
