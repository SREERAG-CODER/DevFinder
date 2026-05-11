const API   = 'http://127.0.0.1:5000/api';
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');
const socket = io('http://127.0.0.1:5000');

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
    renderHostedCards(allTeams.filter(t => t.created_by === user.id));
  } else if (type === 'joined') {
    fetchMyTeams();
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

function renderHostedCards(teams) {
  const row = document.getElementById('cards-row');
  if (!teams.length) {
    row.innerHTML = `<p style="font-size:14px;font-weight:600;color:rgba(0,0,0,0.4);margin-top:8px">
      You haven't hosted any teams yet.</p>`;
    return;
  }
  row.innerHTML = teams.map(t => `
    <div class="team-card">
      <div class="card-top">
        <div>
          <div class="card-name">${t.name}</div>
          <div class="card-by">Slots: ${t.team_size || 4}</div>
        </div>
        <div class="card-avatar"><i class="fa-solid fa-user-tie"></i></div>
      </div>
      <div class="card-roles">
        ${(t.roles || []).slice(0, 3).map((r, i) => `
          <div class="role-row">
            <span class="dot ${dotClass[i % 3]}"></span>${r}
          </div>`).join('')}
      </div>
      <div class="card-foot">
        <div class="dl-badge" style="background:var(--black)">
          <div class="dl-label" style="color:var(--white)">Deadline</div>
          <div class="dl-date" style="color:var(--white)">${formatDate(t.deadline)}</div>
        </div>
        <button class="manage-btn" onclick="openRequestsModal(${t.id})">
          MANAGE <i class="fa-solid fa-list-check"></i>
        </button>
      </div>
    </div>`).join('');
}

function renderMyTeamsCards(teams) {
  const row = document.getElementById('cards-row');
  if (!teams.length) {
    row.innerHTML = `<p style="font-size:14px;font-weight:600;color:rgba(0,0,0,0.4);margin-top:8px">
      You haven't joined any teams yet. Browse the dashboard to find your tribe!</p>`;
    return;
  }
  row.innerHTML = teams.map(t => `
    <div class="team-card my-team-card">
      <div class="card-top">
        <div>
          <div class="card-name">${t.name}</div>
          <div class="card-by">Hosted by ${t.creator_name}</div>
        </div>
        <div class="card-avatar"><i class="fa-solid fa-users-viewfinder"></i></div>
      </div>
      
      <div class="team-roster">
        <div class="roster-label">TEAM ROSTER</div>
        ${t.members.map(m => `
          <div class="member-row" onclick="openUserProfileModal(${m.id})">
            <div class="member-dot"></div>
            <div class="member-name">${m.name}</div>
            <div class="member-role-tag">${m.role_in_team}</div>
          </div>
        `).join('')}
      </div>

      <div class="card-foot" style="margin-top:12px;">
        <div class="dl-badge" style="background:var(--green2);flex:1">
          <div class="dl-label">Project Status</div>
          <div class="dl-date">ACTIVE</div>
        </div>
        <button class="apply-btn" onclick="openChat(${t.id}, '${t.name.replace(/'/g, "\\'")}')" style="background:var(--yellow)">
          CHAT <i class="fa-solid fa-comments"></i>
        </button>
      </div>
    </div>`).join('');
}

async function fetchMyTeams() {
  const row = document.getElementById('cards-row');
  row.innerHTML = '<p style="text-align:center;width:100%;padding:40px;">Loading your squads...</p>';
  try {
    const res = await fetch(`${API}/teams/my-teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    renderMyTeamsCards(data);
  } catch (err) {
    console.error("Failed to fetch my teams:", err);
    row.innerHTML = `<p style="color:var(--red);text-align:center;width:100%">${err.message}</p>`;
  }
}

let currentChatTeamId = null;

function openChat(teamId, teamName) {
  currentChatTeamId = teamId;
  document.getElementById('chat-team-name').textContent = teamName;
  document.getElementById('chat-modal').classList.add('open');
  const container = document.getElementById('chat-messages');
  container.innerHTML = '<p style="text-align:center;padding:20px;font-size:12px;color:#888;">Loading history...</p>';
  
  socket.emit('join_room', teamId);

  // Fetch history
  fetch(`${API}/chat/${teamId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(msgs => {
    container.innerHTML = '';
    msgs.forEach(m => renderMessage(m));
    container.scrollTop = container.scrollHeight;
  })
  .catch(err => {
    console.error("Chat history error:", err);
    container.innerHTML = '<p style="text-align:center;color:var(--red);">Failed to load history.</p>';
  });
}

function renderMessage(data) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  // Handle both snake_case (DB) and camelCase (Socket)
  const senderId = data.sender_id || data.senderId;
  const senderName = data.sender_name || data.senderName;
  const text = data.content || data.message;
  const isMe = String(senderId) === String(user.id);
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${isMe ? 'sent' : 'received'}`;
  msgDiv.innerHTML = `
    <div class="msg-sender">${isMe ? 'YOU' : senderName}</div>
    <div class="msg-text">${text}</div>
  `;
  
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function closeChat() {
  document.getElementById('chat-modal').classList.remove('open');
  currentChatTeamId = null;
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || !currentChatTeamId) return;

  const data = {
    teamId: currentChatTeamId,
    senderId: user.id,
    senderName: user.name,
    message: message
  };

  socket.emit('send_message', data);
  input.value = '';
}

socket.on('receive_message', (data) => {
  console.log("Socket received message:", data);
  // Use loose equality or cast to String to be safe
  if (String(data.teamId) !== String(currentChatTeamId)) {
    console.log("Message ignored: team mismatch", data.teamId, currentChatTeamId);
    return;
  }
  renderMessage(data);
});

// Allow Enter key to send message
document.getElementById('chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

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

// ── Requests Logic ───────────────────────────────────────
function openRequestsModal(teamId) {
  const modal = document.getElementById('requests-modal');
  modal.classList.add('open');
  const container = document.getElementById('requests-list-container');
  container.innerHTML = '<p style="text-align:center;padding:20px;">Loading applications...</p>';

  fetch(`${API}/applications/team/${teamId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(apps => {
    if (!apps.length) {
      container.innerHTML = '<p style="text-align:center;padding:20px;font-size:14px;color:#888;">No applications yet for this team.</p>';
      return;
    }
    container.innerHTML = apps.map(a => `
      <div class="request-item">
        <div class="req-left" onclick="openUserProfileModal(${a.applicant_id})">
          <div class="req-avatar"><i class="fa-solid fa-user"></i></div>
          <div class="req-info">
            <div class="req-name">${a.applicant_name}</div>
            <div class="req-role">${a.role}</div>
            <div class="req-message">"${a.message}"</div>
          </div>
        </div>
        <div class="req-actions">
          ${a.status === 'pending' ? `
            <button class="req-btn accept" onclick="updateAppStatus(${a.id}, 'accepted', ${teamId})">ACCEPT</button>
            <button class="req-btn reject" onclick="updateAppStatus(${a.id}, 'rejected', ${teamId})">REJECT</button>
          ` : `
            <span class="status-badge ${a.status}">${a.status.toUpperCase()}</span>
          `}
        </div>
      </div>
    `).join('');
  })
  .catch(err => {
    container.innerHTML = `<p style="color:var(--red);text-align:center;padding:20px;">Error: ${err.message}</p>`;
  });
}

function closeRequestsModal() {
  document.getElementById('requests-modal').classList.remove('open');
}

function updateAppStatus(appId, status, teamId) {
  if (!confirm(`Are you sure you want to ${status} this application?`)) return;

  fetch(`${API}/applications/${appId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  .then(res => {
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  })
  .then(() => {
    alert(`Application ${status}!`);
    openRequestsModal(teamId); // Refresh list
  })
  .catch(err => alert(err.message));
}

// ── Profile View Logic ───────────────────────────────────
function openUserProfileModal(userId) {
  const modal = document.getElementById('user-profile-modal');
  modal.classList.add('open');
  const container = document.getElementById('user-profile-content');
  container.innerHTML = '<p>Loading profile...</p>';

  fetch(`${API}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(u => {
    const skillsArr = u.skills ? u.skills.split(',').map(s => s.trim()) : [];
    container.innerHTML = `
      <div class="profile-view-avatar"><i class="fa-solid fa-user"></i></div>
      <div class="profile-view-name">${u.name}</div>
      <div class="profile-view-email">${u.email}</div>
      <div class="profile-view-bio">${u.bio || 'No bio provided.'}</div>
      <div class="profile-view-skills">
        ${skillsArr.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
      <div class="profile-view-links">
        ${u.github_url ? `<a href="${u.github_url}" target="_blank" class="profile-link"><i class="fa-brands fa-github"></i></a>` : ''}
        ${u.linkedin_url ? `<a href="${u.linkedin_url}" target="_blank" class="profile-link"><i class="fa-brands fa-linkedin"></i></a>` : ''}
      </div>
    `;
  })
  .catch(err => {
    container.innerHTML = `<p style="color:var(--red)">Error: ${err.message}</p>`;
  });
}

function closeUserProfileModal() {
  document.getElementById('user-profile-modal').classList.remove('open');
}

// Close modals on overlay click
['requests-modal', 'user-profile-modal'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === document.getElementById(id)) {
      document.getElementById(id).classList.remove('open');
    }
  });
});

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