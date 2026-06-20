/* =====================================================
   UNDANGAN PERNIKAHAN - Revi & Siti
   ===================================================== */

/* =====================================================
   STATE / VARIABEL GLOBAL
   ===================================================== */
let attendStatus = 'hadir';
let wishes = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
let musicPlaying = false;

/* =====================================================
   BUKA UNDANGAN (Envelope Animation)
   ===================================================== */
function openInvitation() {
  const env = document.getElementById('envelope-screen');
  const main = document.getElementById('main-content');
  const nav = document.getElementById('scroll-nav');
  const musicBtn = document.getElementById('music-btn');

  // Animasi envelope menghilang
  env.classList.add('hide');

  setTimeout(() => {
    env.style.display = 'none';

    // Tampilkan konten utama
    main.classList.add('visible');
    nav.style.display = 'flex';
    musicBtn.style.display = 'flex';
    musicBtn.style.alignItems = 'center';
    musicBtn.style.justifyContent = 'center';

    // Inisialisasi semua fitur
    startCountdown();
    renderWishes();
    startPetals();
    initScrollObserver();
    initNavDots();
  }, 1000);
}

/* =====================================================
   HITUNG MUNDUR (Countdown Timer)
   ===================================================== */
function startCountdown() {
  // ⚙️ GANTI TANGGAL SESUAI HARI H
  const target = new Date('2026-06-29T08:00:00');

  function tick() {
    const now = new Date();
    const diff = target - now;

    // Jika sudah lewat hari H
    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent = '00';
      document.getElementById('cd-secs').textContent = '00';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    flipNumber('cd-days', d);
    flipNumber('cd-hours', h);
    flipNumber('cd-mins', m);
    flipNumber('cd-secs', s);
  }

  tick(); // Panggil langsung agar tidak ada delay 1 detik pertama
  setInterval(tick, 1000);

  updateProgressBar();
  setInterval(updateProgressBar, 1000);
}

/* =====================================================
   RSVP — Tombol Kehadiran
   ===================================================== */
function setAttend(val) {
  attendStatus = val;
  document.getElementById('btn-hadir').classList.toggle('active', val === 'hadir');
  document.getElementById('btn-tidak').classList.toggle('active', val === 'tidak');
}

/* =====================================================
   RSVP — Submit Form
   ===================================================== */
function submitRSVP() {
  const name    = document.getElementById('rsvp-name').value.trim();
  const attend  = attendStatus; // ← pakai variabel global yang sudah ada
  const msg     = document.getElementById('rsvp-msg').value.trim();
  const guests  = document.getElementById('rsvp-guests').value;

  if (!name) {
    showToast('Mohon isi nama Anda ✏️');
    document.getElementById('rsvp-name').focus();
    return;
  }

  const btn = document.getElementById('rsvp-submit');
  const originalText = btn.textContent;
  btn.textContent = 'Mengirim...';
  btn.disabled = true;

  fetch(GOOGLE_SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, attend, msg, guests })
  })
  .then(() => {
    const entry = {
      name, msg, guests,
      attend: attendStatus,
      time: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    };
    wishes.unshift(entry);
    localStorage.setItem('wedding_wishes', JSON.stringify(wishes));
    renderWishes();

    document.getElementById('rsvp-name').value = '';
    document.getElementById('rsvp-msg').value  = '';
    setAttend('hadir');
    updateCharCount();

    const toastMsg = attendStatus === 'hadir'
      ? `Terima kasih, ${name}! Kami menantikan kehadiran Anda 🌸`
      : `Terima kasih, ${name}! Doa Anda sangat berarti bagi kami 🙏`;
    showToast(toastMsg);
  })
  .catch(() => {
    showToast('Gagal mengirim, coba lagi');
  })
  .finally(() => {
    btn.textContent = originalText;
    btn.disabled    = false;
  });
}

/* =====================================================
   RSVP — Render Daftar Ucapan
   ===================================================== */
function renderWishes() {

  const list = document.getElementById('wishes-list');
  if (!wishes.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = wishes.map(w => `
    <div class="wish-item">
      <p class="wish-name">${escHtml(w.name)} &nbsp;·&nbsp; ${w.time}</p>
      <p class="wish-msg">"${escHtml(w.msg || 'Selamat menempuh hidup baru!')}"</p>
      <p class="wish-attend-tag ${w.attend}">
        ${w.attend === 'hadir' ? '✓ Hadir · ' + w.guests : '✗ Tidak Hadir'}
      </p>
    </div>
  `).join('');
}

/* =====================================================
   UTILITY — Escape HTML (keamanan XSS)
   ===================================================== */
function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =====================================================
   TOAST NOTIFICATION
   ===================================================== */
function showToast(msg) {
  const t = document.createElement('div');

  t.style.cssText = `
    position: fixed;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1208;
    color: #e8d49e;
    border: 1px solid #c9a84c;
    padding: 1rem 2rem;
    font-size: 0.85rem;
    font-family: 'Lato', sans-serif;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.4s;
    text-align: center;
    max-width: 90vw;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  `;

  t.textContent = msg;
  document.body.appendChild(t);

  // Fade in
  requestAnimationFrame(() => { t.style.opacity = '1'; });

  // Fade out & hapus
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 500);
  }, 3500);
}

/* =====================================================
   FALLING PETALS (Animasi Bunga Jatuh)
   ===================================================== */
const petalEmojis = ['🌸', '🌺', '✿', '❀', '🌼', '💮'];

