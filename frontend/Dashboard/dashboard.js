const API   = 'http://127.0.0.1:5000/api';
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');

// ── Auth guard ───────────────────────────────────────────
if (!token || !user) window.location.href = '../Authentication/login.html';

// ── Set username in sidebar ──────────────────────────────
if (user) document.getElementById('sidebar-name').textContent = user.name.toUpperCase();

// ── Sidebar toggle ───────────────────────────────────────
let sidebarOpen = true;

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sb   = document.getElementById('sidebar');
  const btn  = document.getElementById('collapse-btn');
  const icon = document.getElementById('collapse-icon');
  const bg   = document.querySelector('.bg-wrap');

  sb.classList.toggle('collapsed', !sidebarOpen);
  btn.style.left   = sidebarOpen ? '270px' : '0px';
  icon.style.transform = sidebarOpen ? '' : 'rotate(180deg)';
  bg.style.left    = sidebarOpen ? '270px' : '0px';
}

function setActive(el, type = 'all') {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  
  if (type === 'all') {
    renderCards(allTeams);
  } else if (type === 'hosted') {
    renderCards(allTeams.filter(t => t.created_by === user.id));
  } else if (type === 'joined') {
    // This would require a joined_teams fetch, for now showing empty
    renderCards([]);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../Authentication/login.html';
}

// ── Cards ────────────────────────────────────────────────
const dotClass = ['dot-r', 'dot-y', 'dot-g'];
let allTeams = [];

function formatDate(d) {
  if (!d) return 'TBD';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).toUpperCase();
}

function renderCards(teams) {
  const row = document.getElementById('cards-row');
  if (!teams.length) {
    row.innerHTML = `<p style="font-size:14px;font-weight:600;color:rgba(0,0,0,0.4);margin-top:8px">
      No teams yet. Click <strong>+ HOST TEAM</strong> to create one.</p>`;
    return;
  }
  row.innerHTML = teams.map(t => `
    <div class="team-card">
      <div class="card-top">
        <div>
          <div class="card-name">${t.name}</div>
          <div class="card-by">By ${t.by || t.creator_name || 'Unknown'}</div>
        </div>
        <div class="card-avatar"><i class="fa-solid fa-user"></i></div>
      </div>
      <div class="card-roles">
        ${(t.roles || []).slice(0, 3).map((r, i) => `
          <div class="role-row">
            <span class="dot ${dotClass[i % 3]}"></span>${r}
          </div>`).join('')}
      </div>
      <div class="card-foot">
        <div class="slot-circle">${t.slots || t.team_size || 4}</div>
        <div class="dl-badge">
          <div class="dl-label">Deadline</div>
          <div class="dl-date">${formatDate(t.deadline)}</div>
        </div>
        <button class="apply-btn" onclick="openApplyModal(${t.id}, '${t.name.replace(/'/g, "\\'")}', ${JSON.stringify(t.roles).replace(/"/g, '&quot;')})">
          APPLY <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>`).join('');
}

// ── API Integration ──────────────────────────────────────
async function fetchTeams() {
  try {
    const res = await fetch(`${API}/teams`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    allTeams = data;
    renderCards(allTeams);
  } catch (err) {
    console.error("Failed to fetch teams:", err);
  }
}

fetchTeams();

// ── Search ───────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderCards(allTeams.filter(t =>
    t.name.toLowerCase().includes(q) || (t.by || '').toLowerCase().includes(q)
  ));
});

// ── Modal ────────────────────────────────────────────────
function openModal()  { document.getElementById('modal').classList.add('open') }
function closeModal() { document.getElementById('modal').classList.remove('open') }

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

document.getElementById('apply-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('apply-modal')) closeApplyModal();
});

let currentApplyTeamId = null;

