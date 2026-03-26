import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import CoursesPage from "./CoursesPage";
import CourseDetails from "./CourseDetails";

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
          <Route path="*" element={<Navigate to="/my-work" replace />} />
        </Routes>
      </main>
    </div>
  );
}