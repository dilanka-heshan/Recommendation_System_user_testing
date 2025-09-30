"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthProvider";

interface DatabaseStatus {
  success: boolean;
  message: string;
  tables: {
    video_interactions: {
      exists: boolean;
      total_records: number;
    };
    recommendation_sessions: {
      exists: boolean;
      total_records: number;
    };
  };
}

interface VideoInteraction {
  id: string;
  user_id: string;
  video_id: string | null;
  interaction_type: 'view' | 'click' | 'select' | 'deselect';
  is_recommended: boolean;
  session_id: string | null;
  timestamp: string;
  created_at: string;
}

interface RecommendationSession {
  id: string;
  user_id: string;
  session_id: string;
  recommended_videos: string[];
  selected_videos: string[];
  total_recommended: number;
  selected_recommended: number;
  recommendation_accuracy: number;
  timestamp: string;
  created_at: string;
}

interface AnalyticsSummary {
  user_id: string;
  total_sessions: number;
  avg_accuracy: number;
  total_videos_recommended: number;
  total_videos_selected: number;
  total_interactions: number;
  unique_videos_interacted: number;
  date: string;
}

interface AnalyticsData {
  interactions: VideoInteraction[];
  sessions: RecommendationSession[];
  summary: AnalyticsSummary[];
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const result = await response.json();
        setDbStatus(result);
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    }
    setLoading(false);
  };

  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [interactionsRes, sessionsRes, summaryRes] = await Promise.all([
        fetch(`/api/analytics?type=interactions&user_id=${user.id}&limit=50`),
        fetch(`/api/analytics?type=sessions&user_id=${user.id}&limit=20`),
        fetch(`/api/analytics?type=summary&user_id=${user.id}&limit=7`)
      ]);

      const interactions = interactionsRes.ok ? (await interactionsRes.json()).data : [];
      const sessions = sessionsRes.ok ? (await sessionsRes.json()).data : [];
      const summary = summaryRes.ok ? (await summaryRes.json()).data : [];

      setAnalyticsData({ interactions, sessions, summary });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }, [user]);

  const downloadCSV = async (fileType: 'interactions' | 'sessions') => {
    try {
      const response = await fetch(`/api/analytics?type=download&file=${fileType}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileType}_analytics.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('CSV file not found or empty');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV file');
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    if (user) {
      loadAnalyticsData();
    }
  }, [user, loadAnalyticsData]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please sign in to view your analytics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Video Analytics - Supabase Database</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">📊 How It Works</h2>
          <p className="text-blue-700">
            Your video interaction data is automatically saved to a Supabase PostgreSQL database with real-time analytics,
            advanced querying capabilities, and secure data storage. You can still export data as CSV files for external analysis.
          </p>
        </div>

        {/* Database Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Video Interactions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Records every click, view, selection, and deselection in the database
            </p>
            <div className="mb-4 space-y-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                dbStatus?.tables?.video_interactions?.exists 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {dbStatus?.tables?.video_interactions?.exists ? '✓ Table Ready' : 'Table Not Found'}
              </div>
              <div className="text-sm text-gray-600">
                Total Records: {dbStatus?.tables?.video_interactions?.total_records || 0}
              </div>
              <div className="text-sm text-gray-600">
                Your Records: {analyticsData?.interactions?.length || 0}
              </div>
            </div>
            <button
              onClick={() => downloadCSV('interactions')}
              disabled={!dbStatus?.tables?.video_interactions?.exists}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export Interactions CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Recommendation Sessions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Session summaries with accuracy metrics stored in database
            </p>
            <div className="mb-4 space-y-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                dbStatus?.tables?.recommendation_sessions?.exists 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {dbStatus?.tables?.recommendation_sessions?.exists ? '✓ Table Ready' : 'Table Not Found'}
              </div>
              <div className="text-sm text-gray-600">
                Total Records: {dbStatus?.tables?.recommendation_sessions?.total_records || 0}
              </div>
              <div className="text-sm text-gray-600">
                Your Sessions: {analyticsData?.sessions?.length || 0}
              </div>
            </div>
            <button
              onClick={() => downloadCSV('sessions')}
              disabled={!dbStatus?.tables?.recommendation_sessions?.exists}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export Sessions CSV
            </button>
          </div>
        </div>

        {/* Recent Analytics Data */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Sessions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Recent Sessions</h3>
              {analyticsData.sessions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analyticsData.sessions.slice(0, 5).map((session: RecommendationSession, index: number) => (
                    <div key={session.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Session {index + 1}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Recommended: {session.total_recommended} videos</div>
                        <div>Selected: {session.selected_recommended} recommended</div>
                        <div>Accuracy: <span className="font-medium">{session.recommendation_accuracy}%</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No sessions recorded yet.</p>
              )}
            </div>

            {/* Recent Interactions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Recent Interactions</h3>
              {analyticsData.interactions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analyticsData.interactions.slice(0, 10).map((interaction: VideoInteraction) => (
                    <div key={interaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          interaction.interaction_type === 'select' ? 'bg-green-100 text-green-800' :
                          interaction.interaction_type === 'deselect' ? 'bg-red-100 text-red-800' :
                          interaction.interaction_type === 'click' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interaction.interaction_type}
                        </span>
                        <span className="text-gray-600">
                          {interaction.video_id ? `Video: ${interaction.video_id.substring(0, 8)}...` : 'No video'}
                        </span>
                        {interaction.is_recommended && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">recommended</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(interaction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No interactions recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Database Schema Info */}
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">�️ Database Schema & Export Structure</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Video Interactions Table:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>id</code> - Unique record identifier (UUID)</li>
                <li>• <code>user_id</code> - User identifier (UUID)</li>
                <li>• <code>video_id</code> - YouTube video ID</li>
                <li>• <code>interaction_type</code> - view/click/select/deselect</li>
                <li>• <code>is_recommended</code> - true if video was recommended</li>
                <li>• <code>session_id</code> - Session identifier</li>
                <li>• <code>timestamp</code> - When the interaction happened</li>
                <li>• <code>created_at</code> - Record creation time</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Recommendation Sessions Table:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>id</code> - Unique record identifier (UUID)</li>
                <li>• <code>user_id</code> - User identifier (UUID)</li>
                <li>• <code>session_id</code> - Unique session identifier</li>
                <li>• <code>recommended_videos</code> - JSON array of video IDs</li>
                <li>• <code>selected_videos</code> - JSON array of selected IDs</li>
                <li>• <code>total_recommended</code> - Count (auto-calculated)</li>
                <li>• <code>selected_recommended</code> - Match count (auto-calculated)</li>
                <li>• <code>recommendation_accuracy</code> - Percentage (auto-calculated)</li>
                <li>• <code>timestamp</code> - Session completion time</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✨ Database Advantages:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Real-time data updates and querying</li>
              <li>• Automatic calculation of accuracy metrics</li>
              <li>• Advanced filtering and analytics capabilities</li>
              <li>• Secure authentication and row-level security</li>
              <li>• Scalable PostgreSQL performance</li>
              <li>• Still supports CSV export for external tools</li>
            </ul>
          </div>
        </div>

        {/* Analysis Examples */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 Advanced Analytics Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-blue-600 mb-2">Real-time Queries</h4>
              <p className="text-gray-600">
                Run complex SQL queries to analyze user behavior patterns, session trends, and recommendation effectiveness in real-time
              </p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-green-600 mb-2">Automated Metrics</h4>
              <p className="text-gray-600">
                Database automatically calculates accuracy percentages, interaction counts, and session summaries using triggers
              </p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-purple-600 mb-2">Secure & Scalable</h4>
              <p className="text-gray-600">
                Row-level security ensures users only see their data, while PostgreSQL scales to millions of interactions
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center space-x-4">
          <button
            onClick={checkDatabaseStatus}
            disabled={loading}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
          <button
            onClick={loadAnalyticsData}
            disabled={loading || !user}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            Load Your Data
          </button>
        </div>

        {dbStatus && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Database: <code>video_interactions</code> ({dbStatus.tables?.video_interactions?.total_records || 0} records) 
            and <code>recommendation_sessions</code> ({dbStatus.tables?.recommendation_sessions?.total_records || 0} records)
          </div>
        )}
      </div>
    </div>
  );
}