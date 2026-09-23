document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('membros-grid');
    const searchInput = document.getElementById('search-membro');
    const filtersContainer = document.getElementById('filters-container');
    if(!grid) return;

    let todosMembros = []; // Guarda todos os membros para não precisar chamar a API de novo ao filtrar

    // 1. Mostrar Skeletons
    grid.innerHTML = '';
    for(let i=0; i<8; i++) {
        grid.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-badge"></div>
            </div>`;
    }

    try {
        const res = await fetch(`${window.API_BASE}/membros`);
        if (!res.ok) throw new Error('Erro ao buscar membros');
        todosMembros = await res.json();

        // Ordenar por prioridade
        const prioridadeCargos = {
            "Fundador": 0, "Líder": 1, "Builder": 2, "Fazendeiro": 3, "Britadeira": 4, 
            "Minerador": 5, "Rasante": 6, "Slayer": 7, "Pescador": 8, "Alquimista": 9, 
            "Dragão": 10, "Farmer": 11, "Recruta": 12
        };

        todosMembros.sort((a, b) => {
            const prioA = prioridadeCargos[a.cargo] !== undefined ? prioridadeCargos[a.cargo] : 99;
            const prioB = prioridadeCargos[b.cargo] !== undefined ? prioridadeCargos[b.cargo] : 99;
            return prioA - prioB;
        });

        gerarBotoesFiltro(todosMembros);
        renderMembros(todosMembros); // Renderiza a lista completa inicial

    } catch (error) {
        grid.innerHTML = '<p style="color: var(--danger-color); text-align:center; width:100%;">Erro ao carregar lista de membros.</p>';
    }

    // --- FUNÇÃO PARA RENDERIZAR OS CARDS ---
    function renderMembros(lista) {
        grid.innerHTML = ''; 
        if (lista.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">Nenhum membro encontrado.</p>';
            return;
        }

        lista.forEach(membro => {
            const card = document.createElement('div');
            card.className = 'member-card';
            
            const skinImg = document.createElement('img');
            skinImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(membro.nick)}/80`;
            skinImg.alt = membro.nick;
            skinImg.className = 'member-skin';
            skinImg.onerror = () => { skinImg.src = 'https://mc-heads.net/avatar/Steve/80'; };

            const h3 = document.createElement('h3');
            h3.textContent = membro.nick;

            const span = document.createElement('span');
            span.textContent = membro.cargo;
            const classeLimpa = membro.cargo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
            span.className = `cargo-${classeLimpa}`;

            card.appendChild(skinImg);
            card.appendChild(h3);
            card.appendChild(span);
            grid.appendChild(card);
        });
    }

    // --- FUNÇÃO PARA GERAR OS FILTROS ---
    function gerarBotoesFiltro(lista) {
        // Pega todos os cargos únicos que existem atualmente no banco
        const cargosUnicos = [...new Set(lista.map(m => m.cargo))];
        
        cargosUnicos.forEach(cargo => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.cargo = cargo;
            btn.textContent = cargo;
            filtersContainer.appendChild(btn);
        });

        // Adicionar evento de clique nos filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove classe ativa de todos
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Adiciona no clicado
                e.target.classList.add('active');

                const cargoSelecionado = e.target.dataset.cargo;
                filtrarLista(searchInput.value, cargoSelecionado);
            });
        });
    }

    // --- LÓGICA GERAL DE FILTRAGEM ---
    function filtrarLista(termoBusca, cargoSelecionado) {
        let listaFiltrada = todosMembros;

        // Filtra por Cargo
        if (cargoSelecionado !== 'Todos') {
            listaFiltrada = listaFiltrada.filter(m => m.cargo === cargoSelecionado);
        }

        // Filtra por Nick (Busca)
        if (termoBusca.trim() !== '') {
            const termo = termoBusca.toLowerCase();
            listaFiltrada = listaFiltrada.filter(m => m.nick.toLowerCase().includes(termo));
        }

        renderMembros(listaFiltrada);
    }

    // --- EVENTO DE DIGITAÇÃO NA BUSCA ---
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const cargoAtivo = document.querySelector('.filter-btn.active').dataset.cargo;
            filtrarLista(e.target.value, cargoAtivo);
        });
    }
});