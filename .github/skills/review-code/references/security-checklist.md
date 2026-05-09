# Security Review Checklist

## Input Validation
- [ ] All user inputs validated and sanitized
- [ ] SQL parameterized queries used (no string concatenation)
- [ ] XSS prevention in rendered output (HTML encoding)
- [ ] Path traversal prevention in file operations

## Authentication & Authorization
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks on each resource access
- [ ] No hardcoded credentials or API keys
- [ ] Tokens/sessions expire appropriately

## Data Protection
- [ ] Sensitive data encrypted at rest and in transit
- [ ] PII not logged or exposed in error messages
- [ ] Secrets stored in environment variables or vault, not code
- [ ] CORS configured restrictively

## Dependencies
- [ ] No known vulnerable dependencies
- [ ] Dependencies pinned to specific versions
- [ ] Third-party code reviewed for security

## Error Handling
- [ ] Errors don't expose internal details (stack traces, SQL, paths)
- [ ] Failed operations don't leave system in inconsistent state
- [ ] Rate limiting on authentication endpoints
