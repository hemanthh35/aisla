# AISLA Security Best Practices

## Environment Variables

### Required Secrets
```env
# Never commit these!
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_API_KEY=your-google-api-key
```

### Always Use .env
- Never hardcode secrets in files
- Add `.env` to `.gitignore`
- Use `.env.example` for templates
- Rotate secrets regularly

## Authentication

### JWT Tokens
- **Expiry**: 7 days for security
- **Storage**: HttpOnly cookies (better than localStorage)
- **Refresh**: Implement refresh tokens for long sessions
- **Validation**: Always verify token signature

### Password Security
```javascript
// Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);

// Never store plain text passwords
// Never log passwords
```

## API Security

### Input Validation
```javascript
// ✓ Always validate user input
if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
}

// ✗ Never trust user input
```

### Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Limit API calls per user

### CORS
```javascript
// Only allow trusted origins
app.use(cors({
    origin: ['https://yourdomain.com'],
    credentials: true
}));
```

## Database Security

### MongoDB
- Enable authentication
- Use strong passwords
- Restrict network access (IP whitelist)
- Regular backups
- Enable encryption at rest

### Query Injection Prevention
```javascript
// ✓ Use Mongoose (prevents injection)
User.findOne({ email: userInput });

// ✗ Never use string concatenation
// db.collection.find({ email: `${userInput}` })
```

## HTTPS & TLS

- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use valid SSL certificates
- Keep TLS updated

## Dependency Security

### Regular Audits
```bash
npm audit
npm audit fix
```

### Keep Updated
```bash
npm update
npm outdated
```

### Remove Unused
```bash
npm prune
```

## Deployment Security

### Render.com
- Use environment variables for secrets
- Enable HTTPS
- Regular security updates
- Monitor logs for attacks

### Monitoring
- Set up error tracking (Sentry)
- Monitor failed auth attempts
- Alert on unusual activity

## Common Vulnerabilities

### SQL Injection
- Use parameterized queries
- Mongoose prevents this

### XSS (Cross-Site Scripting)
- Sanitize HTML input
- Use Content Security Policy headers
- Escape output

### CSRF (Cross-Site Request Forgery)
- Use CSRF tokens
- Validate origin headers
- Use SameSite cookies

### Password Issues
- Minimum 8 characters
- Require mix of uppercase, lowercase, numbers
- Never email passwords
- Implement password reset securely

## Incident Response

### If Compromised
1. Rotate all secrets immediately
2. Review access logs
3. Change all passwords
4. Enable 2FA if available
5. Notify users if data exposed

### Secrets Exposed to Git
```bash
# Remove from history (careful!)
git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch .env' \
    --prune-empty --tag-name-filter cat -- --all

# Push to clean history
git push origin --force --all
git push origin --force --tags
```

## Security Checklist

- [ ] Secrets in `.env` only
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enabled
- [ ] JWT validation implemented
- [ ] Input validation on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting on auth
- [ ] Password hashing (bcrypt)
- [ ] Error messages don't leak info
- [ ] Logs sanitized (no secrets)
- [ ] Dependencies up-to-date
- [ ] Database encrypted
- [ ] Backups automated

## Resources

- OWASP Top 10: https://owasp.org/Top10/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- MongoDB Security: https://docs.mongodb.com/manual/security/
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html

## Questions?

Review the Contributing guide or ask the maintainers.
