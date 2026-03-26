import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import CoursesPage from "./CoursesPage";
import CourseDetails from "./CourseDetails";

function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600">Coming soon...</p>
      </div>
    </div>
  );
}

export default function MyWorkApp() {
  const basePath = "/my-work";

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar basePath={basePath} />
      <main className="md:ml-64 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard basePath={basePath} />} />
          <Route path="/courses" element={<CoursesPage basePath={basePath} />} />
          <Route path="/courses/:id" element={<CourseDetails basePath={basePath} />} />
          <Route path="/announcements" element={<PlaceholderPage title="Announcements" />} />
          <Route path="/messages" element={<PlaceholderPage title="Messages" />} />
          <Route path="*" element={<Navigate to="/my-work" replace />} />
        </Routes>
      </main>
    </div>
  );
}