function openApplyModal(teamId, teamName, roles) {
  currentApplyTeamId = teamId;
  const modal = document.getElementById('apply-modal');
  const roleSelect = document.getElementById('a-role');
  
  // Fill roles
  roleSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
  if (!roles.length) roleSelect.innerHTML = '<option value="General">General Member</option>';

  modal.querySelector('.modal-title').textContent = `APPLY FOR: ${teamName}`;
  modal.classList.add('open');
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.remove('open');
  document.getElementById('apply-modal-error').style.display = 'none';
  document.getElementById('a-message').value = '';
}

function submitApply() {
  const role    = document.getElementById('a-role').value;
  const message = document.getElementById('a-message').value.trim();
  const btn     = document.getElementById('apply-submit-btn');
  const errorEl = document.getElementById('apply-modal-error');

  errorEl.style.display = 'none';
  if (!message) {
    errorEl.textContent = 'Please add a short message or portfolio link';
    errorEl.style.display = 'block';
    return;
  }

  const oldText = btn.textContent;
  btn.textContent = 'SUBMITTING...';
  btn.disabled = true;

  fetch(`${API}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      team_id: currentApplyTeamId,
      role: role,
      message: message
    })
  })
  .then(res => res.json().then(data => ({ ok: res.ok, data })))
  .then(({ ok, data }) => {
    if (!ok) throw new Error(data.error || 'Failed to submit application');
    
    alert('Application submitted successfully! ✅');
    closeApplyModal();
  })
  .catch(err => {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  })
  .finally(() => {
    btn.textContent = oldText;
    btn.disabled = false;
  });
}

function addRole() {
  const builder = document.getElementById('roles-builder');
  const row = document.createElement('div');
  row.className = 'role-input-row';
  row.innerHTML = `
    <input type="text" placeholder="e.g. Backend Developer">
    <button onclick="removeRole(this)"><i class="fa-solid fa-minus"></i></button>`;
  builder.appendChild(row);
}

function removeRole(btn) {
  if (document.querySelectorAll('.role-input-row').length > 1)
    btn.parentElement.remove();
}

function showModalError(msg) {
  const el = document.getElementById('modal-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function submitHost() {
  const name     = document.getElementById('f-name').value.trim();
  const by       = document.getElementById('f-by').value.trim();
  const size     = document.getElementById('f-size').value;
  const deadline = document.getElementById('f-deadline').value;
  const roles    = [...document.querySelectorAll('.role-input-row input')]
                     .map(i => i.value.trim()).filter(Boolean);

  document.getElementById('modal-error').style.display = 'none';
  if (!name)         return showModalError('Team name is required');
  if (!by)           return showModalError('Hosted by is required');
  if (!roles.length) return showModalError('Add at least one role');

  const desc     = document.getElementById('f-desc').value.trim();
  const tech     = document.getElementById('f-tech').value.trim().split(',').map(s => s.trim()).filter(Boolean);

  const btn = document.querySelector('#modal .submit-btn');
  const oldText = btn.textContent;
  btn.textContent = 'HOSTING...';
  btn.disabled = true;

  fetch(`${API}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: name.toUpperCase(),
      hosted_by: by,
      description: desc,
      tech_stack: tech,
      roles: roles,
      team_size: size,
      deadline: deadline
    })
  })
  .then(res => res.json().then(data => ({ ok: res.ok, data })))
  .then(({ ok, data }) => {
    if (!ok) throw new Error(data.error || 'Failed to host team');
    
    allTeams.unshift(data);
    renderCards(allTeams);
    closeModal();
    
    // Reset form
    ['f-name','f-by','f-desc','f-tech','f-deadline'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-size').value = '4';
    document.getElementById('roles-builder').innerHTML = `
      <div class="role-input-row">
        <input type="text" placeholder="e.g. UI/UX Designer">
        <button onclick="removeRole(this)"><i class="fa-solid fa-minus"></i></button>
      </div>`;
  })
  .catch(err => {
    showModalError(err.message);
  })
  .finally(() => {
    btn.textContent = oldText;
    btn.disabled = false;
  });
}