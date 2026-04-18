import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Bell,
  MessageCircle,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { COURSES, MOCK_USER } from './mockData';

export default function Sidebar({ basePath = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const withBase = (path) => `${basePath}${path}`;
  const isActive = (path) => location.pathname === withBase(path);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Courses', path: '/courses', isSection: true },
    { icon: Bell, label: 'Announcements', path: '/announcements' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' }
  ];

  const secondaryItems = [
    { icon: Building2, label: 'My Class', path: '/class' },
    { icon: Users, label: 'Teachers', path: '/teachers' }
  ];

  const settingsItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: LogOut, label: 'Logout', path: '/logout' }
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 md:hidden z-50 p-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        } ${!isMobile && 'md:fixed md:w-64'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            <div className="text-2xl">📚</div>
            {isOpen && (
              <div>
                <h1 className="font-bold text-lg">UniLink</h1>
                <p className="text-xs text-slate-400">Course Hub</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {isOpen && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{MOCK_USER.avatar}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{MOCK_USER.name}</p>
                <p className="text-xs text-slate-400">{MOCK_USER.classGroup}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.path}>
                <button
                  onClick={() => {
                    if (item.isSection) {
                      setIsCoursesExpanded(!isCoursesExpanded);
                    } else {
                      navigate(withBase(item.path));
                      if (isMobile) setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  } ${!isOpen && 'justify-center'}`}
                  title={!isOpen ? item.label : ''}
                >
                  <Icon size={20} />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.isSection && (
                        isCoursesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                      )}
                    </>
                  )}
                </button>

                {/* Courses Submenu */}
                {item.isSection && isOpen && isCoursesExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-600 pl-2">
                    {COURSES.slice(0, 3).map((course) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          navigate(withBase(`/courses/${course.id}`));
                          if (isMobile) setIsOpen(false);
                        }}
                        className={`w-full text-left text-sm px-3 py-1.5 rounded transition-all ${
                          location.pathname === withBase(`/courses/${course.id}`)
                            ? 'bg-primary bg-opacity-20 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block truncate">{course.title}</span>
                        {course.newAnnouncements > 0 && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full inline-block mt-1">
                            {course.newAnnouncements} new
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        navigate(withBase('/courses'));
                        if (isMobile) setIsOpen(false);
                      }}
                      className="w-full text-left text-sm px-3 py-1.5 text-primary hover:text-blue-300 font-semibold"
                    >
                      View All →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Secondary Menu */}
        {isOpen && (
          <>
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Academic</p>
            </div>
            <nav className="px-3 space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(withBase(item.path))}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </>
        )}

        {/* Settings Menu */}
        <div className={`p-3 border-t border-slate-700 bg-slate-900 mt-auto ${!isOpen ? 'px-2' : ''}`}>
          <div className="space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (item.label === 'Logout') {
                        logout();
                        navigate('/login');
                        return;
                      }
                      navigate(withBase(item.path));
                      if (isMobile) setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    } ${!isOpen && 'justify-center'} ${item.label === 'Logout' ? 'sidebar-logout' : ''}`}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon size={20} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
        ></div>
      )}
    </>
  );
}
