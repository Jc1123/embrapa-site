// Destaca o link ativo na navegação e inicializa funções globais
document.addEventListener('DOMContentLoaded', () => {
    // 1. Destacar link ativo
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // 2. Iniciar Sistema de Status do Servidor Armageddon
    checkServer();
    setInterval(checkServer, 60000); // Atualiza a cada 1 minuto
});

// Função de verificação do status do servidor (fora do DOMContentLoaded)
async function checkServer() {
    const playersText = document.getElementById('server-players');
    const dot = document.getElementById('server-dot');
    
    // Verifica se os elementos existem na página atual para não dar erro
    if (!playersText || !dot) return; 

    try {
        const res = await fetch('https://api.mcsrvstat.us/3/armamc.com');
        const data = await res.json();

        if (data.online) {
            dot.style.background = '#4ade80'; // Verde
            dot.style.boxShadow = '0 0 15px #4ade80';
            
            const onlineCount = data.players ? data.players.online : '?';
            const maxCount = data.players ? data.players.max : '?';
            
            playersText.innerHTML = `<span style="color:#4ade80;">Online</span> • ${onlineCount} / ${maxCount} jogadores`;
        } else {
            dot.style.background = '#ff3b3b'; // Vermelho
            dot.style.boxShadow = '0 0 15px #ff3b3b';
            playersText.innerHTML = '<span style="color:#ff3b3b;">Offline</span>';
        }
    } catch (e) {
        playersText.innerText = 'Erro ao buscar status';
        if (dot) dot.style.background = '#ff3b3b';
    }
}