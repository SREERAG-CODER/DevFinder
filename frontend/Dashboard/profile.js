const API   = 'http://127.0.0.1:5000/api';
const token = localStorage.getItem('token');
let   user  = JSON.parse(localStorage.getItem('user') || 'null');

// ── Auth guard ───────────────────────────────────────────
if (!token || !user) window.location.href = '../Authentication/login.html';

// ── Sidebar ──────────────────────────────────────────────
let sidebarOpen = true;
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sb  = document.getElementById('sidebar');
  const btn = document.getElementById('collapse-btn');
  const ico = document.getElementById('collapse-icon');
  const bg  = document.querySelector('.bg-wrap');
  sb.classList.toggle('collapsed', !sidebarOpen);
  btn.style.left           = sidebarOpen ? '270px' : '0px';
  ico.style.transform      = sidebarOpen ? '' : 'rotate(180deg)';
  bg.style.left            = sidebarOpen ? '270px' : '0px';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../Authentication/login.html';
}

// ── Toast ────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Load profile from DB ─────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Merge fresh DB data into user
    user = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(user));
    renderProfile();
  } catch (err) {
    // Fallback to localStorage if API fails
    renderProfile();
  }
}

// ── Render profile data ──────────────────────────────────
function renderProfile() {
  const name   = user.name      || '';
  const email  = user.email     || '';
  const bio    = user.bio       || '';
  const github = user.github_url   || '';
  const linkedin = user.linkedin_url || '';
  const skills = Array.isArray(user.skills) ? user.skills : [];

  // Sidebar + header
  document.getElementById('sidebar-name').textContent = name.toUpperCase();
  document.getElementById('p-name').textContent       = name;
  document.getElementById('p-email').textContent      = email;

  // Avatar initials
  const avatar = document.getElementById('big-avatar');
  if (!avatar.querySelector('img')) {
    avatar.textContent = name.charAt(0).toUpperCase() || '?';
  }

  // Member since
  if (user.created_at) {
    const d = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('p-since').textContent = `Member since ${d}`;
  }

  // View mode fields
  document.getElementById('v-name').textContent = name || '—';
  document.getElementById('v-bio').textContent  = bio  || 'No bio added yet.';
  document.getElementById('v-bio').className    = 'vr-val' + (bio ? '' : ' empty');

  // Skills view
  const vs = document.getElementById('v-skills');
  vs.innerHTML = skills.length
    ? skills.map(s => `<div class="skill-chip view-chip"><span>${s}</span></div>`).join('')
    : `<span style="font-size:13px;color:#ccc;font-style:italic">No skills added yet.</span>`;

  // Links
  const gh = document.getElementById('p-github');
  gh.textContent = github || 'Not added';
  gh.href        = github || '#';
  gh.className   = 'link-val' + (github ? '' : ' empty');

  const li = document.getElementById('p-linkedin');
  li.textContent = linkedin || 'Not added';
  li.href        = linkedin || '#';
  li.className   = 'link-val' + (linkedin ? '' : ' empty');

  // Prefill edit fields
  document.getElementById('e-name').value    = name;
  document.getElementById('e-bio').value     = bio;
  document.getElementById('e-github').value  = github;
  document.getElementById('e-linkedin').value = linkedin;

  // Skills in edit mode
  editSkills = [...skills];
  renderEditSkills();

  // Hosted teams (from localStorage for now)
  renderHosted();
}

// ── Edit toggle ──────────────────────────────────────────
let editing = false;
function toggleEdit() {
  editing = !editing;
  document.getElementById('view-mode').classList.toggle('hide', editing);
  document.getElementById('edit-mode').classList.toggle('show', editing);
  const btn   = document.getElementById('edit-toggle-btn');
  const icon  = document.getElementById('edit-btn-icon');
  const label = document.getElementById('edit-btn-label');
  btn.classList.toggle('active', editing);
  icon.className  = editing ? 'fa-solid fa-xmark' : 'fa-solid fa-pen';
  label.textContent = editing ? 'CANCEL EDIT' : 'EDIT PROFILE';
}

function cancelEdit() {
  editing = true;
  toggleEdit();
  document.getElementById('save-error').style.display = 'none';
  // Reset edit skills to current user skills
  editSkills = Array.isArray(user.skills) ? [...user.skills] : [];
  renderEditSkills();
}

// ── Skills chip system ───────────────────────────────────
let editSkills = [];

function renderEditSkills() {
  const wrap = document.getElementById('e-skills');
  wrap.innerHTML = editSkills.map((s, i) => `
    <div class="skill-chip">
      <span>${s}</span>
      <button onclick="removeSkill(${i})" title="Remove">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`).join('');
}

function addSkill() {
  const input = document.getElementById('skill-input');
  const val   = input.value.trim();
  if (!val) return;
  // Support comma-separated entry
  val.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
    if (!editSkills.includes(s)) editSkills.push(s);
  });
  input.value = '';
  renderEditSkills();
}

function removeSkill(i) {
  editSkills.splice(i, 1);
  renderEditSkills();
}

function skillKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
}

