import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { HuntingRule } from '../models/HuntingRule';
import { ThreatIntel } from '../models/ThreatIntel';

const router: Router = Router();

// MITRE ATT&CK tactics for heatmap
const MITRE_TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command and Control',
  'Exfiltration', 'Impact',
];

// Sample sigma rules for seeding
const DEFAULT_RULES = [
  { ruleId: 'SIGMA-001', title: 'Suspicious PowerShell Execution', category: 'EXECUTION', mitreAttackId: 'T1059.001', logSource: 'Windows Event Log 4688', severity: 'HIGH', description: 'Detects suspicious PowerShell execution patterns often used in malicious activities.', sigmaRule: 'title: Suspicious PowerShell Execution\ndescription: Detects suspicious PowerShell execution\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4688\n    CommandLine|contains: \n      - "-EncodedCommand"\n      - "-e " \n      - "IEX("\n  condition: selection' },
  { ruleId: 'SIGMA-002', title: 'Cobalt Strike Named Pipe', category: 'C2', mitreAttackId: 'T1572', logSource: 'Windows Event Log 5145', severity: 'CRITICAL', description: 'Detects named pipe patterns associated with Cobalt Strike beacons.', sigmaRule: 'title: Cobalt Strike Named Pipe\ndescription: Detects Cobalt Strike named pipes\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 5145\n    ShareName: "\\\\*\\IPC$"\n    RelativeTargetName|contains: "msagent_"  \n  condition: selection' },
  { ruleId: 'SIGMA-003', title: 'LSASS Access for Credential Dumping', category: 'CREDENTIAL_ACCESS', mitreAttackId: 'T1003.001', logSource: 'Windows Event Log 4656', severity: 'CRITICAL', description: 'Detects attempts to access LSASS process memory for credential dumping.', sigmaRule: 'title: LSASS Access via Mimikatz\ndescription: Detects LSASS process access\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4656\n    ObjectName: "\\Device\\Nsi"  \n  condition: selection' },
  { ruleId: 'SIGMA-004', title: 'DNS Tunneling Detection', category: 'EXFILTRATION', mitreAttackId: 'T1048', logSource: 'DNS Query Logs', severity: 'HIGH', description: 'Detects possible DNS tunneling via unusual query patterns.', sigmaRule: 'title: DNS Tunneling\ndescription: Detects DNS tunneling\nlogsource:\n  category: dns\ndetection:\n  selection:\n    QueryType: "TXT"\n    QueryLength: ">100" \n  condition: selection' },
  { ruleId: 'SIGMA-005', title: 'Pass-the-Hash Detection', category: 'LATERAL_MOVEMENT', mitreAttackId: 'T1550.002', logSource: 'Windows Event Log 4624', severity: 'HIGH', description: 'Detects pass-the-hash authentication patterns across systems.', sigmaRule: 'title: Pass-the-Hash\ndescription: Detects PtH authentication\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4624\n    LogonType: 3\n    LogonProcessName: "NtLmSsp"  \n  condition: selection' },
  { ruleId: 'SIGMA-006', title: 'Scheduled Task Creation', category: 'PERSISTENCE', mitreAttackId: 'T1053.005', logSource: 'Windows Event Log 4698', severity: 'MEDIUM', description: 'Detects creation of scheduled tasks for persistence.', sigmaRule: 'title: Scheduled Task Creation\ndescription: Detects scheduled task creation\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4698  \n  condition: selection' },
];

// ═══ GET /hunting/mitre-heatmap — MITRE ATT&CK Coverage ═══
router.get('/mitre-heatmap', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const rules = await HuntingRule.find({ tenantId }).lean();
    const threats = await ThreatIntel.find({ tenantId, isActive: true })
      .select('mitreAttackIds threatType severity').lean();

    // Build coverage grid
    const coverage: Record<string, { total: number; covered: number; severity: string }> = {};
    for (const tactic of MITRE_TACTICS) {
      const tacticRules = rules.filter(r => r.mitreAttackId && threats.some(t => (t.mitreAttackIds || []).includes(r.mitreAttackId)));
      const covered = tacticRules.length;
      const maxSeverity = covered > 0 ? 'CRITICAL' : 'NONE';
      coverage[tactic] = { total: threats.length, covered, severity: maxSeverity };
    }

    res.json({ tactics: MITRE_TACTICS, coverage });
  } catch (err) {
    console.error('[Hunting] MITRE heatmap error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ═══ GET /hunting/rules — List hunting rules ═══
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const { category, status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId };
    if (category) filter.category = category;
    if (status) filter.status = status;

    let rules = await HuntingRule.find(filter).sort({ createdAt: -1 }).lean();

    // Seed default rules if empty
    if (rules.length === 0) {
      await HuntingRule.insertMany(DEFAULT_RULES.map(r => ({ ...r, tenantId })));
      rules = await HuntingRule.find(filter).sort({ createdAt: -1 }).lean();
    }

    res.json({ data: rules });
  } catch (err) {
    console.error('[Hunting] List rules error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ═══ PATCH /hunting/rules/:id/status — Toggle rule status ═══
router.patch('/rules/:id/status', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const { status } = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']) }).parse(req.body);
    const rule = await HuntingRule.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status } },
      { new: true },
    );
    if (!rule) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: `Rule ${status}`, data: rule });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
