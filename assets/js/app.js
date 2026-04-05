const STORAGE_FAVORITES = 'laowu_favorites';
const STORAGE_COMPARE = 'laowu_compare';
const STORAGE_COOKIE_ACCEPT = 'laowu_cookie_accept';
const BASE_IMAGE_FOLDER = 'Lao Wu china images';
const FILTER_FIELDS = ['year', 'make', 'model', 'location'];

function encodePathSegment(value) {
  return encodeURIComponent(value).replace(/%20/g, '%20');
}

function buildImageUrl(folder, image) {
  return `${BASE_IMAGE_FOLDER}/${encodePathSegment(folder)}/${encodePathSegment(image)}`;
}

function getStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function closeMobileNav() {
  const nav = document.querySelector('.site-nav');
  const button = document.querySelector('.hamburger');
  nav?.classList.remove('open');
  button?.classList.remove('open');
}

function toggleMenu() {
  const nav = document.querySelector('.site-nav');
  const button = document.querySelector('.hamburger');
  if (!nav || !button) return;
  const toggle = () => {
    nav.classList.toggle('open');
    button.classList.toggle('open');
  };
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggle();
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !button.contains(e.target)) {
      closeMobileNav();
    }
  });
}

function initNav() {
  const links = document.querySelectorAll('.site-nav a');
  const nav = document.querySelector('.site-nav');
  const button = document.querySelector('.hamburger');
  const currentPath = window.location.pathname.replace(/\/$/, '');

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const samePageHash = href.startsWith('#') || (link.hash && link.pathname.replace(/\/$/, '') === currentPath);

    link.addEventListener('click', (e) => {
      if (samePageHash && link.hash) {
        e.preventDefault();
        document.querySelector(link.hash)?.scrollIntoView({ behavior: 'smooth' });
      }
      closeMobileNav();
    });

    const normalizedHref = link.href.replace(window.location.origin, '');
    const normalizedLocation = window.location.href.replace(window.location.origin, '');
    if (normalizedHref === normalizedLocation || normalizedHref === window.location.pathname || normalizedHref === `${window.location.pathname.replace(/\/$/, '')}/index.html`) {
      link.classList.add('active');
    }
  });
}

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem(STORAGE_COOKIE_ACCEPT) === 'true') {
    banner.style.display = 'none';
  }
  const acceptBtn = banner.querySelector('button');
  acceptBtn?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_COOKIE_ACCEPT, 'true');
    banner.style.display = 'none';
  });
}

function showToast(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(window.__laowuToastTimer);
  window.__laowuToastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function initContactActions() {
  document.body.addEventListener('click', (event) => {
    const action = event.target.closest('.contact-action, .contact-cta');
    if (!action) return;
    showToast('Opening your contact method...');
  });
}

function fetchListings() {
  return fetch('data/listings.json')
    .then((response) => response.json())
    .catch(() => []);
}

function buildCategoryChips(listings) {
  const container = document.querySelector('#category-chips');
  if (!container) return;
  const categories = Array.from(new Set(listings.map((listing) => listing.category))).sort();
  categories.unshift('All');
  container.innerHTML = categories.map((category) => `<button class="category-chip" data-category="${category}">${category}</button>`).join('');
  container.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.category-chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      applyFilters(listings);
      // Close menu on mobile
      const nav = document.querySelector('.site-nav');
      const button = document.querySelector('.hamburger');
      nav?.classList.remove('open');
      button?.classList.remove('open');
    });
  });
  container.querySelector('.category-chip')?.classList.add('active');
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function buildCarCard(listing) {
  const favoriteIds = getStorageArray(STORAGE_FAVORITES);
  const compareIds = getStorageArray(STORAGE_COMPARE);
  const imageUrl = buildImageUrl(listing.folder, listing.images[0]);
  const isFavorite = favoriteIds.includes(listing.id);
  const isCompare = compareIds.includes(listing.id);

  return `
    <article class="car-card">
      <img src="${imageUrl}" alt="${listing.title} photo" loading="lazy" />
      <div class="car-card-body">
        <strong>${listing.title}</strong>
        <div class="car-meta">
          <span class="meta-pill">${listing.year}</span>
          <span class="meta-pill">${listing.fuel}</span>
          <span class="meta-pill">${listing.transmission}</span>
          <span class="meta-pill">${listing.location}</span>
        </div>
        <p>${listing.short}</p>
        <div class="card-actions">
          <a class="btn" href="car.html?id=${listing.id}">View details</a>
          <button class="btn-secondary favorite-btn" data-id="${listing.id}" aria-pressed="${isFavorite}">
            ${isFavorite ? 'Saved' : 'Save'}
          </button>
        </div>
        <div class="card-actions" style="gap:0.6rem; margin-top:0.8rem;">
          <span class="card-badge">${formatPrice(listing.priceUSD)}</span>
          <label class="category-chip" style="padding:0.65rem 0.9rem; margin:0;">
            <input type="checkbox" class="compare-checkbox" data-id="${listing.id}" ${isCompare ? 'checked' : ''} /> Compare
          </label>
        </div>
      </div>
    </article>
  `;
}

