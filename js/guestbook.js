/* ============================================================
   THERE'S THE RUB — guestbook.js
   Google Places Reviews Integration

   SETUP INSTRUCTIONS:
   1. Get a Google Places API key:
      https://console.cloud.google.com/apis/credentials
      Enable: "Places API (New)"

   2. Find your Place ID:
      https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
      Search for "There's The Rub Norwich" or "15 Pottergate Norwich"

   3. Fill in GOOGLE_API_KEY and PLACE_ID below.

   4. Restrict your API key to your domain in the Google Cloud Console
      to prevent unauthorised usage.
   ============================================================ */

const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE';
const PLACE_ID       = 'YOUR_PLACE_ID_HERE';

const isConfigured = GOOGLE_API_KEY !== 'YOUR_API_KEY_HERE' && PLACE_ID !== 'YOUR_PLACE_ID_HERE';

const container   = document.getElementById('reviews-container');
const setupNotice = document.getElementById('reviews-setup');

// ── Show/hide setup notice ────────────────────────────────────
if (!isConfigured && setupNotice) {
  setupNotice.style.display = 'block';
}

// ── Fetch reviews from Places API (New) ──────────────────────
async function fetchReviews() {
  if (!container) return;

  if (!isConfigured) {
    renderFallback();
    return;
  }

  container.innerHTML = '<p class="reviews-loading">Loading reviews…</p>';

  try {
    const endpoint = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    const res = await fetch(endpoint, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount,displayName'
      }
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    const reviews = data.reviews || [];

    if (!reviews.length) {
      container.innerHTML = '<p class="reviews-loading">No reviews yet — be the first!</p>';
      return;
    }

    renderReviews(reviews, data.rating, data.userRatingCount);
  } catch (err) {
    console.error('Reviews fetch failed:', err);
    container.innerHTML = `<p class="reviews-error">Unable to load reviews right now. <a href="https://search.google.com/local/reviews?placeid=${PLACE_ID}" target="_blank" rel="noopener">Read them on Google →</a></p>`;
  }
}

// ── Render star string ────────────────────────────────────────
function stars(rating) {
  const full  = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// ── Render reviews grid ───────────────────────────────────────
function renderReviews(reviews, avgRating, totalCount) {
  // Summary bar
  const summary = document.getElementById('reviews-summary');
  if (summary && avgRating) {
    summary.innerHTML = `
      <div class="rating-summary">
        <span class="rating-summary__score">${avgRating.toFixed(1)}</span>
        <div>
          <div class="rating-summary__stars">${stars(avgRating)}</div>
          <div class="rating-summary__count">${totalCount} Google reviews</div>
        </div>
      </div>`;
  }

  const grid = document.createElement('div');
  grid.className = 'reviews-grid';

  reviews
    .filter(r => r.text?.text)
    .forEach((r, i) => {
      const date = r.relativePublishTimeDescription || '';
      const card = document.createElement('div');
      card.className = 'review-card reveal';
      if (i === 1) card.classList.add('reveal-delay-1');
      if (i === 2) card.classList.add('reveal-delay-2');

      card.innerHTML = `
        <div class="review-card__stars">${stars(r.rating)}</div>
        <p class="review-card__text">"${escapeHtml(r.text.text)}"</p>
        <div class="review-card__author">${escapeHtml(r.authorAttribution?.displayName || 'Google Reviewer')}</div>
        <div class="review-card__date">${date}</div>
        <div class="review-card__via">via Google</div>`;

      grid.appendChild(card);
    });

  container.innerHTML = '';
  container.appendChild(grid);

  // Re-observe newly added reveal elements
  document.querySelectorAll('.review-card.reveal').forEach(el => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  });
}

// ── Fallback placeholder reviews ─────────────────────────────
function renderFallback() {
  const placeholders = [
    { rating: 5, text: "Absolutely wonderful experience. I popped in on a whim and left feeling completely de-stressed. The practitioner was professional and the 20-minute session was genuinely transformative.", author: "Sarah M.", date: "2 weeks ago" },
    { rating: 5, text: "What a find! No appointment needed and right in the city centre. I go every couple of weeks now. My neck and shoulders have never felt better.", author: "James T.", date: "1 month ago" },
    { rating: 5, text: "Brilliant service — quick, effective, and really affordable. I dragged my sceptical husband in and now he's a convert too. We'll definitely be back.", author: "Laura K.", date: "3 weeks ago" },
  ];

  const note = document.createElement('p');
  note.style.cssText = 'text-align:center;color:var(--ink-light);font-style:italic;margin-bottom:24px;font-size:0.88rem;';
  note.textContent = 'Sample reviews shown — connect Google Places API to display live reviews.';

  const grid = document.createElement('div');
  grid.className = 'reviews-grid';

  placeholders.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = `review-card reveal${i > 0 ? ` reveal-delay-${i}` : ''}`;
    card.innerHTML = `
      <div class="review-card__stars">${stars(r.rating)}</div>
      <p class="review-card__text">"${r.text}"</p>
      <div class="review-card__author">${r.author}</div>
      <div class="review-card__date">${r.date}</div>
      <div class="review-card__via">via Google</div>`;
    grid.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(note);
  container.appendChild(grid);

  document.querySelectorAll('.review-card.reveal').forEach(el => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    obs.observe(el);
  });
}

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────
fetchReviews();
