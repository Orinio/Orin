import type { Tool } from '../core/types.js';

export const checkUrlSafetyTool: Tool = {
  name: 'check_url_safety',
  description: 'Check if a URL is safe and not malicious',
  category: 'safety',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to check' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const urlObj = new URL(args.url);
      const domain = urlObj.hostname;
      const suspiciousPatterns = [/bit\.ly/, /tinyurl/, /t\.co/, /goo\.gl/, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/];
      const isSuspicious = suspiciousPatterns.some(p => p.test(args.url));
      const isHttp = urlObj.protocol === 'http:';
      const trustedDomains = ['github.com', 'gitlab.com', 'coursera.org', 'udemy.com', 'kaggle.com', 'leetcode.com', 'linkedin.com'];
      const isTrusted = trustedDomains.some(d => domain.includes(d));

      return {
        success: true,
        data: {
          url: args.url, domain, is_safe: !isSuspicious && !isHttp,
          is_trusted: isTrusted, is_suspicious: isSuspicious,
          warnings: [isSuspicious ? 'Suspicious patterns' : null, isHttp ? 'Uses HTTP' : null].filter(Boolean),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Invalid URL' };
    }
  },
};

export const validateEmailTool: Tool = {
  name: 'validate_email',
  description: 'Validate if an email address format is valid',
  category: 'safety',
  parameters: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'Email address to validate' },
    },
    required: ['email'],
  },
  execute: async (args) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(args.email);
      const [, domain] = args.email.split('@');
      const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com'];
      const isDisposable = disposableDomains.includes(domain);
      return {
        success: true,
        data: { email: args.email, valid_format: isValid, domain, is_disposable: isDisposable, is_valid: isValid && !isDisposable },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
