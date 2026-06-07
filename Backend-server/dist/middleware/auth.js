"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: { code: 'MISSING_AUTH', message: 'Missing or invalid authorization header' } });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase_js_1.supabase.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Auth middleware error');
        res.status(500).json({ error: { code: 'AUTH_FAILED', message: 'Authentication failed' } });
    }
}
//# sourceMappingURL=auth.js.map