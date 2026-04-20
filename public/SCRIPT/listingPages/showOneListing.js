/* ================================================================
   Handles: photo gallery · lightbox · price chart · save button ·
			description toggle · share · view count ping
   ================================================================ */
(function () {
	'use strict';

	/* ── Data injected by EJS ── */
	const L = window.__LISTING__ || {};
	const PRICES = window.__SIMILAR_PRICES__ || [];

	/* ── DOM refs ── */
	const mainPhoto = document.getElementById('mainPhoto');
	const galPrev = document.getElementById('galPrev');
	const galNext = document.getElementById('galNext');
	const galCurrent = document.getElementById('galCurrent');
	const thumbStrip = document.getElementById('thumbStrip');
	const galFullscreen = document.getElementById('galFullscreen');
	const lightbox = document.getElementById('lightbox');
	const lbImg = document.getElementById('lightboxImg');
	const lbClose = document.getElementById('lightboxClose');
	const lbPrev = document.getElementById('lbPrev');
	const lbNext = document.getElementById('lbNext');
	const lbCurrent = document.getElementById('lbCurrent');
	const descText = document.getElementById('descText');
	const descToggle = document.getElementById('descToggle');
	const saveBtn = document.getElementById('saveBtn');
	const shareBtn = document.getElementById('shareBtn');

	const photos = L.photos || [];
	let currentIdx = 0;

	/* ================================================================
	   GALLERY
	   ================================================================ */
	function goToPhoto(idx) {
		if (!photos.length) return;
		currentIdx = (idx + photos.length) % photos.length;

		if (mainPhoto) {
			mainPhoto.style.opacity = '0';
			mainPhoto.src = photos[currentIdx];
			mainPhoto.alt = `${document.title} — photo ${currentIdx + 1}`;
			mainPhoto.onload = () => { mainPhoto.style.opacity = '1'; };
		}
		if (galCurrent) galCurrent.textContent = currentIdx + 1;

		/* Update thumbnails */
		if (thumbStrip) {
			thumbStrip.querySelectorAll('.gallery-thumb').forEach((t, i) => {
				t.classList.toggle('active', i === currentIdx);
				t.setAttribute('aria-pressed', i === currentIdx ? 'true' : 'false');
			});
		}

		/* Sync lightbox if open */
		if (lightbox && !lightbox.hidden) {
			if (lbImg) lbImg.src = photos[currentIdx];
			if (lbCurrent) lbCurrent.textContent = currentIdx + 1;
		}
	}

	/* Wire arrows */
	galPrev && galPrev.addEventListener('click', () => goToPhoto(currentIdx - 1));
	galNext && galNext.addEventListener('click', () => goToPhoto(currentIdx + 1));

	/* Wire thumbnails */
	if (thumbStrip) {
		thumbStrip.querySelectorAll('.gallery-thumb').forEach(thumb => {
			thumb.addEventListener('click', () => {
				const idx = parseInt(thumb.dataset.index, 10);
				goToPhoto(idx);
			});
		});
	}

	/* Keyboard arrows on gallery */
	document.addEventListener('keydown', (e) => {
		if (lightbox && !lightbox.hidden) return; // handled by lightbox
		if (e.key === 'ArrowLeft') goToPhoto(currentIdx - 1);
		if (e.key === 'ArrowRight') goToPhoto(currentIdx + 1);
	});

	/* Touch swipe on main gallery */
	if (mainPhoto) {
		let touchStartX = 0;
		mainPhoto.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
		mainPhoto.addEventListener('touchend', e => {
			const dx = e.changedTouches[0].clientX - touchStartX;
			if (dx < -50) goToPhoto(currentIdx + 1);
			if (dx > 50) goToPhoto(currentIdx - 1);
		}, { passive: true });
	}

	/* ================================================================
	   LIGHTBOX
	   ================================================================ */
	function openLightbox(idx) {
		if (!lightbox || !photos.length) return;
		currentIdx = idx;
		if (lbImg) lbImg.src = photos[currentIdx];
		if (lbCurrent) lbCurrent.textContent = currentIdx + 1;
		lightbox.hidden = false;
		document.body.style.overflow = 'hidden';
		lbClose && lbClose.focus();
	}
	function closeLightbox() {
		if (!lightbox) return;
		lightbox.hidden = true;
		document.body.style.overflow = '';
		galFullscreen && galFullscreen.focus();
	}

	galFullscreen && galFullscreen.addEventListener('click', () => openLightbox(currentIdx));
	const galleryMainEl = document.getElementById('galleryMain');
	if (galleryMainEl && mainPhoto) {
		mainPhoto.style.cursor = 'zoom-in';
		mainPhoto.addEventListener('click', () => openLightbox(currentIdx));
	}
	lbClose && lbClose.addEventListener('click', closeLightbox);
	lightbox && lightbox.addEventListener('click', (e) => {
		if (e.target === lightbox) closeLightbox();
	});
	lbPrev && lbPrev.addEventListener('click', () => {
		currentIdx = (currentIdx - 1 + photos.length) % photos.length;
		if (lbImg) lbImg.src = photos[currentIdx];
		if (lbCurrent) lbCurrent.textContent = currentIdx + 1;
		if (galCurrent) galCurrent.textContent = currentIdx + 1;
	});
	lbNext && lbNext.addEventListener('click', () => {
		currentIdx = (currentIdx + 1) % photos.length;
		if (lbImg) lbImg.src = photos[currentIdx];
		if (lbCurrent) lbCurrent.textContent = currentIdx + 1;
		if (galCurrent) galCurrent.textContent = currentIdx + 1;
	});
	document.addEventListener('keydown', (e) => {
		if (!lightbox || lightbox.hidden) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') lbPrev && lbPrev.click();
		if (e.key === 'ArrowRight') lbNext && lbNext.click();
	});

	/* ================================================================
	   PRICE COMPARISON CHART
	   ================================================================ */
	function buildPriceChart() {
		const canvas = document.getElementById('priceChart');
		if (!canvas || typeof Chart === 'undefined') return;

		const thisPrice = L.price || 0;

		/* Use server-provided similar prices, or generate a synthetic bell curve */
		let simPrices = PRICES.length >= 3
			? PRICES
			: generateSyntheticPrices(thisPrice);

		/* Build histogram buckets */
		const minP = Math.min(...simPrices, thisPrice);
		const maxP = Math.max(...simPrices, thisPrice);
		const range = maxP - minP || 1;
		const BUCKETS = 8;
		const step = range / BUCKETS;

		const bucketLabels = [];
		const bucketCounts = [];
		const bucketColors = [];

		for (let i = 0; i < BUCKETS; i++) {
			const lo = minP + i * step;
			const hi = lo + step;
			const mid = (lo + hi) / 2;
			const fmt = n => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}k`;
			bucketLabels.push(fmt(mid));

			const count = simPrices.filter(p => p >= lo && p < hi).length;
			bucketCounts.push(count);

			/* Highlight the bucket containing this listing */
			const isThis = thisPrice >= lo && thisPrice < hi;
			bucketColors.push(isThis ? '#FF385C' : '#e8e4da');
		}

		const chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: bucketLabels,
				datasets: [{
					data: bucketCounts,
					backgroundColor: bucketColors,
					borderRadius: 6,
					borderSkipped: false,
				}]
			},
			options: {
				responsive: true,
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							title: items => `Around ${items[0].label}`,
							label: ctx => `${ctx.parsed.y} similar listing${ctx.parsed.y !== 1 ? 's' : ''}`,
						}
					}
				},
				scales: {
					x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#888' } },
					y: { display: false },
				},
				animation: { duration: 700, easing: 'easeOutQuart' },
			}
		});

		/* Compute stats */
		const avg = simPrices.reduce((a, b) => a + b, 0) / simPrices.length;
		const sortedP = [...simPrices].sort((a, b) => a - b);
		const median = sortedP[Math.floor(sortedP.length / 2)];
		const minVal = sortedP[0];
		const maxVal = sortedP[sortedP.length - 1];

		/* Position badge */
		const badge = document.getElementById('pricePositionBadge');
		if (badge) {
			if (thisPrice < avg * 0.85) {
				badge.textContent = 'Below market — great deal';
				badge.className = 'chart-badge below';
			} else if (thisPrice > avg * 1.15) {
				badge.textContent = 'Above market average';
				badge.className = 'chart-badge above';
			} else {
				badge.textContent = 'Near market average';
				badge.className = 'chart-badge market';
			}
		}

		/* Stats row */
		const statsRow = document.getElementById('chartStatsRow');
		if (statsRow) {
			const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
			statsRow.innerHTML = `
        <div class="cstat">
          <span class="cstat-val">${fmt(minVal)}</span>
          <span class="cstat-key">Lowest similar</span>
        </div>
        <div class="cstat">
          <span class="cstat-val">${fmt(avg)}</span>
          <span class="cstat-key">Average price</span>
        </div>
        <div class="cstat">
          <span class="cstat-val">${fmt(maxVal)}</span>
          <span class="cstat-key">Highest similar</span>
        </div>`;
		}
	}

	/* Generate a synthetic bell-curve of prices around thisPrice */
	function generateSyntheticPrices(base) {
		const prices = [];
		const spread = base * 0.4;
		for (let i = 0; i < 20; i++) {
			const rand = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
			prices.push(Math.max(1, Math.round(base + rand * spread)));
		}
		return prices;
	}

	/* Run chart after Chart.js loads */
	if (typeof Chart !== 'undefined') {
		buildPriceChart();
	} else {
		window.addEventListener('load', buildPriceChart);
	}

	/* ================================================================
	   DESCRIPTION TOGGLE
	   ================================================================ */
	if (descToggle && descText) {
		descToggle.addEventListener('click', () => {
			const expanded = descText.classList.toggle('expanded');
			descToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			descToggle.innerHTML = expanded
				? 'Show less <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;display:inline-block;vertical-align:middle;transform:rotate(180deg)"><polyline points="6 9 12 15 18 9"/></svg>'
				: 'Show more <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>';
		});
	}

	/* ================================================================
	   SAVE / HEART BUTTON
	   ================================================================ */
	const SAVED_KEY = 'sn_saved';
	let savedSet = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));

	function syncSaveUI() {
		if (!saveBtn || !L.id) return;
		const isSaved = savedSet.has(L.id);
		saveBtn.classList.toggle('saved', isSaved);
		saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
		saveBtn.setAttribute('aria-label', isSaved ? 'Unsave this listing' : 'Save this listing');
	}
	syncSaveUI();

	saveBtn && saveBtn.addEventListener('click', () => {
		if (!L.id) return;
		if (savedSet.has(L.id)) {
			savedSet.delete(L.id);
			showToast('Removed from saved');
		} else {
			savedSet.add(L.id);
			showToast('Saved! ❤');
			saveBtn.style.transform = 'scale(1.3)';
			setTimeout(() => saveBtn.style.transform = '', 300);
		}
		syncSaveUI();
		localStorage.setItem(SAVED_KEY, JSON.stringify([...savedSet]));

		/* Optionally persist to server */
		if (L.id) {
			fetch(`/api/listings/${L.id}/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
				.catch(() => { });
		}
	});

	/* ================================================================
	   SHARE BUTTON
	   ================================================================ */
	shareBtn && shareBtn.addEventListener('click', async () => {
		const shareData = {
			title: document.title,
			text: `Check out this listing on SwapNext: ${document.querySelector('h1, .page-heading')?.textContent || ''}`,
			url: window.location.href,
		};
		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(window.location.href);
				showToast('Link copied to clipboard!');
			}
		} catch (_) {
			await navigator.clipboard.writeText(window.location.href).catch(() => { });
			showToast('Link copied!');
		}
	});

	/* ================================================================
	   VIEW COUNT PING
	   ================================================================ */
	if (L.id) {
		/* Ping after 2 seconds (user actually read the page) */
		setTimeout(() => {
			fetch(`/api/listings/${L.id}/view`, { method: 'POST' }).catch(() => { });
		}, 2000);
	}

	/* ================================================================
	   TOAST NOTIFICATION
	   ================================================================ */
	function showToast(msg) {
		let t = document.querySelector('.sn-toast');
		if (!t) {
			t = document.createElement('div');
			t.className = 'sn-toast';
			t.setAttribute('role', 'status');
			t.setAttribute('aria-live', 'polite');
			t.style.cssText = `
        position:fixed;bottom:28px;left:50%;
        transform:translateX(-50%);
        background:#222;color:white;
        padding:11px 22px;border-radius:8px;
        font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
        z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);
        animation:toastIn .25s ease;pointer-events:none;`;
		}
		if (!document.getElementById('sn-toast-style')) {
			const s = document.createElement('style');
			s.id = 'sn-toast-style';
			s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
			document.head.appendChild(s);
		}
		t.textContent = msg;
		document.body.appendChild(t);
		clearTimeout(t._timer);
		t._timer = setTimeout(() => t.remove(), 2600);
	}

	/* Smooth opacity on photo load */
	if (mainPhoto) { mainPhoto.style.transition = 'opacity 0.2s'; }

})();
