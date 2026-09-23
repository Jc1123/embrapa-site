import {
    supabase,
    checkAuthMiddleware,
    methodNotAllowed,
    normalizeText,
    setNoStore
} from './_utils.js';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function parseCargo(body = {}, { requireCurrentName = false } = {}) {
    const nome = normalizeText(body.nome, { min: 1, max: 40 });
    const corRaw = normalizeText(body.cor, { min: 7, max: 7 });
    const prioridade = Number(body.prioridade);
    const nomeAtual = requireCurrentName
        ? normalizeText(body.nome_atual, { min: 1, max: 40 })
        : null;

    if (
        !nome ||
        !corRaw ||
        !HEX_COLOR.test(corRaw) ||
        !Number.isInteger(prioridade) ||
        prioridade < 1 ||
        prioridade > 9999 ||
        (requireCurrentName && !nomeAtual)
    ) {
        return null;
    }

    return {
        nome,
        cor: corRaw.toUpperCase(),
        prioridade,
        nomeAtual
    };
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('cargos')
            .select('nome, cor, prioridade')
            .order('prioridade', { ascending: true })
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar cargos:', error);
            return res.status(500).json({ error: 'Erro ao buscar cargos' });
        }

        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).json(data ?? []);
    }

    setNoStore(res);

    if (!checkAuthMiddleware(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.method === 'POST') {
        const cargo = parseCargo(req.body);

        if (!cargo) {
            return res.status(400).json({ error: 'Dados do cargo inválidos' });
        }

        const { data, error } = await supabase
            .from('cargos')
            .insert([{
                nome: cargo.nome,
                cor: cargo.cor,
                prioridade: cargo.prioridade
            }])
            .select('nome, cor, prioridade')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Já existe um cargo com esse nome' });
            }

            console.error('Erro ao criar cargo:', error);
            return res.status(500).json({ error: 'Erro ao criar cargo' });
        }

        return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
        const cargo = parseCargo(req.body, { requireCurrentName: true });

        if (!cargo) {
            return res.status(400).json({ error: 'Dados do cargo inválidos' });
        }

        const { data, error } = await supabase
            .from('cargos')
            .update({
                nome: cargo.nome,
                cor: cargo.cor,
                prioridade: cargo.prioridade
            })
            .eq('nome', cargo.nomeAtual)
            .select('nome, cor, prioridade')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Já existe um cargo com esse nome' });
            }

            console.error('Erro ao atualizar cargo:', error);
            return res.status(500).json({ error: 'Erro ao atualizar cargo' });
        }

        return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
        const nome = normalizeText(req.query?.nome, { min: 1, max: 40 });

        if (!nome) {
            return res.status(400).json({ error: 'Cargo obrigatório' });
        }

        const { error } = await supabase
            .from('cargos')
            .delete()
            .eq('nome', nome);

        if (error) {
            if (error.code === '23503') {
                return res.status(409).json({
                    error: 'Esse cargo está sendo usado por um ou mais membros. Altere esses membros antes de excluir o cargo.'
                });
            }

            console.error('Erro ao excluir cargo:', error);
            return res.status(500).json({ error: 'Erro ao excluir cargo' });
        }

        return res.status(200).json({ success: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
}
