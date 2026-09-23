document.addEventListener('DOMContentLoaded', async () => {
    const loginModal = document.getElementById('login-modal');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    
    // Verificar Sessão
    async function checkSession() {
        try {
            const res = await fetch(`${window.API_BASE}/check-auth`, { method: 'GET' });
            if (res.ok) {
                loginModal.style.display = 'none';
                adminPanel.style.display = 'flex';
                initDashboard();
            } else {
                loginModal.style.display = 'flex';
                adminPanel.style.display = 'none';
            }
        } catch (e) {
            loginModal.style.display = 'flex';
        }
    }

    // Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-pass').value;
        const btn = loginForm.querySelector('button');
        btn.innerText = 'Autenticando...';
        
        try {
            const res = await fetch(`${window.API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                checkSession();
            } else {
                window.showToast('Senha incorreta', true);
                document.getElementById('admin-pass').value = '';
            }
        } catch (err) {
            window.showToast('Erro de conexão', true);
        } finally {
            btn.innerText = 'Entrar';
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch(`${window.API_BASE}/check-auth`, { method: 'DELETE' });
        window.location.reload();
    });

    // Navegação do Painel
    const tabs = document.querySelectorAll('.sidebar-menu li');
    const sections = document.querySelectorAll('.admin-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
            if (tab.dataset.target === 'sec-solicitacoes') loadSolicitacoes();
            if (tab.dataset.target === 'sec-membros') loadMembros();
        });
    });

    async function initDashboard() {
        loadSolicitacoesStats();
    }

    async function loadSolicitacoesStats() {
        const res = await fetch(`${window.API_BASE}/solicitacoes`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('total-solicitacoes').textContent = data.length;
        }
    }

    // Gerenciar Solicitações
    async function loadSolicitacoes() {
        const tbodyPendentes = document.getElementById('tbody-pendentes');
        const tbodyConcluidas = document.getElementById('tbody-concluidas');
        tbodyPendentes.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
        
        const res = await fetch(`${window.API_BASE}/solicitacoes`);
        if (!res.ok) return;
        const data = await res.json();
        
        tbodyPendentes.innerHTML = '';
        tbodyConcluidas.innerHTML = '';

        data.forEach(item => {
            const tr = document.createElement('tr');
            const dataEnvio = new Date(item.created_at).toLocaleString('pt-BR');
            tr.innerHTML = `
                <td>${item.nick}</td>
                <td>${item.contato}</td>
                <td>${dataEnvio}</td>
                <td>
                    <div class="action-menu">⋮
                        <div class="action-dropdown">
                            ${item.status === 'pendente' ? `<div onclick="updateSolicitacao('${item.id}', 'concluida')">Concluir</div>` : ''}
                            <div class="text-danger" onclick="deleteSolicitacao('${item.id}')">Excluir</div>
                        </div>
                    </div>
                </td>
            `;
            if (item.status === 'pendente') tbodyPendentes.appendChild(tr);
            else tbodyConcluidas.appendChild(tr);
        });
    }

    window.updateSolicitacao = async (id, status) => {
        await fetch(`${window.API_BASE}/solicitacoes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        loadSolicitacoes();
        loadSolicitacoesStats();
    };

    window.deleteSolicitacao = async (id) => {
        if(confirm('Certeza que deseja excluir?')) {
            await fetch(`${window.API_BASE}/solicitacoes?id=${id}`, { method: 'DELETE' });
            loadSolicitacoes();
            loadSolicitacoesStats();
        }
    };

    // Gerenciar Membros Admin
    async function loadMembros() {
        const tbody = document.getElementById('tbody-membros');
        tbody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
        
        const res = await fetch(`${window.API_BASE}/membros`);
        if (!res.ok) return;
        const data = await res.json();
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nick}</td>
                <td>${item.cargo}</td>
                <td>
                    <div class="action-menu">⋮
                        <div class="action-dropdown">
                            <div class="btn-editar" 
                                data-id="${item.id}" 
                                data-nick="${item.nick}" 
                                data-cargo="${item.cargo}" 
                                data-bio="${item.bio || ''}" 
                                data-data="${item.data_entrou || ''}">
                                Alterar
                            </div>
                            <div class="text-danger" onclick="deleteMembro('${item.id}')">Excluir</div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Evento de clique seguro para os botões Alterar gerados dinamicamente
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ds = e.currentTarget.dataset;
                abrirModalEdicao(ds.id, ds.nick, ds.cargo, ds.bio, ds.data);
            });
        });
    }

    window.deleteMembro = async (id) => {
        if(confirm('Excluir este membro?')) {
            await fetch(`${window.API_BASE}/membros-admin?id=${id}`, { method: 'DELETE' });
            loadMembros();
        }
    };

    // Modal de Novo/Alterar Membro
    const modalNovoMembro = document.getElementById('modal-novo-membro');
    
    // Abrir Modal para ADICIONAR
    document.getElementById('btn-novo-membro').addEventListener('click', () => {
        document.getElementById('modal-membro-titulo').innerText = 'Adicionar Membro';
        document.getElementById('form-novo-membro').reset();
        document.getElementById('membro-id').value = ''; 
        modalNovoMembro.classList.add('active');
    });

    // Função para abrir Modal para ALTERAR
    function abrirModalEdicao(id, nick, cargo, bio, dataEntrou) {
        document.getElementById('modal-membro-titulo').innerText = 'Alterar Membro';
        document.getElementById('membro-id').value = id;
        document.getElementById('novo-nick').value = nick;
        document.getElementById('novo-cargo').value = cargo;
        
        // Atribuindo valores aos campos corretos do seu HTML
        document.getElementById('input-bio').value = bio && bio !== 'null' ? bio : '';
        document.getElementById('input-data').value = dataEntrou && dataEntrou !== 'null' ? dataEntrou : '';
        
        modalNovoMembro.classList.add('active');
    }

    // Fechar Modal
    document.getElementById('btn-fechar-modal').addEventListener('click', () => modalNovoMembro.classList.remove('active'));

    // Lógica do botão Salvar (Incluindo Bio e Data)
    document.getElementById('form-novo-membro').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('membro-id').value;
        const btn = document.getElementById('btn-salvar-membro');
        btn.disabled = true;

        const dadosMembro = {
            nick: document.getElementById('novo-nick').value,
            cargo: document.getElementById('novo-cargo').value,
            bio: document.getElementById('input-bio').value,
            data_entrou: document.getElementById('input-data').value
        };

        if (id) {
            dadosMembro.id = id;
        }

        const method = id ? 'PUT' : 'POST';

        const res = await fetch(`${window.API_BASE}/membros-admin`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosMembro)
        });

        if (res.ok) {
            window.showToast(id ? 'Membro alterado com sucesso!' : 'Membro adicionado!');
            document.getElementById('form-novo-membro').reset();
            document.getElementById('membro-id').value = '';
            modalNovoMembro.classList.remove('active');
            loadMembros();
        } else {
            window.showToast('Erro ao salvar membro', true);
        }
        btn.disabled = false;
    });

    checkSession();
});