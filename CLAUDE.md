# HookLineStudio - Claude Code Configuration

## Project Overview
HookLineStudio is a React/TypeScript full-stack application designed for creating high-converting sales hooks with AI assistance. The project emphasizes performance optimization and user experience.

## AI Team Configuration
*Generated on 2025-08-03*

### Detected Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.6.3
- Vite 5.4.19 for build tooling
- Tailwind CSS 3.4.17 with Radix UI components
- Wouter for routing, TanStack Query for state management
- Framer Motion for animations
- Firebase Authentication integration

**Backend:**
- Node.js/Express 4.21.2 server
- PostgreSQL database with Drizzle ORM 0.44.4
- OpenAI integration for AI features
- Stripe payment processing
- Firebase Admin SDK

**DevOps & Deployment:**
- Vercel for frontend deployment
- Railway for database hosting
- ESBuild for server bundling

### Agent Team Mapping

| Task Category | Agent | Usage Notes |
|---------------|-------|-------------|
| React Components & Hooks | `@react-component-architect` | Primary for all React development, hooks optimization, component architecture |
| Backend APIs & Services | `@backend-developer` | Node.js/Express endpoints, Drizzle ORM queries, server-side logic |
| API Design & Contracts | `@api-architect` | RESTful design, OpenAPI specs, authentication patterns |
| UI/UX & Styling | `@tailwind-css-expert` | Tailwind utility classes, Radix UI integration, responsive design |
| Performance Issues | `@performance-optimizer` | **Critical** - React bundling issues, production optimization, performance audits |
| Code Quality & Security | `@code-reviewer` | Pre-merge reviews, security audits, best practices enforcement |
| Project Orchestration | `@tech-lead-orchestrator` | Complex multi-domain features, architecture decisions |
| Technical Analysis | `@code-archaeologist` | Legacy code analysis, codebase documentation, risk assessment |
| Documentation | `@documentation-specialist` | API docs, README updates, technical writing |

### Sample Usage Commands

**React Development:**
```bash
claude "@react-component-architect create a mobile-optimized hook card component with lazy loading and performance metrics"
```

**Backend Development:**
```bash
claude "@backend-developer add a new API endpoint for user subscription management with Stripe integration"
```

**Performance Optimization:**
```bash
claude "@performance-optimizer analyze and fix the React hooks bundling issues in production build"
```

**Code Review:**
```bash
claude "@code-reviewer review the authentication flow for security vulnerabilities and performance bottlenecks"
```

**API Design:**
```bash
claude "@api-architect design a RESTful API contract for the analytics dashboard with proper pagination"
```

### Best Practices for Multi-Agent Workflows

1. **Sequential Delegation:** Always use `@code-reviewer` after feature completion by specialist agents
2. **Performance Focus:** Engage `@performance-optimizer` for all production-critical changes
3. **Architecture Decisions:** Route complex system design questions to `@tech-lead-orchestrator`
4. **Framework-Specific:** Prefer `@react-component-architect` over generic `@frontend-developer`
5. **Security First:** Include security review for all authentication and payment-related changes

### Project-Specific Recommendations

Given the recent React hooks bundling issues and performance focus:

1. **Critical Performance Path:** Always use `@performance-optimizer` for build configuration changes
2. **React Optimization:** Leverage `@react-component-architect` for component architecture decisions
3. **Mobile-First:** Use `@tailwind-css-expert` for responsive design improvements
4. **Security Priority:** Engage `@code-reviewer` for all Firebase Auth and Stripe integration changes

### Development Workflow

**For New Features:**
1. Start with `@tech-lead-orchestrator` for planning
2. Delegate to appropriate specialist (`@react-component-architect` or `@backend-developer`)
3. Use `@tailwind-css-expert` for styling
4. Finish with `@code-reviewer` for quality assurance

**For Bug Fixes:**
1. Use `@code-archaeologist` to analyze the issue
2. Apply fixes with appropriate specialist
3. Use `@performance-optimizer` if performance-related
4. Review with `@code-reviewer`

**For Performance Issues:**
1. **Always** start with `@performance-optimizer`
2. Implement fixes with appropriate specialist
3. Verify with production testing