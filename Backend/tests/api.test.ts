import axios from 'axios';

const BASE = 'http://localhost:4000';
const API = '/api/v1';

let token = '';
let scanJobId = '';
let osintJobId = '';
let vulnId = '';
let notifId = '';
const testEmail = `test_${Date.now()}@test.com`;
const testPw = 'Test123!xZ';

function headers() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ═══════════════════════════════════════════════════════
// 1. AUTH SERVICE
// ═══════════════════════════════════════════════════════

describe('Auth Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`${BASE}${API}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
  });

  test('POST /auth/register -- should register new user', async () => {
    const res = await axios.post(`${BASE}${API}/auth/register`, {
      email: testEmail, password: testPw,
      name: 'Test User', tenantName: 'Test Corp', tenantSlug: `test-corp-${Date.now()}`,
    });
    expect(res.status).toBe(201);
    expect(res.data.accessToken).toBeTruthy();
    token = res.data.accessToken;
  });

  test('POST /auth/login -- should authenticate', async () => {
    const res = await axios.post(`${BASE}${API}/auth/login`, {
      email: testEmail, password: testPw,
    });
    expect(res.status).toBe(200);
    expect(res.data.accessToken).toBeTruthy();
    token = res.data.accessToken;
  });

  test('GET /auth/me -- should return profile', async () => {
    const res = await axios.get(`${BASE}${API}/auth/me`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.user.email).toBe(testEmail);
  });

  test('PUT /auth/me -- should update profile', async () => {
    const res = await axios.put(`${BASE}${API}/auth/me`,
      { name: 'Updated User' },
      { headers: headers() }
    );
    expect(res.status).toBe(200);
    expect(res.data.user.name).toBe('Updated User');
  });

  test('POST /auth/login -- should reject wrong password', async () => {
    try {
      await axios.post(`${BASE}${API}/auth/login`, {
        email: testEmail, password: 'WrongPassword!',
      });
      fail('Should have thrown 401');
    } catch (err: any) {
      expect(err.response?.status).toBe(401);
    }
  });

  test('POST /auth/change-password -- should validate strength', async () => {
    try {
      await axios.post(`${BASE}${API}/auth/change-password`, {
        currentPassword: testPw, newPassword: 'weak',
      }, { headers: headers() });
      fail('Should have thrown 400');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
    }
  });
});

// ═══════════════════════════════════════════════════════
// 2. DISCOVERY SERVICE
// ═══════════════════════════════════════════════════════

