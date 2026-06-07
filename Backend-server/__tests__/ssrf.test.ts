import { describe, it, expect } from 'vitest';
import { isUrlSafe } from '../src/lib/ai/tools/search.tools';

describe('SSRF Protection - isUrlSafe', () => {
  describe('safe URLs', () => {
    it('allows valid HTTPS URLs', () => {
      expect(isUrlSafe('https://github.com/user/repo').safe).toBe(true);
    });

    it('allows valid HTTP URLs', () => {
      expect(isUrlSafe('http://example.com').safe).toBe(true);
    });

    it('allows URLs with paths and query strings', () => {
      expect(isUrlSafe('https://api.example.com/v1/users?page=1').safe).toBe(true);
    });

    it('allows URLs with ports', () => {
      expect(isUrlSafe('https://example.com:8080/api').safe).toBe(true);
    });
  });

  describe('blocked protocols', () => {
    it('blocks ftp:// URLs', () => {
      const result = isUrlSafe('ftp://example.com/file');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('HTTP/HTTPS');
    });

    it('blocks file:// URLs', () => {
      expect(isUrlSafe('file:///etc/passwd').safe).toBe(false);
    });

    it('blocks javascript: URLs', () => {
      expect(isUrlSafe('javascript:alert(1)').safe).toBe(false);
    });

    it('blocks data: URLs', () => {
      expect(isUrlSafe('data:text/html,<h1>XSS</h1>').safe).toBe(false);
    });
  });

  describe('blocked internal hosts', () => {
    it('blocks localhost', () => {
      const result = isUrlSafe('http://localhost:3000');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Internal');
    });

    it('blocks 127.0.0.1', () => {
      const result = isUrlSafe('http://127.0.0.1/admin');
      expect(result.safe).toBe(false);
    });

    it('blocks 0.0.0.0', () => {
      expect(isUrlSafe('http://0.0.0.0/').safe).toBe(false);
    });

    it('blocks AWS metadata endpoint', () => {
      const result = isUrlSafe('http://169.254.169.254/latest/meta-data/');
      expect(result.safe).toBe(false);
    });

    it('blocks GCP metadata endpoint', () => {
      expect(isUrlSafe('http://metadata.google.internal/').safe).toBe(false);
    });

    it('blocks Alibaba metadata endpoint', () => {
      expect(isUrlSafe('http://100.100.100.200/latest/meta-data/').safe).toBe(false);
    });
  });

  describe('blocked IP ranges', () => {
    it('blocks 10.x.x.x private IPs', () => {
      expect(isUrlSafe('http://10.0.0.1/').safe).toBe(false);
      expect(isUrlSafe('http://10.255.255.255/').safe).toBe(false);
    });

    it('blocks 172.16-31.x.x private IPs', () => {
      expect(isUrlSafe('http://172.16.0.1/').safe).toBe(false);
      expect(isUrlSafe('http://172.31.255.255/').safe).toBe(false);
    });

    it('blocks 192.168.x.x private IPs', () => {
      expect(isUrlSafe('http://192.168.1.1/').safe).toBe(false);
      expect(isUrlSafe('http://192.168.0.0/').safe).toBe(false);
    });

    it('allows 172.15.x.x (not in private range)', () => {
      expect(isUrlSafe('http://172.15.0.1/').safe).toBe(true);
    });

    it('allows 172.32.x.x (not in private range)', () => {
      expect(isUrlSafe('http://172.32.0.1/').safe).toBe(true);
    });
  });

  describe('blocked internal hostnames', () => {
    it('blocks .internal domains', () => {
      expect(isUrlSafe('http://service.internal/api').safe).toBe(false);
    });

    it('blocks .local domains', () => {
      expect(isUrlSafe('http://myserver.local/').safe).toBe(false);
    });
  });

  describe('invalid URLs', () => {
    it('blocks invalid URL format', () => {
      const result = isUrlSafe('not-a-url');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Invalid');
    });

    it('blocks empty string', () => {
      expect(isUrlSafe('').safe).toBe(false);
    });
  });
});
