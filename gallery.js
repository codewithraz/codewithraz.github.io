// GreenFort Materials — Project Gallery
// ----------------------------------------------------------------------------
// Photos live in the  images/gallery/  folder.
//
// HOW IT FINDS YOUR PHOTOS (in order):
//   1. The generated list in gallery-images.js  (run ./build-gallery.sh to refresh)
//   2. A live directory listing, when viewed through a local web server
//   3. Numbered files (1.jpg, 2.jpg, 3.jpg, …) as a no-setup fallback
//
// So: drop any photos into images/gallery/, run ./build-gallery.sh, and they
// all appear here automatically — no captions, click any photo to enlarge.
// ----------------------------------------------------------------------------

(function () {
    const GALLERY_PATH = 'images/gallery/';
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const zoomIcon =
        '<span class="zoom-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></span>';

    let images = [];
    let current = 0;
    let autoTimer = null;

    // ---- Load the photo list, then render ------------------------------------
    loadImageList().then((list) => {
        images = list;
        render();
    });

    async function loadImageList() {
        // 1. Generated manifest (works everywhere, incl. GitHub Pages)
        if (Array.isArray(window.GALLERY_IMAGES) && window.GALLERY_IMAGES.length) {
            return window.GALLERY_IMAGES.map((f) => GALLERY_PATH + f);
        }
        // 2. Live directory listing (works on local dev servers like python http.server)
        const listed = await tryDirectoryListing();
        if (listed.length) return listed;
        // 3. Numbered files fallback (1.jpg, 2.jpg, …)
        return await probeNumbered();
    }

    async function tryDirectoryListing() {
        try {
            const res = await fetch(GALLERY_PATH, { cache: 'no-store' });
            if (!res.ok) return [];
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const files = [];
            doc.querySelectorAll('a[href]').forEach((a) => {
                const href = a.getAttribute('href').split('/').pop();
                if (href && /\.(jpe?g|png|webp|gif)$/i.test(href)) {
                    files.push(GALLERY_PATH + decodeURIComponent(href));
                }
            });
            return [...new Set(files)].sort();
        } catch (e) {
            return [];
        }
    }

    function probeNumbered(maxMisses = 3, cap = 300) {
        const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
        const found = [];
        let misses = 0;

        const exists = (src) =>
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = src;
            });

        return (async () => {
            for (let n = 1; misses < maxMisses && n <= cap; n++) {
                let hit = null;
                for (const ext of exts) {
                    const src = `${GALLERY_PATH}${n}.${ext}`;
                    if (await exists(src)) { hit = src; break; }
                }
                if (hit) { found.push(hit); misses = 0; }
                else misses++;
            }
            return found;
        })();
    }

    // ---- Render (auto-scrolling marquee rows) --------------------------------
    function render() {
        grid.innerHTML = '';

        if (!images.length) {
            grid.className = 'gallery-grid';
            grid.innerHTML =
                '<div class="gallery-empty">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' +
                '<h3>Project photos coming soon</h3>' +
                '<p>Add your finished-project images to <code>images/gallery/</code>, then run <code>./build-gallery.sh</code> to publish them here.</p>' +
                '</div>';
            return;
        }

        grid.className = 'gallery-marquee';

        // Decide how many scrolling rows to use
        const rowCount = images.length >= 9 ? 3 : images.length >= 4 ? 2 : 1;
        const rows = Array.from({ length: rowCount }, () => []);
        images.forEach((src, i) => rows[i % rowCount].push(i)); // round-robin

        const makeItem = (i, duplicate) => {
            const item = document.createElement('div');
            item.className = 'marquee-item';
            item.dataset.index = i;
            if (duplicate) item.setAttribute('aria-hidden', 'true');
            item.innerHTML =
                '<img src="' + images[i] + '" alt="GreenFort finished project ' + (i + 1) + '" loading="lazy">' +
                zoomIcon;
            return item;
        };

        rows.forEach((indices, r) => {
            const row = document.createElement('div');
            row.className = 'marquee-row' + (r % 2 === 1 ? ' reverse' : '');

            const track = document.createElement('div');
            track.className = 'marquee-track';
            // Slower for fewer photos, faster cap for many — keeps a steady glide
            track.style.animationDuration = Math.max(28, indices.length * 6) + 's';

            // Two identical sets back-to-back for a seamless infinite loop
            indices.forEach((i) => track.appendChild(makeItem(i, false)));
            indices.forEach((i) => track.appendChild(makeItem(i, true)));

            row.appendChild(track);
            grid.appendChild(row);
        });

        setupLightbox();
    }

    // ---- Lightbox ------------------------------------------------------------
    function setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const counter = document.getElementById('lightboxCounter');
        const btnPrev = lightbox.querySelector('.lightbox-prev');
        const btnNext = lightbox.querySelector('.lightbox-next');
        const btnClose = lightbox.querySelector('.lightbox-close');
        const btnPlay = lightbox.querySelector('.lightbox-play');
        const iconPlay = btnPlay.querySelector('.icon-play');
        const iconPause = btnPlay.querySelector('.icon-pause');

        const multiple = images.length > 1;
        btnPrev.style.display = btnNext.style.display = btnPlay.style.display = multiple ? 'flex' : 'none';

        function show(index) {
            current = (index + images.length) % images.length;
            lightboxImg.src = images[current];
            counter.textContent = current + 1 + ' / ' + images.length;
        }

        function openAt(index) {
            show(index);
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
            stopAuto();
        }

        function startAuto() {
            stopAuto();
            autoTimer = setInterval(() => show(current + 1), 3000);
            iconPlay.style.display = 'none';
            iconPause.style.display = 'block';
        }

        function stopAuto() {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = null;
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
        }

        function toggleAuto() {
            autoTimer ? stopAuto() : startAuto();
        }

        grid.addEventListener('click', (e) => {
            const item = e.target.closest('.marquee-item');
            if (item) openAt(Number(item.dataset.index));
        });

        btnPrev.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
        btnNext.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });
        btnClose.addEventListener('click', close);
        btnPlay.addEventListener('click', (e) => { e.stopPropagation(); toggleAuto(); });

        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (multiple && e.key === 'ArrowLeft') show(current - 1);
            else if (multiple && e.key === 'ArrowRight') show(current + 1);
            else if (multiple && e.key === ' ') { e.preventDefault(); toggleAuto(); }
        });

        // basic swipe support on touch devices
        let touchX = null;
        lightbox.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
        lightbox.addEventListener('touchend', (e) => {
            if (touchX === null || !multiple) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(dx > 0 ? current - 1 : current + 1);
            touchX = null;
        });
    }
})();
