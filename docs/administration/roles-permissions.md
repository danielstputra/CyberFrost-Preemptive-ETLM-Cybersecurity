# Roles & Permissions

CyberFrost uses **Role-Based Access Control (RBAC)** with 7 distinct roles.

## Role Hierarchy

```
SUPER_ADMIN (score: 100)
  └── SOC_MANAGER (score: 80)
       └── SOC_ANALYST (score: 60)
            └── TENANT_ADMIN (score: 50)
                 └── SECURITY_OPERATOR (score: 40)
                      └── COMPLIANCE_OFFICER (score: 30)
                           └── EXECUTIVE_VIEWER (score: 10)
```

## Permission Matrix

| Permission | SUPER_ADMIN | SOC_MANAGER | SOC_ANALYST | TENANT_ADMIN | SECURITY_OP | COMPLIANCE | EXECUTIVE |
|---|---|---|---|---|---|---|---|
| Manage Tenants | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Tenants | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Review Takedown | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve Takedown | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Takedown | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Threats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request Scan | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

## Multi-Tenancy

- **Internal roles** (SUPER_ADMIN, SOC_MANAGER, SOC_ANALYST) can access all tenants
- **External roles** (TENANT_ADMIN and below) are restricted to their own tenant
- Data isolation is enforced at the database query level using `tenantId` filters
- JWT tokens include `tenantId` to identify the user's organization
