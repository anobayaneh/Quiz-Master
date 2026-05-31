// =============================================
// QUIZ SYSTEM DATABASE (localStorage)
// =============================================

const DB = {
  init() {
    if (!localStorage.getItem('qs_initialized')) {
      this.seed();
      localStorage.setItem('qs_initialized', 'true');
    }
  },

  seed() {
    // Users
    const users = [
      { id: 'u1', role: 'admin', name: 'Administrator', email: 'admin@quizsystem.com', password: 'admin123', avatar: 'AD', createdAt: new Date().toISOString() },
      { id: 'u2', role: 'teacher', name: 'Ms. Maria Santos', email: 'teacher@quizsystem.com', password: 'teacher123', avatar: 'MS', subject: 'Mathematics', createdAt: new Date().toISOString() },
      { id: 'u3', role: 'teacher', name: 'Mr. Jose Reyes', email: 'jose@quizsystem.com', password: 'jose123', avatar: 'JR', subject: 'Science', createdAt: new Date().toISOString() },
      { id: 'u4', role: 'student', name: 'Ana Dela Cruz', email: 'student@quizsystem.com', password: 'student123', avatar: 'AC', section: 'BSIT-A607', createdAt: new Date().toISOString() },
      { id: 'u5', role: 'student', name: 'Carlos Mendoza', email: 'carlos@quizsystem.com', password: 'carlos123', avatar: 'CM', section: 'BSIT-A607', createdAt: new Date().toISOString() },
      { id: 'u6', role: 'student', name: 'Liza Pascual', email: 'liza@quizsystem.com', password: 'liza123', avatar: 'LP', section: 'BSCS-B201', createdAt: new Date().toISOString() },
    ];

    // Quizzes
    const quizzes = [
      {
        id: 'q1',
        title: 'Algebra Basics',
        description: 'Fundamental algebra concepts covering equations and inequalities.',
        subject: 'Mathematics',
        type: 'quiz',
        teacherId: 'u2',
        teacherName: 'Ms. Maria Santos',
        timeLimit: 30,
        passingScore: 70,
        status: 'published',
        section: 'BSIT-A607',
        createdAt: new Date().toISOString(),
        questions: [
          { id: 'qq1', type: 'multiple_choice', text: 'What is the value of x if 2x + 4 = 10?', points: 5, options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], answer: 1 },
          { id: 'qq2', type: 'multiple_choice', text: 'Which of the following is a quadratic equation?', points: 5, options: ['2x + 1 = 0', 'x² + 3x - 4 = 0', '3x - 7 = 14', '5 + x = 9'], answer: 1 },
          { id: 'qq3', type: 'true_false', text: 'The equation x² - 4 = 0 has two solutions.', points: 5, options: ['True', 'False'], answer: 0 },
          { id: 'qq4', type: 'multiple_choice', text: 'Simplify: 3(x + 4) - 2x', points: 5, options: ['x + 12', 'x + 4', '5x + 12', 'x - 12'], answer: 0 },
          { id: 'qq5', type: 'identification', text: 'What do you call a polynomial with exactly two terms?', points: 5, answer: 'binomial' },
        ]
      },
      {
        id: 'q2',
        title: 'Cell Biology Exam',
        description: 'Comprehensive exam on cell structure and function.',
        subject: 'Science',
        type: 'exam',
        teacherId: 'u3',
        teacherName: 'Mr. Jose Reyes',
        timeLimit: 60,
        passingScore: 75,
        status: 'published',
        section: 'BSIT-A607',
        createdAt: new Date().toISOString(),
        questions: [
          { id: 'qe1', type: 'multiple_choice', text: 'Which organelle is known as the "powerhouse of the cell"?', points: 10, options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'], answer: 2 },
          { id: 'qe2', type: 'true_false', text: 'Plant cells have cell walls but animal cells do not.', points: 10, options: ['True', 'False'], answer: 0 },
          { id: 'qe3', type: 'multiple_choice', text: 'What is the primary function of the nucleus?', points: 10, options: ['Protein synthesis', 'Energy production', 'Control center and DNA storage', 'Cell division'], answer: 2 },
          { id: 'qe4', type: 'identification', text: 'What is the process by which cells divide to produce two identical daughter cells?', points: 10, answer: 'mitosis' },
          { id: 'qe5', type: 'multiple_choice', text: 'Which of the following is NOT found in animal cells?', points: 10, options: ['Mitochondria', 'Cell membrane', 'Chloroplast', 'Nucleus'], answer: 2 },
        ]
      },
      {
        id: 'q3',
        title: 'Number Theory Quiz',
        description: 'Quick quiz on number theory fundamentals.',
        subject: 'Mathematics',
        type: 'quiz',
        teacherId: 'u2',
        teacherName: 'Ms. Maria Santos',
        timeLimit: 20,
        passingScore: 60,
        status: 'draft',
        section: 'BSCS-B201',
        createdAt: new Date().toISOString(),
        questions: [
          { id: 'qn1', type: 'multiple_choice', text: 'What is the smallest prime number?', points: 10, options: ['0', '1', '2', '3'], answer: 2 },
          { id: 'qn2', type: 'true_false', text: 'All even numbers greater than 2 are composite.', points: 10, options: ['True', 'False'], answer: 0 },
          { id: 'qn3', type: 'identification', text: 'What is the GCF of 12 and 18?', points: 10, answer: '6' },
        ]
      }
    ];

    // Results
    const results = [
      {
        id: 'r1',
        quizId: 'q1',
        quizTitle: 'Algebra Basics',
        studentId: 'u4',
        studentName: 'Ana Dela Cruz',
        score: 20,
        totalPoints: 25,
        percentage: 80,
        passed: true,
        timeTaken: 18,
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        answers: { qq1: 1, qq2: 1, qq3: 0, qq4: 0, qq5: 'binomial' }
      },
      {
        id: 'r2',
        quizId: 'q2',
        quizTitle: 'Cell Biology Exam',
        studentId: 'u4',
        studentName: 'Ana Dela Cruz',
        score: 40,
        totalPoints: 50,
        percentage: 80,
        passed: true,
        timeTaken: 45,
        submittedAt: new Date(Date.now() - 172800000).toISOString(),
        answers: { qe1: 2, qe2: 0, qe3: 2, qe4: 'mitosis', qe5: 2 }
      }
    ];

    localStorage.setItem('qs_users', JSON.stringify(users));
    localStorage.setItem('qs_quizzes', JSON.stringify(quizzes));
    localStorage.setItem('qs_results', JSON.stringify(results));
  },

  // Users CRUD
  getUsers() { return JSON.parse(localStorage.getItem('qs_users') || '[]'); },
  getUserById(id) { return this.getUsers().find(u => u.id === id); },
  getUserByEmail(email) { return this.getUsers().find(u => u.email === email); },
  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    localStorage.setItem('qs_users', JSON.stringify(users));
  },
  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem('qs_users', JSON.stringify(users));
  },

  // Quizzes CRUD
  getQuizzes() { return JSON.parse(localStorage.getItem('qs_quizzes') || '[]'); },
  getQuizById(id) { return this.getQuizzes().find(q => q.id === id); },
  saveQuiz(quiz) {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) quizzes[idx] = quiz; else quizzes.push(quiz);
    localStorage.setItem('qs_quizzes', JSON.stringify(quizzes));
  },
  deleteQuiz(id) {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    localStorage.setItem('qs_quizzes', JSON.stringify(quizzes));
    // Also delete results
    const results = this.getResults().filter(r => r.quizId !== id);
    localStorage.setItem('qs_results', JSON.stringify(results));
  },

  // Results CRUD
  getResults() { return JSON.parse(localStorage.getItem('qs_results') || '[]'); },
  getResultsByStudent(studentId) { return this.getResults().filter(r => r.studentId === studentId); },
  getResultsByQuiz(quizId) { return this.getResults().filter(r => r.quizId === quizId); },
  hasStudentTaken(quizId, studentId) { return this.getResults().some(r => r.quizId === quizId && r.studentId === studentId); },
  saveResult(result) {
    const results = this.getResults();
    results.push(result);
    localStorage.setItem('qs_results', JSON.stringify(results));
  },

  // Auth
  login(email, password) {
    const user = this.getUserByEmail(email);
    if (user && user.password === password) return user;
    return null;
  },
  currentUser() {
    const data = sessionStorage.getItem('qs_current_user');
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser(user) {
    sessionStorage.setItem('qs_current_user', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('qs_current_user');
  },

  // Helpers
  genId(prefix) { return prefix + Date.now() + Math.random().toString(36).substr(2,5); },
};
