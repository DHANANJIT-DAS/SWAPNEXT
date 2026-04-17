// Page loader
    window.addEventListener('load', () => {
      const loader = document.getElementById('pageLoader');
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 400);
    });

    // Toast helper
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    }

    // Description toggle
    function toggleDescription() {
      const text = document.getElementById('descText');
      const btn  = document.getElementById('readMoreBtn');
      const icon = document.getElementById('readMoreIcon');
      const expanded = text.classList.toggle('expanded');
      btn.innerHTML = expanded
        ? 'Show less <i class="fa-solid fa-chevron-up" id="readMoreIcon"></i>'
        : 'Show more <i class="fa-solid fa-chevron-down" id="readMoreIcon"></i>';
    }

    // Wishlist
    function handleWishlist(btn) {
      const icon = document.getElementById('heartIcon');
      const saved = icon.classList.toggle('fa-solid');
      icon.classList.toggle('fa-regular', !saved);
      if (saved) { icon.style.color = '#FF385C'; showToast('❤️ Saved to your wishlist'); }
      else        { icon.style.color = ''; showToast('Removed from wishlist'); }
    }

    // Share
    function handleShare() {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href })
          .catch(() => {});
      } else {
        navigator.clipboard?.writeText(window.location.href)
          .then(() => showToast('🔗 Link copied to clipboard!'))
          .catch(() => showToast('🔗 Copy this link: ' + window.location.href));
      }
    }

    // Gallery modal
    function openGallery()  { document.getElementById('galleryModal').classList.add('open'); }
    function closeGallery() { document.getElementById('galleryModal').classList.remove('open'); }
    document.getElementById('galleryModal').addEventListener('click', function(e) {
      if (e.target === this) closeGallery();
    });

    // Guest counter
    let guests = 1;
    function changeGuests(delta) {
      guests = Math.max(1, Math.min(10, guests + delta));
      document.getElementById('guestCount').textContent = guests;
      document.getElementById('guestLabel').textContent = guests + (guests === 1 ? ' guest' : ' guests');
    }

    // Reserve
    function handleReserve() {
      showToast('✅ Booking request sent! Host will confirm shortly.');
    }

    // Keyboard close for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeGallery();
    });