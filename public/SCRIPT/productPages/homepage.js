document.addEventListener("DOMContentLoaded", () => {
    // --- PART 1: ROW SCROLLING LOGIC ---
    const rows = document.querySelectorAll(".location-row");

    rows.forEach(row => {
        const scroller = row.querySelector(".horizontal-scroller");
        const next = row.querySelector(".next");
        const prev = row.querySelector(".prev");

        if (next && prev) {
            next.addEventListener("click", () => {
                scroller.scrollBy({ left: 450, behavior: "smooth" });
            });

            prev.addEventListener("click", () => {
                scroller.scrollBy({ left: -450, behavior: "smooth" });
            });
        }
    });


        const heartBtns = document.querySelectorAll('.heart-overlay-btn');

        heartBtns.forEach(btn => {
            btn.addEventListener('click', async function(e) {
                // 1. Stop the card link from opening
                e.preventDefault();
                e.stopPropagation();

                const pid = this.dataset.productId;
                const icon = this.querySelector('i');

                try {
                    const res = await fetch(`/api/v1/products/${pid}/watchlist`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });

                    // 2. Handle Login Redirect
                    if (res.status === 401 || res.redirected) {
                        window.location.href = '/api/v1/users/login';
                        return;
                    }

                    if (res.ok) {
                        

                        // 4. Toggle Icons and 'is-saved' class
                        icon.classList.toggle('fa-regular');
                        icon.classList.toggle('fa-solid');
                        icon.classList.toggle('saved');
                        icon.classList.toggle('notSaved');

                        
                    }
                } catch (err) {
                    console.error("Watchlist failed", err);
                }
            });
        });
    
});