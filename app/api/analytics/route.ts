import { NextRequest, NextResponse } from 'next/server'
import { writeFile, appendFile, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface VideoInteractionData {
  user_id: string
  video_id: string
  interaction_type: 'view' | 'click' | 'select' | 'deselect'
  is_recommended: boolean
  timestamp: string
  session_id?: string
}

interface AnalyticsRequest {
  user_id: string
  interactions: VideoInteractionData[]
  session_data?: {
    recommended_videos: string[]
    selected_videos: string[]
    recommendation_accuracy?: number
  }
}

// Ensure analytics directory exists
const analyticsDir = join(process.cwd(), 'analytics-data')
if (!existsSync(analyticsDir)) {
  mkdirSync(analyticsDir, { recursive: true })
}

const interactionsFile = join(analyticsDir, 'video_interactions.csv')
const sessionsFile = join(analyticsDir, 'recommendation_sessions.csv')

// Initialize CSV files with headers if they don't exist
function initializeCSVFiles() {
  if (!existsSync(interactionsFile)) {
    const interactionsHeader = 'timestamp,user_id,video_id,interaction_type,is_recommended,session_id\n'
    writeFile(interactionsFile, interactionsHeader, (err) => {
      if (err) console.error('Error creating interactions CSV:', err)
    })
  }

  if (!existsSync(sessionsFile)) {
    const sessionsHeader = 'timestamp,user_id,recommended_videos,selected_videos,total_recommended,selected_recommended,recommendation_accuracy\n'
    writeFile(sessionsFile, sessionsHeader, (err) => {
      if (err) console.error('Error creating sessions CSV:', err)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsRequest = await request.json()
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Initialize CSV files
    initializeCSVFiles()

    const results = []

    // Store individual interactions to CSV
    if (body.interactions && body.interactions.length > 0) {
      let interactionsData = ''
      
      for (const interaction of body.interactions) {
        const csvRow = [
          interaction.timestamp || new Date().toISOString(),
          interaction.user_id,
          interaction.video_id,
          interaction.interaction_type,
          interaction.is_recommended,
          interaction.session_id || ''
        ].join(',') + '\n'
        
        interactionsData += csvRow
      }

      // Append to interactions CSV
      appendFile(interactionsFile, interactionsData, (err) => {
        if (err) {
          console.error('Error writing interactions to CSV:', err)
        } else {
          console.log(`Added ${body.interactions.length} interactions to CSV`)
        }
      })

      results.push({ 
        success: true, 
        type: 'interactions',
        count: body.interactions.length,
        file: 'video_interactions.csv'
      })
    }

    // Store session summary to CSV
    if (body.session_data) {
      const { recommended_videos, selected_videos } = body.session_data
      
      // Calculate recommendation accuracy
      const recommendedSet = new Set(recommended_videos)
      const selectedRecommended = selected_videos.filter(videoId => recommendedSet.has(videoId))
      const accuracy = recommended_videos.length > 0 
        ? (selectedRecommended.length / recommended_videos.length) * 100 
        : 0

      const sessionRow = [
        new Date().toISOString(),
        body.user_id,
        `"[${recommended_videos.join(',')}]"`, // Wrap array in quotes for CSV
        `"[${selected_videos.join(',')}]"`,
        recommended_videos.length,
        selectedRecommended.length,
        accuracy.toFixed(2)
      ].join(',') + '\n'

      // Append to sessions CSV
      appendFile(sessionsFile, sessionRow, (err) => {
        if (err) {
          console.error('Error writing session to CSV:', err)
        } else {
          console.log('Added session summary to CSV')
        }
      })

      results.push({ 
        success: true, 
        type: 'session',
        file: 'recommendation_sessions.csv',
        metrics: {
          total_recommended: recommended_videos.length,
          selected_recommended: selectedRecommended.length,
          accuracy: accuracy.toFixed(2) + '%'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics data saved to CSV files',
      results,
      files: {
        interactions: 'analytics-data/video_interactions.csv',
        sessions: 'analytics-data/recommendation_sessions.csv'
      },
      summary: {
        total_interactions: body.interactions?.length || 0,
        csv_files_updated: results.length
      }
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to read CSV data (optional - for basic analytics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'interactions' | 'sessions' | 'download'

    if (type === 'download') {
      const fileType = searchParams.get('file') || 'interactions'
      const filePath = fileType === 'sessions' ? sessionsFile : interactionsFile
      
      if (!existsSync(filePath)) {
        return NextResponse.json(
          { error: 'CSV file not found' },
          { status: 404 }
        )
      }

      const fs = require('fs')
      const fileContent = fs.readFileSync(filePath, 'utf8')
      
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileType}_analytics.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'CSV analytics system active',
      files: {
        interactions_exists: existsSync(interactionsFile),
        sessions_exists: existsSync(sessionsFile),
        interactions_path: 'analytics-data/video_interactions.csv',
        sessions_path: 'analytics-data/recommendation_sessions.csv'
      }
    })

  } catch (error) {
    console.error('Error reading CSV files:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}