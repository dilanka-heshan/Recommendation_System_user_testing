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

// Function to fetch random videos from database
async function fetchRandomVideosFromDB(excludeIds: string[] = [], limit: number = 4): Promise<Video[]> {
  try {
    let query = supabase
      .from('videos')
      .select('video_id, title, thumbnail_url, description')
      .limit(limit * 3) // Fetch more to have options for random selection

    // Only add the exclusion filter if there are IDs to exclude
    if (excludeIds.length > 0) {
      query = query.not('video_id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`)
    }

    const { data: videoData, error } = await query

    if (error) {
      console.error('Error fetching random videos from database:', error)
      return []
    }

    if (!videoData || videoData.length === 0) {
      console.log('No videos found in database, will use fallback')
      return []
    }

    // Randomly shuffle and select the required number
    const shuffledVideos = videoData.sort(() => Math.random() - 0.5).slice(0, limit)

    return shuffledVideos.map(video => ({
      id: video.video_id,
      title: video.title || `Video ${video.video_id}`,
      thumbnail: video.thumbnail_url || 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      description: video.description || video.title || `Video content for ${video.video_id}`
    }))

  } catch (error) {
    console.error('Error in fetchRandomVideosFromDB:', error)
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

    // Fetch 4 random videos from database (excluding already recommended ones)
    const randomVideosFromDB = await fetchRandomVideosFromDB(excludeIds, 4);

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

    // If we don't have enough from microservice, fill with database videos
    if (recommendedVideos.length < 4) {
      const videosNeeded = 4 - recommendedVideos.length;
      const extraVideos = randomVideosFromDB.slice(0, videosNeeded);
      recommendedVideos = [...recommendedVideos, ...extraVideos];
    }

    // For additional random videos, use remaining database videos or fallback
    let additionalRandomVideos: Video[] = [];
    if (randomVideosFromDB.length >= 4) {
      // We have enough from database
      additionalRandomVideos = randomVideosFromDB.slice(0, 4);
    } else {
      // Use what we have from DB plus fallback
      const remainingFromDB = randomVideosFromDB.filter(v => !recommendedVideos.some(rv => rv.id === v.id));
      const videosNeeded = 4 - remainingFromDB.length;
      const fallbackNeeded = fallbackVideos
        .filter(v => !recommendedVideos.some(rv => rv.id === v.id) && !remainingFromDB.some(rv => rv.id === v.id))
        .slice(0, videosNeeded);
      additionalRandomVideos = [...remainingFromDB, ...fallbackNeeded];
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
        from_database: randomVideosFromDB.length,
        from_fallback: Math.max(0, 8 - recommendedVideos.length - randomVideosFromDB.length)
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