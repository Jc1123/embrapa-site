document.addEventListener('DOMContentLoaded', async () => {
    const loginModal = document.getElementById('login-modal');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    
    // Verificar Sessão (Usa o cookie HttpOnly enviando credentials)
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

    // Carregar Dados Dashboard
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
                            <div class="text-danger" onclick="deleteMembro('${item.id}')">Excluir</div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteMembro = async (id) => {
        if(confirm('Excluir este membro?')) {
            await fetch(`${window.API_BASE}/membros-admin?id=${id}`, { method: 'DELETE' });
            loadMembros();
        }
    };

    // Modal de Novo Membro
    const modalNovoMembro = document.getElementById('modal-novo-membro');
    document.getElementById('btn-novo-membro').addEventListener('click', () => modalNovoMembro.classList.add('active'));
    document.getElementById('btn-fechar-modal').addEventListener('click', () => modalNovoMembro.classList.remove('active'));

    document.getElementById('form-novo-membro').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nick = document.getElementById('novo-nick').value;
        const cargo = document.getElementById('novo-cargo').value;
        const btn = document.getElementById('btn-salvar-membro');
        btn.disabled = true;

        const res = await fetch(`${window.API_BASE}/membros-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, cargo })
        });

        if (res.ok) {
            window.showToast('Membro adicionado!');
            document.getElementById('form-novo-membro').reset();
            modalNovoMembro.classList.remove('active');
            loadMembros();
        } else {
            window.showToast('Erro ao salvar membro', true);
        }
        btn.disabled = false;
    });

    // Inicia verificação ao carregar a tela de admin
    checkSession();
});