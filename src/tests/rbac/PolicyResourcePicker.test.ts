import { describe, it, expect } from 'vitest';

describe('Policy Resource Picker Alignment (Section 5.1)', () => {
  const OFFICIAL_RESOURCES = [
    'entity',
    'venue',
    'configuration',
    'inventory',
    'operator',
    'subscriber',
  ];

  it('includes exactly 6 official resources and excludes legacy device and managementRole', () => {
    expect(OFFICIAL_RESOURCES).toContain('inventory');
    expect(OFFICIAL_RESOURCES).toContain('operator');
    expect(OFFICIAL_RESOURCES).toContain('subscriber');
    expect(OFFICIAL_RESOURCES).not.toContain('device');
    expect(OFFICIAL_RESOURCES).not.toContain('managementRole');
    expect(OFFICIAL_RESOURCES.length).toBe(6);
  });
});
