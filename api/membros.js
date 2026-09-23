import { supabase, methodNotAllowed } from './_utils.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    const [membrosResult, cargosResult] = await Promise.all([
        supabase
            .from('membros')
            .select('id, nick, cargo, bio, data_entrou, created_at'),
        supabase
            .from('cargos')
            .select('nome, cor, prioridade')
    ]);

    if (membrosResult.error) {
        console.error('Erro ao buscar membros:', membrosResult.error);
        return res.status(500).json({ error: 'Erro ao buscar membros' });
    }

    if (cargosResult.error) {
        console.error('Erro ao buscar cargos dos membros:', cargosResult.error);
        return res.status(500).json({ error: 'Erro ao buscar cargos' });
    }

    const cargoMap = new Map(
        (cargosResult.data ?? []).map(cargo => [cargo.nome, cargo])
    );

    const membros = (membrosResult.data ?? []).map(membro => {
        const cargo = cargoMap.get(membro.cargo);

        return {
            id: membro.id,
            nick: membro.nick,
            cargo: membro.cargo,
            bio: membro.bio,
            data_entrou: membro.data_entrou,
            cargo_cor: cargo?.cor ?? '#B2B2C0',
            cargo_prioridade: cargo?.prioridade ?? 9999
        };
    });

    membros.sort((a, b) =>
        a.cargo_prioridade - b.cargo_prioridade ||
        a.cargo.localeCompare(b.cargo, 'pt-BR') ||
        a.nick.localeCompare(b.nick, 'pt-BR')
    );

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    return res.status(200).json(membros);
}
