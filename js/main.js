document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('nav a[href]').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    checkServer();

    const intervalId = setInterval(() => {
        if (!document.hidden) checkServer();
    }, 60000);

    window.addEventListener('beforeunload', () => clearInterval(intervalId));
});

async function checkServer() {
    const playersText = document.getElementById('server-players');
    const dot = document.getElementById('server-dot');

    if (!playersText || !dot) return;

    try {
        const res = await fetch(
            `https://api.mcsrvstat.us/3/armamc.com?t=${Date.now()}`,
            { cache: 'no-store' }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        playersText.textContent = '';

        const status = document.createElement('span');

        if (data.online) {
            dot.className = 'server-dot online';
            status.className = 'server-label online';
            status.textContent = 'Online';

            const onlineCount = Number.isFinite(data.players?.online)
                ? data.players.online
                : '?';

            const maxCount = Number.isFinite(data.players?.max)
                ? data.players.max
                : '?';

            playersText.append(
                status,
                document.createTextNode(` • ${onlineCount} / ${maxCount} jogadores`)
            );
        } else {
            dot.className = 'server-dot offline';
            status.className = 'server-label offline';
            status.textContent = 'Offline';
            playersText.appendChild(status);
        }
    } catch (error) {
        console.error('Erro ao consultar servidor:', error);
        dot.className = 'server-dot offline';
        playersText.textContent = 'Erro ao buscar status';
    }
}
