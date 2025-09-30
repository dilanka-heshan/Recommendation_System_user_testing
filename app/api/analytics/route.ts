import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsRequest = await request.json()
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const results = []

    // Store individual interactions to database
    if (body.interactions && body.interactions.length > 0) {
      const interactionsToInsert = body.interactions.map(interaction => ({
        user_id: interaction.user_id,
        video_id: interaction.video_id || null,
        interaction_type: interaction.interaction_type,
        is_recommended: interaction.is_recommended,
        session_id: interaction.session_id || null,
        timestamp: interaction.timestamp || new Date().toISOString()
      }))

      const { data: interactionsData, error: interactionsError } = await supabase
        .from('video_interactions')
        .insert(interactionsToInsert)
        .select()

      if (interactionsError) {
        console.error('Error inserting interactions:', interactionsError)
        throw new Error(`Failed to insert interactions: ${interactionsError.message}`)
      }

      console.log(`Added ${body.interactions.length} interactions to database`)
      results.push({ 
        success: true, 
        type: 'interactions',
        count: body.interactions.length,
        table: 'video_interactions'
      })
    }

    // Store session summary to database
    if (body.session_data) {
      const { recommended_videos, selected_videos } = body.session_data
      
      // Get session_id from the first interaction or generate one
      const sessionId = body.interactions?.[0]?.session_id || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const sessionData = {
        user_id: body.user_id,
        session_id: sessionId,
        recommended_videos: recommended_videos,
        selected_videos: selected_videos,
        timestamp: new Date().toISOString()
        // Note: total_recommended, selected_recommended, and recommendation_accuracy 
        // will be automatically calculated by the database trigger
      }

      const { data: sessionDbData, error: sessionError } = await supabase
        .from('recommendation_sessions')
        .insert([sessionData])
        .select()

      if (sessionError) {
        console.error('Error inserting session:', sessionError)
        throw new Error(`Failed to insert session: ${sessionError.message}`)
      }

      console.log('Added session summary to database')
      
      // Get the calculated metrics from the inserted record
      const insertedSession = sessionDbData[0]
      
      results.push({ 
        success: true, 
        type: 'session',
        table: 'recommendation_sessions',
        metrics: {
          total_recommended: insertedSession.total_recommended,
          selected_recommended: insertedSession.selected_recommended,
          accuracy: insertedSession.recommendation_accuracy + '%'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics data saved to Supabase database',
      results,
      tables: {
        interactions: 'video_interactions',
        sessions: 'recommendation_sessions'
      },
      summary: {
        total_interactions: body.interactions?.length || 0,
        tables_updated: results.length
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

// GET endpoint to retrieve analytics data from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'interactions' | 'sessions' | 'download' | 'summary'
    const userId = searchParams.get('user_id')
    const sessionId = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (type === 'download') {
      const fileType = searchParams.get('file') || 'interactions'
      
      let query = supabase.from(
        fileType === 'sessions' ? 'recommendation_sessions' : 'video_interactions'
      ).select('*')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.order('timestamp', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch ${fileType}: ${error.message}`)
      }

      // Convert to CSV format
      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'No data found' },
          { status: 404 }
        )
      }

      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        ).join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileType}_analytics.csv"`
        }
      })
    }

    if (type === 'interactions') {
      let query = supabase.from('video_interactions').select('*')
      
      if (userId) query = query.eq('user_id', userId)
      if (sessionId) query = query.eq('session_id', sessionId)
      
      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(`Failed to fetch interactions: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data,
        count: data.length
      })
    }

    if (type === 'sessions') {
      let query = supabase.from('recommendation_sessions').select('*')
      
      if (userId) query = query.eq('user_id', userId)
      
      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(`Failed to fetch sessions: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data,
        count: data.length
      })
    }

    if (type === 'summary') {
      const { data, error } = await supabase
        .from('analytics_summary')
        .select('*')
        .eq('user_id', userId || '')
        .order('date', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(`Failed to fetch analytics summary: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data,
        count: data.length
      })
    }

    // Default response - system status
    const { data: interactionsCount } = await supabase
      .from('video_interactions')
      .select('*', { count: 'exact', head: true })
    
    const { data: sessionsCount } = await supabase
      .from('recommendation_sessions')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Supabase analytics system active',
      tables: {
        video_interactions: {
          exists: true,
          total_records: interactionsCount?.length || 0
        },
        recommendation_sessions: {
          exists: true,
          total_records: sessionsCount?.length || 0
        }
      },
      available_endpoints: {
        'GET ?type=interactions': 'Get video interactions',
        'GET ?type=sessions': 'Get recommendation sessions',
        'GET ?type=summary': 'Get analytics summary',
        'GET ?type=download&file=interactions': 'Download interactions as CSV',
        'GET ?type=download&file=sessions': 'Download sessions as CSV',
        'POST': 'Insert new analytics data'
      }
    })

  } catch (error) {
    console.error('Error reading from Supabase:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}