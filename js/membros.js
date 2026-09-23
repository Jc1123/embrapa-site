document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('membros-grid');
    if (!grid) return;

    const searchInput = document.getElementById('search-membro');
    const filtersContainer = document.getElementById('filters-container');
    const modalPerfil = document.getElementById('modal-perfil');
    const btnFecharPerfil = document.getElementById('fechar-perfil');

    let todosMembros = [];
    let cargos = [];
    let cargoMap = new Map();
    let ultimoFoco = null;

    mostrarSkeletons();

    try {
        [todosMembros, cargos] = await Promise.all([
            window.apiFetch('/membros'),
            window.apiFetch('/cargos')
        ]);

        cargos.sort(ordenarCargos);
        cargoMap = new Map(cargos.map(cargo => [cargo.nome, cargo]));
        todosMembros.sort(ordenarMembros);

        gerarBotoesFiltro(cargos);
        renderMembros(todosMembros);
    } catch (error) {
        console.error(error);
        grid.textContent = '';

        const p = document.createElement('p');
        p.className = 'empty-state error-text';
        p.textContent = 'Erro ao carregar lista de membros.';
        grid.appendChild(p);
    }

    function ordenarCargos(a, b) {
        return Number(a.prioridade) - Number(b.prioridade) ||
            a.nome.localeCompare(b.nome, 'pt-BR');
    }

    function ordenarMembros(a, b) {
        const prioA = Number(a.cargo_prioridade ?? cargoMap.get(a.cargo)?.prioridade ?? 9999);
        const prioB = Number(b.cargo_prioridade ?? cargoMap.get(b.cargo)?.prioridade ?? 9999);

        return prioA - prioB ||
            String(a.cargo).localeCompare(String(b.cargo), 'pt-BR') ||
            a.nick.localeCompare(b.nick, 'pt-BR');
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

            const badge = criarCargoBadge(
                membro.cargo,
                membro.cargo_cor ?? cargoMap.get(membro.cargo)?.cor
            );

            card.append(skinImg, h3, badge);
            card.addEventListener('click', () => abrirPerfilModal(membro, skinImg.src));

            grid.appendChild(card);
        });
    }

    function gerarBotoesFiltro(listaCargos) {
        if (!filtersContainer) return;

        filtersContainer.textContent = '';

        const todos = document.createElement('button');
        todos.type = 'button';
        todos.className = 'filter-btn active';
        todos.dataset.cargo = 'Todos';
        todos.textContent = 'Todos';
        filtersContainer.appendChild(todos);

        listaCargos
            .slice()
            .sort(ordenarCargos)
            .forEach(cargo => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'filter-btn cargo-filter';
                btn.dataset.cargo = cargo.nome;
                btn.textContent = cargo.nome;
                aplicarCorCargo(btn, cargo.cor);
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

        const listaFiltrada = todosMembros
            .filter(membro => {
                const correspondeCargo =
                    cargoSelecionado === 'Todos' || membro.cargo === cargoSelecionado;

                const correspondeBusca =
                    !termo || membro.nick.toLocaleLowerCase('pt-BR').includes(termo);

                return correspondeCargo && correspondeBusca;
            })
            .sort(ordenarMembros);

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
            cargo.className = 'cargo-badge';
            aplicarCorCargo(
                cargo,
                membro.cargo_cor ?? cargoMap.get(membro.cargo)?.cor
            );
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

    function criarCargoBadge(nome, cor) {
        const badge = document.createElement('span');
        badge.className = 'cargo-badge';
        badge.textContent = nome || 'Sem cargo';
        aplicarCorCargo(badge, cor);
        return badge;
    }

    function aplicarCorCargo(elemento, cor) {
        const hex = /^#[0-9a-fA-F]{6}$/.test(String(cor || ''))
            ? String(cor).toUpperCase()
            : '#B2B2C0';

        elemento.style.setProperty('--cargo-color', hex);
        elemento.style.setProperty('--cargo-contrast', corDeContraste(hex));
    }

    function corDeContraste(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminancia > 0.58 ? '#111111' : '#FFFFFF';
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
