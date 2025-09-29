import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RecommendationRequest {
  user_id: string
  top_k?: number
}

interface BackendVideo {
  video_id: string
  title: string
  thumbnail_url: string
}

interface BackendResponse {
  user_id: string
  video_ids: string[]
  total_count: number
}

interface Video {
  id: string
  title: string
  thumbnail: string
  description: string
}

// Function to fetch random videos from backend service
async function fetchRandomVideosFromBackend(excludeIds: string[] = [], limit: number = 4): Promise<Video[]> {
  try {
    // Get the Cloud Run service URL from environment variables
    // For local development, default to localhost:8000
    const backendUrl = process.env.CLOUD_RUN_URL || 'https://recommendation-system-micro-service-youtube-d-837849930410.europe-west1.run.app'
    
    // Fetch more videos initially to allow for exclusion filtering
    const fetchLimit = Math.min(limit + excludeIds.length + 5, 20) // Max 20 as per API limit
    
    console.log(`Calling random videos service at: ${backendUrl}/test/random-videos?limit=${fetchLimit}`)

    const response = await fetch(`${backendUrl}/test/random-videos?limit=${fetchLimit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.error('Error fetching random videos from backend:', response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data || data.status !== 'success' || !data.videos || !Array.isArray(data.videos)) {
      console.log('No videos found in backend response, will use fallback')
      return []
    }

    // Filter out excluded video IDs
    let filteredVideos = data.videos
    if (excludeIds.length > 0) {
      filteredVideos = data.videos.filter((video: any) => !excludeIds.includes(video.video_id))
    }

    // Randomly shuffle and select the required number
    const shuffledVideos = filteredVideos.sort(() => Math.random() - 0.5).slice(0, limit)

    return shuffledVideos.map((video: any) => ({
      id: video.video_id,
      title: video.title || `Video ${video.video_id}`,
      thumbnail: video.thumbnail_url || 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      description: video.description || video.title || `Video content for ${video.video_id}`
    }))

  } catch (error) {
    console.error('Error in fetchRandomVideosFromBackend:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()

    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Default to 4 videos from microservice
    const top_k = body.top_k || 4

    let recommendedVideos: Video[] = [];

    try {
      // Get the Cloud Run service URL from environment variables
      // For local development, default to localhost:8000
      const backendUrl = process.env.CLOUD_RUN_URL || 'http://localhost:8000'

      console.log(`Calling recommendation service at: ${backendUrl}/run-workflow/run-workflow-video-ids`)

      const response = await fetch(`${backendUrl}/run-workflow/run-workflow-video-ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: body.user_id,
          top_k: top_k
        })
      })
      console.log(body.user_id, top_k)

      if (response.ok) {
        const data: BackendResponse = await response.json()

        // Check if video_ids array exists and is valid
        if (data && data.video_ids && Array.isArray(data.video_ids)) {
          // Fetch video details from Supabase database using the video IDs
          const { data: videoDetails, error: dbError } = await supabase
            .from('videos')
            .select('video_id, title, thumbnail_url')
            .in('video_id', data.video_ids)

          if (!dbError && videoDetails && videoDetails.length > 0) {
            // Transform the database results to match frontend expectations
            recommendedVideos = data.video_ids.map(videoId => {
              const videoDetail = videoDetails.find(v => v.video_id === videoId)
              if (!videoDetail) {
                console.warn(`Video details not found for ID: ${videoId}`)
                return {
                  id: videoId,
                  title: `Recommended Video ${videoId}`,
                  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', // Fallback YouTube thumbnail
                  description: `Recommended video content for ${videoId}`
                }
              }
              return {
                id: videoDetail.video_id,
                title: videoDetail.title || `Video ${videoDetail.video_id}`,
                thumbnail: videoDetail.thumbnail_url || 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
                description: videoDetail.title || `Video content for ${videoDetail.video_id}`
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from microservice:', error)
      // Don't return error, continue with fallback
    }

    // Ensure we have exactly 4 recommended videos from microservice
    recommendedVideos = recommendedVideos.slice(0, 4);

    // Get video IDs that are already recommended to exclude from random selection
    const excludeIds = recommendedVideos.map(v => v.id);

    // Fetch 4 random videos from backend service (excluding already recommended ones)
    const randomVideosFromBackend = await fetchRandomVideosFromBackend(excludeIds, 4);

    // If we don't have enough videos from database, we'll create fallback videos
    const fallbackVideos: Video[] = [
      {
        id: "fallback_1",
        title: "Introduction to Machine Learning - Complete Guide",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
        description: "Complete introduction to machine learning concepts and applications"
      },
      {
        id: "fallback_2",
        title: "AI in Healthcare: Revolutionary Applications",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
        description: "Exploring how AI is transforming healthcare and medical diagnosis"
      },
      {
        id: "fallback_3",
        title: "Deep Learning Fundamentals Explained",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
        description: "Understanding the core concepts of deep learning and neural networks"
      },
      {
        id: "fallback_4",
        title: "Data Science Projects for Beginners",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
        description: "Hands-on data science projects to build your portfolio"
      }
    ];

    // If we don't have enough from microservice, fill with backend videos
    if (recommendedVideos.length < 4) {
      const videosNeeded = 4 - recommendedVideos.length;
      const extraVideos = randomVideosFromBackend.slice(0, videosNeeded);
      recommendedVideos = [...recommendedVideos, ...extraVideos];
    }

    // For additional random videos, use remaining backend videos or fallback
    let additionalRandomVideos: Video[] = [];
    if (randomVideosFromBackend.length >= 4) {
      // We have enough from backend
      additionalRandomVideos = randomVideosFromBackend.slice(0, 4);
    } else {
      // Use what we have from backend plus fallback
      const remainingFromBackend = randomVideosFromBackend.filter((v: Video) => !recommendedVideos.some((rv: Video) => rv.id === v.id));
      const videosNeeded = 4 - remainingFromBackend.length;
      const fallbackNeeded = fallbackVideos
        .filter((v: Video) => !recommendedVideos.some((rv: Video) => rv.id === v.id) && !remainingFromBackend.some((rv: Video) => rv.id === v.id))
        .slice(0, videosNeeded);
      additionalRandomVideos = [...remainingFromBackend, ...fallbackNeeded];
    }

    // Ensure we have exactly 4 additional videos
    additionalRandomVideos = additionalRandomVideos.slice(0, 4);

    // Combine recommended and additional videos to get 8 total
    const allVideos = [...recommendedVideos.slice(0, 4), ...additionalRandomVideos];

    console.log(`Final result: ${allVideos.length} videos total`);
    console.log('Video thumbnails:', allVideos.map(v => ({ id: v.id, thumbnail: v.thumbnail })));

    return NextResponse.json({
      user_id: body.user_id,
      videos: allVideos,
      count: allVideos.length,
      recommended_count: recommendedVideos.length,
      additional_count: additionalRandomVideos.length,
      source_info: {
        from_microservice: recommendedVideos.length,
        from_backend: randomVideosFromBackend.length,
        from_fallback: Math.max(0, 8 - recommendedVideos.length - randomVideosFromBackend.length)
      }
    })

  } catch (error) {
    console.error('Error in recommendations API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}