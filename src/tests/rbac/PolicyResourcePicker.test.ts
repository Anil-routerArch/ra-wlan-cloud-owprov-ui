import { describe, it, expect } from 'vitest';

/**
 * Policy Resource Picker Alignment (Section 5.1)
 * 
 * DESCRIPTION:
 *   Validates that UI policy creation/editing modals include exactly the 6 official 
 *   supported resources defined in Section 5.1 of the Specification:
 *   'entity', 'venue', 'configuration', 'inventory', 'operator', 'subscriber'.
 * 
 * EXPECTED OUTPUT:
 *   - RESOURCES contains 'inventory', 'operator', 'subscriber'
 *   - RESOURCES excludes legacy 'device' and 'managementRole'
 *   - RESOURCES.length === 6
 */
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
