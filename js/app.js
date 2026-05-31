// =============================================
// QUIZ SYSTEM - MAIN APP
// =============================================

let currentPage = 'dashboard';
let quizTimerInterval = null;
let quizTimeRemaining = 0;
let currentQuiz = null;
let studentAnswers = {};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  const user = DB.currentUser();
  if (!user) { showLogin(); } else { showApp(user); }
});

// ---- TOAST ----
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const cont = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---- MODAL HELPERS ----
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// =============================================
// LOGIN
// =============================================
function showLogin() {
  document.getElementById('app').innerHTML = '';
  document.getElementById('login-page').classList.remove('hidden');
}

function fillDemo(role) {
  const creds = {
    admin: { email: 'admin@quizsystem.com', pw: 'admin123' },
    teacher: { email: 'teacher@quizsystem.com', pw: 'teacher123' },
    student: { email: 'student@quizsystem.com', pw: 'student123' }
  };
  document.getElementById('login-email').value = creds[role].email;
  document.getElementById('login-password').value = creds[role].pw;
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const user = DB.login(email, password);
  if (user) {
    DB.setCurrentUser(user);
    document.getElementById('login-page').classList.add('hidden');
    showApp(user);
    toast(`Welcome back, ${user.name}!`, 'success');
  } else {
    toast('Invalid email or password.', 'error');
    document.getElementById('login-password').value = '';
  }
});

