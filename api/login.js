import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { methodNotAllowed, normalizeText, setNoStore } from './_utils.js';

function safeEqual(a, b) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

export default async function handler(req, res) {
    setNoStore(res);

    if (req.method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
    }

    const password = normalizeText(req.body?.password, {
        min: 1,
        max: 256,
        trim: false
    });

    if (!password) {
        return res.status(400).json({ error: 'Senha inválida' });
    }

    if (!safeEqual(password, process.env.ADMIN_PASSWORD)) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: '8h',
            issuer: 'embrapa-site',
            audience: 'embrapa-admin'
        }
    );

    res.setHeader(
        'Set-Cookie',
        cookie.serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 8,
            path: '/'
        })
    );

    return res.status(200).json({ success: true });
}
