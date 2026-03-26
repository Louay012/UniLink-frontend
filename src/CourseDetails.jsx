import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, Play, Download, Send } from 'lucide-react';
import { COURSES, ANNOUNCEMENTS, LESSONS, CHAT_MESSAGES, formatDate } from './mockData';

export default function CourseDetails({ basePath = '' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const withBase = (path) => `${basePath}${path}`;
  const [activeTab, setActiveTab] = useState('announcements');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(CHAT_MESSAGES[id] || []);

  const course = COURSES.find((c) => c.id === id);
  const courseAnnouncements = ANNOUNCEMENTS[id] || [];
  const courseLessons = LESSONS[id] || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Course not found</h2>
          <button
            onClick={() => navigate(withBase('/courses'))}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const toggleWeek = (week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [week]: !prev[week]
    }));
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: 'Ahmed Ben Ali',
        role: 'STUDENT',
        content: chatInput,
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, newMessage]);
      setChatInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div
        className="h-40 w-full relative"
        style={{
          background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}dd 100%)`
        }}
      >
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(withBase('/courses'))}
            className="flex items-center gap-2 text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="absolute inset-0 flex items-end p-8">
          <div className="text-white max-w-7xl mx-auto w-full">
            <p className="text-sm font-semibold opacity-90">{course.code}</p>
            <h1 className="text-4xl font-bold mt-2">{course.title}</h1>
            <p className="text-white opacity-90 mt-2">👨‍🏫 {course.teacher.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'announcements', label: '📢 Announcements', icon: '📢' },
              { id: 'lessons', label: '📚 Lessons', icon: '📚' },
              { id: 'chat', label: '💬 Chat', icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {courseAnnouncements.length > 0 ? (
              courseAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-lg shadow border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {announcement.title}
                        </h3>
                        {announcement.badge && (
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              announcement.badge === 'URGENT'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {announcement.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 mt-2">{announcement.content}</p>
                      <p className="text-sm text-slate-500 mt-3">
                        📅 {formatDate(announcement.timestamp)}
                      </p>

                      {/* Attachments */}
                      {announcement.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold text-slate-700">Attachments:</p>
                          {announcement.attachments.map((att) => (
                            <a
                              key={att.id}
                              href="#"
                              className="flex items-center gap-2 text-primary hover:text-opacity-80 text-sm"
                            >
                              <FileText size={16} />
                              <span>{att.name}</span>
                              <span className="text-slate-400">({att.size})</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-slate-600">No announcements yet</p>
              </div>
            )}
          </div>
        )}

        {/* LESSONS TAB */}
        {activeTab === 'lessons' && (
          <div className="space-y-3">
            {courseLessons.length > 0 ? (
              courseLessons.map((lesson) => (
                <div key={lesson.week} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {/* Week Header */}
                  <button
                    onClick={() => toggleWeek(lesson.week)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      Week {lesson.week}: {lesson.title}
                    </h3>
                    <span
                      className={`transform transition-transform ${
                        expandedWeeks[lesson.week] ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Week Content */}
                  {expandedWeeks[lesson.week] && (
                    <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                      <div className="space-y-2">
                        {lesson.items.map((item) => (
                          <a
                            key={item.id}
                            href="#"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-300"
                          >
                            {item.type === 'video' ? (
                              <Play size={20} className="text-red-500" />
                            ) : item.type === 'pdf' ? (
                              <FileText size={20} className="text-red-600" />
                            ) : item.type === 'pptx' ? (
                              <FileText size={20} className="text-orange-600" />
                            ) : (
                              <FileText size={20} className="text-slate-600" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.size}</p>
                            </div>
                            <Download
                              size={18}
                              className="text-slate-400 hover:text-primary transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="text-4xl mb-3">📖</div>
                <p className="text-slate-600">No lessons available yet</p>
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-screen md:h-96">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'TEACHER' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'TEACHER'
                          ? 'bg-blue-100 text-slate-900'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {msg.role === 'TEACHER' && (
                        <p className="text-xs font-semibold mb-1">{msg.sender} (Teacher)</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'TEACHER'
                            ? 'text-slate-600'
                            : 'text-white text-opacity-70'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500">No messages yet. Start the conversation!</div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
