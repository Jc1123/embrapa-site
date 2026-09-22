import { supabase } from './_utils.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

    const { data, error } = await supabase.from('membros').select('id, nick, cargo').order('created_at', { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
}