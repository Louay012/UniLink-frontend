import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Trash2, X } from 'lucide-react';

import { useAuth } from './context/AuthContext';
import {
  getCourse,
  listCourseAnnouncements,
  listCourseAttachments,
  createCourseAnnouncement,
  listCourseChats,
  listChatMessages,
  sendChatMessage
} from './services/course.service';
import AnnouncementCard from './mywork/components/AnnouncementCard';
import AttachmentPreview from './mywork/components/AttachmentPreview';
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
    author: teacherName || 'Teacher',
    visualType: announcement.priority === 'URGENT' ? 'URGENT' : 'NORMAL'
  };
}

export default function CourseDetails({ basePath = '' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedRole } = useAuth();

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
  const [chatError, setChatError] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'NORMAL',
    attachmentName: '',
    attachmentUrl: '',
    attachmentType: '',
    attachmentSize: ''
  });
  const [announcementFiles, setAnnouncementFiles] = useState([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [postError, setPostError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const withBase = (path) => `${basePath}${path}`;
  const cardColor = course?.color || pickColor(course?.code || id);
  const isTeacherView = selectedRole?.value === 'TEACHER';

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    setError('');
    setChatError('');

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
        setChatError(chatLoadError.message || 'Could not load messaging for this course.');
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
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
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
        if (active) {
          setChatError(chatMessageError.message || 'Failed to load chat messages.');
        }
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
      setChatError(sendError.message || 'Failed to send message.');
    }
  }

  async function handleSubmitAnnouncement(event) {
    event.preventDefault();
    if (!isTeacherView) return;

    setPostError('');
    setPostingAnnouncement(true);
    try {
      const payload = {
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        priority: announcementForm.priority
      };

      const attachmentUrl = announcementForm.attachmentUrl.trim();
      if (attachmentUrl) {
        payload.attachmentUrl = attachmentUrl;
        payload.attachmentName = announcementForm.attachmentName.trim() || 'Attachment';
        payload.attachmentType = announcementForm.attachmentType.trim() || null;
        payload.attachmentSize = announcementForm.attachmentSize.trim()
          ? Number(announcementForm.attachmentSize)
          : null;
      }

      await createCourseAnnouncement(selectedRole, id, payload);
      setAnnouncementForm({
        title: '',
        body: '',
        priority: 'NORMAL',
        attachmentName: '',
        attachmentUrl: '',
        attachmentType: '',
        attachmentSize: ''
      });
      setAnnouncementFiles([]);
      setShowAnnouncementForm(false);
      await loadCourseData();
      setActiveTab('content');
    } catch (submitError) {
      setPostError(submitError.message || 'Failed to create announcement.');
    } finally {
      setPostingAnnouncement(false);
    }
  }

  function handleBack() {
    navigate(withBase('/courses'));
  }

  function openAnnouncementComposer() {
    setPostError('');
    setShowAnnouncementForm(true);
  }

  function closeAnnouncementComposer() {
    if (postingAnnouncement) return;
    setShowAnnouncementForm(false);
    setPostError('');
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
      {/* Header */}
      <div
        className="h-40 w-full relative"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`
        }}
      >
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="absolute inset-0 flex items-end p-8 pointer-events-none">
          <div className="text-white max-w-7xl mx-auto w-full">
            <p className="text-sm font-semibold opacity-90">{course.code}</p>
            <h1 className="text-4xl font-bold mt-2">{course.title}</h1>
            <p className="text-white opacity-90 mt-2">👨‍🏫 {course.teacher?.name || 'Unknown Teacher'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'content', label: 'Content' },
              { id: 'attachments', label: `Attachments (${streamStats.attachments})` },
              { id: 'messaging', label: 'Messaging' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
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

      {error ? (
        <div className="mx-4 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 lg:mx-8">
          {error}
        </div>
      ) : null}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {isTeacherView ? (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">Announcements</h3>
                  <button
                    type="button"
                    onClick={openAnnouncementComposer}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Post
                  </button>
                </div>
              </section>
            ) : null}

            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
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

                  <form className="message-form mt-3" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      value={messageDraft}
                      placeholder="Type your message"
                      onChange={(event) => setMessageDraft(event.target.value)}
                    />
                    <button type="submit">Send</button>
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

      {showAnnouncementForm && isTeacherView ? (
        <div
          className="announcement-modal-backdrop"
          role="presentation"
          onClick={closeAnnouncementComposer}
        >
          <div
            className="announcement-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="announcement-modal-header">
              <div>
                <p className="announcement-modal-kicker">Teacher post composer</p>
                <h3 id="announcement-modal-title">Create Post</h3>
                <p className="announcement-modal-subtitle">
                  Publish a course announcement and stage local files for the upload pipeline.
                </p>
              </div>
              <button
                type="button"
                className="announcement-modal-close"
                onClick={closeAnnouncementComposer}
                aria-label="Close composer"
              >
                <X size={18} />
              </button>
            </div>

            <form className="announcement-modal-form" onSubmit={handleSubmitAnnouncement}>
              <div className="announcement-modal-grid">
                <label className="announcement-field announcement-field-wide">
                  <span>Title</span>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Announcement title"
                    required
                  />
                </label>

                <label className="announcement-field">
                  <span>Priority</span>
                  <select
                    value={announcementForm.priority}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>

                <label className="announcement-field announcement-field-wide">
                  <span>Content</span>
                  <textarea
                    value={announcementForm.body}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, body: event.target.value }))}
                    placeholder="Write the announcement..."
                    required
                  />
                </label>

                <div className="announcement-field announcement-field-wide">
                  <span>Files from your device</span>
                  <div className="announcement-upload-panel">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleAnnouncementFileChange}
                      className="announcement-file-input"
                    />
                    <p className="announcement-helper-text">
                      Select multiple files at once. They are previewed here now; backend upload support is still required before they can be sent with the post.
                    </p>
                  </div>
                </div>

                <div className="announcement-field announcement-field-wide">
                  <div className="announcement-files-header">
                    <span>Selected files</span>
                    <span>{announcementFiles.length} staged</span>
                  </div>

                  {announcementFiles.length ? (
                    <div className="announcement-file-list">
                      {announcementFiles.map((item) => (
                        <div key={item.id} className="announcement-file-item">
                          <div className="announcement-file-main">
                            <Paperclip size={14} />
                            <div>
                              <strong>{item.name}</strong>
                              <p>{[item.type || 'Unknown type', formatFileSize(item.size)].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                          <button type="button" className="announcement-file-remove" onClick={() => removeAnnouncementFile(item.id)}>
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="announcement-helper-text">No local files selected yet.</p>
                  )}
                </div>

                <div className="announcement-field announcement-field-wide announcement-field-advanced">
                  <span>External attachment metadata (optional)</span>
                  <div className="announcement-advanced-grid">
                    <label>
                      <span>Attachment URL</span>
                      <input
                        type="url"
                        value={announcementForm.attachmentUrl}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, attachmentUrl: event.target.value }))}
                        placeholder="https://..."
                      />
                    </label>
                    <label>
                      <span>File name</span>
                      <input
                        type="text"
                        value={announcementForm.attachmentName}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, attachmentName: event.target.value }))}
                        placeholder="File title"
                      />
                    </label>
                    <label>
                      <span>MIME type</span>
                      <input
                        type="text"
                        value={announcementForm.attachmentType}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, attachmentType: event.target.value }))}
                        placeholder="application/pdf"
                      />
                    </label>
                    <label>
                      <span>File size in bytes</span>
                      <input
                        type="number"
                        min="0"
                        value={announcementForm.attachmentSize}
                        onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, attachmentSize: event.target.value }))}
                        placeholder="102400"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {postError ? <p className="announcement-modal-error">{postError}</p> : null}

              <div className="announcement-modal-footer">
                <button type="button" className="announcement-modal-secondary" onClick={closeAnnouncementComposer} disabled={postingAnnouncement}>
                  Cancel
                </button>
                <button type="submit" className="announcement-modal-primary" disabled={postingAnnouncement}>
                  {postingAnnouncement ? 'Posting...' : 'Post announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {chatError ? (
        <div className="mx-4 mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 sm:mx-6 lg:mx-8">
          {chatError}
        </div>
      ) : null}
    </div>
  );
}
