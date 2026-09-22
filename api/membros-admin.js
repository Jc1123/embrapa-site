import { supabase, checkAuthMiddleware, sanitizeInput } from './_utils.js';

export default async function handler(req, res) {
    if (!checkAuthMiddleware(req)) return res.status(401).json({ error: 'Não autorizado' });

    if (req.method === 'POST') {
        const { nick, cargo } = req.body;
        if (!nick || !cargo) return res.status(400).json({ error: 'Campos obrigatórios' });

        const { error } = await supabase.from('membros').insert([
            { nick: sanitizeInput(nick), cargo: sanitizeInput(cargo) }
        ]);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query;
        const { error } = await supabase.from('membros').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
}