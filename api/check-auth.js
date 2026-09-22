import { checkAuthMiddleware } from './_utils.js';
import cookie from 'cookie';

export default async function handler(req, res) {
    if (req.method === 'DELETE') { // Logout
        res.setHeader('Set-Cookie', cookie.serialize('auth_token', '', { maxAge: -1, path: '/' }));
        return res.status(200).json({ success: true });
    }
    
    const isAuthenticated = checkAuthMiddleware(req);
    if (isAuthenticated) {
        return res.status(200).json({ success: true });
    }
    return res.status(401).json({ error: 'Não autorizado' });
}