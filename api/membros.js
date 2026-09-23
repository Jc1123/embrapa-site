import { supabase, methodNotAllowed } from './_utils.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    const { data, error } = await supabase
        .from('membros')
        .select('id, nick, cargo, bio, data_entrou')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar membros:', error);
        return res.status(500).json({ error: 'Erro ao buscar membros' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data ?? []);
}
