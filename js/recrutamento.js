document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recrutamento-form');
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const nick = document.getElementById('nick')?.value.trim() || '';
        const contato = document.getElementById('contato')?.value.trim() || '';

        if (!nick || !contato) {
            window.showToast('Por favor, preencha todos os campos.', true);
            return;
        }

        if (nick.length > 32 || contato.length > 120) {
            window.showToast('Revise o tamanho dos campos.', true);
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            await window.apiFetch('/solicitacoes', {
                method: 'POST',
                body: JSON.stringify({ nick, contato })
            });

            window.showToast('Solicitação enviada com sucesso!');
            form.reset();
        } catch (error) {
            console.error(error);
            window.showToast(error.message || 'Erro ao comunicar com o servidor.', true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar Solicitação';
        }
    });
});
