let currentFilmId = null;
let currentTranslators = [];
let currentQualities = [];

// Поиск фильма
async function searchFilm() {
    const query = document.getElementById('filmInput').value.trim();
    if (!query) return alert('Введите название фильма');
    
    showLoading(true);
    
    try {
        // Используем CORS proxy для обхода ограничений
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://hdrezka.ag/search/?do=search&subaction=search&q=${query}`)}`);
        const data = await response.json();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        const films = doc.querySelectorAll('.b-content__inline_item');
        if (films.length === 0) {
            alert('Фильмы не найдены');
            return;
        }
        
        displayFilms(films);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при поиске');
    } finally {
        showLoading(false);
    }
}

// Отображение результатов поиска
function displayFilms(films) {
    const filmList = document.getElementById('filmList');
    filmList.innerHTML = '';
    
    films.forEach(film => {
        const title = film.querySelector('.title').textContent;
        const link = film.querySelector('a').href;
        const filmId = link.match(/\/(\d+)-/)[1];
        
        const filmItem = document.createElement('div');
        filmItem.className = 'film-item';
        filmItem.innerHTML = `
            <strong>${title}</strong>
            <br>
            <small>${link}</small>
        `;
        
        filmItem.onclick = () => selectFilm(filmId, link);
        filmList.appendChild(filmItem);
    });
    
    document.getElementById('results').style.display = 'block';
}

// Выбор фильма
async function selectFilm(filmId, filmUrl) {
    currentFilmId = filmId;
    showLoading(true);
    
    try {
        // Получаем информацию о фильме
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(filmUrl)}`);
        const data = await response.json();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Парсим доступные озвучки и качества
        parseTranslatorsAndQualities(doc);
        
        document.getElementById('results').style.display = 'none';
        document.getElementById('playerSection').style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке фильма');
    } finally {
        showLoading(false);
    }
}

// Парсинг озвучек и качеств
function parseTranslatorsAndQualities(doc) {
    // Озвучки
    const translatorSelect = document.getElementById('translatorSelect');
    translatorSelect.innerHTML = '';
    
    const translators = doc.querySelectorAll('.b-translator__item');
    currentTranslators = [];
    
    translators.forEach((translator, index) => {
        const name = translator.textContent.trim();
        const id = translator.getAttribute('data-translator_id');
        
        if (id) {
            currentTranslators.push({ id, name });
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            if (index === 0) option.selected = true;
            translatorSelect.appendChild(option);
        }
    });
    
    // Качества
    const qualitySelect = document.getElementById('qualitySelect');
    qualitySelect.innerHTML = '';
    
    const qualities = doc.querySelectorAll('.b-post__quality-item');
    currentQualities = [];
    
    qualities.forEach((quality, index) => {
        const name = quality.textContent.trim();
        const value = quality.getAttribute('data-quality');
        
        if (value) {
            currentQualities.push({ value, name });
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            if (index === 0) option.selected = true;
            qualitySelect.appendChild(option);
        }
    });
}

// Получение видео ссылки
async function getVideoUrl() {
    const translatorId = document.getElementById('translatorSelect').value;
    const quality = document.getElementById('qualitySelect').value;
    
    showLoading(true);
    
    try {
        // Эмуляция получения ссылки (в реальности нужен бекенд)
        const videoUrl = await simulateGetVideoUrl(currentFilmId, translatorId, quality);
        
        document.getElementById('videoResult').innerHTML = `
            <h3>Ссылка на видео:</h3>
            <textarea readonly style="width: 100%; height: 100px; margin: 10px 0;">${videoUrl}</textarea>
            <br>
            <button onclick="copyToClipboard('${videoUrl}')">Скопировать ссылку</button>
            <button onclick="testVideo('${videoUrl}')">Тестировать видео</button>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при получении ссылки');
    } finally {
        showLoading(false);
    }
}

// Эмуляция получения ссылки (заглушка)
async function simulateGetVideoUrl(filmId, translatorId, quality) {
    // В реальном приложении здесь будет запрос к бекенду
    // который парсит HDRezka и возвращает ссылку
    
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`https://example.com/video/${filmId}_${translatorId}_${quality}.mp4`);
        }, 2000);
    });
}

// Вспомогательные функции
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Ссылка скопирована в буфер обмена');
    });
}

function testVideo(url) {
    window.open(url, '_blank');
}

// Инициализация
document.getElementById('filmInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchFilm();
});
// В script.js добавьте эту функцию
async function getVideoUrlClientSide() {
    // Открываем popup с iframe для парсинга
    const popup = window.open('about:blank', 'parser', 'width=800,height=600');
    
    popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Парсинг HDRezka</title>
        </head>
        <body>
            <div id="status">Загрузка...</div>
            <script>
                // Здесь код для парсинга в popup
                // Это сложнее из-за CORS, но возможно
            <\/script>
        </body>
        </html>
    `);
}
