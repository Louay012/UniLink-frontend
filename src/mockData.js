// Mock data for UniLink courses application
export const MOCK_USER = {
  id: 'u-student-1',
  name: 'Ahmed Ben Ali',
  email: 'ahmed@university.edu',
  role: 'STUDENT',
  classGroup: 'GL4A',
  avatar: '👨‍🎓'
};

export const TEACHERS = {
  't-1': { id: 't-1', name: 'Dr. Fatima Hassan', avatar: '👨‍🏫' },
  't-2': { id: 't-2', name: 'Prof. Mohammed Karim', avatar: '👨‍🏫' },
  't-3': { id: 't-3', name: 'Dr. Leila Mansouri', avatar: '👩‍🏫' }
};

export const COURSES = [
  {
    id: 'c-1',
    code: 'GL4A-ALGO',
    title: 'Algorithms & Data Structures',
    teacher: TEACHERS['t-1'],
    description: 'Advanced algorithms and data structure design patterns',
    color: '#0e6ba8',
    newAnnouncements: 2,
    nextLesson: '2026-03-27T14:00:00'
  },
  {
    id: 'c-2',
    code: 'GL4A-DB',
    title: 'Database Systems',
    teacher: TEACHERS['t-2'],
    description: 'Relational and NoSQL database design and optimization',
    color: '#a23b72',
    newAnnouncements: 0,
    nextLesson: '2026-03-28T10:00:00'
  },
  {
    id: 'c-3',
    code: 'GL4A-AI',
    title: 'Artificial Intelligence',
    teacher: TEACHERS['t-3'],
    description: 'Machine learning, neural networks, and AI applications',
    color: '#f18f01',
    newAnnouncements: 3,
    nextLesson: '2026-03-26T09:00:00'
  },
  {
    id: 'c-4',
    code: 'GL4A-WEB',
    title: 'Web Development',
    teacher: TEACHERS['t-1'],
    description: 'Full-stack web development with modern frameworks',
    color: '#06a77d',
    newAnnouncements: 1,
    nextLesson: '2026-03-29T11:00:00'
  },
  {
    id: 'c-5',
    code: 'GL4A-MOBILE',
    title: 'Mobile Development',
    teacher: TEACHERS['t-3'],
    description: 'iOS and Android native application development',
    color: '#d62828',
    newAnnouncements: 0,
    nextLesson: '2026-03-30T15:00:00'
  },
  {
    id: 'c-6',
    code: 'GL4A-CLOUD',
    title: 'Cloud Computing',
    teacher: TEACHERS['t-2'],
    description: 'AWS, Azure, and cloud infrastructure design',
    color: '#9d4edd',
    newAnnouncements: 2,
    nextLesson: '2026-04-01T10:00:00'
  }
];

export const ANNOUNCEMENTS = {
  'c-1': [
    {
      id: 'a-1',
      courseId: 'c-1',
      title: 'Assignment 3 Released',
      content: 'The third assignment on graph algorithms has been released. Deadline: April 10, 2026. Submit via the course portal with proper documentation.',
      timestamp: '2026-03-24T16:30:00',
      badge: 'NEW',
      attachments: [
        { id: 'att-1', name: 'Assignment_3.pdf', type: 'pdf', size: '2.5 MB' }
      ]
    },
    {
      id: 'a-2',
      courseId: 'c-1',
      title: 'Midterm Exam Scheduled',
      content: 'Midterm exam will be held on April 15, 2026, in Hall A. Syllabus covers all topics up to Chapter 8.',
      timestamp: '2026-03-22T09:00:00',
      badge: 'URGENT',
      attachments: []
    }
  ],
  'c-2': [
    {
      id: 'a-3',
      courseId: 'c-2',
      title: 'Database Design Project',
      content: 'Project requirements and guidelines are now available. Teams of 3-4 students. Due date: May 1, 2026.',
      timestamp: '2026-03-20T14:00:00',
      badge: null,
      attachments: [
        { id: 'att-2', name: 'Project_Guidelines.docx', type: 'docx', size: '1.2 MB' }
      ]
    }
  ],
  'c-3': [
    {
      id: 'a-4',
      courseId: 'c-3',
      title: 'Lab Session Canceled',
      content: 'Lab session on March 26 is canceled due to equipment maintenance. It will be rescheduled to March 28.',
      timestamp: '2026-03-25T11:00:00',
      badge: 'NEW',
      attachments: []
    },
    {
      id: 'a-5',
      courseId: 'c-3',
      title: 'Neural Networks Tutorial',
      content: 'New tutorial on implementing neural networks with TensorFlow is available.',
      timestamp: '2026-03-23T13:00:00',
      badge: 'NEW',
      attachments: [
        { id: 'att-3', name: 'NN_Tutorial.ipynb', type: 'jupyter', size: '5.8 MB' }
      ]
    },
    {
      id: 'a-6',
      courseId: 'c-3',
      title: 'Research Papers Recommended',
      content: 'Check out the recommended research papers on the course page for deeper understanding.',
      timestamp: '2026-03-21T10:00:00',
      badge: null,
      attachments: []
    }
  ],
  'c-4': [
    {
      id: 'a-7',
      courseId: 'c-4',
      title: 'Framework Choice for Project',
      content: 'You can choose between React, Vue, or Angular for your frontend project. React is recommended.',
      timestamp: '2026-03-23T15:00:00',
      badge: 'NEW',
      attachments: []
    }
  ],
  'c-5': [],
  'c-6': [
    {
      id: 'a-8',
      courseId: 'c-6',
      title: 'AWS Certification Discount',
      content: 'Special discount code for AWS certification exam available. Contact teacher for code.',
      timestamp: '2026-03-25T09:00:00',
      badge: 'NEW',
      attachments: []
    },
    {
      id: 'a-9',
      courseId: 'c-6',
      title: 'Cloud Project Deadline Extended',
      content: 'New deadline for cloud project is April 20, 2026 (extended by 1 week).',
      timestamp: '2026-03-20T12:00:00',
      badge: null,
      attachments: []
    }
  ]
};

