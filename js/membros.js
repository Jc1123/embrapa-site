document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('membros-grid');
    if(!grid) return;

    try {
        const res = await fetch(`${window.API_BASE}/membros`);
        if (!res.ok) throw new Error('Erro ao buscar membros');
        const membros = await res.json();

        grid.innerHTML = ''; // Limpa loader
        
        if (membros.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-secondary);">Nenhum membro cadastrado ainda.</p>';
            return;
        }

        membros.forEach(membro => {
            const card = document.createElement('div');
            card.className = 'member-card';
            
            // Ícone da Skin do Minecraft
            const skinImg = document.createElement('img');
            // Busca a cabeça 3D do Nick digitado no Minecraft
            skinImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(membro.nick)}/80`;
            skinImg.alt = membro.nick;
            skinImg.className = 'member-skin';
            
            // Fallback caso a skin/nick não exista no Minecraft original
            skinImg.onerror = () => {
                skinImg.src = 'https://mc-heads.net/avatar/Steve/80';
            };

            const h3 = document.createElement('h3');
            h3.textContent = membro.nick;

            const span = document.createElement('span');
            span.textContent = membro.cargo;

            card.appendChild(skinImg);
            card.appendChild(h3);
            card.appendChild(span);
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = '<p style="color: var(--danger-color);">Erro ao carregar lista de membros.</p>';
    }
});