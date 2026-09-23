import {
    supabase,
    checkAuthMiddleware,
    methodNotAllowed,
    normalizeText,
    requireId,
    setNoStore
} from './_utils.js';

function parseMember(body = {}) {
    const nick = normalizeText(body.nick, { min: 1, max: 32 });
    const cargo = normalizeText(body.cargo, { min: 1, max: 40 });
    const bio = normalizeText(body.bio ?? '', { min: 0, max: 400 });
    const dataEntrou = normalizeText(body.data_entrou ?? '', { min: 0, max: 20 });

    if (!nick || !cargo || bio === null || dataEntrou === null) {
        return null;
    }

    return {
        nick,
        cargo,
        bio,
        data_entrou: dataEntrou || null
    };
}

async function cargoExiste(nome) {
    const { data, error } = await supabase
        .from('cargos')
        .select('nome')
        .eq('nome', nome)
        .maybeSingle();

    if (error) {
        console.error('Erro ao validar cargo:', error);
        throw new Error('Erro ao validar cargo');
    }

    return Boolean(data);
}

export default async function handler(req, res) {
    setNoStore(res);

    if (!checkAuthMiddleware(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.method === 'POST') {
        const member = parseMember(req.body);

        if (!member) {
            return res.status(400).json({ error: 'Dados do membro inválidos' });
        }

        try {
            if (!(await cargoExiste(member.cargo))) {
                return res.status(400).json({ error: 'Cargo inexistente' });
            }
        } catch {
            return res.status(500).json({ error: 'Erro ao validar cargo' });
        }

        const { data, error } = await supabase
            .from('membros')
            .insert([member])
            .select('id, nick, cargo, bio, data_entrou')
            .single();

        if (error) {
            console.error('Erro ao adicionar membro:', error);
            return res.status(500).json({ error: 'Erro ao adicionar membro' });
        }

        return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
        const id = requireId(req.body?.id);
        const member = parseMember(req.body);

        if (!id || !member) {
            return res.status(400).json({ error: 'Dados do membro inválidos' });
        }

        try {
            if (!(await cargoExiste(member.cargo))) {
                return res.status(400).json({ error: 'Cargo inexistente' });
            }
        } catch {
            return res.status(500).json({ error: 'Erro ao validar cargo' });
        }

        const { data, error } = await supabase
            .from('membros')
            .update(member)
            .eq('id', id)
            .select('id, nick, cargo, bio, data_entrou')
            .single();

        if (error) {
            console.error('Erro ao atualizar membro:', error);
            return res.status(500).json({ error: 'Erro ao atualizar membro' });
        }

        return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
        const id = requireId(req.query?.id);

        if (!id) {
            return res.status(400).json({ error: 'ID obrigatório' });
        }

        const { error } = await supabase
            .from('membros')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir membro:', error);
            return res.status(500).json({ error: 'Erro ao excluir membro' });
        }

        return res.status(200).json({ success: true });
    }

    return methodNotAllowed(res, ['POST', 'PUT', 'DELETE']);
}