export const LESSONS = {
  'c-1': [
    {
      week: 1,
      title: 'Introduction to Algorithms',
      items: [
        { id: 'l-1', name: 'Welcome.pdf', type: 'pdf', size: '1.2 MB' },
        { id: 'l-2', name: 'Chapter1_Slides.pptx', type: 'pptx', size: '3.5 MB' }
      ]
    },
    {
      week: 2,
      title: 'Sorting Algorithms',
      items: [
        { id: 'l-3', name: 'Lecture_Video.mp4', type: 'video', size: '256 MB' },
        { id: 'l-4', name: 'Exercise_Set_1.pdf', type: 'pdf', size: '0.8 MB' }
      ]
    },
    {
      week: 3,
      title: 'Graph Algorithms',
      items: [
        { id: 'l-5', name: 'Slides.pdf', type: 'pdf', size: '2.1 MB' },
        { id: 'l-6', name: 'Code_Examples.zip', type: 'zip', size: '5.2 MB' }
      ]
    }
  ],
  'c-2': [
    {
      week: 1,
      title: 'Database Fundamentals',
      items: [
        { id: 'l-7', name: 'Intro_to_Databases.pdf', type: 'pdf', size: '1.5 MB' },
        { id: 'l-8', name: 'SQL_Basics_Tutorial.mp4', type: 'video', size: '180 MB' }
      ]
    }
  ],
  'c-3': [
    {
      week: 1,
      title: 'ML Fundamentals',
      items: [
        { id: 'l-9', name: 'ML_Overview.pdf', type: 'pdf', size: '2.8 MB' }
      ]
    }
  ],
  'c-4': [],
  'c-5': [],
  'c-6': []
};

export const CHAT_MESSAGES = {
  'c-1': [
    { id: 'msg-1', sender: 'Dr. Fatima Hassan', role: 'TEACHER', content: 'Hello everyone, welcome to the course!', timestamp: '2026-03-21T10:00:00' },
    { id: 'msg-2', sender: 'Ahmed Ben Ali', role: 'STUDENT', content: 'Hi! Looking forward to this course.', timestamp: '2026-03-21T10:15:00' },
    { id: 'msg-3', sender: 'Dr. Fatima Hassan', role: 'TEACHER', content: 'Great! Make sure to complete the prerequisites before week 2.', timestamp: '2026-03-21T10:20:00' }
  ],
  'c-2': [
    { id: 'msg-4', sender: 'Prof. Mohammed Karim', role: 'TEACHER', content: 'Any questions about the database design project?', timestamp: '2026-03-25T14:00:00' }
  ],
  'c-3': [],
  'c-4': [],
  'c-5': [],
  'c-6': []
};

export function getTeacherName(teacherId) {
  return TEACHERS[teacherId]?.name || 'Unknown Teacher';
}

export function getCourseName(courseId) {
  return COURSES.find(c => c.id === courseId)?.title || 'Unknown Course';
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