// =============================================
// APP SHELL
// =============================================
function showApp(user) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <div class="logo-icon">📝</div>
          <div>
            <div class="logo-text">QuizMaster</div>
            <div class="logo-sub">Exam System</div>
          </div>
        </div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar">${user.avatar}</div>
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role}</div>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav"></nav>
      <div class="sidebar-footer">
        <div class="nav-item" onclick="doLogout()">
          <span class="nav-icon">🚪</span> Logout
        </div>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
    <div class="main-content">
      <div class="topbar">
        <div class="topbar-left">
          <button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>
          <div>
            <div class="page-title" id="page-title">Dashboard</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search..." id="global-search" oninput="handleSearch(this.value)">
          </div>
          <div class="user-avatar" style="cursor:pointer" title="${user.name}">${user.avatar}</div>
        </div>
      </div>
      <div class="page-body" id="page-body"></div>
      <footer class="app-footer">
        Developed by <span>Gideon Agtas</span> &nbsp;|&nbsp; BSIT - A607 &nbsp;|&nbsp; QuizMaster Exam System &copy; 2025
      </footer>
    </div>
  `;
  buildNav(user.role);
  navigate('dashboard');
}

function buildNav(role) {
  const nav = document.getElementById('sidebar-nav');
  const items = {
    admin: [
      { label: 'Overview', icon: '📊', page: 'dashboard' },
      { label: 'Users', icon: '👥', page: 'users', section: 'Management' },
      { label: 'Quizzes & Exams', icon: '📋', page: 'quizzes' },
      { label: 'All Results', icon: '📈', page: 'results' },
      { label: 'Reports', icon: '📑', page: 'reports', section: 'Analytics' },
    ],
    teacher: [
      { label: 'Dashboard', icon: '📊', page: 'dashboard' },
      { label: 'My Quizzes', icon: '📋', page: 'quizzes', section: 'Content' },
      { label: 'Create Quiz', icon: '➕', page: 'create-quiz' },
      { label: 'Results', icon: '📈', page: 'results', section: 'Reports' },
    ],
    student: [
      { label: 'Dashboard', icon: '📊', page: 'dashboard' },
      { label: 'Available Quizzes', icon: '📋', page: 'quizzes', section: 'Exams' },
      { label: 'My Results', icon: '🏆', page: 'results' },
    ]
  };
  let html = '';
  let lastSection = '';
  (items[role] || []).forEach(item => {
    if (item.section && item.section !== lastSection) {
      html += `<div class="nav-section-label">${item.section}</div>`;
      lastSection = item.section;
    }
    html += `<div class="nav-item" id="nav-${item.page}" onclick="navigate('${item.page}')">
      <span class="nav-icon">${item.icon}</span> ${item.label}
    </div>`;
  });
  nav.innerHTML = html;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
}

function navigate(page, params = {}) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`nav-${page}`)?.classList.add('active');
  if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }

  const user = DB.currentUser();
  const titles = {
    dashboard: 'Dashboard', users: 'User Management', quizzes: 'Quizzes & Exams',
    'create-quiz': 'Create Quiz', results: 'Results', reports: 'Reports',
    'take-quiz': 'Taking Exam', 'quiz-result': 'Result'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  const body = document.getElementById('page-body');
  switch (page) {
    case 'dashboard': renderDashboard(user, body); break;
    case 'users': renderUsers(body); break;
    case 'quizzes': renderQuizzes(user, body); break;
    case 'create-quiz': renderCreateQuiz(body, params.quiz || null); break;
    case 'results': renderResults(user, body); break;
    case 'reports': renderReports(body); break;
    case 'take-quiz': renderTakeQuiz(params.quizId, body); break;
    case 'quiz-result': renderQuizResult(params.result, body); break;
    default: body.innerHTML = '<div class="empty-state"><div class="empty-icon">🚧</div><h3>Coming Soon</h3></div>';
  }
}

function handleSearch(val) {
  if (currentPage === 'quizzes') {
    document.querySelectorAll('.quiz-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(val.toLowerCase()) ? '' : 'none';
    });
  }
}

function doLogout() {
  DB.logout();
  document.getElementById('app').innerHTML = '';
  showLogin();
  toast('Logged out successfully.', 'info');
}

// =============================================
// DASHBOARD
// =============================================
function renderDashboard(user, body) {
  const quizzes = DB.getQuizzes();
  const users = DB.getUsers();
  const results = DB.getResults();

  if (user.role === 'admin') {
    const totalUsers = users.length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const totalQuizzes = quizzes.length;
    const published = quizzes.filter(q => q.status === 'published').length;
    const avgScore = results.length ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0;

    body.innerHTML = `
      <div class="page-header"><div><h2>System Overview</h2><p>Welcome back, ${user.name}</p></div></div>
      <div class="stats-grid">
        <div class="stat-card blue"><div class="stat-icon">👥</div><div class="stat-value">${totalUsers}</div><div class="stat-label">Total Users</div></div>
        <div class="stat-card green"><div class="stat-icon">📋</div><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Total Quizzes/Exams</div></div>
        <div class="stat-card cyan"><div class="stat-icon">✅</div><div class="stat-value">${published}</div><div class="stat-label">Published</div></div>
        <div class="stat-card orange"><div class="stat-icon">📊</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex-wrap:wrap;">
        <div class="card">
          <div class="card-header"><span class="card-title">User Breakdown</span></div>
          ${roleStatBar('Admins', users.filter(u=>u.role==='admin').length, totalUsers, 'blue')}
          ${roleStatBar('Teachers', teachers, totalUsers, 'green')}
          ${roleStatBar('Students', students, totalUsers, 'cyan')}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Recent Submissions</span></div>
          ${results.slice(-5).reverse().map(r => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
              <div><div style="font-size:13px;font-weight:600;">${r.studentName}</div><div style="font-size:12px;color:var(--text2);">${r.quizTitle}</div></div>
              <span class="badge ${r.passed?'badge-success':'badge-danger'}">${r.percentage}%</span>
            </div>
          `).join('') || '<div class="empty-state" style="padding:20px"><p>No submissions yet</p></div>'}
        </div>
      </div>`;
  } else if (user.role === 'teacher') {
    const myQuizzes = quizzes.filter(q => q.teacherId === user.id);
    const myResults = results.filter(r => myQuizzes.some(q => q.id === r.quizId));
    const published = myQuizzes.filter(q => q.status === 'published').length;
    const avgScore = myResults.length ? Math.round(myResults.reduce((a, r) => a + r.percentage, 0) / myResults.length) : 0;

    body.innerHTML = `
      <div class="page-header"><div><h2>Welcome, ${user.name}!</h2><p>${user.subject} Teacher</p></div>
        <button class="btn btn-primary" onclick="navigate('create-quiz')">➕ Create New</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card blue"><div class="stat-icon">📋</div><div class="stat-value">${myQuizzes.length}</div><div class="stat-label">My Quizzes</div></div>
        <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${published}</div><div class="stat-label">Published</div></div>
        <div class="stat-card cyan"><div class="stat-icon">📊</div><div class="stat-value">${myResults.length}</div><div class="stat-label">Submissions</div></div>
        <div class="stat-card orange"><div class="stat-icon">⭐</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">My Recent Quizzes</span>
          <button class="btn btn-primary btn-sm" onclick="navigate('create-quiz')">➕ New</button>
        </div>
        <div class="quiz-grid">${myQuizzes.slice(0,3).map(q => quizCard(q, user)).join('') || '<div class="empty-state"><p>No quizzes yet. Create one!</p></div>'}</div>
      </div>`;
  } else {
    // Student
    const myResults = DB.getResultsByStudent(user.id);
    const pubQuizzes = quizzes.filter(q => q.status === 'published');
    const pending = pubQuizzes.filter(q => !DB.hasStudentTaken(q.id, user.id)).length;
    const avgScore = myResults.length ? Math.round(myResults.reduce((a, r) => a + r.percentage, 0) / myResults.length) : 0;
    const passed = myResults.filter(r => r.passed).length;

    body.innerHTML = `
      <div class="page-header"><div><h2>Hello, ${user.name}! 👋</h2><p>Section: ${user.section || 'N/A'}</p></div></div>
      <div class="stats-grid">
        <div class="stat-card blue"><div class="stat-icon">📋</div><div class="stat-value">${pending}</div><div class="stat-label">Pending Exams</div></div>
        <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${passed}</div><div class="stat-label">Passed</div></div>
        <div class="stat-card cyan"><div class="stat-icon">📊</div><div class="stat-value">${myResults.length}</div><div class="stat-label">Completed</div></div>
        <div class="stat-card orange"><div class="stat-icon">⭐</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Available Exams</span>
          <button class="btn btn-secondary btn-sm" onclick="navigate('quizzes')">View All</button>
        </div>
        <div class="quiz-grid">${pubQuizzes.slice(0,3).map(q => quizCard(q, user)).join('') || '<div class="empty-state"><p>No exams available.</p></div>'}</div>
      </div>`;
  }
}

function roleStatBar(label, count, total, color) {
  const pct = total ? Math.round(count / total * 100) : 0;
  return `<div style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
      <span>${label}</span><span style="font-weight:700">${count} <span style="color:var(--text2);font-weight:400">(${pct}%)</span></span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--${color==='blue'?'primary':color==='green'?'success':'secondary'})"></div></div>
  </div>`;
}

