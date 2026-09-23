import cookie from 'cookie';
import { checkAuthMiddleware, methodNotAllowed, setNoStore } from './_utils.js';

export default async function handler(req, res) {
    setNoStore(res);

    if (req.method === 'DELETE') {
        res.setHeader(
            'Set-Cookie',
            cookie.serialize('auth_token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 0,
                expires: new Date(0),
                path: '/'
            })
        );

        return res.status(200).json({ success: true });
    }

    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET', 'DELETE']);
    }

    if (!checkAuthMiddleware(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    return res.status(200).json({ success: true });
}
