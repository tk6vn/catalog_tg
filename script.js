// Конфигурация
const HDREZKA_DOMAINS = [
    'https://hdrezka2vbppy.org',
];

let currentDomain = HDREZKA_DOMAINS[0];
let isAuthenticated = false;
let authCookies = '';

// Проверка доступности доменов
async function checkDomains() {
    for (const domain of HDREZKA_DOMAINS) {
        try {
            const response = await fetch(`${domain}/healthcheck`, {
                method: 'HEAD',
                timeout: 5000
            });
            if (response.status === 200) {
                currentDomain = domain;
                console.log(`Используем домен: ${domain}`);
                return true;
            }
        } catch (error) {
            console.log(`Домен ${domain} недоступен`);
        }
    }
    return false;
}

// Авторизация
async function loginToHdrezka() {
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!login || !password) {
        showAuthStatus('Заполните все поля', 'error');
        return;
    }

    showLoading(true);
    
    try {
        // Получаем CSRF токен
        const csrfResponse = await fetch(`${currentDomain}/login/`, {
            credentials: 'include'
        });
        
        const csrfText = await csrfResponse.text();
        const csrfToken = extractCsrfToken(csrfText);
        
        // Отправляем форму авторизации
        const formData = new URLSearchParams();
        formData.append('login_name', login);
        formData.append('login_password', password);
        formData.append('login_not_save', '0');
        formData.append('login', 'submit');
        
        const authResponse = await fetch(`${currentDomain}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-Token': csrfToken,
                'Referer': `${currentDomain}/login/`
            },
            body: formData,
            credentials: 'include',
            redirect: 'manual'
        });
        
        // Проверяем куки авторизации
        const cookies = authResponse.headers.get('set-cookie');
        if (cookies && cookies.includes('dle_user_id')) {
            authCookies = cookies;
            isAuthenticated = true;
            showAuthStatus('Авторизация успешна!', 'success');
            document.getElementById('authSection').style.display = 'none';
        } else {
            throw new Error('Ошибка авторизации');
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        showAuthStatus('Ошибка авторизации. Проверьте данные.', 'error');
    } finally {
        showLoading(false);
    }
}

// Поиск с авторизацией
async function searchFilm() {
    if (!isAuthenticated) {
        showAuthStatus('Требуется авторизация!', 'error');
        return;
    }
    
    const query = document.getElementById('filmInput').value.trim();
    if (!query) return alert('Введите название фильма');
    
    showLoading(true);
    
    try {
        const searchUrl = `${currentDomain}/search/?do=search&subaction=search&q=${encodeURIComponent(query)}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Cookie': authCookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': currentDomain
            },
            credentials: 'include'
        });
        
        if (response.status === 403) {
            throw new Error('Доступ запрещен. Требуется обновить авторизацию.');
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Проверяем не перенаправило ли нас на страницу входа
        if (doc.querySelector('form[action*="login"]')) {
            isAuthenticated = false;
            throw new Error('Сессия истекла. Требуется повторная авторизация.');
        }
        
        const films = doc.querySelectorAll('.b-content__inline_item');
        if (films.length === 0) {
            alert('Фильмы не найдены');
            return;
        }
        
        displayFilms(films);
        
    } catch (error) {
        console.error('Search error:', error);
        handleSearchError(error);
    } finally {
        showLoading(false);
    }
}

// Вспомогательные функции
function extractCsrfToken(html) {
    const match = html.match(/<input[^>]*name="csrf_token"[^>]*value="([^"]*)"/i);
    return match ? match[1] : '';
}

function showAuthStatus(message, type) {
    const statusEl = document.getElementById('authStatus');
    statusEl.textContent = message;
    statusEl.className = type === 'success' ? 'auth-success' : 'auth-error';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

function handleSearchError(error) {
    if (error.message.includes('авторизация') || error.message.includes('сессия')) {
        showAuthStatus(error.message, 'error');
        document.getElementById('authSection').style.display = 'block';
        isAuthenticated = false;
    } else {
        alert('Ошибка поиска: ' + error.message);
    }
}

// Обновленная функция отображения фильмов
function displayFilms(films) {
    const filmList = document.getElementById('filmList');
    filmList.innerHTML = '';
    
    films.forEach(film => {
        const titleEl = film.querySelector('.title');
        const linkEl = film.querySelector('a');
        
        if (titleEl && linkEl) {
            const title = titleEl.textContent;
            const link = linkEl.href;
            const filmId = extractFilmId(link);
            
            const filmItem = document.createElement('div');
            filmItem.className = 'film-item';
            filmItem.innerHTML = `
                <strong>${title}</strong>
                <br>
                <small>${new URL(link).hostname}</small>
                <br>
                <button onclick="selectFilm('${filmId}', '${link}')">Выбрать этот фильм</button>
            `;
            filmList.appendChild(filmItem);
        }
    });
    
    document.getElementById('results').style.display = 'block';
}

function extractFilmId(url) {
    const match = url.match(/\/(\d+)-[^/]+\.html$/);
    return match ? match[1] : '';
}

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Проверяем доступные домены HDRezka...');
    const domainAvailable = await checkDomains();
    
    if (!domainAvailable) {
        showAuthStatus('Все домены HDRezka недоступны. Попробуйте позже.', 'error');
    }
});
