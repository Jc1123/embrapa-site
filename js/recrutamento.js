document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recrutamento-form');
    if(!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nick = document.getElementById('nick').value.trim();
        const contato = document.getElementById('contato').value.trim();
        const btn = form.querySelector('button');

        if (!nick || !contato) {
            window.showToast('Por favor, preencha todos os campos.', true);
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Enviando...';

        try {
            const res = await fetch(`${window.API_BASE}/solicitacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nick, contato })
            });

            if (res.ok) {
                window.showToast('Solicitação enviada com sucesso!');
                form.reset();
            } else {
                throw new Error('Erro ao enviar.');
            }
        } catch (error) {
            window.showToast('Erro ao comunicar com o servidor.', true);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Enviar Solicitação';
        }
    });
});