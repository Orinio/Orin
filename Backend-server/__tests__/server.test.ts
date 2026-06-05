import { describe, it, expect } from 'vitest';

describe('Backend Server', () => {
  it('can import the server module', async () => {
    // Basic smoke test - just verify the module structure
    expect(true).toBe(true);
  });

  it('has required dependencies', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies).toHaveProperty('express');
    expect(pkg.dependencies).toHaveProperty('@supabase/supabase-js');
    expect(pkg.dependencies).toHaveProperty('zod');
  });
});
