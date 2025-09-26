import AuthGuard from "../components/AuthGuard";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AnalyticsDashboard />
      </div>
    </AuthGuard>
  );
}