// ── Save profile ─────────────────────────────────────────
async function saveProfile() {
  const name     = document.getElementById('e-name').value.trim();
  const bio      = document.getElementById('e-bio').value.trim();
  const github   = document.getElementById('e-github').value.trim();
  const linkedin = document.getElementById('e-linkedin').value.trim();
  const errEl    = document.getElementById('save-error');
  errEl.style.display = 'none';

  if (!name) {
    errEl.textContent = 'Name cannot be empty';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res  = await fetch(`${API}/users/profile`, {
      method : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization : `Bearer ${token}`
      },
      body: JSON.stringify({ name, bio, skills: editSkills, github_url: github, linkedin_url: linkedin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update local state and UI
    user = data;
    localStorage.setItem('user', JSON.stringify(user));

    renderProfile();
    cancelEdit();
    showToast('Profile updated successfully!');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ── Avatar upload ────────────────────────────────────────
document.getElementById('avatar-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const avatar = document.getElementById('big-avatar');
    avatar.innerHTML = `<img src="${ev.target.result}" alt="avatar">`;
    // Store in localStorage as base64 (replace with real upload later)
    localStorage.setItem('avatar', ev.target.result);
    showToast('Profile photo updated!');
  };
  reader.readAsDataURL(file);
});

// Load saved avatar
const savedAvatar = localStorage.getItem('avatar');
if (savedAvatar) {
  document.getElementById('big-avatar').innerHTML = `<img src="${savedAvatar}" alt="avatar">`;
}

// ── Hosted teams ─────────────────────────────────────────
async function renderHosted() {
  const grid = document.getElementById('hosted-grid');
  
  try {
    // Fetch teams created by the user from the backend
    const res = await fetch(`${API}/teams`);
    const allTeams = await res.json();
    if (!res.ok) throw new Error(allTeams.error);

    // Filter teams created by the current user
    const hosted = allTeams.filter(t => t.created_by === user.id);

    if (!hosted.length) {
      grid.innerHTML = `
        <div class="empty-hosted">
          <i class="fa-solid fa-layer-group"></i>
          No hosted teams yet
        </div>`;
      return;
    }

    grid.innerHTML = hosted.map(t => `
      <div class="hosted-card">
        <div class="hosted-icon"><i class="fa-solid fa-trophy"></i></div>
        <div class="hosted-info">
          <div class="hosted-name">${t.name}</div>
          <div class="hosted-meta">${(t.roles || []).join(' · ')} · Deadline ${t.deadline || 'TBD'}</div>
        </div>
        <button class="view-applicants-btn" onclick="viewApplicants(${t.id}, '${t.name.replace(/'/g, "\\'")}')">
          VIEW APPLICANTS
        </button>
      </div>`).join('');
  } catch (err) {
    console.error("Failed to load hosted teams:", err);
    grid.innerHTML = `<div class="empty-hosted">Error loading teams</div>`;
  }
}

// ── Applicant Management ─────────────────────────────────
function closeApplicantsModal() {
  document.getElementById('applicants-modal').classList.remove('open');
}

async function viewApplicants(teamId, teamName) {
  document.getElementById('m-team-name').textContent = `APPLICANTS: ${teamName}`;
  const list = document.getElementById('applicant-list');
  list.innerHTML = '<div class="empty-hosted">Loading...</div>';
  document.getElementById('applicants-modal').classList.add('open');

  try {
    const res = await fetch(`${API}/applications/team/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.length) {
      list.innerHTML = '<div class="empty-hosted">No applicants yet</div>';
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="applicant-card">
        <div class="applicant-head">
          <div>
            <div class="applicant-name">${a.applicant_name}</div>
            <div class="profile-email">${a.applicant_email}</div>
          </div>
          <div class="applicant-role-badge">${a.role}</div>
        </div>
        <div class="applicant-msg">${a.message || 'No message provided.'}</div>
        <div class="applicant-actions" id="actions-${a.id}">
          ${a.status === 'pending' ? `
            <button class="action-btn accept-btn" onclick="updateAppStatus(${a.id}, 'accepted')">ACCEPT</button>
            <button class="action-btn reject-btn" onclick="updateAppStatus(${a.id}, 'rejected')">REJECT</button>
          ` : `
            <div class="status-badge status-${a.status}">${a.status.toUpperCase()}</div>
          `}
        </div>
      </div>`).join('');

  } catch (err) {
    list.innerHTML = `<div class="empty-hosted">Error: ${err.message}</div>`;
  }
}

async function updateAppStatus(appId, status) {
  const container = document.getElementById(`actions-${appId}`);
  const oldContent = container.innerHTML;
  container.innerHTML = '<div class="profile-email">Updating...</div>';

  try {
    const res = await fetch(`${API}/applications/${appId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    container.innerHTML = `<div class="status-badge status-${status}">${status.toUpperCase()}</div>`;
    showToast(`Application ${status}!`);
  } catch (err) {
    container.innerHTML = oldContent;
    showToast('Error: ' + err.message);
  }
}

// ── Init ─────────────────────────────────────────────────
loadProfile();