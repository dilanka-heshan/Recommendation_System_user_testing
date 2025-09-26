"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthProvider";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [csvStatus, setCsvStatus] = useState<any>(null);

  const checkCSVFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const result = await response.json();
        setCsvStatus(result);
      }
    } catch (error) {
      console.error('Error checking CSV files:', error);
    }
    setLoading(false);
  };

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
    checkCSVFiles();
  }, []);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please sign in to view your analytics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Video Analytics - CSV Export System</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">📊 How It Works</h2>
          <p className="text-blue-700">
            Your video interaction data is automatically saved to CSV files that you can download and analyze 
            with Excel, Google Sheets, Python pandas, or any data analysis tool.
          </p>
        </div>

        {/* CSV Files Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Video Interactions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Records every click, view, selection, and deselection
            </p>
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                csvStatus?.files?.interactions_exists 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {csvStatus?.files?.interactions_exists ? '✓ Data Available' : 'No Data Yet'}
              </span>
            </div>
            <button
              onClick={() => downloadCSV('interactions')}
              disabled={!csvStatus?.files?.interactions_exists}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Download Interactions CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Recommendation Sessions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Summary of each session with accuracy metrics
            </p>
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                csvStatus?.files?.sessions_exists 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {csvStatus?.files?.sessions_exists ? '✓ Data Available' : 'No Data Yet'}
              </span>
            </div>
            <button
              onClick={() => downloadCSV('sessions')}
              disabled={!csvStatus?.files?.sessions_exists}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Download Sessions CSV
            </button>
          </div>
        </div>

        {/* CSV Structure Info */}
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">📋 CSV File Structure</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Video Interactions CSV:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>timestamp</code> - When the interaction happened</li>
                <li>• <code>user_id</code> - User identifier</li>
                <li>• <code>video_id</code> - YouTube video ID</li>
                <li>• <code>interaction_type</code> - view/click/select/deselect</li>
                <li>• <code>is_recommended</code> - true if video was recommended</li>
                <li>• <code>session_id</code> - Session identifier</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Recommendation Sessions CSV:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>timestamp</code> - Session completion time</li>
                <li>• <code>user_id</code> - User identifier</li>
                <li>• <code>recommended_videos</code> - List of recommended videos</li>
                <li>• <code>selected_videos</code> - List of selected videos</li>
                <li>• <code>total_recommended</code> - Count of recommended videos</li>
                <li>• <code>selected_recommended</code> - How many recommended were selected</li>
                <li>• <code>recommendation_accuracy</code> - Percentage accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Analysis Examples */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 What You Can Analyze</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-blue-600 mb-2">Recommendation Quality</h4>
              <p className="text-gray-600">
                Calculate average accuracy across sessions to measure how well your ML model performs
              </p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-green-600 mb-2">User Behavior</h4>
              <p className="text-gray-600">
                Analyze click patterns, time between interactions, and selection preferences
              </p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-purple-600 mb-2">A/B Testing</h4>
              <p className="text-gray-600">
                Compare different recommendation approaches and their success rates
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={checkCSVFiles}
            disabled={loading}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        {csvStatus && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            CSV files location: <code>{csvStatus.files?.interactions_path}</code> and <code>{csvStatus.files?.sessions_path}</code>
          </div>
        )}
      </div>
    </div>
  );
}