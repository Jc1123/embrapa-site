import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const requiredEnv = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'ADMIN_PASSWORD'
];

for (const name of requiredEnv) {
    if (!process.env[name]) {
        throw new Error(`Variável de ambiente ausente: ${name}`);
    }
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export function getAuthPayload(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) return null;

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'embrapa-site',
            audience: 'embrapa-admin'
        });

        return payload?.role === 'admin' ? payload : null;
    } catch {
        return null;
    }
}

export function checkAuthMiddleware(req) {
    return Boolean(getAuthPayload(req));
}

export function normalizeText(value, {
    min = 0,
    max = 255,
    trim = true
} = {}) {
    if (typeof value !== 'string') return null;

    const normalized = trim ? value.trim() : value;

    if (normalized.length < min || normalized.length > max) {
        return null;
    }

    return normalized;
}

export function requireId(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;

    const id = String(value).trim();
    return id ? id : null;
}

export function methodNotAllowed(res, allowed) {
    res.setHeader('Allow', allowed);
    return res.status(405).json({ error: 'Método não permitido' });
}

export function setNoStore(res) {
    res.setHeader('Cache-Control', 'no-store');
}
