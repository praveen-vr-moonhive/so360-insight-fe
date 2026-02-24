/**
 * Segment → module dependencies mapping.
 * A segment is visible only if at least one of its required modules is enabled.
 * Values are plain module IDs (no prefix) — matches isModuleEnabled() input.
 */
export const SEGMENT_MODULE_DEPS: Record<string, string[]> = {
    revenue:   ['crm', 'accounting', 'dailystore', 'inbox'],
    execution: ['projects', 'flow', 'procurement', 'dailystore'],
    delivery:  ['inventory', 'procurement', 'dailystore'],
    workforce: ['people', 'timesheet'],
    finance:   ['accounting'],
};
