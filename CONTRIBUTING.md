# AISLA Contributing Guide

## Getting Started

### Prerequisites
- Node.js 20.x
- MongoDB Atlas account
- Ollama (for local AI)
- Git

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/hemanthh35/labs.git
cd labs
```

2. **Install dependencies**
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

3. **Configure environment**
```bash
# Copy template
cp server/.env.example server/.env

# Edit with your credentials
nano server/.env
```

4. **Start services**
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start server
cd server && npm start

# Terminal 3: Start client
cd client && npm start
```

## Development Workflow

### Creating a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code improvements
- `perf/` - Performance optimizations

### Making Changes

1. **Write code** following project conventions
2. **Test locally** with `npm start`
3. **Commit with clear messages**
```bash
git add .
git commit -m "feat: Add feature description"
```

4. **Push to GitHub**
```bash
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to GitHub → `labs` repository
2. Click "Compare & Pull Request"
3. Fill in PR title and description
4. Link any related issues
5. Submit PR

### PR Guidelines

- **Title**: Clear, concise description
- **Description**: What, why, and how
- **Tests**: Include screenshots/test results
- **Documentation**: Update README if needed

### Code Review

- At least one approval required
- All CI checks must pass
- No conflicts with main branch

### Merging

After approval:
1. Ensure branch is up-to-date
2. Squash commits if needed
3. Merge to main
4. Delete feature branch

## Code Standards

### JavaScript/React
```javascript
// Use ES6+ syntax
import x from 'y';

// Arrow functions
const myFunc = () => { };

// Async/await
const data = await fetch(...);

// Clear variable names
const userExperiments = [];
```

### Comments
```javascript
// Explain WHY, not WHAT
// ✓ Good: Cache experiments to avoid repeated API calls
// ✗ Bad: Get experiments array

// Use section headers for large functions
// ============================================
// MAIN LOGIC
// ============================================
```

### Error Handling
```javascript
try {
    // operation
} catch (error) {
    console.error('Context:', error);
    res.status(500).json({ message: error.message });
}
```

## Testing

### Manual Testing Checklist
- [ ] Feature works as intended
- [ ] No console errors
- [ ] Works on desktop and mobile
- [ ] No performance degradation
- [ ] Proper error handling

### Test Cases
1. Happy path (normal use)
2. Edge cases
3. Error scenarios
4. Performance under load

## Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance

**Example:**
```
feat: Add email notifications for quiz results

- Send email when student completes quiz
- Include score and feedback in email
- Add email template configuration
- Fixes #123
```

## Project Structure

```
labs/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   └── App.js       # Main app
│   └── package.json
├── server/              # Node.js backend
│   ├── routes/          # API routes
│   ├── controllers/     # Route handlers
│   ├── models/          # MongoDB schemas
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration
│   └── package.json
├── PERFORMANCE.md       # Performance guide
├── RENDER_DEPLOYMENT.md # Deployment guide
└── README.md            # Project overview
```

## Performance Considerations

- Keep AI prompts concise
- Use pagination for large datasets
- Cache frequently accessed data
- Monitor generation times
- Test on low-end devices

## Security

- Never commit secrets
- Use environment variables
- Validate all user input
- Sanitize API responses
- Keep dependencies updated

## Documentation

- Update README for major changes
- Document new features
- Keep API docs current
- Add inline comments for complex logic
- Update this guide as needed

## Questions?

- Check existing issues
- Review similar PRs
- Ask in discussions
- Email maintainer

## License

MIT - See LICENSE file