// =============================================
// USERS (Admin Only)
// =============================================
function renderUsers(body) {
  const user = DB.currentUser();
  if (user.role !== 'admin') { body.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h3>Access Denied</h3></div>'; return; }
  const users = DB.getUsers();

  body.innerHTML = `
    <div class="page-header">
      <div><h2>User Management</h2><p>Manage all system users</p></div>
      <button class="btn btn-primary" onclick="showUserModal()">➕ Add User</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="filterUserTable('all',this)">All (${users.length})</button>
      <button class="tab-btn" onclick="filterUserTable('admin',this)">Admins</button>
      <button class="tab-btn" onclick="filterUserTable('teacher',this)">Teachers</button>
      <button class="tab-btn" onclick="filterUserTable('student',this)">Students</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table id="users-table">
          <thead><tr><th>User</th><th>Role</th><th>Email</th><th>Section/Subject</th><th>Actions</th></tr></thead>
          <tbody>${users.map(u => userRow(u)).join('')}</tbody>
        </table>
      </div>
    </div>
    ${userModal()}
  `;
}

function userRow(u) {
  const roleColors = { admin: 'danger', teacher: 'secondary', student: 'success' };
  return `<tr id="user-row-${u.id}">
    <td><div style="display:flex;align-items:center;gap:10px">
      <div class="user-avatar" style="width:32px;height:32px;font-size:11px">${u.avatar}</div>
      <span style="font-weight:600">${u.name}</span>
    </div></td>
    <td><span class="badge badge-${roleColors[u.role]}">${u.role}</span></td>
    <td style="color:var(--text2)">${u.email}</td>
    <td style="color:var(--text2)">${u.subject || u.section || '—'}</td>
    <td><div class="td-actions">
      <button class="btn-icon" onclick="showUserModal('${u.id}')" title="Edit">✏️</button>
      <button class="btn-icon" onclick="deleteUser('${u.id}')" title="Delete">🗑️</button>
    </div></td>
  </tr>`;
}

function filterUserTable(role, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const users = DB.getUsers();
  const filtered = role === 'all' ? users : users.filter(u => u.role === role);
  document.querySelector('#users-table tbody').innerHTML = filtered.map(u => userRow(u)).join('');
}

function userModal(userId = null) {
  const u = userId ? DB.getUserById(userId) : null;
  return `
  <div class="modal-overlay hidden" id="user-modal">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${u ? 'Edit User' : 'Add New User'}</span>
        <button class="modal-close" onclick="closeModal('user-modal')">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="um-id" value="${u?.id || ''}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Full Name</label>
            <input class="form-control" id="um-name" value="${u?.name || ''}" placeholder="Full name"></div>
          <div class="form-group"><label class="form-label">Role</label>
            <select class="form-control" id="um-role" onchange="updateUserFormFields()">
              <option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option>
              <option value="teacher" ${u?.role==='teacher'?'selected':''}>Teacher</option>
              <option value="student" ${u?.role==='student'?'selected':''}>Student</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Email</label>
          <input class="form-control" id="um-email" type="email" value="${u?.email || ''}" placeholder="email@example.com"></div>
        <div class="form-group"><label class="form-label">Password ${u?'(leave blank to keep)':''}</label>
          <input class="form-control" id="um-password" type="password" placeholder="${u?'New password...':'Password'}"></div>
        <div id="um-extra">
          ${u?.role==='teacher'?`<div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="um-subject" value="${u?.subject||''}"></div>`:''}
          ${u?.role==='student'?`<div class="form-group"><label class="form-label">Section</label><input class="form-control" id="um-section" value="${u?.section||''}"></div>`:''}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('user-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="saveUser()">💾 Save User</button>
      </div>
    </div>
  </div>`;
}

function showUserModal(userId = null) {
  document.getElementById('user-modal')?.remove();
  document.getElementById('page-body').insertAdjacentHTML('beforeend', userModal(userId));
  openModal('user-modal');
}

function updateUserFormFields() {
  const role = document.getElementById('um-role').value;
  const extra = document.getElementById('um-extra');
  extra.innerHTML = role === 'teacher'
    ? `<div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="um-subject" placeholder="e.g. Mathematics"></div>`
    : role === 'student'
    ? `<div class="form-group"><label class="form-label">Section</label><input class="form-control" id="um-section" placeholder="e.g. BSIT-A607"></div>`
    : '';
}

function saveUser() {
  const id = document.getElementById('um-id').value;
  const name = document.getElementById('um-name').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const password = document.getElementById('um-password').value;
  const role = document.getElementById('um-role').value;
  if (!name || !email) { toast('Name and email are required.', 'error'); return; }

  const existing = id ? DB.getUserById(id) : null;
  const user = {
    id: id || DB.genId('u'),
    name, email, role,
    password: password || (existing?.password || 'password123'),
    avatar: name.split(' ').map(w=>w[0]).join('').toUpperCase().substr(0,2),
    subject: document.getElementById('um-subject')?.value || existing?.subject || '',
    section: document.getElementById('um-section')?.value || existing?.section || '',
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  DB.saveUser(user);
  closeModal('user-modal');
  renderUsers(document.getElementById('page-body'));
  toast(id ? 'User updated!' : 'User created!', 'success');
}

function deleteUser(id) {
  const u = DB.getUserById(id);
  const me = DB.currentUser();
  if (u.id === me.id) { toast("You can't delete yourself!", 'error'); return; }
  if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) {
    DB.deleteUser(id);
    renderUsers(document.getElementById('page-body'));
    toast('User deleted.', 'success');
  }
}

// =============================================
// QUIZZES
// =============================================
function quizCard(q, user) {
  const taken = user.role === 'student' ? DB.hasStudentTaken(q.id, user.id) : false;
  const totalPts = q.questions.reduce((a, qq) => a + qq.points, 0);
  return `
  <div class="quiz-card" id="qcard-${q.id}">
    <div class="quiz-card-header">
      <div class="quiz-card-type ${q.type}">${q.type === 'exam' ? '📜' : '📝'} ${q.type.toUpperCase()}</div>
      <div class="quiz-card-title">${q.title}</div>
      <div class="quiz-card-desc">${q.description}</div>
    </div>
    <div class="quiz-card-meta">
      <div class="quiz-meta-item">⏱️ ${q.timeLimit} min</div>
      <div class="quiz-meta-item">❓ ${q.questions.length} items</div>
      <div class="quiz-meta-item">⭐ ${totalPts} pts</div>
    </div>
    <div class="quiz-card-footer">
      ${user.role === 'student'
        ? taken
          ? `<button class="btn btn-secondary btn-sm w-full" disabled>✅ Already Taken</button>`
          : `<button class="btn btn-primary btn-sm w-full" onclick="confirmTakeQuiz('${q.id}')">▶️ Take Exam</button>`
        : `<button class="btn btn-secondary btn-sm" onclick="navigate('create-quiz',{quiz:DB.getQuizById('${q.id}')})">✏️ Edit</button>
           <button class="btn btn-danger btn-sm" onclick="deleteQuiz('${q.id}')">🗑️</button>
           <span class="badge ${q.status==='published'?'badge-success':'badge-gray'} ml-auto">${q.status}</span>`
      }
    </div>
  </div>`;
}

function renderQuizzes(user, body) {
  const allQuizzes = DB.getQuizzes();
  const quizzes = user.role === 'student'
    ? allQuizzes.filter(q => q.status === 'published')
    : user.role === 'teacher'
    ? allQuizzes.filter(q => q.teacherId === user.id)
    : allQuizzes;

  body.innerHTML = `
    <div class="page-header">
      <div><h2>${user.role === 'student' ? 'Available Exams' : 'Quizzes & Exams'}</h2><p>${quizzes.length} total</p></div>
      ${user.role !== 'student' ? `<button class="btn btn-primary" onclick="navigate('create-quiz')">➕ Create New</button>` : ''}
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="filterQuizzes('all',this,'${user.role}')">All</button>
      <button class="tab-btn" onclick="filterQuizzes('quiz',this,'${user.role}')">Quizzes</button>
      <button class="tab-btn" onclick="filterQuizzes('exam',this,'${user.role}')">Exams</button>
    </div>
    <div class="quiz-grid" id="quiz-grid">
      ${quizzes.length ? quizzes.map(q => quizCard(q, user)).join('') : '<div class="empty-state"><div class="empty-icon">📋</div><h3>No quizzes found</h3><p>Create one to get started.</p></div>'}
    </div>
  `;
}

function filterQuizzes(type, btn, role) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const user = DB.currentUser();
  let quizzes = DB.getQuizzes();
  if (role === 'student') quizzes = quizzes.filter(q => q.status === 'published');
  if (role === 'teacher') quizzes = quizzes.filter(q => q.teacherId === user.id);
  if (type !== 'all') quizzes = quizzes.filter(q => q.type === type);
  document.getElementById('quiz-grid').innerHTML = quizzes.map(q => quizCard(q, user)).join('') || '<div class="empty-state"><p>No items.</p></div>';
}

