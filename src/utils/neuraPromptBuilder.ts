// Maps segment codes to prompts that reliably trigger Neura's ReportAgent.
// The intent parser recognizes specific keyword phrases to route to the correct agent action.
// Ref: ReportAgent capabilities: financial_summary, sales_overview, project_status, inventory_status
const SEGMENT_PROMPTS: Record<string, string> = {
    finance: 'Generate a financial summary report',
    revenue: 'Generate a sales overview report',
    execution: 'Generate a project status report',
    delivery: 'Generate an inventory status report',
    workforce: 'Generate a workforce utilization report',
};

export function buildEnrichedPrompt(segmentCode: string, _context?: any): string {
    return SEGMENT_PROMPTS[segmentCode] ?? 'Generate a business performance summary report';
}
