"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
exports.requireRole = requireRole;
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware (req.user must be set)
 */
async function adminMiddleware(req, res, next) {
    const user = req.user;
    if (!user?.id) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            },
        });
        return;
    }
    try {
        // Check user role in the users table
        const { data: userProfile, error } = await supabase_js_1.supabase
            .from('users')
            .select('role, account_status')
            .eq('auth_user_id', user.id)
            .single();
        if (error || !userProfile) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'User profile not found',
                },
            });
            return;
        }
        if (userProfile.account_status !== 'active') {
            res.status(403).json({
                error: {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Account is not active',
                },
            });
            return;
        }
        if (userProfile.role !== 'admin') {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin access required',
                },
            });
            return;
        }
        // Attach role info to request
        req.userRole = userProfile.role;
        next();
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Admin middleware error');
        res.status(500).json({
            error: {
                code: 'AUTH_FAILED',
                message: 'Authorization check failed',
            },
        });
    }
}
/**
 * Middleware to check if user has one of the specified roles
 * Must be used AFTER authMiddleware
 */
function requireRole(...roles) {
    return async (req, res, next) => {
        const user = req.user;
        if (!user?.id) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
            return;
        }
        try {
            const { data: userProfile, error } = await supabase_js_1.supabase
                .from('users')
                .select('role, account_status')
                .eq('auth_user_id', user.id)
                .single();
            if (error || !userProfile) {
                res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: 'User profile not found',
                    },
                });
                return;
            }
            if (userProfile.account_status !== 'active') {
                res.status(403).json({
                    error: {
                        code: 'ACCOUNT_INACTIVE',
                        message: 'Account is not active',
                    },
                });
                return;
            }
            if (!roles.includes(userProfile.role)) {
                res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: `Required role: ${roles.join(' or ')}`,
                    },
                });
                return;
            }
            req.userRole = userProfile.role;
            next();
        }
        catch (err) {
            logger_js_1.logger.error({ err }, 'Role middleware error');
            res.status(500).json({
                error: {
                    code: 'AUTH_FAILED',
                    message: 'Authorization check failed',
                },
            });
        }
    };
}
//# sourceMappingURL=admin.js.map