function updateCards(listings) {
  const grid = document.getElementById('car-grid');
  const results = document.getElementById('results-count');
  if (!grid || !results) return;
  grid.innerHTML = listings.map((listing) => buildCarCard(listing)).join('');
  results.textContent = `${listings.length} cars found`;
  grid.querySelectorAll('.favorite-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const favorites = getStorageArray(STORAGE_FAVORITES);
      if (favorites.includes(id)) {
        setStorageArray(STORAGE_FAVORITES, favorites.filter((item) => item !== id));
        button.textContent = 'Save';
        button.setAttribute('aria-pressed', 'false');
      } else {
        favorites.push(id);
        setStorageArray(STORAGE_FAVORITES, favorites);
        button.textContent = 'Saved';
        button.setAttribute('aria-pressed', 'true');
      }
    });
  });
  grid.querySelectorAll('.compare-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const id = checkbox.dataset.id;
      const compare = getStorageArray(STORAGE_COMPARE);
      if (checkbox.checked) {
        if (!compare.includes(id)) compare.push(id);
      } else {
        setStorageArray(STORAGE_COMPARE, compare.filter((item) => item !== id));
      }
      setStorageArray(STORAGE_COMPARE, compare);
    });
  });
}

function applyFilters(listings) {
  const query = document.getElementById('search-query')?.value.toLowerCase() || '';
  const category = document.querySelector('.category-chip.active')?.dataset.category || 'All';
  const year = document.getElementById('filter-year')?.value || 'All';

  const filtered = listings.filter((listing) => {
    const matchQuery = `${listing.title} ${listing.make} ${listing.model} ${listing.location}`.toLowerCase().includes(query);
    const matchCategory = category === 'All' || listing.category === category;
    const matchYear = year === 'All' || String(listing.year) === year;
    return matchQuery && matchCategory && matchYear;
  });
  updateCards(filtered);
}

function initHome() {
const heroGrid = document.getElementById('hero-mini-grid');

    fetchListings().then((listings) => {
      if (!listings.length) return;
      const featured = listings.filter((item) => item.featured).slice(0, 5);
      const categories = Array.from(new Set(listings.map((item) => item.category))).sort();
      const heroCards = [
        {
          title: 'Welcome global partners',
          subtitle: 'Discover curated export-ready inventory with trusted international trading terms.',
        },
        {
          title: 'Business-ready mobility',
          subtitle: 'Scale your fleet with premium vehicles, transparent pricing, and fast delivery.',
        },
        {
          title: 'Trusted export supply',
          subtitle: 'Connect with a global inventory partner offering streamlined sourcing and confidence.',
        },
      ];
      const cardItems = listings
        .slice()
        .sort((a, b) => (Number(b.featured) - Number(a.featured)) || (b.priceUSD - a.priceUSD));

    if (heroGrid) {
      const cards = heroCards.map((card, index) => ({
        ...card,
        values: cardItems.slice(index * 3, index * 3 + 3),
      }));

      heroGrid.innerHTML = cards.map((card, index) => `
        <article class="hero-mini-card" data-card="${index}">
          <div class="mini-slider">
            ${card.values.map((item, imageIndex) => `
              <img class="mini-slide ${imageIndex === 0 ? 'active' : ''}" src="${buildImageUrl(item.folder, item.images[0])}" alt="${item.title} photo" loading="lazy" />
            `).join('')}
          </div>
          <div class="hero-card-body">
            <h3>${card.title}</h3>
            <p>${card.subtitle}</p>
          </div>
        </article>
      `).join('');

      cards.forEach((card, index) => {
        const slides = heroGrid.querySelectorAll(`.hero-mini-card[data-card="${index}"] .mini-slide`);
        let active = 0;
        if (!slides.length) return;
        setInterval(() => {
          slides[active]?.classList.remove('active');
          active = (active + 1) % slides.length;
          slides[active]?.classList.add('active');
        }, 3800 + index * 300);
      });
    }

    buildCategoryChips(listings);

    const featuredContainer = document.getElementById('featured-cards');
    if (featuredContainer) {
      featuredContainer.innerHTML = featured.map((item) => `
        <article class="featured-card">
          <img src="${buildImageUrl(item.folder, item.images[0])}" alt="${item.title} photo" loading="lazy" />
          <div class="featured-card-body">
            <strong>${item.title}</strong>
            <p>${item.short}</p>
            <div class="card-actions">
              <a class="btn btn-dark" href="car.html?id=${item.id}">Details</a>
              <span class="card-badge">${formatPrice(item.priceUSD)}</span>
            </div>
          </div>
        </article>
      `).join('');
    }

    const quickLinks = document.getElementById('category-chips-quick');
    if (quickLinks) {
      quickLinks.innerHTML = categories.map((label) => `<button class="category-chip" data-category="${label}">${label}</button>`).join('');
      quickLinks.querySelectorAll('.category-chip').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelectorAll('#category-chips .category-chip').forEach((chip) => chip.classList.remove('active'));
          const target = document.querySelector(`#category-chips .category-chip[data-category="${button.dataset.category}"]`);
          target?.classList.add('active');
          button.classList.add('active');
          applyFilters(listings);
          closeMobileNav();
        });
      });
    }

    document.getElementById('search-query')?.addEventListener('input', () => {
      applyFilters(listings);
      closeMobileNav();
    });
    document.getElementById('search-query')?.addEventListener('click', () => {
      closeMobileNav();
    });
    document.getElementById('filter-year')?.addEventListener('change', () => {
      applyFilters(listings);
      closeMobileNav();
    });
    document.getElementById('filter-year')?.addEventListener('click', () => {
      closeMobileNav();
    });
    updateCards(listings);
  });
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function initCarDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  fetchListings().then((listings) => {
    const car = listings.find((item) => item.id === id);
    const detailSection = document.getElementById('car-detail');
    if (!car || !detailSection) {
      detailSection.innerHTML = '<p class="muted">Car not found. Return to <a href="index.html">home</a>.</p>';
      return;
    }
    document.title = `${car.title} | LAO WU CHINA USED CARS`;
    setText('#detail-title', car.title);
    setText('#detail-price', formatPrice(car.priceUSD));
    setText('#detail-location', car.location);
    setText('#detail-short', car.short);
    setText('#detail-year', String(car.year));
    setText('#detail-mileage', car.mileage);
    setText('#detail-fuel', car.fuel);
    setText('#detail-transmission', car.transmission);
    setText('#detail-condition', car.condition);
    setText('#detail-history', car.history);
    setText('#detail-description', car.description);
    const specsList = document.getElementById('detail-specs');
    if (specsList) {
      specsList.innerHTML = Object.entries(car.specs).map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`).join('');
    }
    const gallery = document.getElementById('detail-gallery');
    if (gallery) {
      gallery.innerHTML = `
        <div class="gallery-main">
          ${car.images.map((image, index) => `
            <div class="gallery-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
              <img src="${buildImageUrl(car.folder, image)}" alt="${car.title} image ${index + 1}" loading="lazy" />
            </div>
          `).join('')}
        </div>
        <div class="gallery-thumbs">
          ${car.images.map((image, index) => `
            <button type="button" class="gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
              <img src="${buildImageUrl(car.folder, image)}" alt="${car.title} thumbnail ${index + 1}" loading="lazy" />
            </button>
          `).join('')}
        </div>
      `;
      initGalleryAutoplay(gallery);
      gallery.querySelectorAll('.gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const selectedIndex = Number(thumb.dataset.index);
          setActiveGalleryIndex(gallery, selectedIndex);
        });
      });
    }
    document.querySelectorAll('.contact-cta').forEach((button) => {
      const subject = encodeURIComponent(`Inquiry about ${car.title}`);
      button.href = `mailto:laowucardealers@gmail.com?subject=${subject}`;
    });
    document.getElementById('contact-whatsapp')?.setAttribute('href', `https://wa.me/8613800138000?text=${encodeURIComponent('Hello, I want to ask about ' + car.title)}`);
  });
}

