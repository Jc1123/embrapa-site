import {
    supabase,
    checkAuthMiddleware,
    methodNotAllowed,
    normalizeText,
    requireId,
    setNoStore
} from './_utils.js';

const STATUS_VALIDOS = new Set(['pendente', 'concluida']);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const nick = normalizeText(req.body?.nick, { min: 1, max: 32 });
        const contato = normalizeText(req.body?.contato, { min: 2, max: 120 });

        if (!nick || !contato) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const { error } = await supabase
            .from('solicitacoes')
            .insert([{ nick, contato, status: 'pendente' }]);

        if (error) {
            console.error('Erro ao salvar solicitação:', error);
            return res.status(500).json({ error: 'Erro ao salvar' });
        }

        return res.status(201).json({ success: true });
    }

    setNoStore(res);

    if (!checkAuthMiddleware(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('solicitacoes')
            .select('id, nick, contato, status, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
            return res.status(500).json({ error: 'Erro ao buscar solicitações' });
        }

        return res.status(200).json(data ?? []);
    }

    if (req.method === 'PUT') {
        const id = requireId(req.body?.id);
        const status = normalizeText(req.body?.status, { min: 1, max: 20 });

        if (!id || !status || !STATUS_VALIDOS.has(status)) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const { error } = await supabase
            .from('solicitacoes')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Erro ao atualizar solicitação:', error);
            return res.status(500).json({ error: 'Erro ao atualizar solicitação' });
        }

        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        const id = requireId(req.query?.id);

        if (!id) {
            return res.status(400).json({ error: 'ID obrigatório' });
        }

        const { error } = await supabase
            .from('solicitacoes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir solicitação:', error);
            return res.status(500).json({ error: 'Erro ao excluir solicitação' });
        }

        return res.status(200).json({ success: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
}
