import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ComplianceFramework } from '../models/ComplianceFramework';
import { PolicyDocument } from '../models/PolicyDocument';

const router: Router = Router();

// Seed frameworks & controls
const FRAMEWORKS = [
  { framework: 'ISO 27001', version: '2022', controls: [
    { controlId: 'A.5.1', title: 'Information Security Policy', category: 'Policy', severity: 'HIGH' },
    { controlId: 'A.6.1', title: 'Internal Organization', category: 'Organization', severity: 'MEDIUM' },
    { controlId: 'A.7.1', title: 'Human Resource Security', category: 'HR', severity: 'MEDIUM' },
    { controlId: 'A.8.1', title: 'Asset Management', category: 'Assets', severity: 'HIGH' },
    { controlId: 'A.9.1', title: 'Access Control', category: 'Access', severity: 'CRITICAL' },
    { controlId: 'A.10.1', title: 'Cryptography', category: 'Security', severity: 'CRITICAL' },
    { controlId: 'A.12.1', title: 'Operations Security', category: 'Operations', severity: 'HIGH' },
    { controlId: 'A.16.1', title: 'Incident Management', category: 'Incident', severity: 'CRITICAL' },
    { controlId: 'A.18.1', title: 'Compliance', category: 'Compliance', severity: 'HIGH' },
  ]},
  { framework: 'NIST CSF', version: '2.0', controls: [
    { controlId: 'ID.AM', title: 'Asset Management', category: 'Identify', severity: 'HIGH' },
    { controlId: 'ID.GV', title: 'Governance', category: 'Identify', severity: 'MEDIUM' },
    { controlId: 'PR.AC', title: 'Access Control', category: 'Protect', severity: 'CRITICAL' },
    { controlId: 'PR.DS', title: 'Data Security', category: 'Protect', severity: 'CRITICAL' },
    { controlId: 'DE.CM', title: 'Continuous Monitoring', category: 'Detect', severity: 'HIGH' },
    { controlId: 'RS.MI', title: 'Mitigation', category: 'Respond', severity: 'HIGH' },
    { controlId: 'RC.RP', title: 'Recovery Planning', category: 'Recover', severity: 'MEDIUM' },
  ]},
  { framework: 'PCI DSS', version: '4.0', controls: [
    { controlId: '1.1', title: 'Firewall Configuration', category: 'Network', severity: 'CRITICAL' },
    { controlId: '2.1', title: 'System Hardening', category: 'Config', severity: 'HIGH' },
    { controlId: '3.1', title: 'Cardholder Data Protection', category: 'Data', severity: 'CRITICAL' },
    { controlId: '4.1', title: 'Encryption in Transit', category: 'Network', severity: 'CRITICAL' },
    { controlId: '7.1', title: 'Access Control', category: 'Access', severity: 'CRITICAL' },
    { controlId: '10.1', title: 'Logging', category: 'Monitoring', severity: 'HIGH' },
  ]},
  { framework: 'GDPR', version: '2018', controls: [
    { controlId: 'ART.5', title: 'Data Processing Principles', category: 'Privacy', severity: 'CRITICAL' },
    { controlId: 'ART.17', title: 'Right to Erasure', category: 'Privacy', severity: 'HIGH' },
    { controlId: 'ART.32', title: 'Security of Processing', category: 'Security', severity: 'CRITICAL' },
    { controlId: 'ART.33', title: 'Data Breach Notification', category: 'Incident', severity: 'CRITICAL' },
  ]},
];

// ═══ GET /compliance/dashboard — Compliance overview ═══
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    // Seed frameworks if empty
    const existing = await ComplianceFramework.countDocuments();
    if (existing === 0) {
      await ComplianceFramework.insertMany(FRAMEWORKS);
    }

    const frameworks = await ComplianceFramework.find().lean();
    const policies = await PolicyDocument.countDocuments({ tenantId, status: 'ACTIVE' });

    const summary = frameworks.map(fw => ({
      framework: fw.framework,
      version: fw.version,
      totalControls: fw.controls.length,
      critical: fw.controls.filter(c => c.severity === 'CRITICAL').length,
      high: fw.controls.filter(c => c.severity === 'HIGH').length,
    }));

    res.json({ frameworks: summary, activePolicies: policies, totalFrameworks: frameworks.length });
  } catch (err) {
    console.error('[Compliance] Dashboard error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ═══ GET /compliance/frameworks/:name — Framework detail + controls ═══
router.get('/frameworks/:name', async (req: Request, res: Response) => {
  try {
    const fw = await ComplianceFramework.findOne({ framework: req.params.name }).lean();
    if (!fw) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ data: fw });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ═══ GET /compliance/policies — List policies ═══
router.get('/policies', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    let policies = await PolicyDocument.find({ tenantId }).sort({ createdAt: -1 }).lean();
    if (policies.length === 0) {
      await PolicyDocument.insertMany([
        { tenantId, title: 'Information Security Policy', category: 'SECURITY', content: 'This policy defines the security requirements for protecting information assets.', status: 'ACTIVE', version: '1.0', approvedBy: 'SOC Manager', effectiveDate: new Date(), reviewDate: new Date(Date.now() + 365*86400000), tags: ['ISO27001'] },
        { tenantId, title: 'Incident Response Plan', category: 'INCIDENT_RESPONSE', content: 'Standard operating procedures for detecting, responding, and recovering from security incidents.', status: 'ACTIVE', version: '2.1', approvedBy: 'SOC Manager', effectiveDate: new Date(), reviewDate: new Date(Date.now() + 180*86400000), tags: ['NIST'] },
        { tenantId, title: 'Access Control Policy', category: 'ACCESS_CONTROL', content: 'Guidelines for user access provisioning, authentication, and authorization.', status: 'ACTIVE', version: '1.2', approvedBy: 'SOC Manager', effectiveDate: new Date(), reviewDate: new Date(Date.now() + 365*86400000), tags: ['PCI DSS'] },
        { tenantId, title: 'Data Protection Policy', category: 'DATA_PROTECTION', content: 'Data classification, handling, and protection requirements.', status: 'DRAFT', version: '0.9', approvedBy: '', effectiveDate: new Date(), reviewDate: new Date(Date.now() + 365*86400000), tags: ['GDPR'] },
      ]);
      policies = await PolicyDocument.find({ tenantId }).sort({ createdAt: -1 }).lean();
    }
    res.json({ data: policies });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
