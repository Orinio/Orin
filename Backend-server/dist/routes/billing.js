"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
exports.billingRouter = (0, express_1.Router)();
const checkoutSchema = zod_1.z.object({
    plan: zod_1.z.enum(['pro', 'team']),
});
exports.billingRouter.get('/me', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: profile } = await supabase_js_1.supabase
            .from('users')
            .select('subscription_plan, subscription_status, subscription_expires_at')
            .eq('auth_user_id', userId)
            .single();
        res.json({
            success: true,
            data: {
                plan: profile?.subscription_plan || 'free',
                status: profile?.subscription_status || 'active',
                expiresAt: profile?.subscription_expires_at || null,
            },
        });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Billing me error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.billingRouter.post('/checkout', async (req, res) => {
    try {
        const userId = req.user?.id;
        const parsed = checkoutSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
            return;
        }
        const { plan } = parsed.data;
        const { data: profile } = await supabase_js_1.supabase
            .from('users')
            .select('id, email')
            .eq('auth_user_id', userId)
            .single();
        if (!profile) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        logger_js_1.logger.info({ userId: profile.id, plan }, 'Checkout initiated');
        const stripeSessionUrl = process.env.STRIPE_CHECKOUT_URL;
        if (stripeSessionUrl) {
            res.json({ success: true, data: { url: stripeSessionUrl } });
        }
        else {
            res.json({
                success: true,
                data: {
                    url: `${process.env.FRAPP_URL || 'http://localhost:3000'}/dashboard/billing?checkout=success&plan=${plan}`,
                },
            });
        }
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Billing checkout error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.billingRouter.get('/portal', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: profile } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', userId)
            .single();
        if (!profile) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        logger_js_1.logger.info({ userId: profile.id }, 'Billing portal accessed');
        const portalUrl = process.env.STRIPE_PORTAL_URL || `${process.env.FRAPP_URL || 'http://localhost:3000'}/dashboard/billing`;
        res.json({ success: true, data: { url: portalUrl } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Billing portal error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
//# sourceMappingURL=billing.js.map