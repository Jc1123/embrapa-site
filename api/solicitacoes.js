import { supabase, checkAuthMiddleware, sanitizeInput } from './_utils.js';

export default async function handler(req, res) {
    // POST público (Envio de formulário Juntar-se)
    if (req.method === 'POST') {
        const { nick, contato } = req.body;
        if (!nick || !contato) return res.status(400).json({ error: 'Campos obrigatórios' });

        const { error } = await supabase.from('solicitacoes').insert([
            { nick: sanitizeInput(nick), contato: sanitizeInput(contato) }
        ]);

        if (error) return res.status(500).json({ error: 'Erro ao salvar' });
        return res.status(201).json({ success: true });
    }

    // Rotas protegidas (GET, PUT, DELETE)
    if (!checkAuthMiddleware(req)) return res.status(401).json({ error: 'Não autorizado' });

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('solicitacoes').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
        const { id, status } = req.body;
        const { error } = await supabase.from('solicitacoes').update({ status }).eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query;
        const { error } = await supabase.from('solicitacoes').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
}