function deleteQuiz(id) {
  if (confirm('Delete this quiz? All results will also be deleted.')) {
    DB.deleteQuiz(id);
    navigate('quizzes');
    toast('Quiz deleted.', 'success');
  }
}

// =============================================
// CREATE/EDIT QUIZ
// =============================================
function renderCreateQuiz(body, existingQuiz = null) {
  const user = DB.currentUser();
  if (user.role === 'student') { body.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h3>Access Denied</h3></div>'; return; }

  const q = existingQuiz || { id: '', title: '', description: '', subject: '', type: 'quiz', timeLimit: 30, passingScore: 70, status: 'draft', section: '', questions: [] };

  body.innerHTML = `
    <div class="page-header">
      <div><h2>${existingQuiz ? 'Edit' : 'Create'} Quiz/Exam</h2><p>Fill in the details and add questions</p></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;align-items:start">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-title" style="margin-bottom:20px">📋 Basic Information</div>
          <input type="hidden" id="cq-id" value="${q.id}">
          <div class="form-group"><label class="form-label">Title</label>
            <input class="form-control" id="cq-title" value="${q.title}" placeholder="Quiz/Exam title"></div>
          <div class="form-group"><label class="form-label">Description</label>
            <textarea class="form-control" id="cq-desc" placeholder="Brief description...">${q.description}</textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Subject</label>
              <input class="form-control" id="cq-subject" value="${q.subject}" placeholder="e.g. Mathematics"></div>
            <div class="form-group"><label class="form-label">Type</label>
              <select class="form-control" id="cq-type">
                <option value="quiz" ${q.type==='quiz'?'selected':''}>Quiz</option>
                <option value="exam" ${q.type==='exam'?'selected':''}>Exam</option>
              </select></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Time Limit (min)</label>
              <input class="form-control" id="cq-time" type="number" value="${q.timeLimit}" min="5"></div>
            <div class="form-group"><label class="form-label">Passing Score (%)</label>
              <input class="form-control" id="cq-passing" type="number" value="${q.passingScore}" min="1" max="100"></div>
            <div class="form-group"><label class="form-label">Status</label>
              <select class="form-control" id="cq-status">
                <option value="draft" ${q.status==='draft'?'selected':''}>Draft</option>
                <option value="published" ${q.status==='published'?'selected':''}>Published</option>
              </select></div>
          </div>
          <div class="form-group"><label class="form-label">Section (leave blank for all)</label>
            <input class="form-control" id="cq-section" value="${q.section}" placeholder="e.g. BSIT-A607"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">❓ Questions (<span id="q-count">${q.questions.length}</span>)</span>
            <button class="btn btn-primary btn-sm" onclick="addQuestion()">➕ Add Question</button>
          </div>
          <div id="questions-container">
            ${q.questions.map((qq, i) => buildQuestionHTML(qq, i)).join('')}
          </div>
          ${q.questions.length === 0 ? `<div class="empty-state" id="no-q-msg"><p>No questions yet. Add some!</p></div>` : ''}
        </div>
      </div>

      <div>
        <div class="card" style="position:sticky;top:80px">
          <div class="card-title" style="margin-bottom:16px">⚡ Actions</div>
          <button class="btn btn-secondary w-full" style="margin-bottom:10px" onclick="saveQuiz('draft')">💾 Save as Draft</button>
          <button class="btn btn-success w-full" style="margin-bottom:10px" onclick="saveQuiz('published')">🚀 Publish</button>
          <button class="btn btn-secondary w-full" onclick="navigate('quizzes')">✕ Cancel</button>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:12px;color:var(--text2);margin-bottom:8px">SUMMARY</div>
            <div style="font-size:13px;display:flex;flex-direction:column;gap:6px">
              <div>Questions: <strong id="sum-q">${q.questions.length}</strong></div>
              <div>Total Points: <strong id="sum-pts">${q.questions.reduce((a,qq)=>a+qq.points,0)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Store questions in memory
  window._questions = q.questions.map(qq => ({...qq}));
}

function addQuestion() {
  const newQ = { id: DB.genId('qq'), type: 'multiple_choice', text: '', points: 5, options: ['', '', '', ''], answer: 0 };
  window._questions = window._questions || [];
  window._questions.push(newQ);
  const container = document.getElementById('questions-container');
  const noMsg = document.getElementById('no-q-msg');
  if (noMsg) noMsg.remove();
  container.insertAdjacentHTML('beforeend', buildQuestionHTML(newQ, window._questions.length - 1));
  updateQuestionCount();
}

function buildQuestionHTML(qq, i) {
  const letters = ['A','B','C','D'];
  return `
  <div class="question-builder-item" id="qb-${qq.id}">
    <div class="question-builder-header">
      <span class="q-num">Question ${i+1}</span>
      <div style="display:flex;gap:6px">
        <select class="form-control" style="width:auto;padding:4px 8px;font-size:12px" onchange="changeQType('${qq.id}',this.value)">
          <option value="multiple_choice" ${qq.type==='multiple_choice'?'selected':''}>Multiple Choice</option>
          <option value="true_false" ${qq.type==='true_false'?'selected':''}>True/False</option>
          <option value="identification" ${qq.type==='identification'?'selected':''}>Identification</option>
        </select>
        <button class="btn-icon" onclick="removeQuestion('${qq.id}')">🗑️</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Question Text</label>
      <textarea class="form-control" oninput="updateQField('${qq.id}','text',this.value)" placeholder="Enter question...">${qq.text}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Points</label>
      <input class="form-control" type="number" value="${qq.points}" min="1" oninput="updateQField('${qq.id}','points',+this.value)" style="max-width:100px">
    </div>
    <div id="qb-options-${qq.id}">
      ${buildOptionsHTML(qq)}
    </div>
  </div>`;
}

function buildOptionsHTML(qq) {
  const letters = ['A','B','C','D'];
  if (qq.type === 'identification') {
    return `<div class="form-group"><label class="form-label">Correct Answer</label>
      <input class="form-control" value="${qq.answer||''}" oninput="updateQField('${qq.id}','answer',this.value.toLowerCase().trim())" placeholder="Type the correct answer...">
    </div>`;
  }
  if (qq.type === 'true_false') {
    return `<div class="form-group"><label class="form-label">Correct Answer</label>
      <select class="form-control" style="max-width:200px" onchange="updateQField('${qq.id}','answer',+this.value)">
        <option value="0" ${qq.answer===0?'selected':''}>True</option>
        <option value="1" ${qq.answer===1?'selected':''}>False</option>
      </select></div>`;
  }
  const opts = qq.options || ['','','',''];
  return `<div class="form-group"><label class="form-label">Options (select correct answer)</label>
    ${opts.map((opt, i) => `
    <div class="option-row">
      <input type="radio" name="ans-${qq.id}" value="${i}" ${qq.answer===i?'checked':''} onchange="updateQField('${qq.id}','answer',${i})">
      <span style="font-size:12px;font-weight:700;width:20px">${letters[i]}</span>
      <input class="form-control" value="${opt}" placeholder="Option ${letters[i]}" oninput="updateQOption('${qq.id}',${i},this.value)">
    </div>`).join('')}
  </div>`;
}

function changeQType(qid, type) {
  const q = window._questions.find(q => q.id === qid);
  if (!q) return;
  q.type = type;
  if (type === 'multiple_choice') { q.options = ['','','','']; q.answer = 0; }
  else if (type === 'true_false') { q.options = ['True','False']; q.answer = 0; }
  else { q.answer = ''; delete q.options; }
  document.getElementById(`qb-options-${qid}`).innerHTML = buildOptionsHTML(q);
}

function updateQField(qid, field, value) {
  const q = window._questions?.find(q => q.id === qid);
  if (q) { q[field] = value; updateQuestionCount(); }
}

function updateQOption(qid, idx, value) {
  const q = window._questions?.find(q => q.id === qid);
  if (q && q.options) { q.options[idx] = value; }
}

function removeQuestion(qid) {
  window._questions = window._questions.filter(q => q.id !== qid);
  document.getElementById(`qb-${qid}`)?.remove();
  updateQuestionCount();
  // Renumber
  document.querySelectorAll('.question-builder-item .q-num').forEach((el, i) => el.textContent = `Question ${i+1}`);
}

function updateQuestionCount() {
  const count = window._questions?.length || 0;
  const pts = window._questions?.reduce((a, q) => a + (q.points || 0), 0) || 0;
  document.getElementById('q-count').textContent = count;
  document.getElementById('sum-q').textContent = count;
  document.getElementById('sum-pts').textContent = pts;
}

function saveQuiz(statusOverride) {
  const user = DB.currentUser();
  const id = document.getElementById('cq-id').value;
  const title = document.getElementById('cq-title').value.trim();
  const description = document.getElementById('cq-desc').value.trim();
  const subject = document.getElementById('cq-subject').value.trim();
  const type = document.getElementById('cq-type').value;
  const timeLimit = parseInt(document.getElementById('cq-time').value) || 30;
  const passingScore = parseInt(document.getElementById('cq-passing').value) || 70;
  const section = document.getElementById('cq-section').value.trim();
  const status = statusOverride || document.getElementById('cq-status').value;

  if (!title) { toast('Title is required.', 'error'); return; }
  if (!window._questions || window._questions.length === 0) { toast('Add at least one question.', 'error'); return; }

  // Validate questions
  for (const q of window._questions) {
    if (!q.text.trim()) { toast('All questions must have text.', 'error'); return; }
    if (q.type === 'multiple_choice' && q.options.some(o => !o.trim())) { toast('All options must be filled.', 'error'); return; }
  }

  const existing = id ? DB.getQuizById(id) : null;
  const quiz = {
    id: id || DB.genId('q'),
    title, description, subject, type, timeLimit, passingScore, section, status,
    teacherId: user.id,
    teacherName: user.name,
    createdAt: existing?.createdAt || new Date().toISOString(),
    questions: window._questions
  };
  DB.saveQuiz(quiz);
  window._questions = [];
  navigate('quizzes');
  toast(`Quiz ${id ? 'updated' : 'created'} and ${status}!`, 'success');
}

// =============================================
// TAKE QUIZ
// =============================================
function confirmTakeQuiz(quizId) {
  const q = DB.getQuizById(quizId);
  if (!q) return;
  const totalPts = q.questions.reduce((a, qq) => a + qq.points, 0);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'confirm-quiz-modal';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><span class="modal-title">Ready to Start?</span></div>
      <div class="modal-body" style="text-align:center;padding:32px 24px">
        <div style="font-size:48px;margin-bottom:16px">${q.type==='exam'?'📜':'📝'}</div>
        <h3 style="font-size:22px;margin-bottom:8px">${q.title}</h3>
        <p style="color:var(--text2);margin-bottom:24px">${q.description}</p>
        <div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px">
          <div style="text-align:center"><div style="font-size:22px;font-weight:800">${q.questions.length}</div><div style="font-size:12px;color:var(--text2)">Questions</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800">${q.timeLimit}m</div><div style="font-size:12px;color:var(--text2)">Time Limit</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800">${totalPts}</div><div style="font-size:12px;color:var(--text2)">Total Pts</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800">${q.passingScore}%</div><div style="font-size:12px;color:var(--text2)">Passing</div></div>
        </div>
        <p style="font-size:13px;color:var(--warning)">⚠️ Once started, the timer cannot be paused.</p>
      </div>
      <div class="modal-footer" style="justify-content:center;gap:16px">
        <button class="btn btn-secondary" onclick="document.getElementById('confirm-quiz-modal').remove()">Cancel</button>
        <button class="btn btn-primary btn-lg" onclick="document.getElementById('confirm-quiz-modal').remove();navigate('take-quiz',{quizId:'${quizId}'})">▶️ Start Now</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function renderTakeQuiz(quizId, body) {
  currentQuiz = DB.getQuizById(quizId);
  if (!currentQuiz) { body.innerHTML = '<div class="empty-state"><h3>Quiz not found</h3></div>'; return; }
  studentAnswers = {};
  quizTimeRemaining = currentQuiz.timeLimit * 60;

  body.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <div class="quiz-timer" id="quiz-timer">
        <div class="timer-label">Time Left</div>
        <div class="timer-value" id="timer-display">--:--</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-right:120px">
        <div>
          <h2 style="font-size:20px;font-weight:800">${currentQuiz.title}</h2>
          <p style="font-size:13px;color:var(--text2)">${currentQuiz.questions.length} questions · ${currentQuiz.questions.reduce((a,q)=>a+q.points,0)} total points</p>
        </div>
        <div id="q-progress" style="font-size:13px;color:var(--text2)">0 / ${currentQuiz.questions.length} answered</div>
      </div>
      <div id="quiz-questions">
        ${currentQuiz.questions.map((q, i) => renderQuestion(q, i)).join('')}
      </div>
      <div style="text-align:center;padding:20px;padding-right:120px">
        <button class="btn btn-success btn-lg" onclick="submitQuiz()">✅ Submit Answers</button>
      </div>
    </div>
  `;
  startTimer();
}

function renderQuestion(q, i) {
  const letters = ['A','B','C','D'];
  const opts = q.type === 'true_false' ? ['True','False'] : q.options;
  return `
  <div class="quiz-question-card" id="qq-card-${q.id}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="question-number">Question ${i+1}</div>
      <span class="question-points">${q.points} pts</span>
    </div>
    <div class="question-text">${q.text}</div>
    ${q.type === 'identification'
      ? `<input class="form-control" id="ans-${q.id}" placeholder="Type your answer here..." oninput="recordAnswer('${q.id}',this.value.toLowerCase().trim())">`
      : `<div>${opts.map((opt, oi) => `
        <div class="option-item" id="opt-${q.id}-${oi}" onclick="selectOption('${q.id}',${oi})">
          <div class="option-letter">${q.type==='true_false'?(oi===0?'T':'F'):letters[oi]}</div>
          <span>${opt}</span>
        </div>`).join('')}</div>`
    }
  </div>`;
}

function selectOption(qid, optIdx) {
  // Deselect all
  document.querySelectorAll(`[id^="opt-${qid}-"]`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${qid}-${optIdx}`)?.classList.add('selected');
  recordAnswer(qid, optIdx);
}

function recordAnswer(qid, value) {
  studentAnswers[qid] = value;
  const answered = Object.keys(studentAnswers).length;
  document.getElementById('q-progress').textContent = `${answered} / ${currentQuiz.questions.length} answered`;
}

function startTimer() {
  updateTimerDisplay();
  quizTimerInterval = setInterval(() => {
    quizTimeRemaining--;
    updateTimerDisplay();
    if (quizTimeRemaining <= 0) {
      clearInterval(quizTimerInterval);
      toast('Time is up! Auto-submitting...', 'warning');
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(quizTimeRemaining / 60);
  const s = quizTimeRemaining % 60;
  const el = document.getElementById('timer-display');
  if (!el) return;
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.className = 'timer-value';
  if (quizTimeRemaining <= 300) el.classList.add('warning');
  if (quizTimeRemaining <= 60) el.classList.replace('warning','danger');
}

function submitQuiz() {
  if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }
  const user = DB.currentUser();
  const unanswered = currentQuiz.questions.filter(q => studentAnswers[q.id] === undefined).length;
  if (unanswered > 0) {
    if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  }

  let score = 0;
  currentQuiz.questions.forEach(q => {
    const userAns = studentAnswers[q.id];
    if (userAns === undefined) return;
    if (q.type === 'identification') {
      if (String(userAns).toLowerCase().trim() === String(q.answer).toLowerCase().trim()) score += q.points;
    } else {
      if (+userAns === +q.answer) score += q.points;
    }
  });

  const totalPts = currentQuiz.questions.reduce((a, q) => a + q.points, 0);
  const percentage = Math.round(score / totalPts * 100);
  const passed = percentage >= currentQuiz.passingScore;
  const timeTaken = currentQuiz.timeLimit * 60 - quizTimeRemaining;

  const result = {
    id: DB.genId('r'),
    quizId: currentQuiz.id,
    quizTitle: currentQuiz.title,
    studentId: user.id,
    studentName: user.name,
    score, totalPoints: totalPts, percentage, passed,
    timeTaken: Math.round(timeTaken / 60),
    submittedAt: new Date().toISOString(),
    answers: {...studentAnswers},
    quiz: currentQuiz
  };
  DB.saveResult(result);
  navigate('quiz-result', { result });
}

// =============================================
// QUIZ RESULT
// =============================================
function renderQuizResult(result, body) {
  const quiz = result.quiz || DB.getQuizById(result.quizId);
  body.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <div class="card" style="text-align:center;margin-bottom:20px">
        <div class="result-circle ${result.passed?'pass':'fail'}">
          <span>${result.percentage}%</span>
          <span>${result.passed?'PASSED':'FAILED'}</span>
        </div>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:8px">${result.quizTitle}</h2>
        <p style="color:var(--text2);margin-bottom:20px">${result.passed?'🎉 Congratulations! You passed!':'😔 You did not meet the passing score.'}</p>
        <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-bottom:20px">
          <div><div style="font-size:24px;font-weight:800;color:var(--primary-light)">${result.score}/${result.totalPoints}</div><div style="font-size:12px;color:var(--text2)">Score</div></div>
          <div><div style="font-size:24px;font-weight:800;color:var(--secondary)">${quiz?.passingScore||70}%</div><div style="font-size:12px;color:var(--text2)">Passing Score</div></div>
          <div><div style="font-size:24px;font-weight:800;color:var(--warning)">${result.timeTaken}m</div><div style="font-size:12px;color:var(--text2)">Time Taken</div></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="navigate('quizzes')">📋 Back to Quizzes</button>
          <button class="btn btn-secondary" onclick="navigate('results')">📊 My Results</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">📝 Answer Review</span></div>
        ${(quiz?.questions||[]).map((q, i) => {
          const userAns = result.answers[q.id];
          let isCorrect = false;
          if (q.type === 'identification') {
            isCorrect = String(userAns||'').toLowerCase().trim() === String(q.answer).toLowerCase().trim();
          } else {
            isCorrect = +userAns === +q.answer;
          }
          const letters = ['A','B','C','D'];
          const opts = q.type === 'true_false' ? ['True','False'] : q.options;
          return `
          <div class="quiz-question-card ${isCorrect?'review-correct':'review-wrong'}" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <span class="question-number">Q${i+1}</span>
              <span class="review-badge ${isCorrect?'correct':'wrong'}">${isCorrect?'✅ Correct':'❌ Wrong'} (+${isCorrect?q.points:0}/${q.points})</span>
            </div>
            <div class="question-text" style="font-size:15px">${q.text}</div>
            ${q.type === 'identification'
              ? `<div style="font-size:13px">Your answer: <strong>${userAns||'(blank)'}</strong> ${!isCorrect?`· Correct: <strong style="color:var(--success)">${q.answer}</strong>`:''}</div>`
              : opts.map((opt, oi) => {
                  let cls = '';
                  if (oi === +q.answer) cls = 'correct';
                  else if (oi === +userAns && !isCorrect) cls = 'wrong';
                  return `<div class="option-item ${cls}" style="cursor:default;margin-bottom:6px">
                    <div class="option-letter">${q.type==='true_false'?(oi===0?'T':'F'):letters[oi]}</div>
                    <span>${opt}</span>
                    ${oi===+q.answer?`<span style="margin-left:auto;font-size:12px;color:var(--success)">✓ Correct</span>`:''}
                    ${oi===+userAns&&!isCorrect?`<span style="margin-left:auto;font-size:12px;color:var(--danger)">✗ Your answer</span>`:''}
                  </div>`;
                }).join('')
            }
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// =============================================
// RESULTS
// =============================================
function renderResults(user, body) {
  const allResults = user.role === 'student'
    ? DB.getResultsByStudent(user.id)
    : user.role === 'teacher'
    ? DB.getResults().filter(r => DB.getQuizzes().filter(q => q.teacherId === user.id).some(q => q.id === r.quizId))
    : DB.getResults();

  body.innerHTML = `
    <div class="page-header"><div><h2>${user.role==='student'?'My Results':'All Results'}</h2><p>${allResults.length} total submissions</p></div></div>
    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead><tr>
            ${user.role!=='student'?'<th>Student</th>':''}
            <th>Quiz/Exam</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Status</th>
            <th>Time</th>
            <th>Date</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${allResults.length === 0
              ? `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text2)">No results yet.</td></tr>`
              : allResults.sort((a,b) => new Date(b.submittedAt)-new Date(a.submittedAt)).map(r => `
              <tr>
                ${user.role!=='student'?`<td><strong>${r.studentName}</strong></td>`:''}
                <td>${r.quizTitle}</td>
                <td><strong>${r.score}/${r.totalPoints}</strong></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="width:80px">
                      <div class="progress-fill" style="width:${r.percentage}%;background:${r.passed?'var(--success)':'var(--danger)'}"></div>
                    </div>
                    <span style="font-size:13px">${r.percentage}%</span>
                  </div>
                </td>
                <td><span class="badge ${r.passed?'badge-success':'badge-danger'}">${r.passed?'Passed':'Failed'}</span></td>
                <td style="color:var(--text2)">${r.timeTaken}m</td>
                <td style="color:var(--text2);font-size:12px">${new Date(r.submittedAt).toLocaleDateString()}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="viewResultDetail('${r.id}')">👁 View</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function viewResultDetail(resultId) {
  const result = DB.getResults().find(r => r.id === resultId);
  if (!result) return;
  const quiz = DB.getQuizById(result.quizId);
  result.quiz = quiz;
  navigate('quiz-result', { result });
}

// =============================================
// REPORTS (Admin)
// =============================================
function renderReports(body) {
  const results = DB.getResults();
  const quizzes = DB.getQuizzes();
  const users = DB.getUsers();

  const passRate = results.length ? Math.round(results.filter(r=>r.passed).length/results.length*100) : 0;
  const avgScore = results.length ? Math.round(results.reduce((a,r)=>a+r.percentage,0)/results.length) : 0;

  // Per-quiz stats
  const quizStats = quizzes.map(q => {
    const qResults = results.filter(r => r.quizId === q.id);
    const avg = qResults.length ? Math.round(qResults.reduce((a,r)=>a+r.percentage,0)/qResults.length) : 0;
    const pass = qResults.filter(r=>r.passed).length;
    return { ...q, attempts: qResults.length, avg, pass };
  }).filter(q => q.attempts > 0);

  body.innerHTML = `
    <div class="page-header"><div><h2>Analytics & Reports</h2><p>System-wide performance overview</p></div></div>
    <div class="stats-grid">
      <div class="stat-card blue"><div class="stat-icon">📊</div><div class="stat-value">${results.length}</div><div class="stat-label">Total Submissions</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${passRate}%</div><div class="stat-label">Pass Rate</div></div>
      <div class="stat-card cyan"><div class="stat-icon">⭐</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Average Score</div></div>
      <div class="stat-card orange"><div class="stat-icon">👥</div><div class="stat-value">${users.filter(u=>u.role==='student').length}</div><div class="stat-label">Students</div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">📋 Quiz Performance Summary</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Quiz/Exam</th><th>Teacher</th><th>Attempts</th><th>Avg Score</th><th>Passed</th><th>Pass Rate</th></tr></thead>
          <tbody>
            ${quizStats.length === 0
              ? `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text2)">No submissions yet.</td></tr>`
              : quizStats.map(q => `
              <tr>
                <td><strong>${q.title}</strong> <span class="badge badge-${q.type==='exam'?'warning':'secondary'}">${q.type}</span></td>
                <td style="color:var(--text2)">${q.teacherName}</td>
                <td>${q.attempts}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${q.avg}%;background:var(--primary)"></div></div>
                    <span>${q.avg}%</span>
                  </div>
                </td>
                <td>${q.pass}/${q.attempts}</td>
                <td><span class="badge ${q.attempts>0&&q.pass/q.attempts>=0.7?'badge-success':'badge-danger'}">${q.attempts?Math.round(q.pass/q.attempts*100):0}%</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
