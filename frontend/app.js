const API_URL = 'http://localhost:3000/api';

const journalSection = document.getElementById('journal');
const analyticsSection = document.getElementById('analytics');

document.getElementById('journalBtn').onclick = () => {
  journalSection.classList.add('active');
  analyticsSection.classList.remove('active');
  loadEntries();
};

document.getElementById('analyticsBtn').onclick = () => {
  journalSection.classList.remove('active');
  analyticsSection.classList.add('active');
  loadAnalytics();
};

async function loadEntries() {
  const res = await fetch(`${API_URL}/entries`);
  const entries = await res.json();
  const now = new Date();
  const thisMonth = entries.filter(e => new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear());
  const list = document.getElementById('entry-list');
  list.innerHTML = '';
  thisMonth.forEach(e => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `<strong>${new Date(e.date).toLocaleDateString()}</strong> Mood: ${e.mood}<br>${e.content}`;
    list.appendChild(div);
  });
}

async function loadAnalytics() {
  const res = await fetch(`${API_URL}/analytics`);
  const data = await res.json();
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!data.length) return;
  const maxMood = 5;
  const padding = 40;
  const stepX = (canvas.width - padding * 2) / (data.length - 1);
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding - (data[0].mood / maxMood) * (canvas.height - padding * 2));
  data.forEach((d, i) => {
    const x = padding + i * stepX;
    const y = canvas.height - padding - (d.mood / maxMood) * (canvas.height - padding * 2);
    ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#4b79a1';
  ctx.stroke();
}

document.getElementById('entry-form').addEventListener('submit', async e => {
  e.preventDefault();
  const entry = {
    content: document.getElementById('content').value,
    mood: parseInt(document.getElementById('mood').value, 10),
    energy: parseInt(document.getElementById('energy').value, 10),
    stress: parseInt(document.getElementById('stress').value, 10)
  };
  await fetch(`${API_URL}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  e.target.reset();
  loadEntries();
});

// initial load
loadEntries();
