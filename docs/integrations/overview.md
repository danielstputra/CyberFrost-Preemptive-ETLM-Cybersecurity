# Integrations

## SIEM Integrations

| Platform | Type | Description |
|---|---|---|
| Splunk | Webhook | SIEM log ingestion and alerting |
| Jira | Webhook | Automated ticket creation |
| ServiceNow | Webhook | ITSM workflow automation |
| Custom Webhook | Generic | Any HTTP endpoint |

## External APIs

| Service | Integration | Auth |
|---|---|---|
| Google Safe Browsing | URL verification | API Key |
| PhishTank | Phishing URL submission | API Key |
| Kominfo Trust+ | Indonesia government reporting | Nodemailer SMTP |
| Meta BRP (v19.0) | Social media brand protection | OAuth Token |
| Twitter API | Impersonation reporting | Bearer Token |
| LinkedIn API | Fake profile reporting | Bearer Token |
| Cloudflare WAF | Firewall rule deployment | API Token |

## Email

- **Provider:** SMTP (Resend compatible)
- **Protocol:** SMTP over TLS (port 465)
- **Templates:** Handlebars-based legal/abuse email templates
- **Attachments:** Max 5MB per email (validated before send)

## Webhooks

- Outbound webhooks to SIEM/SOAR platforms
- SSRF protection with IP blocklist validation
- Configurable per tenant via integrations page
- Events: threat detected, vulnerability found, scan completed

## Configuration

Integrations are managed via the Integrations page in the dashboard, or via the REST API at `/api/v1/action/integration`.
