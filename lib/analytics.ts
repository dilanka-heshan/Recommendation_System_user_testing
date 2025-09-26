// Analytics utility functions for tracking video interactions

interface VideoInteraction {
  user_id: string
  video_id: string
  interaction_type: 'view' | 'click' | 'select' | 'deselect'
  is_recommended: boolean
  timestamp?: string
  session_id?: string
  recommended_videos?: string[]
  selected_videos?: string[]
}

interface SessionData {
  recommended_videos: string[]
  selected_videos: string[]
}

class VideoAnalytics {
  private static instance: VideoAnalytics
  private sessionId: string
  private interactions: VideoInteraction[] = []
  private recommendedVideos: string[] = []

  private constructor() {
    // Generate unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getInstance(): VideoAnalytics {
    if (!VideoAnalytics.instance) {
      VideoAnalytics.instance = new VideoAnalytics()
    }
    return VideoAnalytics.instance
  }

  // Set the list of recommended videos for this session
  setRecommendedVideos(videoIds: string[]): void {
    this.recommendedVideos = videoIds
    console.log('Analytics: Set recommended videos', videoIds)
  }

  // Track a video interaction
  async trackInteraction(
    userId: string,
    videoId: string,
    interactionType: 'view' | 'click' | 'select' | 'deselect',
    selectedVideos: string[] = []
  ): Promise<void> {
    const interaction: VideoInteraction = {
      user_id: userId,
      video_id: videoId,
      interaction_type: interactionType,
      is_recommended: this.recommendedVideos.includes(videoId),
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      recommended_videos: [...this.recommendedVideos],
      selected_videos: [...selectedVideos]
    }

    // Store interaction locally for batch sending
    this.interactions.push(interaction)
    
    console.log('Analytics: Tracked interaction', {
      type: interactionType,
      videoId,
      isRecommended: interaction.is_recommended,
      sessionId: this.sessionId
    })

    // Send interaction immediately for real-time tracking
    try {
      await this.sendInteraction(interaction)
    } catch (error) {
      console.error('Analytics: Failed to send interaction', error)
    }
  }

  // Send a single interaction to the server
  private async sendInteraction(interaction: VideoInteraction): Promise<void> {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: interaction.user_id,
        interactions: [interaction]
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send analytics: ${response.status}`)
    }
  }

  // Send session summary with recommendation accuracy
  async sendSessionSummary(userId: string, selectedVideos: string[]): Promise<void> {
    try {
      const sessionData: SessionData = {
        recommended_videos: [...this.recommendedVideos],
        selected_videos: [...selectedVideos]
      }

      // Calculate accuracy
      const recommendedSet = new Set(this.recommendedVideos)
      const selectedRecommended = selectedVideos.filter(videoId => recommendedSet.has(videoId))
      const accuracy = this.recommendedVideos.length > 0 
        ? (selectedRecommended.length / this.recommendedVideos.length) * 100 
        : 0

      console.log('Analytics: Sending session summary', {
        recommended: this.recommendedVideos.length,
        selected: selectedVideos.length,
        selectedRecommended: selectedRecommended.length,
        accuracy: accuracy.toFixed(2) + '%'
      })

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          interactions: this.interactions,
          session_data: {
            ...sessionData,
            recommendation_accuracy: accuracy
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send session summary: ${response.status}`)
      }

      const result = await response.json()
      console.log('Analytics: Session summary sent successfully', result.summary)

      // Clear interactions after successful send
      this.interactions = []

    } catch (error) {
      console.error('Analytics: Failed to send session summary', error)
      throw error
    }
  }

  // Get current session statistics
  getSessionStats(): {
    sessionId: string
    totalInteractions: number
    recommendedVideos: string[]
    interactionsByType: Record<string, number>
  } {
    const interactionsByType = this.interactions.reduce((acc, interaction) => {
      acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      sessionId: this.sessionId,
      totalInteractions: this.interactions.length,
      recommendedVideos: [...this.recommendedVideos],
      interactionsByType
    }
  }

  // Reset session (for new recommendation cycle)
  resetSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.interactions = []
    this.recommendedVideos = []
    console.log('Analytics: Session reset', this.sessionId)
  }
}

// Convenience functions for easy usage
export const analytics = VideoAnalytics.getInstance()

export const trackVideoClick = (userId: string, videoId: string, selectedVideos: string[] = []) => {
  return analytics.trackInteraction(userId, videoId, 'click', selectedVideos)
}

export const trackVideoView = (userId: string, videoId: string, selectedVideos: string[] = []) => {
  return analytics.trackInteraction(userId, videoId, 'view', selectedVideos)
}

export const trackVideoSelect = (userId: string, videoId: string, selectedVideos: string[] = []) => {
  return analytics.trackInteraction(userId, videoId, 'select', selectedVideos)
}

export const trackVideoDeselect = (userId: string, videoId: string, selectedVideos: string[] = []) => {
  return analytics.trackInteraction(userId, videoId, 'deselect', selectedVideos)
}

export const setRecommendedVideos = (videoIds: string[]) => {
  analytics.setRecommendedVideos(videoIds)
}

export const sendSessionSummary = (userId: string, selectedVideos: string[]) => {
  return analytics.sendSessionSummary(userId, selectedVideos)
}

export const getSessionStats = () => {
  return analytics.getSessionStats()
}

export const resetAnalyticsSession = () => {
  analytics.resetSession()
}