describe('Discovery Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4002${API}/health`);
    expect(res.status).toBe(200);
  });

  test('POST /discovery/scan -- should queue scan', async () => {
    const res = await axios.post(`${BASE}${API}/discovery/scan`,
      { domain: 'example.com' }, { headers: headers() });
    expect(res.status).toBe(202);
    expect(res.data.jobId).toBeTruthy();
    scanJobId = res.data.jobId;
  });

  test('GET /discovery/scan/:id -- should show progress', async () => {
    let status = 'QUEUED';
    let progress = 0;
    const start = Date.now();
    while ((status === 'QUEUED' || status === 'RUNNING') && Date.now() - start < 30000) {
      await new Promise(r => setTimeout(r, 3000));
      const res = await axios.get(`${BASE}${API}/discovery/scan/${scanJobId}`, { headers: headers() });
      status = res.data.status;
      progress = res.data.progress;
      expect(progress).toBeLessThanOrEqual(100);
    }
    expect(['COMPLETED', 'FAILED']).toContain(status);
  });

  test('GET /discovery/domains -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/discovery/domains?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.pagination).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// 3. INTELLIGENCE SERVICE
// ═══════════════════════════════════════════════════════

describe('Intelligence Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4003${API}/health`);
    expect(res.status).toBe(200);
  });

  test('GET /intelligence/dashboard -- should return stats', async () => {
    const res = await axios.get(`${BASE}${API}/intelligence/dashboard`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalVulnerabilities');
    expect(typeof res.data.totalVulnerabilities).toBe('number');
  });

  test('GET /intelligence/vulnerabilities -- should paginate', async () => {
    const res = await axios.get(`${BASE}${API}/intelligence/vulnerabilities?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeLessThanOrEqual(5);
    expect(res.data.pagination.page).toBe(1);
    vulnId = res.data.data[0]?.id || '';
  });

  test('GET /intelligence/vulnerabilities -- filter by severity', async () => {
    const res = await axios.get(`${BASE}${API}/intelligence/vulnerabilities?severity=CRITICAL&limit=3`, { headers: headers() });
    expect(res.status).toBe(200);
    if (res.data.data.length > 0) {
      expect(res.data.data[0].severity).toBe('CRITICAL');
    }
  });

  test('GET /intelligence/vulnerabilities/:id -- should return detail', async () => {
    if (!vulnId) return;
    const res = await axios.get(`${BASE}${API}/intelligence/vulnerabilities/${vulnId}`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.cveId).toBeTruthy();
  });

  test('GET /intelligence/threats -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/intelligence/threats?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('GET /intelligence/threat-actors -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/intelligence/threat-actors`, { headers: headers() });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// 4. OSINT SERVICE
// ═══════════════════════════════════════════════════════

describe('OSINT Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4004${API}/health`);
    expect(res.status).toBe(200);
  });

  test('POST /osint/scan -- should queue scan', async () => {
    const res = await axios.post(`${BASE}${API}/osint/scan`,
      { target: 'example.com', scanType: 'DOMAIN' }, { headers: headers() });
    expect(res.status).toBe(202);
    expect(res.data.jobId).toBeTruthy();
    osintJobId = res.data.jobId;
  });

  test('GET /osint/scan/:id -- should return status', async () => {
    const res = await axios.get(`${BASE}${API}/osint/scan/${osintJobId}`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.target).toBe('example.com');
  });

  test('GET /osint/leaks -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/osint/leaks?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('GET /osint/exposures -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/osint/exposures?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('GET /osint/dashboard -- should return stats', async () => {
    const res = await axios.get(`${BASE}${API}/osint/dashboard`, { headers: headers() });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// 5. NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════

describe('Notification Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4005${API}/health`);
    expect(res.status).toBe(200);
  });

  test('POST /notifications/send-test -- should queue notification', async () => {
    const res = await axios.post(`${BASE}${API}/notifications/send-test`, {
      title: 'Test Alert', message: 'Unit test message',
      severity: 'HIGH', eventType: 'THREAT_DETECTED',
    }, { headers: headers() });
    expect(res.status).toBe(202);
  });

  test('GET /notifications -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/notifications?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
    if (res.data.data.length > 0) {
      notifId = res.data.data[0]._id;
    }
  });

  test('GET /notifications/unread-count -- should return counts', async () => {
    const res = await axios.get(`${BASE}${API}/notifications/unread-count`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('unread');
    expect(res.data).toHaveProperty('criticalUnread');
  });

  test('PATCH /notifications/:id/read -- should mark as read', async () => {
    if (!notifId) return;
    const res = await axios.patch(`${BASE}${API}/notifications/${notifId}/read`, {}, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('POST /notifications/read-all -- should mark all as read', async () => {
    const res = await axios.post(`${BASE}${API}/notifications/read-all`, {}, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.message).toContain('notifications as read');
  });
});

// ═══════════════════════════════════════════════════════
// 6. ACTION & MITIGATION SERVICE
// ═══════════════════════════════════════════════════════

describe('Action & Mitigation Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4006${API}/health`);
    expect(res.status).toBe(200);
  });

  test('POST /action/takedown -- should submit takedown', async () => {
    const res = await axios.post(`${BASE}${API}/action/takedown`, {
      targetUrl: 'https://phishing-test.com/fake',
      domain: 'example.com', threatType: 'PHISHING',
    }, { headers: headers() });
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('SUBMITTED');
  });

  test('GET /action/takedown -- should list', async () => {
    const res = await axios.get(`${BASE}${API}/action/takedown?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('POST /action/takedown/generate-email -- should generate abuse email', async () => {
    const res = await axios.post(`${BASE}${API}/action/takedown/generate-email`, {
      targetUrl: 'https://phishing.com', domain: 'victim.com',
      threatType: 'PHISHING', emailType: 'HOSTING',
    }, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.email).toHaveProperty('subject');
    expect(res.data.email).toHaveProperty('body');
  });

  test('POST /action/mitigation/block -- should queue block', async () => {
    const res = await axios.post(`${BASE}${API}/action/mitigation/block`, {
      targetIp: '203.0.113.99', mitigationType: 'BLOCK_IP',
      description: 'Test block',
    }, { headers: headers() });
    expect(res.status).toBe(202);
  });

  test('GET /action/mitigation -- should list mitigations', async () => {
    const res = await axios.get(`${BASE}${API}/action/mitigation?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('GET /action/mitigation/stats/overview -- should return stats', async () => {
    const res = await axios.get(`${BASE}${API}/action/mitigation/stats/overview`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('autoTriggered');
  });
});

// ═══════════════════════════════════════════════════════
// 7. AI SERVICE
// ═══════════════════════════════════════════════════════

describe('AI Service', () => {
  test('GET /health -- should return 200', async () => {
    const res = await axios.get(`http://localhost:4007${API}/health`);
    expect(res.status).toBe(200);
  });

  test('POST /ai/generate -- should generate insight', async () => {
    const res = await axios.post(`${BASE}${API}/ai/generate`,
      { title: 'Test Insight', insightType: 'THREAT_SUMMARY' },
      { headers: headers() });
    expect(res.status).toBe(201);
    expect(res.data.summary).toBeTruthy();
  });

  test('POST /ai/summarize -- should summarize text', async () => {
    const res = await axios.post(`${BASE}${API}/ai/summarize`,
      { text: 'Long text to summarize. This is a test. Multiple sentences here.', title: 'Test' },
      { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.summary).toBeTruthy();
  });

  test('POST /ai/analyze-threat -- should analyze threat', async () => {
    const res = await axios.post(`${BASE}${API}/ai/analyze-threat`,
      {
        sourceType: 'VULNERABILITY',
        data: { cveId: 'CVE-2026-99999', cvssScore: 9.8 },
      },
      { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.summary).toBeTruthy();
  });

  test('GET /ai/insights -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/ai/insights?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data.pagination).toBeDefined();
  });

  test('GET /ai/omnibar -- semantic search', async () => {
    const res = await axios.get(`${BASE}${API}/ai/omnibar?q=threat`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('results');
  });
});

// ═══════════════════════════════════════════════════════
// 8. EASM (Discovery)
// ═══════════════════════════════════════════════════════

describe('EASM Service', () => {
  test('GET /discovery/easm/digital-footprint -- should return stats', async () => {
    const res = await axios.get(`${BASE}${API}/discovery/easm/digital-footprint`, { headers: headers() });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalAssets');
  });

  test('GET /discovery/easm/shadow-it -- should return list', async () => {
    const res = await axios.get(`${BASE}${API}/discovery/easm/shadow-it`, { headers: headers() });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// 9. GLOBAL SEARCH
// ═══════════════════════════════════════════════════════

describe('Global Search', () => {
  test('GET /search -- global IOC search', async () => {
    const res = await axios.get(`${BASE}${API}/search?q=CVE&type=all`, { headers: headers() });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// 10. ACTION: TICKETS, WEBHOOKS & WORKFLOWS
// ═══════════════════════════════════════════════════════

describe('Action -- Tickets, Webhooks & Workflows', () => {
  test('POST /action/ticket -- should create ticket', async () => {
    const res = await axios.post(`${BASE}${API}/action/ticket`,
      { title: 'Test Ticket', severity: 'HIGH' },
      { headers: headers() });
    expect(res.status).toBe(201);
    expect(res.data.ticketRef).toBeTruthy();
  });

  test('GET /action/ticket -- should list tickets', async () => {
    const res = await axios.get(`${BASE}${API}/action/ticket?page=1&limit=5`, { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('POST /action/webhook/test -- should test webhook', async () => {
    const res = await axios.post(`${BASE}${API}/action/webhook/test`,
      { url: 'https://hooks.example.com/test' },
      { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('POST /action/webhook/send -- should send webhook', async () => {
    const res = await axios.post(`${BASE}${API}/action/webhook/send`,
      { url: 'https://hooks.example.com/test', eventType: 'TEST', payload: {} },
      { headers: headers() });
    expect(res.status).toBe(200);
  });

  test('POST /action/workflow -- should trigger workflow', async () => {
    const res = await axios.post(`${BASE}${API}/action/workflow`,
      { type: 'auto_block', target: '203.0.113.99' },
      { headers: headers() });
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('RUNNING');
  });

  test('GET /action/workflow -- should list workflows', async () => {
    const res = await axios.get(`${BASE}${API}/action/workflow`, { headers: headers() });
    expect(res.status).toBe(200);
  });
});
