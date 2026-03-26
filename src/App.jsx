import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import CoursesPage from './CoursesPage';
import CourseDetails from './CourseDetails';


export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Full-width container with max-width centering on large screens */}
          <div className="w-full min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              
              {/* Placeholder pages */}
              <Route path="/announcements" element={<PlaceholderPage title="Announcements" />} />
              <Route path="/messages" element={<PlaceholderPage title="Messages" />} />
              <Route path="/class" element={<PlaceholderPage title="My Class" />} />
              <Route path="/teachers" element={<PlaceholderPage title="Teachers" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

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
