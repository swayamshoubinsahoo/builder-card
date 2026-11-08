// GitHub Builder Card Engine
const form = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const statusContainer = document.getElementById('status-container');
const statusMessage = document.getElementById('status-message');
const skeletonLoader = document.getElementById('skeleton-loader');
const cardWrapper = document.getElementById('card-wrapper');

// Card Elements
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userHandle = document.getElementById('user-handle');
const userBio = document.getElementById('user-bio');
const metaTags = document.getElementById('meta-tags');
const statRepos = document.getElementById('stat-repos');
const statFollowers = document.getElementById('stat-followers');
const statFollowing = document.getElementById('stat-following');
const languagesContainer = document.getElementById('languages-container');
const reposContainer = document.getElementById('repos-container');
const activityList = document.getElementById('activity-list');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');

// Color map for common GitHub Languages
const langColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  PHP: '#4F5D95',
  Default: '#6366f1'
};

// Check URL query parameters for direct shared cards
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const user = urlParams.get('user');
  if (user) {
    usernameInput.value = user;
    fetchGitHubData(user);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    fetchGitHubData(username);
  }
});

async function fetchGitHubData(username) {
  showError(null);
  cardWrapper.classList.add('hidden');
  skeletonLoader.classList.remove('hidden');

  try {
    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    
    // Explicit Error Handling: Rate limits (403) and Not Found (404)
    if (userRes.status === 404) {
      throw new Error(`User "@${username}" not found. Check the spelling and try again.`);
    }
    if (userRes.status === 403) {
      const resetTime = userRes.headers.get('X-RateLimit-Reset');
      const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleTimeString() : 'shortly';
      throw new Error(`GitHub API rate limit exceeded. Please try again after ${resetDate}.`);
    }
    if (!userRes.ok) {
      throw new Error(`GitHub API Error: ${userRes.statusText}`);
    }

    const userData = await userRes.json();

    // 2. Fetch Repositories (sorted by updated, limit to top 30)
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=updated`);
    const reposData = reposRes.ok ? await reposRes.json() : [];

    // 3. Fetch Recent Public Events (Activity)
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=5`);
    const eventsData = eventsRes.ok ? await eventsRes.json() : [];

    renderCard(userData, reposData, eventsData);
    
    // Update browser URL query param cleanly without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('user', username);
    window.history.pushState({}, '', newUrl);

  } catch (err) {
    showError(err.message);
  } finally {
    skeletonLoader.classList.add('hidden');
  }
}

function renderCard(user, repos, events) {
  // Render Identity
  userAvatar.src = user.avatar_url;
  userName.textContent = user.name || user.login;
  userHandle.textContent = `@${user.login}`;
  userHandle.href = user.html_url;
  userBio.textContent = user.bio || "Crafting code and building next-gen software.";

  // Meta Tags (Location, Company)
  metaTags.innerHTML = '';
  if (user.location) {
    metaTags.innerHTML += `<span>📍 ${user.location}</span>`;
  }
  if (user.company) {
    metaTags.innerHTML += `<span>🏢 ${user.company}</span>`;
  }

  // Counters
  statRepos.textContent = user.public_repos;
  statFollowers.textContent = user.followers;
  statFollowing.textContent = user.following;

  // Process & Aggregate Dominant Languages
  const langCounts = {};
  repos.forEach(repo => {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  });

  languagesContainer.innerHTML = '';
  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  if (sortedLangs.length === 0) {
    languagesContainer.innerHTML = `<span class="activity-item">No dominant languages indexed yet.</span>`;
  } else {
    sortedLangs.forEach(([lang, count]) => {
      const color = langColors[lang] || langColors.Default;
      const chip = document.createElement('div');
      chip.className = 'lang-chip';
      chip.innerHTML = `<span class="lang-dot" style="background: ${color}"></span>${lang} <span style="color:#64748b">(${count})</span>`;
      languagesContainer.appendChild(chip);
    });
  }

  // Sort & Render Top Repositories (Ranked by stargazers_count)
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4);
  reposContainer.innerHTML = '';

  if (topRepos.length === 0) {
    reposContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No public repositories available.</p>`;
  } else {
    topRepos.forEach(repo => {
      const card = document.createElement('a');
      card.className = 'repo-card';
      card.href = repo.html_url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      
      const langColor = langColors[repo.language] || langColors.Default;

      card.innerHTML = `
        <div class="repo-name">
          <span>${repo.name}</span>
          <span>★ ${repo.stargazers_count}</span>
        </div>
        <div class="repo-desc">${repo.description || "No description provided."}</div>
        <div class="repo-footer">
          <span><span class="lang-dot" style="background: ${langColor}; display:inline-block; margin-right:4px;"></span>${repo.language || 'Code'}</span>
          <span>Forks: ${repo.forks_count}</span>
        </div>
      `;
      reposContainer.appendChild(card);
    });
  }

  // Render Recent Activity (PushEvent, PullRequestEvent, CreateEvent)
  activityList.innerHTML = '';
  if (!events || events.length === 0) {
    activityList.innerHTML = `<li class="activity-item">No recent public activity recorded.</li>`;
  } else {
    events.slice(0, 4).forEach(ev => {
      const item = document.createElement('li');
      item.className = 'activity-item';
      
      let action = 'Contributed to';
      if (ev.type === 'PushEvent') {
        const commitCount = ev.payload.commits ? ev.payload.commits.length : 1;
        action = `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to`;
      } else if (ev.type === 'PullRequestEvent') {
        action = `${ev.payload.action === 'opened' ? 'Opened' : 'Updated'} PR in`;
      } else if (ev.type === 'CreateEvent') {
        action = `Created ${ev.payload.ref_type || 'resource'} in`;
      } else if (ev.type === 'WatchEvent') {
        action = `Starred repository`;
      }

      const repoShort = ev.repo.name.replace(`${user.login}/`, '');
      const timeAgo = formatTimeAgo(new Date(ev.created_at));

      item.innerHTML = `${action} <span class="highlight">${repoShort}</span> <span class="date">${timeAgo}</span>`;
      activityList.appendChild(item);
    });
  }

  cardWrapper.classList.remove('hidden');
}

// Relative time helper
function formatTimeAgo(date) {
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function showError(msg) {
  if (!msg) {
    statusContainer.classList.add('hidden');
    return;
  }
  statusMessage.textContent = msg;
  statusContainer.classList.remove('hidden');
}

// Export as PNG using html2canvas
downloadBtn.addEventListener('click', () => {
  const cardElement = document.getElementById('builder-card');
  html2canvas(cardElement, {
    backgroundColor: '#0b0f19',
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `builder-card-${userName.textContent.trim().toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});

// Share URL button
shareBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const originalText = shareBtn.innerHTML;
    shareBtn.innerHTML = `✓ Copied URL!`;
    setTimeout(() => {
      shareBtn.innerHTML = originalText;
    }, 2000);
  });
});