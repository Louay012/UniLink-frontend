import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send, Trash2, X } from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useNotificationContext } from './context/NotificationContext';
import {
  getCourse,
  listCourseAnnouncements,
  listCourseAttachments,
  createCourseAnnouncement,
  createCourseAnnouncementWithFiles,
  listCourseChats,
  listChatMessages,
  sendChatMessage
} from './services/course.service';
import AnnouncementCard from './components/AnnouncementCard';
import AttachmentPreview from './components/AttachmentPreview';
import ChatBox from './components/ChatBox';

function pickColor(seed) {
  const palette = ['#0e6ba8', '#a23b72', '#f18f01', '#06a77d', '#d62828', '#9d4edd'];
  const value = String(seed || 'course');
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

function mapAnnouncement(announcement, teacherName) {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.body,
    timestamp: announcement.createdAt,
    author: announcement.authorName || teacherName || 'Teacher',
    authorId: announcement.authorId || announcement.createdBy,
    visualType: announcement.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
    attachments: announcement.attachments || []
  };
}

export default function CourseDetails({ basePath = '' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedRole } = useAuth();
  const toast = useToast();
  const { dismissByCourseId } = useNotificationContext();

  const [activeTab, setActiveTab] = useState('content');
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [courseChats, setCourseChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState(selectedRole?.userId || null);
  const [chatLoading, setChatLoading] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'NORMAL'
  });
  const [announcementFiles, setAnnouncementFiles] = useState([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const withBase = (path) => `${basePath}${path}`;
  const cardColor = course?.color || pickColor(course?.code || id);
  const isTeacherView = selectedRole?.value === 'TEACHER';

  const loadCourseData = useCallback(async () => {
    setLoading(true);

    try {
      const [coursePayload, announcementsPayload, attachmentsPayload] = await Promise.all([
        getCourse(selectedRole, id),
        listCourseAnnouncements(selectedRole, id),
        listCourseAttachments(selectedRole, id)
      ]);

      const normalizedCourse = coursePayload
        ? {
            ...coursePayload,
            teacher: coursePayload.teacher || { name: 'Unknown Teacher' },
            color: coursePayload.color || pickColor(coursePayload.code || id),
            announcementCount: Number(coursePayload.announcementCount ?? 0),
            attachmentCount: Number(coursePayload.attachmentCount ?? 0)
          }
        : null;

      const normalizedAttachments = (attachmentsPayload.items || []).map((attachment) => ({
        ...attachment,
        name: attachment.title || attachment.name || 'Attachment'
      }));

      const byAnnouncement = normalizedAttachments.reduce((acc, attachment) => {
        const key = String(attachment.announcementId || '');
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(attachment);
        return acc;
      }, {});

      const mappedAnnouncements = (announcementsPayload.items || []).map((announcement) => {
        const mapped = mapAnnouncement(announcement, normalizedCourse?.teacher?.name);
        return {
          ...mapped,
          attachments: byAnnouncement[String(announcement.id)] || []
        };
      });

      let chatsItems = [];
      try {
        const chatsPayload = await listCourseChats(selectedRole, id);
        if (chatsPayload.actorUserId) {
          setCurrentUserId(chatsPayload.actorUserId);
        }
        chatsItems = (chatsPayload.items || []).map((chat) => ({
          ...chat,
          chatType: String(chat.chat_type || chat.chatType || '').toUpperCase(),
          title: chat.title || chat.name || 'Course Chat',
          messageCount: Number(chat.messageCount ?? chat.message_count ?? 0)
        }));
      } catch (chatLoadError) {
        toast.error(chatLoadError.message || 'Could not load messaging for this course.', 'Chat');
      }

      setCourse(normalizedCourse);
      setAnnouncements(mappedAnnouncements);
      setAttachments(normalizedAttachments);
      setCourseChats(chatsItems);
      setSelectedChatId((prev) => {
        if (prev && chatsItems.some((chat) => chat.id === prev)) {
          return prev;
        }
        return chatsItems[0]?.id || null;
      });

      // Auto-dismiss all notifications for this course
      dismissByCourseId(id);
    } catch (err) {
      toast.error(err.message || 'Failed to load course details.', 'Course Error');
    } finally {
      setLoading(false);
    }
  }, [id, selectedRole]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  useEffect(() => {
    let active = true;

    async function loadChatMessages() {
      if (!selectedChatId) {
        setChatMessages([]);
        return;
      }

      setChatLoading(true);
      try {
        const payload = await listChatMessages(selectedRole, selectedChatId);
        if (!active) return;
        if (payload.actorUserId) {
          setCurrentUserId(payload.actorUserId);
        }
        setChatMessages(payload.items || []);
      } catch (chatMessageError) {
        if (active) toast.error(chatMessageError.message || 'Failed to load chat messages.', 'Chat');
      } finally {
        if (active) {
          setChatLoading(false);
        }
      }
    }

    loadChatMessages();

    return () => {
      active = false;
    };
  }, [selectedChatId, selectedRole]);

  async function handleSendMessage(event) {
    event.preventDefault();
    const body = messageDraft.trim();
    if (!selectedChatId || !body) return;

    try {
      await sendChatMessage(selectedRole, selectedChatId, body);
      setMessageDraft('');
      const payload = await listChatMessages(selectedRole, selectedChatId);
      if (payload.actorUserId) {
        setCurrentUserId(payload.actorUserId);
      }
      setChatMessages(payload.items || []);
    } catch (sendError) {
      toast.error(sendError.message || 'Failed to send message.', 'Chat');
    }
  }

  async function handleSubmitAnnouncement(event) {
    event.preventDefault();
    if (!isTeacherView) return;

    setPostingAnnouncement(true);
    try {
      const payload = {
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        priority: announcementForm.priority
      };

      // Use file upload endpoint if files are staged, otherwise plain JSON
      const rawFiles = announcementFiles.map((f) => f.file).filter(Boolean);
      if (rawFiles.length > 0) {
        await createCourseAnnouncementWithFiles(selectedRole, id, payload, rawFiles);
      } else {
        await createCourseAnnouncement(selectedRole, id, payload);
      }

      toast.success('Announcement posted successfully.', 'Posted!');
      setAnnouncementForm({
        title: '',
        body: '',
        priority: 'NORMAL'
      });
      setAnnouncementFiles([]);
      setShowAnnouncementForm(false);
      await loadCourseData();
      setActiveTab('content');
    } catch (submitError) {
      toast.error(submitError.message || 'Failed to create announcement.', 'Post Error');
    } finally {
      setPostingAnnouncement(false);
    }
  }

  function handleBack() {
    navigate(withBase('/courses'));
  }

  function openAnnouncementComposer() {
    setShowAnnouncementForm(true);
  }

  function closeAnnouncementComposer() {
    if (postingAnnouncement) return;
    setShowAnnouncementForm(false);
    setAnnouncementFiles([]);
    setAnnouncementForm({
      title: '',
      body: '',
      priority: 'NORMAL',
      attachmentName: '',
      attachmentUrl: '',
      attachmentType: '',
      attachmentSize: ''
    });
  }

  function handleAnnouncementFileChange(event) {
    const pickedFiles = Array.from(event.target.files || []);
    if (!pickedFiles.length) return;

    setAnnouncementFiles((previous) => {
      const merged = [...previous];

      for (const file of pickedFiles) {
        const signature = `${file.name}:${file.size}:${file.lastModified}`;
        const alreadyExists = merged.some((item) => item.signature === signature);
        if (!alreadyExists) {
          merged.push({
            id: `${signature}:${merged.length}`,
            signature,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        }
      }

      return merged;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeAnnouncementFile(fileId) {
    setAnnouncementFiles((previous) => previous.filter((item) => item.id !== fileId));
  }

  function formatFileSize(size) {
    if (!Number.isFinite(size)) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  useEffect(() => {
    if (!showAnnouncementForm) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeAnnouncementComposer();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAnnouncementForm, postingAnnouncement]);

  const selectedChat = useMemo(
    () => courseChats.find((chat) => chat.id === selectedChatId) || null,
    [courseChats, selectedChatId]
  );

  const attachmentsByAnnouncement = useMemo(() => {
    return attachments.reduce((acc, attachment) => {
      const key = String(attachment.announcementId || 'unlinked');
      if (!acc[key]) acc[key] = [];
      acc[key].push(attachment);
      return acc;
    }, {});
  }, [attachments]);

  const announcementTitleById = useMemo(() => {
    return announcements.reduce((acc, item) => {
      acc[String(item.id)] = item.title;
      return acc;
    }, {});
  }, [announcements]);

  const linkedAttachmentGroups = useMemo(() => {
    return Object.entries(attachmentsByAnnouncement)
      .sort((left, right) => {
        const leftTitle = left[0] === 'unlinked' ? 'Other files' : (announcementTitleById[left[0]] || left[0]);
        const rightTitle = right[0] === 'unlinked' ? 'Other files' : (announcementTitleById[right[0]] || right[0]);
        return leftTitle.localeCompare(rightTitle);
      });
  }, [attachmentsByAnnouncement, announcementTitleById]);

  const streamStats = useMemo(
    () => ({
      announcements: course?.announcementCount ?? announcements.length,
      attachments: course?.attachmentCount ?? announcements.reduce((sum, item) => sum + (item.attachments?.length || 0), 0)
    }),
    [announcements, course]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600">Loading course...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ── Hero ── */}
      <div
        className="h-48 w-full relative"
        style={{ background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}cc 100%)` }}
      >
        {/* dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Back button — pinned top-left */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Course title block — bottom-left, padded below back button */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 z-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/70 mb-1">
            {course.code}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {course.title}
          </h1>
          <p className="text-sm text-white/80 mt-1">
            👨‍🏫 {course.teacher?.name || 'Unknown Teacher'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {[
              {
                id: 'content',
                label: 'Announcements',
                badge: streamStats.announcements || null
              },
              {
                id: 'attachments',
                label: 'Files',
                badge: streamStats.attachments || null
              },
              {
                id: 'messaging',
                label: 'Messaging',
                badge: null
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-bold rounded-full ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Info Card ── */}
      <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="text-base">📚</span>
            <span className="font-mono font-semibold text-slate-800">{course.code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="text-base">👨‍🏫</span>
            <span>{course.teacher?.name || 'Unknown Teacher'}</span>
          </div>
          {course.classGroupCode && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="text-base">🏫</span>
              <span>Class: <span className="font-semibold">{course.classGroupCode}</span></span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="text-base">📝</span>
            <span>{streamStats.announcements} announcement{streamStats.announcements !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="text-base">📎</span>
            <span>{streamStats.attachments} file{streamStats.attachments !== 1 ? 's' : ''}</span>
          </div>
          {course.isCourseChatEnabled && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <span className="text-base">💬</span>
              <span>Chat enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {isTeacherView ? (
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Announcements</h2>
                <button
                  type="button"
                  onClick={openAnnouncementComposer}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                >
                  + Create Post
                </button>
              </div>
            ) : null}

            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    courseColor={cardColor}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-slate-600">No announcements yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="space-y-4">
            {attachments.length > 0 ? (
              linkedAttachmentGroups.map(([announcementId, list]) => (
                <section key={announcementId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {announcementId === 'unlinked'
                      ? 'Other files'
                      : (announcementTitleById[announcementId] || 'Attachment group')}
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((attachment) => (
                      <AttachmentPreview
                        key={attachment.id}
                        attachment={{
                          ...attachment,
                          name: attachment.name || attachment.title || 'Attachment'
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="text-4xl mb-3">📎</div>
                <p className="text-slate-600">No attachments in this course yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messaging' && (
          <div>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[420px] flex flex-col">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                {selectedChat?.title || 'Course Chat'}
              </h4>

              {chatLoading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}

              {!chatLoading && selectedChat ? (
                <>
                  <ChatBox
                    messages={chatMessages}
                    currentUserId={currentUserId}
                    isDirect={selectedChat.chatType === 'DIRECT'}
                  />

                  <form className="flex gap-2 mt-3" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      value={messageDraft}
                      placeholder="Type your message"
                      onChange={(e) => setMessageDraft(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>
                </>
              ) : null}

              {!chatLoading && !selectedChat ? (
                <p className="text-sm text-slate-500">No course chat available yet.</p>
              ) : null}
            </section>
          </div>
        )}
      </div>

      {/* ── Announcement Composer Modal (Teacher only) ── */}
      {showAnnouncementForm && isTeacherView ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="presentation"
          onClick={closeAnnouncementComposer}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ann-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Teacher post composer
                </p>
                <h3 id="ann-modal-title" className="text-lg font-extrabold text-slate-900">
                  Create Announcement
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Publish a course announcement for all enrolled students.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAnnouncementComposer}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all ml-4 shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form className="p-6 flex flex-col gap-5" onSubmit={handleSubmitAnnouncement}>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ann-title" className="text-sm font-semibold text-slate-700">Title</label>
                <input
                  id="ann-title"
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ann-priority" className="text-sm font-semibold text-slate-700">Priority</label>
                <select
                  id="ann-priority"
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm((p) => ({ ...p, priority: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ann-body" className="text-sm font-semibold text-slate-700">Content</label>
                <textarea
                  id="ann-body"
                  rows={5}
                  value={announcementForm.body}
                  onChange={(e) => setAnnouncementForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Write the announcement..."
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* File picker */}
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-slate-700">Attach files <span className="font-normal text-slate-400">(optional)</span></p>
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                  <Paperclip size={15} />
                  Click to select files
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleAnnouncementFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400">Select multiple files. Upload pipeline required before they are sent.</p>
              </div>

              {/* Staged files */}
              {announcementFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-slate-700">{announcementFiles.length} file{announcementFiles.length !== 1 ? 's' : ''} staged</p>
                  <div className="flex flex-col gap-1.5">
                    {announcementFiles.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip size={13} className="text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              {[item.type || 'Unknown', formatFileSize(item.size)].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAnnouncementFile(item.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold shrink-0"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}




              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAnnouncementComposer}
                  disabled={postingAnnouncement}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingAnnouncement}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {postingAnnouncement ? 'Posting...' : 'Post announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
}
