document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('membros-grid');
    if (!grid) return;

    const searchInput = document.getElementById('search-membro');
    const filtersContainer = document.getElementById('filters-container');
    const modalPerfil = document.getElementById('modal-perfil');
    const btnFecharPerfil = document.getElementById('fechar-perfil');

    let todosMembros = [];
    let ultimoFoco = null;

    const prioridadeCargos = {
        Fundador: 0,
        Líder: 1,
        Builder: 2,
        Fazendeiro: 3,
        Britadeira: 4,
        Minerador: 5,
        Rasante: 6,
        Slayer: 7,
        Pescador: 8,
        Alquimista: 9,
        Dragão: 10,
        Farmer: 11,
        Recruta: 12
    };

    mostrarSkeletons();

    try {
        todosMembros = await window.apiFetch('/membros');

        todosMembros.sort((a, b) => {
            const prioA = prioridadeCargos[a.cargo] ?? 99;
            const prioB = prioridadeCargos[b.cargo] ?? 99;
            return prioA - prioB || a.nick.localeCompare(b.nick, 'pt-BR');
        });

        gerarBotoesFiltro(todosMembros);
        renderMembros(todosMembros);
    } catch (error) {
        console.error(error);
        grid.textContent = '';

        const p = document.createElement('p');
        p.className = 'empty-state error-text';
        p.textContent = 'Erro ao carregar lista de membros.';
        grid.appendChild(p);
    }

    function mostrarSkeletons() {
        grid.textContent = '';

        for (let i = 0; i < 8; i += 1) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';
            card.setAttribute('aria-hidden', 'true');

            ['skeleton-img', 'skeleton-text', 'skeleton-badge'].forEach(className => {
                const el = document.createElement('div');
                el.className = className;
                card.appendChild(el);
            });

            grid.appendChild(card);
        }
    }

    function cargoClass(cargo) {
        return `cargo-${String(cargo)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`;
    }

    function renderMembros(lista) {
        grid.textContent = '';

        if (lista.length === 0) {
            const p = document.createElement('p');
            p.className = 'empty-state';
            p.textContent = 'Nenhum membro encontrado.';
            grid.appendChild(p);
            return;
        }

        lista.forEach(membro => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'member-card';
            card.setAttribute('aria-label', `Abrir perfil de ${membro.nick}`);

            const skinImg = document.createElement('img');
            skinImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(membro.nick)}/80`;
            skinImg.alt = `Avatar de ${membro.nick}`;
            skinImg.className = 'member-skin';
            skinImg.loading = 'lazy';
            skinImg.decoding = 'async';
            skinImg.onerror = () => {
                skinImg.onerror = null;
                skinImg.src = 'https://mc-heads.net/avatar/Steve/80';
            };

            const h3 = document.createElement('h3');
            h3.textContent = membro.nick;

            const span = document.createElement('span');
            span.textContent = membro.cargo;
            span.className = cargoClass(membro.cargo);

            card.append(skinImg, h3, span);
            card.addEventListener('click', () => abrirPerfilModal(membro, skinImg.src));

            grid.appendChild(card);
        });
    }

    function gerarBotoesFiltro(lista) {
        if (!filtersContainer) return;

        const botaoTodos = filtersContainer.querySelector('[data-cargo="Todos"]');
        filtersContainer.textContent = '';

        if (botaoTodos) {
            botaoTodos.classList.add('active');
            filtersContainer.appendChild(botaoTodos);
        } else {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-btn active';
            btn.dataset.cargo = 'Todos';
            btn.textContent = 'Todos';
            filtersContainer.appendChild(btn);
        }

        const cargosUnicos = [...new Set(lista.map(m => m.cargo).filter(Boolean))];

        cargosUnicos.forEach(cargo => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-btn';
            btn.dataset.cargo = cargo;
            btn.textContent = cargo;
            filtersContainer.appendChild(btn);
        });

        filtersContainer.addEventListener('click', event => {
            const btn = event.target.closest('.filter-btn');
            if (!btn) return;

            filtersContainer.querySelectorAll('.filter-btn').forEach(item => {
                item.classList.toggle('active', item === btn);
            });

            filtrarLista(searchInput?.value || '', btn.dataset.cargo || 'Todos');
        });
    }

    function filtrarLista(termoBusca, cargoSelecionado) {
        const termo = termoBusca.trim().toLocaleLowerCase('pt-BR');

        const listaFiltrada = todosMembros.filter(membro => {
            const correspondeCargo =
                cargoSelecionado === 'Todos' || membro.cargo === cargoSelecionado;

            const correspondeBusca =
                !termo || membro.nick.toLocaleLowerCase('pt-BR').includes(termo);

            return correspondeCargo && correspondeBusca;
        });

        renderMembros(listaFiltrada);
    }

    searchInput?.addEventListener('input', event => {
        const activeBtn = filtersContainer?.querySelector('.filter-btn.active');
        filtrarLista(event.target.value, activeBtn?.dataset.cargo || 'Todos');
    });

    function abrirPerfilModal(membro, skinUrl) {
        if (!modalPerfil) return;

        ultimoFoco = document.activeElement;

        const skin = document.getElementById('perfil-skin');
        const nick = document.getElementById('perfil-nick');
        const cargo = document.getElementById('perfil-cargo');
        const bio = document.getElementById('perfil-bio');
        const data = document.getElementById('perfil-data');

        if (skin) skin.src = skinUrl;
        if (nick) nick.textContent = membro.nick;
        if (cargo) {
            cargo.textContent = membro.cargo;
            cargo.className = cargoClass(membro.cargo);
        }
        if (bio) bio.textContent = membro.bio || 'Sem biografia informada.';
        if (data) data.textContent = formatarData(membro.data_entrou);

        modalPerfil.classList.add('active');
        modalPerfil.setAttribute('aria-hidden', 'false');
        btnFecharPerfil?.focus();
    }

    function fecharPerfilModal() {
        if (!modalPerfil) return;
        modalPerfil.classList.remove('active');
        modalPerfil.setAttribute('aria-hidden', 'true');
        ultimoFoco?.focus?.();
    }

    function formatarData(value) {
        if (!value) return 'Não informada';

        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) return `${match[3]}/${match[2]}/${match[1]}`;

        return String(value);
    }

    btnFecharPerfil?.addEventListener('click', fecharPerfilModal);

    modalPerfil?.addEventListener('click', event => {
        if (event.target === modalPerfil) fecharPerfilModal();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modalPerfil?.classList.contains('active')) {
            fecharPerfilModal();
        }
    });
});
