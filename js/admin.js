document.addEventListener('DOMContentLoaded', () => {
    const els = {
        loginModal: document.getElementById('login-modal'),
        adminPanel: document.getElementById('admin-panel'),
        loginForm: document.getElementById('login-form'),
        adminPass: document.getElementById('admin-pass'),
        logoutBtn: document.getElementById('logout-btn'),
        totalSolicitacoes: document.getElementById('total-solicitacoes'),
        totalCargos: document.getElementById('total-cargos'),
        tbodyPendentes: document.getElementById('tbody-pendentes'),
        tbodyConcluidas: document.getElementById('tbody-concluidas'),
        tbodyMembros: document.getElementById('tbody-membros'),
        tbodyCargos: document.getElementById('tbody-cargos'),

        modalMembro: document.getElementById('modal-novo-membro'),
        modalTitulo: document.getElementById('modal-membro-titulo'),
        formMembro: document.getElementById('form-novo-membro'),
        membroId: document.getElementById('membro-id'),
        novoNick: document.getElementById('novo-nick'),
        novoCargo: document.getElementById('novo-cargo'),
        inputBio: document.getElementById('input-bio'),
        inputData: document.getElementById('input-data'),
        btnNovoMembro: document.getElementById('btn-novo-membro'),
        btnFecharModal: document.getElementById('btn-fechar-modal'),
        btnSalvarMembro: document.getElementById('btn-salvar-membro'),

        modalCargo: document.getElementById('modal-cargo'),
        modalCargoTitulo: document.getElementById('modal-cargo-titulo'),
        formCargo: document.getElementById('form-cargo'),
        cargoNomeOriginal: document.getElementById('cargo-nome-original'),
        cargoNome: document.getElementById('cargo-nome'),
        cargoCor: document.getElementById('cargo-cor'),
        cargoPrioridade: document.getElementById('cargo-prioridade'),
        cargoPreview: document.getElementById('cargo-preview'),
        btnNovoCargo: document.getElementById('btn-novo-cargo'),
        btnFecharCargo: document.getElementById('btn-fechar-cargo'),
        btnSalvarCargo: document.getElementById('btn-salvar-cargo')
    };

    let ultimoFoco = null;
    let cargosCache = [];

    function assertRequiredElements() {
        const required = [
            'loginModal', 'adminPanel', 'loginForm', 'adminPass', 'logoutBtn',
            'modalMembro', 'formMembro', 'membroId', 'novoNick', 'novoCargo',
            'inputBio', 'inputData', 'btnNovoMembro', 'btnFecharModal', 'btnSalvarMembro',
            'modalCargo', 'formCargo', 'cargoNomeOriginal', 'cargoNome', 'cargoCor',
            'cargoPrioridade', 'cargoPreview', 'btnNovoCargo', 'btnFecharCargo', 'btnSalvarCargo'
        ];

        const missing = required.filter(name => !els[name]);

        if (missing.length) {
            console.error('Elementos obrigatórios ausentes no admin.html:', missing);
            window.showToast(`Erro de interface: faltam ${missing.join(', ')}`, true);
            return false;
        }

        return true;
    }

    if (!assertRequiredElements()) return;

    async function checkSession() {
        try {
            await window.apiFetch('/check-auth');

            els.loginModal.classList.remove('active');
            els.loginModal.style.display = 'none';
            els.adminPanel.hidden = false;
            els.adminPanel.style.display = 'flex';

            await initDashboard();
        } catch {
            els.loginModal.style.display = 'flex';
            els.loginModal.classList.add('active');
            els.adminPanel.hidden = true;
            els.adminPanel.style.display = 'none';
            els.adminPass.focus();
        }
    }

    els.loginForm.addEventListener('submit', async event => {
        event.preventDefault();

        const password = els.adminPass.value;
        const btn = els.loginForm.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.textContent = 'Autenticando...';

        try {
            await window.apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ password })
            });

            els.adminPass.value = '';
            await checkSession();
        } catch (error) {
            console.error(error);
            window.showToast('Senha incorreta ou erro de autenticação.', true);
            els.adminPass.value = '';
            els.adminPass.focus();
        } finally {
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });

    els.logoutBtn.addEventListener('click', async () => {
        els.logoutBtn.disabled = true;

        try {
            await window.apiFetch('/check-auth', { method: 'DELETE' });
        } catch (error) {
            console.error(error);
        } finally {
            window.location.reload();
        }
    });

    document.querySelectorAll('.sidebar-menu [data-target]').forEach(tab => {
        tab.addEventListener('click', async () => {
            document.querySelectorAll('.sidebar-menu [data-target]').forEach(item => {
                item.classList.toggle('active', item === tab);
                item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
            });

            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.toggle('active', section.id === tab.dataset.target);
            });

            if (tab.dataset.target === 'sec-solicitacoes') {
                await loadSolicitacoes();
            }

            if (tab.dataset.target === 'sec-membros') {
                await garantirCargosCarregados();
                await loadMembros();
            }

            if (tab.dataset.target === 'sec-cargos') {
                await loadCargos({ renderTable: true });
            }
        });
    });

    async function initDashboard() {
        await Promise.all([
            loadSolicitacoesStats(),
            loadCargos({ renderTable: false })
        ]);
    }

    async function loadSolicitacoesStats() {
        try {
            const data = await window.apiFetch('/solicitacoes');
            if (els.totalSolicitacoes) els.totalSolicitacoes.textContent = String(data.length);
        } catch (error) {
            handleApiError(error, 'Erro ao carregar estatísticas');
            if (els.totalSolicitacoes) els.totalSolicitacoes.textContent = '—';
        }
    }

    async function loadSolicitacoes() {
        if (!els.tbodyPendentes || !els.tbodyConcluidas) return;

        showTableLoading(els.tbodyPendentes, 4);
        els.tbodyConcluidas.textContent = '';

        try {
            const data = await window.apiFetch('/solicitacoes');

            els.tbodyPendentes.textContent = '';
            els.tbodyConcluidas.textContent = '';

            data.forEach(item => {
                const row = createSolicitacaoRow(item);
                (item.status === 'pendente'
                    ? els.tbodyPendentes
                    : els.tbodyConcluidas
                ).appendChild(row);
            });

            ensureEmptyRow(els.tbodyPendentes, 4, 'Nenhuma solicitação pendente.');
            ensureEmptyRow(els.tbodyConcluidas, 4, 'Nenhuma solicitação concluída.');
        } catch (error) {
            handleApiError(error, 'Erro ao carregar solicitações');
            showTableMessage(els.tbodyPendentes, 4, 'Erro ao carregar dados.');
        }
    }

    function createSolicitacaoRow(item) {
        const tr = document.createElement('tr');

        tr.appendChild(createCell(item.nick));
        tr.appendChild(createCell(item.contato));
        tr.appendChild(createCell(formatDateTime(item.created_at)));

        const actionsCell = document.createElement('td');
        actionsCell.appendChild(
            createActionMenu([
                ...(item.status === 'pendente'
                    ? [{
                        label: 'Concluir',
                        onClick: () => updateSolicitacao(item.id, 'concluida')
                    }]
                    : []),
                {
                    label: 'Excluir',
                    danger: true,
                    onClick: () => deleteSolicitacao(item.id)
                }
            ])
        );

        tr.appendChild(actionsCell);
        return tr;
    }

    async function updateSolicitacao(id, status) {
        try {
            await window.apiFetch('/solicitacoes', {
                method: 'PUT',
                body: JSON.stringify({ id, status })
            });

            window.showToast('Solicitação atualizada.');
            await Promise.all([loadSolicitacoes(), loadSolicitacoesStats()]);
        } catch (error) {
            handleApiError(error, 'Erro ao atualizar solicitação');
        }
    }

    async function deleteSolicitacao(id) {
        if (!window.confirm('Certeza que deseja excluir esta solicitação?')) return;

        try {
            await window.apiFetch(`/solicitacoes?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            window.showToast('Solicitação excluída.');
            await Promise.all([loadSolicitacoes(), loadSolicitacoesStats()]);
        } catch (error) {
            handleApiError(error, 'Erro ao excluir solicitação');
        }
    }

    async function loadMembros() {
        if (!els.tbodyMembros) return;

        showTableLoading(els.tbodyMembros, 3);

        try {
            const data = await window.apiFetch('/membros');
            els.tbodyMembros.textContent = '';

            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.appendChild(createCell(item.nick));

                const cargoCell = document.createElement('td');
                cargoCell.appendChild(criarCargoBadge(item.cargo, item.cargo_cor));
                tr.appendChild(cargoCell);

                const actionsCell = document.createElement('td');
                actionsCell.appendChild(
                    createActionMenu([
                        {
                            label: 'Alterar',
                            onClick: () => abrirModalEdicao(item)
                        },
                        {
                            label: 'Excluir',
                            danger: true,
                            onClick: () => deleteMembro(item.id)
                        }
                    ])
                );

                tr.appendChild(actionsCell);
                els.tbodyMembros.appendChild(tr);
            });

            ensureEmptyRow(els.tbodyMembros, 3, 'Nenhum membro cadastrado.');
        } catch (error) {
            handleApiError(error, 'Erro ao carregar membros');
            showTableMessage(els.tbodyMembros, 3, 'Erro ao carregar membros.');
        }
    }

    async function deleteMembro(id) {
        if (!window.confirm('Excluir este membro?')) return;

        try {
            await window.apiFetch(`/membros-admin?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            window.showToast('Membro excluído.');
            await loadMembros();
        } catch (error) {
            handleApiError(error, 'Erro ao excluir membro');
        }
    }

    els.btnNovoMembro.addEventListener('click', async () => {
        ultimoFoco = document.activeElement;
        await garantirCargosCarregados();

        els.modalTitulo.textContent = 'Adicionar Membro';
        els.formMembro.reset();
        els.membroId.value = '';
        preencherSelectCargos('');
        abrirModalMembro();
    });

    async function abrirModalEdicao(membro) {
        ultimoFoco = document.activeElement;
        await garantirCargosCarregados();

        els.modalTitulo.textContent = 'Alterar Membro';
        els.membroId.value = membro.id ?? '';
        els.novoNick.value = membro.nick ?? '';
        preencherSelectCargos(membro.cargo ?? '');
        els.inputBio.value = membro.bio ?? '';
        els.inputData.value = normalizeDateForInput(membro.data_entrou);

        abrirModalMembro();
    }

    function abrirModalMembro() {
        els.modalMembro.classList.add('active');
        els.modalMembro.setAttribute('aria-hidden', 'false');
        els.novoNick.focus();
    }

    function fecharModalMembro() {
        els.modalMembro.classList.remove('active');
        els.modalMembro.setAttribute('aria-hidden', 'true');
        ultimoFoco?.focus?.();
    }

    els.btnFecharModal.addEventListener('click', fecharModalMembro);

    els.modalMembro.addEventListener('click', event => {
        if (event.target === els.modalMembro) fecharModalMembro();
    });

    els.formMembro.addEventListener('submit', async event => {
        event.preventDefault();

        const id = els.membroId.value.trim();
        const dadosMembro = {
            nick: els.novoNick.value.trim(),
            cargo: els.novoCargo.value,
            bio: els.inputBio.value.trim(),
            data_entrou: els.inputData.value
        };

        if (!dadosMembro.nick || !dadosMembro.cargo) {
            window.showToast('Nick e cargo são obrigatórios.', true);
            return;
        }

        els.btnSalvarMembro.disabled = true;
        els.btnSalvarMembro.textContent = 'Salvando...';

        try {
            if (id) dadosMembro.id = id;

            await window.apiFetch('/membros-admin', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(dadosMembro)
            });

            window.showToast(id ? 'Membro alterado com sucesso!' : 'Membro adicionado!');
            els.formMembro.reset();
            els.membroId.value = '';
            fecharModalMembro();
            await loadMembros();
        } catch (error) {
            handleApiError(error, 'Erro ao salvar membro');
        } finally {
            els.btnSalvarMembro.disabled = false;
            els.btnSalvarMembro.textContent = 'Salvar Membro';
        }
    });

    async function garantirCargosCarregados() {
        if (cargosCache.length === 0) {
            await loadCargos({ renderTable: false });
        }
    }

    async function loadCargos({ renderTable = true } = {}) {
        if (renderTable && els.tbodyCargos) {
            showTableLoading(els.tbodyCargos, 4);
        }

        try {
            cargosCache = await window.apiFetch('/cargos');
            cargosCache.sort(ordenarCargos);
            preencherSelectCargos(els.novoCargo.value);

            if (els.totalCargos) {
                els.totalCargos.textContent = String(cargosCache.length);
            }

            if (renderTable && els.tbodyCargos) {
                renderCargosTable();
            }
        } catch (error) {
            handleApiError(error, 'Erro ao carregar cargos');
            if (els.totalCargos) els.totalCargos.textContent = '—';
            if (renderTable && els.tbodyCargos) {
                showTableMessage(els.tbodyCargos, 4, 'Erro ao carregar cargos.');
            }
        }
    }

    function ordenarCargos(a, b) {
        return Number(a.prioridade) - Number(b.prioridade) ||
            a.nome.localeCompare(b.nome, 'pt-BR');
    }

    function preencherSelectCargos(valorSelecionado = '') {
        els.novoCargo.textContent = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = cargosCache.length
            ? 'Selecione um cargo'
            : 'Nenhum cargo cadastrado';
        els.novoCargo.appendChild(placeholder);

        cargosCache
            .slice()
            .sort(ordenarCargos)
            .forEach(cargo => {
                const option = document.createElement('option');
                option.value = cargo.nome;
                option.textContent = `${cargo.prioridade}. ${cargo.nome}`;
                els.novoCargo.appendChild(option);
            });

        els.novoCargo.value = valorSelecionado;
    }

    function renderCargosTable() {
        els.tbodyCargos.textContent = '';

        cargosCache
            .slice()
            .sort(ordenarCargos)
            .forEach(cargo => {
                const tr = document.createElement('tr');
                tr.appendChild(createCell(cargo.prioridade));

                const nameCell = document.createElement('td');
                nameCell.appendChild(criarCargoBadge(cargo.nome, cargo.cor));
                tr.appendChild(nameCell);

                const colorCell = document.createElement('td');
                const colorWrap = document.createElement('div');
                colorWrap.className = 'cargo-color-cell';

                const swatch = document.createElement('span');
                swatch.className = 'cargo-color-swatch';
                swatch.style.backgroundColor = cargo.cor;

                const code = document.createElement('code');
                code.textContent = cargo.cor;

                colorWrap.append(swatch, code);
                colorCell.appendChild(colorWrap);
                tr.appendChild(colorCell);

                const actionsCell = document.createElement('td');
                actionsCell.appendChild(
                    createActionMenu([
                        {
                            label: 'Alterar',
                            onClick: () => abrirModalEdicaoCargo(cargo)
                        },
                        {
                            label: 'Excluir',
                            danger: true,
                            onClick: () => deleteCargo(cargo.nome)
                        }
                    ])
                );

                tr.appendChild(actionsCell);
                els.tbodyCargos.appendChild(tr);
            });

        ensureEmptyRow(els.tbodyCargos, 4, 'Nenhum cargo cadastrado.');
    }

    els.btnNovoCargo.addEventListener('click', () => {
        ultimoFoco = document.activeElement;
        els.modalCargoTitulo.textContent = 'Adicionar Cargo';
        els.formCargo.reset();
        els.cargoNomeOriginal.value = '';
        els.cargoCor.value = '#B2B2C0';
        els.cargoPrioridade.value = String(proximaPrioridade());
        atualizarPreviewCargo();
        abrirModalCargo();
    });

    function abrirModalEdicaoCargo(cargo) {
        ultimoFoco = document.activeElement;
        els.modalCargoTitulo.textContent = 'Alterar Cargo';
        els.cargoNomeOriginal.value = cargo.nome;
        els.cargoNome.value = cargo.nome;
        els.cargoCor.value = normalizarCor(cargo.cor);
        els.cargoPrioridade.value = String(cargo.prioridade);
        atualizarPreviewCargo();
        abrirModalCargo();
    }

    function abrirModalCargo() {
        els.modalCargo.classList.add('active');
        els.modalCargo.setAttribute('aria-hidden', 'false');
        els.cargoNome.focus();
    }

    function fecharModalCargo() {
        els.modalCargo.classList.remove('active');
        els.modalCargo.setAttribute('aria-hidden', 'true');
        ultimoFoco?.focus?.();
    }

    els.btnFecharCargo.addEventListener('click', fecharModalCargo);

    els.modalCargo.addEventListener('click', event => {
        if (event.target === els.modalCargo) fecharModalCargo();
    });

    els.cargoNome.addEventListener('input', atualizarPreviewCargo);
    els.cargoCor.addEventListener('input', atualizarPreviewCargo);

    els.formCargo.addEventListener('submit', async event => {
        event.preventDefault();

        const nomeAtual = els.cargoNomeOriginal.value.trim();
        const dadosCargo = {
            nome: els.cargoNome.value.trim(),
            cor: els.cargoCor.value.toUpperCase(),
            prioridade: Number(els.cargoPrioridade.value)
        };

        if (
            !dadosCargo.nome ||
            !/^#[0-9A-F]{6}$/.test(dadosCargo.cor) ||
            !Number.isInteger(dadosCargo.prioridade) ||
            dadosCargo.prioridade < 1 ||
            dadosCargo.prioridade > 9999
        ) {
            window.showToast('Revise nome, cor e prioridade do cargo.', true);
            return;
        }

        els.btnSalvarCargo.disabled = true;
        els.btnSalvarCargo.textContent = 'Salvando...';

        try {
            if (nomeAtual) dadosCargo.nome_atual = nomeAtual;

            await window.apiFetch('/cargos', {
                method: nomeAtual ? 'PUT' : 'POST',
                body: JSON.stringify(dadosCargo)
            });

            window.showToast(nomeAtual ? 'Cargo alterado com sucesso!' : 'Cargo criado com sucesso!');
            fecharModalCargo();
            await loadCargos({ renderTable: true });
            await loadMembros();
        } catch (error) {
            handleApiError(error, 'Erro ao salvar cargo');
        } finally {
            els.btnSalvarCargo.disabled = false;
            els.btnSalvarCargo.textContent = 'Salvar Cargo';
        }
    });

    async function deleteCargo(nome) {
        if (!window.confirm(`Excluir o cargo "${nome}"?`)) return;

        try {
            await window.apiFetch(`/cargos?nome=${encodeURIComponent(nome)}`, {
                method: 'DELETE'
            });

            window.showToast('Cargo excluído.');
            await loadCargos({ renderTable: true });
        } catch (error) {
            handleApiError(error, 'Erro ao excluir cargo');
        }
    }

    function proximaPrioridade() {
        if (!cargosCache.length) return 1;
        const maior = Math.max(...cargosCache.map(cargo => Number(cargo.prioridade) || 0));
        return Math.min(maior + 1, 9999);
    }

    function atualizarPreviewCargo() {
        els.cargoPreview.textContent = els.cargoNome.value.trim() || 'Novo Cargo';
        aplicarCorCargo(els.cargoPreview, els.cargoCor.value);
    }

    function criarCargoBadge(nome, cor) {
        const badge = document.createElement('span');
        badge.className = 'cargo-badge';
        badge.textContent = nome || 'Sem cargo';
        aplicarCorCargo(badge, cor);
        return badge;
    }

    function aplicarCorCargo(elemento, cor) {
        const hex = normalizarCor(cor);
        elemento.style.setProperty('--cargo-color', hex);
        elemento.style.setProperty('--cargo-contrast', corDeContraste(hex));
    }

    function normalizarCor(cor) {
        return /^#[0-9a-fA-F]{6}$/.test(String(cor || ''))
            ? String(cor).toUpperCase()
            : '#B2B2C0';
    }

    function corDeContraste(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminancia > 0.58 ? '#111111' : '#FFFFFF';
    }

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;

        if (els.modalCargo.classList.contains('active')) {
            fecharModalCargo();
            return;
        }

        if (els.modalMembro.classList.contains('active')) {
            fecharModalMembro();
        }
    });

    function createCell(value) {
        const td = document.createElement('td');
        td.textContent = value == null ? '' : String(value);
        return td;
    }

    function createActionMenu(actions) {
        const wrapper = document.createElement('div');
        wrapper.className = 'action-menu';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'action-trigger';
        trigger.textContent = '⋮';
        trigger.setAttribute('aria-label', 'Abrir menu de ações');
        trigger.setAttribute('aria-expanded', 'false');

        const dropdown = document.createElement('div');
        dropdown.className = 'action-dropdown';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = action.label;
            if (action.danger) button.classList.add('text-danger');

            button.addEventListener('click', async () => {
                closeAllActionMenus();
                await action.onClick();
            });

            dropdown.appendChild(button);
        });

        trigger.addEventListener('click', event => {
            event.stopPropagation();

            const shouldOpen = !wrapper.classList.contains('open');
            closeAllActionMenus();

            if (shouldOpen) {
                const rect = trigger.getBoundingClientRect();
                const estimatedMenuHeight = Math.max(52, actions.length * 44 + 8);
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                wrapper.classList.toggle(
                    'open-up',
                    spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow
                );
            }

            wrapper.classList.toggle('open', shouldOpen);
            trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        });

        wrapper.append(trigger, dropdown);
        return wrapper;
    }

    function closeAllActionMenus() {
        document.querySelectorAll('.action-menu.open').forEach(menu => {
            menu.classList.remove('open', 'open-up');
            menu.querySelector('.action-trigger')?.setAttribute('aria-expanded', 'false');
        });
    }

    document.addEventListener('click', closeAllActionMenus);

    function showTableLoading(tbody, colspan) {
        showTableMessage(tbody, colspan, 'Carregando...');
    }

    function showTableMessage(tbody, colspan, message) {
        tbody.textContent = '';
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colspan;
        td.className = 'table-message';
        td.textContent = message;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    function ensureEmptyRow(tbody, colspan, message) {
        if (!tbody.children.length) {
            showTableMessage(tbody, colspan, message);
        }
    }

    function formatDateTime(value) {
        if (!value) return '—';

        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleString('pt-BR');
    }

    function normalizeDateForInput(value) {
        if (!value) return '';

        const stringValue = String(value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return stringValue;

        const br = stringValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        return br ? `${br[3]}-${br[2]}-${br[1]}` : '';
    }

    function handleApiError(error, fallback) {
        console.error(error);

        if (error?.status === 401) {
            window.showToast('Sua sessão expirou. Entre novamente.', true);
            els.adminPanel.hidden = true;
            els.adminPanel.style.display = 'none';
            els.loginModal.style.display = 'flex';
            els.loginModal.classList.add('active');
            return;
        }

        window.showToast(error?.message || fallback, true);
    }

    checkSession();
});
