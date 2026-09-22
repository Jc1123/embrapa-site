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

        // --- SISTEMA DE PRIORIDADE DE CARGOS ---
        const prioridadeCargos = {
            "Fundador": 0, // Adicionado com base nos prints anteriores
            "Líder": 1,
            "Builder": 2,
            "Fazendeiro": 3,
            "Britadeira": 4,
            "Minerador": 5,
            "Rasante": 6,
            "Slayer": 7,
            "Pescador": 8,
            "Alquimista": 9,
            "Dragão": 10,
            "Farmer": 11,
            "Recruta": 12
        };

        // Ordena os membros do menor número (maior prioridade) para o maior
        membros.sort((a, b) => {
            const prioA = prioridadeCargos[a.cargo] !== undefined ? prioridadeCargos[a.cargo] : 99;
            const prioB = prioridadeCargos[b.cargo] !== undefined ? prioridadeCargos[b.cargo] : 99;
            return prioA - prioB;
        });

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
            
            // --- ATRIBUIÇÃO DE CLASSE PARA COR ---
            // Transforma "Líder" em "cargo-lider", "Dragão" em "cargo-dragao", etc.
            const classeLimpa = membro.cargo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
            span.className = `cargo-${classeLimpa}`;

            card.appendChild(skinImg);
            card.appendChild(h3);
            card.appendChild(span);
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = '<p style="color: var(--danger-color);">Erro ao carregar lista de membros.</p>';
    }
});