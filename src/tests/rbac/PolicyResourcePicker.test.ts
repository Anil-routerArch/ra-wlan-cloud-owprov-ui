import { describe, it, expect } from 'vitest';
import { RESOURCES as PRODUCTION_RESOURCES } from 'pages/PoliciesPage/CreatePolicyModal';

/**
 * Policy Resource Picker Alignment (Section 5.1)
 * 
 * DESCRIPTION:
 *   Validates that UI policy creation/editing modals import directly from production
 *   and include the official supported resources defined in Section 5.1.
 */
describe('Policy Resource Picker Alignment (Section 5.1)', () => {
  it('imports production RESOURCES export and excludes legacy device and managementRole', () => {
    expect(PRODUCTION_RESOURCES).toContain('inventory');
    expect(PRODUCTION_RESOURCES).toContain('operator');
    expect(PRODUCTION_RESOURCES).toContain('subscriber');
    expect(PRODUCTION_RESOURCES).toContain('contact');
    expect(PRODUCTION_RESOURCES).not.toContain('device');
    expect(PRODUCTION_RESOURCES).not.toContain('managementRole');
  });
});
