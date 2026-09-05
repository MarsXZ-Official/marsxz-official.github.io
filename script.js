document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ЛОГИКА ТЕМЫ ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('.theme-icon');
    
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️'; 
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.textContent = '🌙'; 
            localStorage.setItem('theme', 'light');
        }
    };

    const isInitiallyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeIcon.textContent = isInitiallyDark ? '☀️' : '🌙';

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isCurrentlyDark);
    });


    // --- 2. АНИМАЦИЯ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });


    // --- 3. ЖИВОЙ ФОН: ПЛАВНЫЕ СФЕРЫ И РАЗНЫЕ РАЗМЕРЫ ---
    const projectCards = document.querySelectorAll('.glass-card');
    const backgroundShapes = Array.from(document.querySelectorAll('.bg-shape'));

    const getSphereCount = () => {
        const area = window.innerWidth * window.innerHeight;
        if (area >= 1600 * 900) return Math.min(10, backgroundShapes.length);
        if (area >= 1100 * 700) return Math.min(8, backgroundShapes.length);
        return Math.min(6, backgroundShapes.length);
    };

    const activeSphereCount = getSphereCount();
    backgroundShapes.forEach((element, index) => {
        element.hidden = index >= activeSphereCount;
    });
    const activeShapes = backgroundShapes.slice(0, activeSphereCount);

    // ИСПРАВЛЕНИЕ: Генерируем совершенно разные случайные размеры для каждой сферы
    const sphereState = activeShapes.map((element, index) => {
        const isMobile = window.innerWidth <= 768;
        const smallestSide = Math.min(window.innerWidth, window.innerHeight);
        const minSize = isMobile ? 54 : smallestSide >= 850 ? 120 : 90;
        const maxSize = isMobile ? Math.min(130, smallestSide * 0.34) : smallestSide >= 850 ? 280 : 220;
        const randomSize = Math.floor(minSize + Math.random() * Math.max(1, maxSize - minSize));
        
        // Применяем размер напрямую
        element.style.width = `${randomSize}px`;
        element.style.height = `${randomSize}px`;

        return {
            element,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: randomSize / 2,
            mass: 1 + (randomSize / 150)
        };
    });

    const spherePalette = [
        '#ff4d6d', '#ff7a00', '#ffd166', '#06d6a0',
        '#00b4d8', '#3a86ff', '#6c63ff', '#9b5de5',
        '#f15bb5', '#8338ec', '#00f5d4', '#70e000',
        '#ff006e', '#fb5607', '#4361ee', '#2ec4b6',
        '#e76f51', '#e9c46a', '#2a9d8f', '#7b2cbf',
        '#48cae4', '#80ed99', '#ff85a1', '#c77dff'
    ];

    const cssRgb = (hex) => {
        const value = hex.replace('#', '');
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    };

    // ИСПРАВЛЕНИЕ: Теперь цвета переходят плавно, так как мы используем backgroundColor и boxShadow (CSS их анимирует без рывков)
    const setSphereColor = (element, hex) => {
        const { r, g, b } = cssRgb(hex);
        // Заменили radial-gradient на заливку и мощное свечение
        element.style.backgroundColor = `rgba(${r},${g},${b},0.65)`;
        element.style.boxShadow = `0 0 70px 30px rgba(${r},${g},${b},0.45)`;
        element.dataset.color = hex;
    };

    const shuffledPalette = () => {
        const pool = [...spherePalette];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    };

    const assignUniqueColors = (changedCount = sphereState.length) => {
        const pool = shuffledPalette();
        const current = sphereState.map(s => s.element.dataset.color || '');
        const selected = new Set();

        const indexes = [...Array(sphereState.length).keys()];
        for (let i = indexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }

        let candidates = 0;
        for (const index of indexes) {
            if (candidates >= changedCount) break;
            const oldColor = current[index];
            let color = pool.find(c => c !== oldColor && !selected.has(c));
            if (!color) break;
            setSphereColor(sphereState[index].element, color);
            selected.add(color);
            candidates++;
        }

        if (!current.some(Boolean)) {
            sphereState.forEach((sphere, index) => setSphereColor(sphere.element, pool[index]));
        }
    };

    const getSphereSize = (sphere) => {
        const rect = sphere.element.getBoundingClientRect();
        sphere.radius = Math.max(20, rect.width / 2);
        return rect;
    };

    const resetSpherePosition = (sphere) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const r = sphere.radius;
        const margin = Math.min(18, r * 0.2);

        sphere.x = margin + r + Math.random() * Math.max(1, vw - 2 * (r + margin));
        sphere.y = margin + r + Math.random() * Math.max(1, vh - 2 * (r + margin));
    };

    const placeSphereOnGrid = (sphere, index) => {
        const columns = Math.ceil(Math.sqrt(sphereState.length * window.innerWidth / Math.max(1, window.innerHeight)));
        const rows = Math.ceil(sphereState.length / columns);
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellWidth = window.innerWidth / columns;
        const cellHeight = window.innerHeight / rows;
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.32;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.32;

        sphere.x = cellWidth * (column + 0.5) + jitterX;
        sphere.y = cellHeight * (row + 0.5) + jitterY;
        keepInsideBounds(sphere);
    };

    const keepInsideBounds = (sphere) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const bleed = Math.min(22, sphere.radius * 0.16);
        const minX = sphere.radius - bleed;
        const maxX = vw - sphere.radius + bleed;
        const minY = sphere.radius - bleed;
        const maxY = vh - sphere.radius + bleed;

        if (sphere.x < minX) {
            sphere.x = minX;
            sphere.vx = Math.abs(sphere.vx) * 0.92;
        } else if (sphere.x > maxX) {
            sphere.x = maxX;
            sphere.vx = -Math.abs(sphere.vx) * 0.92;
        }

        if (sphere.y < minY) {
            sphere.y = minY;
            sphere.vy = Math.abs(sphere.vy) * 0.92;
        } else if (sphere.y > maxY) {
            sphere.y = maxY;
            sphere.vy = -Math.abs(sphere.vy) * 0.92;
        }
    };

    const separateOverlappingSpheres = () => {
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < sphereState.length; i++) {
                for (let k = i + 1; k < sphereState.length; k++) {
                    const a = sphereState[i];
                    const b = sphereState[k];
                    let dx = b.x - a.x;
                    let dy = b.y - a.y;
                    let distance = Math.hypot(dx, dy);

                    if (distance === 0) {
                        dx = 1; dy = 0; distance = 1;
                    }

                    const minDistance = a.radius + b.radius;
                    if (distance < minDistance) {
                        const overlap = minDistance - distance;
                        const nx = dx / distance;
                        const ny = dy / distance;
                        const totalMass = a.mass + b.mass;

                        const moveA = overlap * (b.mass / totalMass);
                        const moveB = overlap * (a.mass / totalMass);

                        a.x -= nx * moveA;
                        a.y -= ny * moveA;
                        b.x += nx * moveB;
                        b.y += ny * moveB;

                        const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                        if (relativeVelocity < 0) {
                            const impulse = -relativeVelocity * 0.34;
                            a.vx -= impulse * nx * (b.mass / totalMass);
                            a.vy -= impulse * ny * (b.mass / totalMass);
                            b.vx += impulse * nx * (a.mass / totalMass);
                            b.vy += impulse * ny * (a.mass / totalMass);
                        }
                    }
                }
            }
        }
    };

    const initSpheres = () => {
        sphereState.forEach(getSphereSize);

        sphereState.forEach((sphere, index) => {
            let placed = false;
            for (let attempt = 0; attempt < 160 && !placed; attempt++) {
                if (attempt === 0) placeSphereOnGrid(sphere, index);
                else resetSpherePosition(sphere);
                placed = sphereState.slice(0, index).every(other =>
                    Math.hypot(sphere.x - other.x, sphere.y - other.y) >=
                    sphere.radius + other.radius + 8
                );
            }

            if (!placed) resetSpherePosition(sphere);

            const angle = Math.random() * Math.PI * 2;
            const speed = window.innerWidth <= 768
                ? 12 + Math.random() * 10
                : 16 + Math.random() * 14;
            sphere.vx = Math.cos(angle) * speed;
            sphere.vy = Math.sin(angle) * speed;
            sphere.element.style.transform = `translate3d(${sphere.x - sphere.radius}px, ${sphere.y - sphere.radius}px, 0)`;
        });

        separateOverlappingSpheres();
        sphereState.forEach(keepInsideBounds);
    };

    let lastFrame = performance.now();
    const animateSpheres = (now) => {
        const delta = Math.min(0.032, Math.max(0.001, (now - lastFrame) / 1000));
        lastFrame = now;

        sphereState.forEach(sphere => {
            sphere.x += sphere.vx * delta;
            sphere.y += sphere.vy * delta;

            const damping = Math.pow(0.999, delta * 60);
            sphere.vx *= damping;
            sphere.vy *= damping;

            const speed = Math.hypot(sphere.vx, sphere.vy);
            if (speed < 8) {
                const angle = Math.atan2(sphere.vy, sphere.vx) + (Math.random() - 0.5) * 0.25;
                sphere.vx += Math.cos(angle) * 0.55;
                sphere.vy += Math.sin(angle) * 0.55;
            }

            keepInsideBounds(sphere);
        });

        separateOverlappingSpheres();

        sphereState.forEach(sphere => {
            sphere.element.style.transform =
                `translate3d(${sphere.x - sphere.radius}px, ${sphere.y - sphere.radius}px, 0)`;
        });

        requestAnimationFrame(animateSpheres);
    };

    const refreshSphereSizes = () => {
        sphereState.forEach(getSphereSize);
        initSpheres();
    };

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            backgroundShapes.forEach(shape => shape.classList.add('is-interactive'));
        });

        card.addEventListener('mouseleave', () => {
            backgroundShapes.forEach(shape => shape.classList.remove('is-interactive'));
        });

        card.addEventListener('pointerdown', () => {
            projectCards.forEach(otherCard => otherCard.classList.remove('is-selected'));
            card.classList.add('is-selected');
        });
    });

    assignUniqueColors(sphereState.length);
    requestAnimationFrame(() => {
        initSpheres();
        requestAnimationFrame(animateSpheres);
    });

    window.addEventListener('resize', refreshSphereSizes, { passive: true });

    setInterval(() => {
        assignUniqueColors(Math.random() < 0.65 ? 2 : 3);
    }, 11000);


    // --- 4. ЛОГИКА МОБИЛЬНОГО МЕНЮ ---
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.querySelector('.desktop-nav');
    const navMenuLinks = navLinks.querySelectorAll('a');
    const burgerLines = burgerMenu.querySelectorAll('.burger-line');

    const setBurgerVisualState = (isOpen) => {
        const transforms = isOpen
            ? ['rotate(45deg)', 'scaleX(0.3)', 'rotate(-45deg)']
            : ['translateY(-6px)', 'translateY(0)', 'translateY(6px)'];

        burgerLines.forEach((line, index) => {
            line.style.setProperty('transform', transforms[index], 'important');
            line.style.setProperty('opacity', isOpen && index === 1 ? '0' : '1', 'important');
        });
    };

    const toggleMenu = () => {
        navLinks.classList.toggle('open');
        burgerMenu.classList.toggle('open');
        document.body.classList.toggle('no-scroll');
        setBurgerVisualState(burgerMenu.classList.contains('open'));
    };

    burgerMenu.addEventListener('click', toggleMenu);

    navMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // --- 5. ЗАГРУЗКА ВИДЕО С YOUTUBE ---
    const YOUTUBE_CHANNEL_ID = 'UC3w3B0bV1K_yT1_V4vYn9qA'; 
    const LATEST_VIDEOS_COUNT = 3;

    const latestContainer = document.getElementById('youtube-latest');
    const popularContainer = document.getElementById('youtube-popular');

    const createVideoCard = (video) => {
        const videoId = video.id || video.guid.split(':').pop();
        const videoUrl = video.link || `https://www.youtube.com/watch?v=${videoId}`;
        const thumbnailUrl = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        
        const card = document.createElement('a');
        card.href = videoUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'glass-card yt-card fade-in';

        card.innerHTML = `
            <div class="video-wrapper">
                <img src="${thumbnailUrl}" alt="${video.title}" loading="lazy" onerror="this.onerror=null;this.src='https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg';">
                ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
            </div>
            <h4>${video.title}</h4>
        `;
        card.addEventListener('mouseenter', () => backgroundShapes.forEach(s => s.classList.add('is-interactive')));
        card.addEventListener('mouseleave', () => backgroundShapes.forEach(s => s.classList.remove('is-interactive')));
        card.addEventListener('pointerdown', () => {
            document.querySelectorAll('.yt-card').forEach(otherCard => otherCard.classList.remove('is-selected'));
            card.classList.add('is-selected');
        });
        return card;
    };

    const fetchAllVideos = async () => {
        try {
            const response = await fetch(`popular_videos.json?v=${new Date().getTime()}`); 
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json(); 
            
            if (data.latest && data.latest.length > 0) {
                latestContainer.innerHTML = ''; 
                data.latest.forEach(video => {
                    const card = createVideoCard(video);
                    latestContainer.appendChild(card);
                });
                latestContainer.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
            } else {
                latestContainer.innerHTML = '<p class="loading-text">Не удалось загрузить последние видео.</p>';
            }

            if (data.popular && data.popular.length > 0) {
                popularContainer.innerHTML = ''; 
                data.popular.forEach(video => {
                    const card = createVideoCard(video);
                    popularContainer.appendChild(card);
                });
                popularContainer.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
            } else {
                popularContainer.innerHTML = '<p class="loading-text">Не удалось загрузить популярные видео.</p>';
            }

        } catch (error) {
            console.error('Ошибка загрузки видео из JSON:', error);
            latestContainer.innerHTML = '<p class="loading-text">Не удалось загрузить данные о видео.</p>';
            popularContainer.innerHTML = ''; 
        }
    };

    fetchAllVideos();

    // --- 6. АКТИВНАЯ ССЫЛКА В НАВИГАЦИИ ПРИ СКРОЛЛЕ ---
    const navObserverLinks = document.querySelectorAll('.desktop-nav a');
    const sectionsToObserve = document.querySelectorAll('main > section[id]');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navObserverLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px' }); 

    sectionsToObserve.forEach(section => {
        sectionObserver.observe(section);
    });

});
