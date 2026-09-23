// Destaca o link ativo na navegação
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Sistema de Status do Servidor Armageddon
async function checkServer() {
    // verifica se o elemento existe na página atual para não dar erro em outras páginas
    const playersText = document.getElementById('server-players');
    if (!playersText) return; 

    try {
        const res = await fetch('https://api.mcsrvstat.us/3/armamc.com');
        const data = await res.json();
        const dot = document.getElementById('server-dot');

        if (data.online) {
            dot.style.background = '#4ade80'; // Verde
            dot.style.boxShadow = '0 0 15px #4ade80';
            playersText.innerHTML = `<span style="color:#4ade80;">Online</span> • ${data.players.online} / ${data.players.max} jogadores`;
        } else {
            dot.style.background = '#ff3b3b'; // Vermelho
            dot.style.boxShadow = '0 0 15px #ff3b3b';
            playersText.innerHTML = '<span style="color:#ff3b3b;">Offline</span>';
        }
    } catch (e) {
        playersText.innerText = 'Erro ao buscar status';
    }
}

// Executa ao carregar a página e depois a cada 1 minuto
document.addEventListener('DOMContentLoaded', () => {
    checkServer();
    setInterval(checkServer, 60000); 
});
});