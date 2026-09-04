/* ============================================================
   STUPIDO STUDIOS — shared behavior
   Identical on every page. Content comes from data-* attributes,
   so galleries and lightboxes never need page-specific JS.
   ============================================================ */
(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;

    /* ---------- Loading screen ---------- */
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        window.addEventListener('load', () => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 900);
        });
    }

    /* ---------- Signature ink-thread canvas ---------- */
    const canvas = document.getElementById('ink-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h, nodes, pointer = { x: -9999, y: -9999 };
        const NODE_COUNT = window.innerWidth < 720 ? 34 : 68;
        const LINK_DIST = 150;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        function makeNodes() {
            nodes = Array.from({ length: NODE_COUNT }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                gold: Math.random() > 0.5,
            }));
        }
        resize();
        makeNodes();
        window.addEventListener('resize', () => { resize(); makeNodes(); });
        window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
        window.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });

        function step() {
            ctx.clearRect(0, 0, w, h);
            for (const n of nodes) {
                n.x += n.vx; n.y += n.vy;
                const dx = n.x - pointer.x, dy = n.y - pointer.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 140) {
                    const force = (140 - dist) / 140 * 0.6;
                    n.vx += (dx / (dist || 1)) * force * 0.02;
                    n.vy += (dy / (dist || 1)) * force * 0.02;
                }
                n.vx *= 0.985; n.vy *= 0.985;
                if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20;
                if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20;
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < LINK_DIST) {
                        const alpha = (1 - d / LINK_DIST) * 0.35;
                        ctx.strokeStyle = a.gold ? `rgba(212,175,55,${alpha})` : `rgba(185,140,255,${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const n of nodes) {
                ctx.beginPath();
                ctx.fillStyle = n.gold ? 'rgba(243,213,142,0.55)' : 'rgba(185,140,255,0.55)';
                ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let animationFrame = null;
        let canvasRunning = false;

        function startCanvas() {
            if (prefersReducedMotion || canvasRunning || document.hidden) return;
            canvasRunning = true;
            const loop = () => {
                if (!canvasRunning || document.hidden) {
                    animationFrame = null;
                    return;
                }
                step();
                animationFrame = requestAnimationFrame(loop);
            };
            loop();
        }

        function stopCanvas() {
            canvasRunning = false;
            if (animationFrame !== null) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        }

        if (prefersReducedMotion) {
            step();
        } else {
            startCanvas();
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) stopCanvas();
                else startCanvas();
            });
        }
    }

    /* ---------- Reveal on scroll ---------- */
    const revealItems = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });
    revealItems.forEach((item) => revealObserver.observe(item));

    /* ---------- Header scroll state + hero parallax ---------- */
    const header = document.querySelector('.site-header');
    const heroContent = document.querySelector('.hero-content');
    const heroPlate = document.querySelector('.hero-plate');
    const handleScroll = () => {
        const scrolled = window.scrollY;
        header?.classList.toggle('scrolled', scrolled > 24);
        if (heroContent) {
            const progress = Math.min(scrolled / 420, 1);
            heroContent.style.transform = `translate3d(0, ${progress * 20}px, 0)`;
            heroContent.style.filter = `blur(${progress * 2.5}px)`;
            heroContent.style.opacity = String(1 - progress * 0.6);
        }
    };
    window.addEventListener('scroll', () => window.requestAnimationFrame(handleScroll), { passive: true });
    handleScroll();

    if (heroPlate && !isCoarse) {
        document.querySelector('.hero')?.addEventListener('mousemove', (event) => {
            const x = (event.clientX - window.innerWidth / 2) / 40;
            const y = (event.clientY - window.innerHeight / 2) / 40;
            heroPlate.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
        });
        document.querySelector('.hero')?.addEventListener('mouseleave', () => {
            heroPlate.style.transform = '';
        });
    }

    /* ---------- Mobile nav ---------- */
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.querySelector('.site-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    menuToggle?.addEventListener('click', () => {
        const open = siteNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            siteNav?.classList.remove('open');
            menuToggle?.setAttribute('aria-expanded', 'false');
        });
    });

    /* ---------- Active section highlighting (home only, harmless elsewhere) ---------- */
    const activeNavLink = document.querySelector('.site-nav .nav-link.active');
    const sections = document.querySelectorAll('main section[id]');
    // Section highlighting is a home-page concern. Gallery subpages retain
    // their explicit page-level active link while scrolling.
    if (sections.length && activeNavLink?.getAttribute('href')?.includes('#')) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((link) => {
                    const href = link.getAttribute('href') || '';
                    if (!href.includes('#')) return;
                    const target = href.split('#')[1];
                    if (!target) return;
                    link.classList.toggle('active', target === entry.target.id);
                });
            });
        }, { threshold: 0.45 });
        sections.forEach((section) => sectionObserver.observe(section));
    }

    /* ---------- Custom cursor ---------- */
    if (!isCoarse) {
        const cursorDot = document.createElement('div');
        const cursorFollower = document.createElement('div');
        const cursorLabel = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        cursorFollower.className = 'cursor-follower';
        cursorLabel.className = 'cursor-label';
        document.body.append(cursorDot, cursorFollower, cursorLabel);

        let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        let fx = cx, fy = cy;
        const update = () => {
            fx += (cx - fx) * 0.15; fy += (cy - fy) * 0.15;
            cursorDot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
            cursorFollower.style.transform = `translate(${fx}px, ${fy}px) translate(-50%,-50%)`;
            cursorLabel.style.transform = `translate(${cx}px, ${cy}px) translate(12px,-26px)`;
            requestAnimationFrame(update);
        };
        update();
        document.addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; });

        const bindCursor = () => {
            document.querySelectorAll('button, a, .plate, .lightbox-close, .filter-chip').forEach((el) => {
                el.addEventListener('mouseenter', () => {
                    cursorFollower.classList.add('active');
                    cursorDot.classList.add('active');
                    if (el.classList.contains('plate')) {
                        cursorLabel.textContent = 'View';
                        cursorLabel.classList.add('visible');
                    }
                });
                el.addEventListener('mouseleave', () => {
                    cursorFollower.classList.remove('active');
                    cursorDot.classList.remove('active');
                    cursorLabel.classList.remove('visible');
                });
            });
        };
        bindCursor();
    }

    /* ---------- Magnetic buttons ---------- */
    if (!isCoarse) {
        document.querySelectorAll('.magnetic').forEach((button) => {
            button.addEventListener('mousemove', (event) => {
                const rect = button.getBoundingClientRect();
                const offsetX = event.clientX - rect.left - rect.width / 2;
                const offsetY = event.clientY - rect.top - rect.height / 2;
                button.style.transform = `translate(${offsetX * 0.08}px, ${offsetY * 0.08}px)`;
            });
            button.addEventListener('mouseleave', () => { button.style.transform = ''; });
        });
    }
    document.querySelectorAll('.btn, .filter-chip').forEach((button) => {
        button.addEventListener('click', () => {
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 220);
        });
    });

    /* ---------- Card tilt ---------- */
    if (!isCoarse) {
        document.querySelectorAll('.plate').forEach((card) => {
            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left, y = event.clientY - rect.top;
                card.style.setProperty('--pointer-x', `${x}px`);
                card.style.setProperty('--pointer-y', `${y}px`);
                card.style.transform = `perspective(900px) rotateX(${(0.5 - y / rect.height) * 5}deg) rotateY(${(x / rect.width - 0.5) * 6}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.removeProperty('--pointer-x');
                card.style.removeProperty('--pointer-y');
                card.style.transform = '';
            });
        });
    }

    /* ---------- Gallery filtering (data-driven, generic) ---------- */
    const filterChips = document.querySelectorAll('.filter-chip');
    const plates = Array.from(document.querySelectorAll('.plate'));
    let visiblePlates = plates.slice();

    function applyFilter(selected) {
        plates.forEach((card) => {
            const match = selected === 'all' || card.dataset.category === selected;
            card.style.display = match ? 'flex' : 'none';
        });
        visiblePlates = plates.filter((c) => c.style.display !== 'none');
    }
    filterChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            filterChips.forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            applyFilter(chip.dataset.filter);
        });
    });
    applyFilter('all');

    /* ---------- Lightbox (generic, reads data-* from whichever plate was clicked) ---------- */
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        const lightboxMeta = document.getElementById('lightbox-meta');
        const lightboxCard = lightbox.querySelector('.lightbox-card');
        const lightboxClose = document.querySelector('.lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        const lightboxZoom = document.getElementById('lightbox-zoom');
        let currentIndex = 0;
        let zoomed = false;
        let lastFocusedElement = null;

        const focusableSelector = [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        function readItem(card) {
            const image = card.querySelector('.plate-visual img');
            return {
                title: card.dataset.title,
                description: card.dataset.description,
                image: card.dataset.image || image?.currentSrc || image?.src,
                medium: card.dataset.medium,
                year: card.dataset.year,
                dimensions: card.dataset.dimensions,
                category: card.dataset.category,
            };
        }

        function focusFirstControl() {
            requestAnimationFrame(() => lightboxClose?.focus());
        }

        function openLightbox(index, trigger = null) {
            const card = visiblePlates[index];
            if (!card) return;
            if (!lightbox.classList.contains('active')) {
                lastFocusedElement = trigger || document.activeElement;
            }
            currentIndex = index;
            const item = readItem(card);
            lightboxImage.replaceChildren();
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.title || '';
                img.sizes = '(max-width: 720px) 92vw, 880px';
                lightboxImage.appendChild(img);
            }
            lightboxTitle.textContent = item.title || '';
            lightboxDescription.textContent = item.description || '';
            lightboxMeta.replaceChildren();
            [['Medium', item.medium], ['Year', item.year], ['Dimensions', item.dimensions], ['Category', item.category]]
                .forEach(([label, value]) => {
                    if (!value) return;
                    const row = document.createElement('div');
                    const strong = document.createElement('strong');
                    strong.textContent = `${label}: `;
                    row.append(strong, value);
                    lightboxMeta.appendChild(row);
                });
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            zoomed = false;
            lightboxImage.style.transform = 'scale(1)';
            focusFirstControl();
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            const returnTarget = lastFocusedElement;
            lastFocusedElement = null;
            if (returnTarget && typeof returnTarget.focus === 'function') {
                requestAnimationFrame(() => returnTarget.focus());
            }
        }

        function trapFocus(event) {
            if (!lightbox.classList.contains('active') || event.key !== 'Tab') return;
            const focusables = Array.from(lightbox.querySelectorAll(focusableSelector))
                .filter((el) => el.offsetParent !== null || el === document.activeElement);
            if (!focusables.length) {
                event.preventDefault();
                lightboxCard?.focus();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        plates.forEach((card) => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', () => {
                const idx = visiblePlates.indexOf(card);
                if (idx >= 0) openLightbox(idx, card);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const idx = visiblePlates.indexOf(card);
                    if (idx >= 0) openLightbox(idx, card);
                }
            });
        });

        lightboxClose?.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            trapFocus(e);
            if (e.defaultPrevented) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight' && visiblePlates.length) {
                openLightbox((currentIndex + 1) % visiblePlates.length);
            }
            if (e.key === 'ArrowLeft' && visiblePlates.length) {
                openLightbox((currentIndex - 1 + visiblePlates.length) % visiblePlates.length);
            }
        });
        lightboxPrev?.addEventListener('click', () => {
            if (visiblePlates.length) openLightbox((currentIndex - 1 + visiblePlates.length) % visiblePlates.length);
        });
        lightboxNext?.addEventListener('click', () => {
            if (visiblePlates.length) openLightbox((currentIndex + 1) % visiblePlates.length);
        });
        lightboxZoom?.addEventListener('click', () => {
            zoomed = !zoomed;
            lightboxImage.style.transform = zoomed ? 'scale(1.08)' : 'scale(1)';
        });
    }

    /* ---------- Contact form (index only, no-op elsewhere) ---------- */
    const form = document.querySelector('.contact-form form');
    const formStatus = document.getElementById('form-status');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = form.querySelector('input[name="name"]').value.trim();
        const email = form.querySelector('input[name="email"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();
        if (!name || !email || !message) {
            formStatus.textContent = 'Please complete every field before sending.';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            formStatus.textContent = 'Please enter a valid email address.';
            return;
        }
        const subject = encodeURIComponent(`Inquiry from ${name}`);
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        window.location.href = `mailto:hello@stupidostudios.art?subject=${subject}&body=${body}`;
        formStatus.textContent = 'Opening your email client to send this along…';
    });

    document.querySelector('.back-to-top')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
