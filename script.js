document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ЛОГИКА ТЕМЫ ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('.theme-icon');
    
    // Функция установки темы и сохранения выбора
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️'; // Иконка солнца для переключения на светлую
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.textContent = '🌙'; // Иконка луны для переключения на темную
            localStorage.setItem('theme', 'light');
        }
    };

    // Устанавливаем иконку при загрузке. Тема уже применена скриптом в <head>.
    const isInitiallyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeIcon.textContent = isInitiallyDark ? '☀️' : '🌙';

    // Слушатель клика по кнопке
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isCurrentlyDark);
    });


    // --- 2. АНИМАЦИЯ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Элемент появляется, когда видно 15% его площади
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Анимируем только один раз
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });


    // --- 3. ИНТЕРАКТИВНАЯ АНИМАЦИЯ ФОНА ПРИ НАВЕДЕНИИ НА КАРТОЧКИ ---
    const projectCards = document.querySelectorAll('.glass-card');
    const backgroundShapes = document.querySelectorAll('.bg-shape');

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            backgroundShapes.forEach(shape => {
                shape.classList.add('fast-animation');
            });
        });

        card.addEventListener('mouseleave', () => {
            backgroundShapes.forEach(shape => {
                shape.classList.remove('fast-animation');
            });
        });
    });

    // --- 4. ЛОГИКА МОБИЛЬНОГО МЕНЮ ---
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.querySelector('.desktop-nav');
    const navMenuLinks = navLinks.querySelectorAll('a');

    const toggleMenu = () => {
        // .open для анимации меню и иконки бургера
        navLinks.classList.toggle('open');
        burgerMenu.classList.toggle('open');
        // Блокировка скролла страницы при открытом меню
        document.body.classList.toggle('no-scroll');
    };

    burgerMenu.addEventListener('click', toggleMenu);

    // Закрываем меню при клике на любую из ссылок внутри него
    navMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // --- 5. ЗАГРУЗКА ВИДЕО С YOUTUBE ---
    const YOUTUBE_CHANNEL_ID = 'UC3w3B0bV1K_yT1_V4vYn9qA'; // Channel ID для @MarsXZ
    const LATEST_VIDEOS_COUNT = 3;

    const latestContainer = document.getElementById('youtube-latest');
    const popularContainer = document.getElementById('youtube-popular');

    // Функция для создания карточки видео
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
            </div>
            <h4>${video.title}</h4>
        `;
        // Добавляем обработчики для анимации фона
        card.addEventListener('mouseenter', () => backgroundShapes.forEach(s => s.classList.add('fast-animation')));
        card.addEventListener('mouseleave', () => backgroundShapes.forEach(s => s.classList.remove('fast-animation')));
        return card;
    };

    // Загрузка последних видео через RSS
    const fetchLatestVideos = async () => {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
        // Используем прокси для обхода CORS
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                latestContainer.innerHTML = ''; // Очищаем сообщение о загрузке
                const videos = data.items.slice(0, LATEST_VIDEOS_COUNT);
                videos.forEach(video => {
                    const card = createVideoCard(video);
                    latestContainer.appendChild(card);
                });
                // Повторно запускаем IntersectionObserver для новых карточек
                latestContainer.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
            } else {
                throw new Error('Не удалось получить данные RSS');
            }
        } catch (error) {
            console.error('Ошибка загрузки видео с YouTube:', error);
            latestContainer.innerHTML = '<p class="loading-text">Не удалось загрузить видео. Попробуйте обновить страницу.</p>';
        }
    };

    // Загрузка популярных видео через нашу серверлесс-функцию
    const fetchPopularVideos = async () => {
        try {
            // Загружаем статичный JSON файл, который генерируется через GitHub Actions
            const response = await fetch('popular_videos.json'); 
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const videos = await response.json();
            
            popularContainer.innerHTML = ''; // Очищаем
            videos.forEach(video => {
                const card = createVideoCard(video);
                popularContainer.appendChild(card);
            });
            popularContainer.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        } catch (error) {
            console.error('Ошибка загрузки популярных видео:', error);
            popularContainer.innerHTML = '<p class="loading-text">Не удалось загрузить популярные видео.</p>';
        }
    };

    fetchLatestVideos();
    fetchPopularVideos();
});
