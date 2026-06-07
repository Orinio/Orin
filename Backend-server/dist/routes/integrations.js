"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsRouter = void 0;
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
exports.integrationsRouter = (0, express_1.Router)();
const PROVIDERS = {
    github: {
        name: 'GitHub',
        description: 'Connect your GitHub profile to import repositories, contributions, and activity data.',
        authUrl: 'https://github.com/login/oauth/authorize',
    },
    linkedin: {
        name: 'LinkedIn',
        description: 'Import your professional experience, endorsements, and recommendations.',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    },
    behance: {
        name: 'Behance',
        description: 'Showcase your creative projects and design portfolio.',
        authUrl: 'https://www.behance.net/oauth2/authorize',
    },
    dribbble: {
        name: 'Dribbble',
        description: 'Import your design shots and creative work.',
        authUrl: 'https://dribbble.com/oauth/authorize',
    },
    medium: {
        name: 'Medium',
        description: 'Sync your published articles and writing samples.',
        authUrl: 'https://medium.com/m/oauth/authorize',
    },
    google: {
        name: 'Google Scholar',
        description: 'Import your research publications and citations.',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    slack: {
        name: 'Slack',
        description: 'Connect workspace activity and collaboration data.',
        authUrl: 'https://slack.com/oauth/v2/authorize',
    },
    figma: {
        name: 'Figma',
        description: 'Import your design files and collaboration history.',
        authUrl: 'https://www.figma.com/oauth',
    },
};
exports.integrationsRouter.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: connections } = await supabase_js_1.supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId);
        const connectionMap = new Map((connections || []).map((c) => [c.provider, c]));
        const data = Object.entries(PROVIDERS).map(([id, provider]) => {
            const conn = connectionMap.get(id);
            return {
                id,
                name: provider.name,
                description: provider.description,
                connected: !!conn,
                lastSync: conn?.last_sync || null,
                status: conn?.status || 'disconnected',
            };
        });
        res.json({ success: true, data });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Integrations list error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.integrationsRouter.get('/:provider/connect', async (req, res) => {
    try {
        const { provider } = req.params;
        const userId = req.user?.id;
        const providerInfo = PROVIDERS[provider];
        if (!providerInfo) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Provider not found' } });
            return;
        }
        const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64');
        const authUrl = `${providerInfo.authUrl}?client_id=${process.env[`${provider.toUpperCase()}_CLIENT_ID`]}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/api/integrations/callback')}&state=${state}&scope=read`;
        res.json({ success: true, data: { authUrl } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Integration connect error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.integrationsRouter.delete('/:provider', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { provider } = req.params;
        const { error } = await supabase_js_1.supabase
            .from('user_integrations')
            .delete()
            .eq('user_id', userId)
            .eq('provider', provider);
        if (error) {
            res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
            return;
        }
        res.json({ success: true });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Integration disconnect error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.integrationsRouter.post('/:provider/import', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { provider } = req.params;
        const { data: connection } = await supabase_js_1.supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', provider)
            .single();
        if (!connection) {
            res.status(400).json({ error: { code: 'NOT_CONNECTED', message: 'Provider not connected' } });
            return;
        }
        await supabase_js_1.supabase
            .from('user_integrations')
            .update({ last_sync: new Date().toISOString(), status: 'syncing' })
            .eq('id', connection.id);
        res.json({ success: true, data: { imported: [] } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Integration import error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
//# sourceMappingURL=integrations.js.map