function setActiveGalleryIndex(container, index) {
  const slides = container.querySelectorAll('.gallery-slide');
  const thumbs = container.querySelectorAll('.gallery-thumb');
  slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
  thumbs.forEach((thumb, idx) => thumb.classList.toggle('active', idx === index));
}

function initGalleryAutoplay(container) {
  const slides = container.querySelectorAll('.gallery-slide');
  let active = 0;
  if (!slides.length) return;
  setInterval(() => {
    active = (active + 1) % slides.length;
    setActiveGalleryIndex(container, active);
  }, 4000);
}

function initCompare() {
  fetchListings().then((listings) => {
    const compareIds = getStorageArray(STORAGE_COMPARE);
    const compareArea = document.getElementById('compare-area');
    if (!compareArea) return;
    if (!compareIds.length) {
      compareArea.innerHTML = '<p>No cars selected for comparison yet. Use the compare checkboxes on the home page to add vehicles.</p>';
      return;
    }
    const selected = compareIds.map((id) => listings.find((item) => item.id === id)).filter(Boolean);
    if (!selected.length) {
      compareArea.innerHTML = '<p>No valid cars found in comparison list.</p>';
      return;
    }
    compareArea.innerHTML = `
      <div class="dark-panel" style="overflow:auto;">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              ${selected.map((item) => `<th>${item.title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${['priceUSD','year','mileage','fuel','transmission','condition','location'].map((key) => `
              <tr>
                <td>${key === 'priceUSD' ? 'Price' : key.charAt(0).toUpperCase() + key.slice(1)}</td>
                ${selected.map((item) => `<td>${key === 'priceUSD' ? formatPrice(item[key]) : item[key]}</td>`).join('')}
              </tr>
            `).join('')}
            <tr>
              <td>Description</td>
              ${selected.map((item) => `<td>${item.short}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

function initPage() {
  initNav();
  toggleMenu();
  initCookieBanner();
  initContactActions();
  registerServiceWorker();
  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  if (page === 'car') initCarDetail();
  if (page === 'compare') initCompare();
}

document.addEventListener('DOMContentLoaded', initPage);