function createPetal() {
  const p = document.createElement('div');
  p.className = 'petal';
  p.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];

  // Posisi & ukuran acak
  p.style.left = Math.random() * 100 + 'vw';
  p.style.top = '-30px';
  p.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';

  // Durasi acak
  const dur = 4 + Math.random() * 5;
  p.style.animation = `fallingPetal ${dur}s linear forwards`;

  document.body.appendChild(p);

  // Hapus dari DOM setelah animasi selesai
  setTimeout(() => p.remove(), dur * 1000);
}

function startPetals() {
  setInterval(() => {
    if (Math.random() > 0.4) createPetal();
  }, 800);
}

/* =====================================================
   SCROLL OBSERVER — Fade-in Elemen saat Discroll
   ===================================================== */
function initScrollObserver() {
  const targets = document.querySelectorAll('.couple-card, .event-card');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  targets.forEach(target => obs.observe(target));
}

/* =====================================================
   NAVIGASI TITIK (Scroll Nav Dots)
   ===================================================== */
function initNavDots() {
  const dots = document.querySelectorAll('.nav-dot');
  const sections = ['hero', 'couple', 'event', 'countdown', 'love-story','gallery', 'location', 'rsvp', 'gift', 'closing'];

  // Klik dot → scroll ke section
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const el = document.getElementById(sections[i]);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Highlight dot aktif saat scroll
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target.id);
        dots.forEach(d => d.classList.remove('active'));
        if (idx > -1) dots[idx].classList.add('active');
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* =====================================================
   WEDDING GIFT — Salin Rekening & Konfirmasi WA
   ===================================================== */
const WHATSAPP_NUMBER = '6282130542331'; // ← Ganti nomor WA Anda
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxXvenU-lXed16f0N9cTxf7b9MtL8IuL356JF3QCPPITSZizxZt4aws43V5Kfw0_Q5r/exec';

function copyAccount(elementId, btn) {
  const text = document.getElementById(elementId).textContent.trim();

  // Coba Clipboard API modern, fallback ke execCommand
  const doFallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    markCopied(btn);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => markCopied(btn)).catch(doFallback);
  } else {
    doFallback();
  }
}

function markCopied(btn) {
  const original = btn.textContent;
  btn.textContent = '✓ Tersalin';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 2000);
  showToast('Nomor berhasil disalin 📋');
}

function confirmViaWhatsApp() {
  const name = document.getElementById('cf-name').value.trim();
  const method = document.getElementById('cf-method').value;

  if (!name) {
    showToast('Mohon isi nama pengirim terlebih dahulu ✏️');
    document.getElementById('cf-name').focus();
    return;
  }

  const msg = [
    ' *Konfirmasi Wedding Gift*',
    '',
    ` *Nama*   : ${name}`,
    ` *Via*    : ${method}`,
    '_Terkirim dari undangan digital_'
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* =====================================================
   MUSIK LATAR (Music Toggle)
   ===================================================== */
function toggleMusic() {
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-btn');

  // Cek apakah ada sumber musik
  if (!audio.src || audio.src === window.location.href) {
    showToast('Tambahkan musik untuk mengaktifkan fitur ini.');
    return;
  }

  if (musicPlaying) {
    audio.pause();
    btn.textContent = '♪';
    btn.classList.remove('spin');
    musicPlaying = false;
  } else {
    audio.play();
    btn.textContent = '♫';
    btn.classList.add('spin');
    musicPlaying = true;
  }
}

/* ── PROGRESS BAR ── */
function updateProgressBar() {
  const start = new Date('2026-06-01T00:00:00').getTime();
  const target = new Date('2026-06-29T08:00:00').getTime();
  const pct = Math.min(100, ((Date.now() - start) / (target - start)) * 100);
  const bar = document.getElementById('cd-progress');
  if (bar) bar.style.width = pct + '%';
}

/* ── LIGHTBOX ── */
function openLightbox(el) {
  const img = el.querySelector('img');
  if (!img) return;
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-caption').textContent = img.alt || 'Momen Kami';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ── SALIN ALAMAT ── */
function copyAddress() {
  const addr = 'Jln. Nyimas gedengwaru, RT/RW.01/03, dsn.cigembong, ds Cikondang, kec. Ganeas, SUMEDANG';
  navigator.clipboard.writeText(addr)
    .then(() => showToast('Alamat berhasil disalin 📋'))
    .catch(() => showToast('Gagal menyalin alamat'));
}

/* ── RSVP COUNTER ── */
function updateCharCount() {
  const ta = document.getElementById('rsvp-msg');
  const label = document.getElementById('char-count');
  if (!ta || !label) return;
  const len = ta.value.length;
  label.textContent = len + ' / 200';
  label.classList.toggle('near-limit', len >= 170);
}

/* ── SHARE CLOSING ── */
function shareWA() {
  const text = encodeURIComponent(
    ' Anda diundang ke pernikahan Revi.h & Siti.nh\n' +
    '📅 Senin, 29 Juni 2026 · 08.00 WIB\n' +
    ' Saung Kreatif, Sumedang\n\n' +
    '🔗 ' + window.location.href
  );
  window.open('https://wa.me/?text=' + text, '_blank');
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast('Link undangan berhasil disalin 🔗'));
}

/* ── FADE IN SCROLL ── */
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-up, .fade-left');
  els.forEach(el => {
    const delay = el.getAttribute('data-delay');
    if (delay) el.style.transitionDelay = delay + 's';
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => observer.observe(el));
}

/* ── FLIP NUMBER COUNTDOWN ── */
function flipNumber(id, newVal) {
  const el = document.getElementById(id);
  if (!el) return;
  const formatted = String(newVal).padStart(2, '0');
  if (el.textContent === formatted) return;
  el.classList.remove('flip');
  void el.offsetWidth;
  el.classList.add('flip');
  el.textContent = formatted;
  setTimeout(() => el.classList.remove('flip'), 350);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
});