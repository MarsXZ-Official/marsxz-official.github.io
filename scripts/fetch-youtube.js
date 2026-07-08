const fs = require('fs');

async function fetchFromYouTube(url) {
    const response = await fetch(url);
    const data = await response.json();
 
    if (data.error) {
        throw new Error(data.error.message);
    }
    return (data.items || []).map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
    }));
}

async function fetchAllVideos() {
    const API_KEY = process.env.API_KEY;
    // ВАЖНО: Используем канонический ID канала. 
    // Этот ID (`UC3w...`) является основным для вашего канала @MarsXZ, 
    // в то время как другой (`UCpT...`) мог быть старым или временным. API требует точный ID.
    const CHANNEL_ID = 'UC3w3B0bV1K_yT1_V4vYn9qA';

    if (!API_KEY) {
        console.error('API_KEY не найден. Убедитесь, что он добавлен в GitHub Secrets.');
        process.exit(1);
    }

    // 1. Ссылка для 3-х САМЫХ НОВЫХ видео
    const latestUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&type=video&maxResults=3`;
    
    // 2. Ссылка для 3-х САМЫХ ПОПУЛЯРНЫХ видео (по просмотрам)
    const popularUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=viewCount&type=video&maxResults=3`;

    try {
        console.log('Запрос данных с YouTube...');
        
        const [latestVideos, popularVideos] = await Promise.all([
            fetchFromYouTube(latestUrl),
            fetchFromYouTube(popularUrl)
        ]);

        // Объединяем результаты в один объект
        const result = {
            latest: latestVideos,
            popular: popularVideos,
            updatedAt: new Date().toISOString()
        };

        // Сохраняем в файл popular_videos.json
        fs.writeFileSync('popular_videos.json', JSON.stringify(result, null, 2));
        
        console.log('Готово! Сохранено 3 последних и 3 популярных видео.');
        
    } catch (error) {
        console.error('Ошибка при работе с API:', error);
        process.exit(1);
    }
}

fetchAllVideos();