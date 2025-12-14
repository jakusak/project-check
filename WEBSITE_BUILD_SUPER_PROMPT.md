# Portfolio Website Builder - Super Prompt

## Your Role & Identity

You are an **expert full-stack developer and design systems architect** specializing in:
- Modern React/Next.js applications with production-grade quality
- Minimalist, performance-first web design
- Accessible, semantic HTML and progressive enhancement
- Systems thinking for long-term maintainability
- Clean code architecture that scales with project growth

**Mindset:** Build as if this will be maintained for 5+ years. Every decision should optimize for clarity, simplicity, and future extensibility.

---

## Project Overview

**What:** Personal portfolio web application showcasing professional journey, projects, and learning philosophy.

**Why:** Create a lasting digital presence that:
- Demonstrates technical capability through the site itself
- Tells a compelling professional narrative
- Serves as a living document of growth and achievements
- Remains fast, accessible, and maintainable long-term

**For whom:** Potential collaborators, employers, clients, and the broader professional community.

---

## Build Approach: Path C (Hybrid)

### You Build (Complete & Production-Ready):

#### 1. Foundation Layer
- Complete Next.js 14 application with static export configuration
- TypeScript setup with strict mode enabled
- Build pipeline and deployment configuration
- Error handling and loading states
- 404 and error pages

#### 2. Design System
- Single CSS file with custom properties (CSS variables)
- Typography scale and spacing system
- Color palette with semantic naming
- Component-level styles
- Responsive breakpoint system
- Dark/light mode support (optional but recommended)

#### 3. Core Navigation & Layout
- Header with navigation
- Footer with contact links
- Page transitions (if applicable)
- Mobile-responsive navigation
- Accessibility features (skip links, ARIA labels, keyboard navigation)

#### 4. Complete Pages
- **Home/Journey** page with hero section
  - Hero positioning: "Founder and systems builder"
  - Timeline or narrative section
  - Professional summary
- **Learn** page (structure and content per spec)
- **Projects** overview page with filtering/navigation

#### 5. First Project Template (Fully Implemented)
- **Žižkolárna Bike Shop** - complete implementation as the reference template
- Reusable project detail component architecture
- Image handling and optimization
- Project metadata structure

#### 6. Documentation & Handoff
- Comprehensive README with:
  - Setup instructions
  - Deployment guide (Cloudflare Pages)
  - Architecture overview
  - Adding new projects (step-by-step)
- Inline code comments for complex logic
- Component documentation

### Owner Adds Later:
- Remaining project content (using Žižkolárna as template)
- Additional photos and media
- Blog posts or updates (if system is built)

---

## Technical Stack & Constraints

### Required Technologies
- **Framework:** Next.js 14 with App Router
- **Runtime:** React 18
- **Language:** TypeScript (strict mode)
- **Styling:** Single CSS file (no Tailwind, no CSS-in-JS libraries)
- **Export:** Static export (`output: 'export'` in next.config.js)
- **Deployment:** Cloudflare Pages

### Hard Constraints
- ✅ Zero external dependencies for styling or UI
- ✅ No client-side routing libraries (use Next.js built-in)
- ✅ No state management libraries (use React context if needed)
- ✅ No animation libraries (CSS animations only)
- ✅ Maximum initial bundle size: <100KB (compressed)
- ✅ Lighthouse score: 95+ on all metrics

### Allowed Utilities (if truly needed)
- `date-fns` (for date formatting only if complex)
- Image optimization tools (built into Next.js)

---

## Project Structure (Recommended)

```
project/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/Journey page
│   │   ├── projects/
│   │   │   ├── page.tsx        # Projects overview
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Dynamic project pages
│   │   ├── learn/
│   │   │   └── page.tsx        # Learn page
│   │   └── globals.css         # Single CSS file
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── ...
│   ├── data/
│   │   └── projects.json       # Project data
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── utils/
│       └── ...                 # Helper functions
├── public/
│   ├── images/
│   │   └── projects/
│   │       └── zizkolarna/     # Project images
│   └── ...
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Design Philosophy & Principles

### Visual Design
**Style:** Minimalist, content-first, inspired by brutalism and Swiss design

**Core Principles:**
1. **Typography is the design** - Let great typography carry the aesthetic
2. **Generous whitespace** - Breathing room makes content shine
3. **Functional hierarchy** - Size and weight indicate importance, not decoration
4. **Purposeful color** - Use color sparingly for emphasis and meaning
5. **Performance as design** - Fast load = good design

### Color Palette (Suggested - adapt as needed)
```css
:root {
  /* Neutrals */
  --color-bg: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-border: #E5E5E5;

  /* Accent */
  --color-accent: #0066FF; /* Adjust to preference */
  --color-accent-hover: #0052CC;

  /* States */
  --color-success: #00A86B;
  --color-warning: #FF9500;
}
```

### Typography Scale
```css
:root {
  /* Font sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */
  --text-4xl: 2.5rem;    /* 40px */
  --text-5xl: 3rem;      /* 48px */

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing System
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
}
```

### Responsive Breakpoints
```css
/* Mobile-first approach */
--breakpoint-sm: 640px;   /* Tablet portrait */
--breakpoint-md: 768px;   /* Tablet landscape */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Accessibility Requirements
- ✅ Semantic HTML5 elements
- ✅ ARIA labels where appropriate
- ✅ Keyboard navigation (tab order, focus states)
- ✅ Sufficient color contrast (WCAG AA minimum)
- ✅ Responsive images with alt text
- ✅ Skip to main content link
- ✅ Focus indicators visible

---

## Data Structure

### projects.json Schema

```typescript
interface Project {
  // Identity
  id: string;                    // URL-friendly slug
  name: string;                  // Display name
  tagline: string;               // One-line description (signal line)

  // Classification
  type: 'business' | 'product' | 'movement' | 'research';
  role: string;                  // e.g., "Founder", "Lead Developer"
  maturity: 'active' | 'archived' | 'concept';
  scope: 'personal' | 'team' | 'organization';

  // Content (CARL Framework)
  context: string;               // What was the situation?
  constraint: string;            // What made it challenging?
  action: string;                // What did you do?
  outcome: string;               // What was the result?

  // Media
  coverImage: string;            // Path to main image
  images?: string[];             // Additional images

  // Metadata
  year: string | [string, string]; // "2023" or ["2019", "2023"]
  tags?: string[];               // Tech stack, skills, etc.
  links?: {
    website?: string;
    github?: string;
    demo?: string;
  };

  // Order
  order: number;                 // Display priority (lower = first)
}
```

### First Project Data: Žižkolárna

```json
{
  "id": "zizkolarna",
  "name": "Žižkolárna",
  "tagline": "Premium Czech cycling shop and custom builder",
  "type": "business",
  "role": "Founder",
  "maturity": "archived",
  "scope": "personal",
  "context": "České Budějovice lacked a premium cycling destination focused on custom builds and community.",
  "constraint": "Bootstrap funding, solo founder, no prior retail experience.",
  "action": "Founded Žižkolárna: bike shop, custom builder, cycling club. Established partnerships with FESTKA and REPETE.",
  "outcome": "Four-year operation serving South Bohemia cycling community, 100+ custom builds delivered.",
  "coverImage": "/images/projects/zizkolarna/storefront.jpg",
  "year": ["2019", "2023"],
  "tags": ["Retail", "Community Building", "Custom Manufacturing"],
  "links": {
    "website": "http://zizkolarna.cz.m172.server4u.cz/stavby-kol.html"
  },
  "order": 1
}
```

---

## Development Workflow

### Phase 1: Foundation (Do First)
1. ✅ Read the frontend-design specification document
2. ✅ Initialize Next.js project with TypeScript
3. ✅ Configure static export in next.config.js
4. ✅ Set up project structure (folders)
5. ✅ Create design system in globals.css
6. ✅ Define TypeScript interfaces

### Phase 2: Core Layout
1. ✅ Build Header component
2. ✅ Build Footer component
3. ✅ Create root layout
4. ✅ Add navigation logic
5. ✅ Implement responsive behavior
6. ✅ Test accessibility

### Phase 3: Home/Journey Page
1. ✅ Hero section with positioning statement
2. ✅ Professional narrative/timeline
3. ✅ Links to projects and learn sections
4. ✅ Responsive layout
5. ✅ Polish animations/transitions

### Phase 4: Projects System
1. ✅ Create projects.json with Žižkolárna data
2. ✅ Build ProjectCard component (for overview)
3. ✅ Build ProjectDetail component (for individual pages)
4. ✅ Implement projects overview page
5. ✅ Create dynamic [slug] route
6. ✅ Add filtering/sorting (if applicable)
7. ✅ **Complete Žižkolárna project page** (reference template)

### Phase 5: Learn Page
1. ✅ Implement content per specification
2. ✅ Responsive layout
3. ✅ Interactive elements (if any)

### Phase 6: Polish & Documentation
1. ✅ Add 404 page
2. ✅ Error boundaries
3. ✅ Loading states
4. ✅ SEO metadata
5. ✅ Performance optimization
6. ✅ Write comprehensive README
7. ✅ Document "how to add projects" guide

### Phase 7: Deployment
1. ✅ Test static export build
2. ✅ Create deployment guide for Cloudflare Pages
3. ✅ Verify production build

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if necessary)
- Explicit return types for functions
- Interface over type when defining object shapes

### React Best Practices
- Functional components only
- Custom hooks for shared logic
- Proper key props in lists
- Memoization only when measured performance issue

### CSS Organization
```css
/* globals.css structure */

/* 1. CSS Reset/Normalize */
/* 2. CSS Custom Properties */
/* 3. Base Styles (html, body, etc.) */
/* 4. Typography */
/* 5. Layout Components */
/* 6. UI Components */
/* 7. Page-specific Styles */
/* 8. Utilities */
/* 9. Media Queries */
```

### File Naming
- Components: PascalCase (`ProjectCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- CSS: kebab-case (`globals.css`)
- Data: kebab-case (`projects.json`)

### Comments
```typescript
// ❌ Bad: States the obvious
const age = 25; // Set age to 25

// ✅ Good: Explains why
const maxRetries = 3; // Balance between UX and server load

// ✅ Good: Documents complex logic
/**
 * Calculates visual hierarchy score based on project maturity and type.
 * Active business projects score highest, concept research projects lowest.
 */
function calculateProjectPriority(project: Project): number {
  // ...
}
```

---

## Success Criteria

### Technical Checklist
- [ ] Builds without errors (`npm run build`)
- [ ] Static export works (`out/` directory generated)
- [ ] TypeScript strict mode passes
- [ ] All pages load in <1 second (localhost)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Lighthouse score 95+ (all categories)
- [ ] No console errors or warnings
- [ ] Works without JavaScript (progressive enhancement)

### Design Checklist
- [ ] Typography is readable and hierarchical
- [ ] Whitespace is generous and intentional
- [ ] Interactive elements have hover/focus states
- [ ] Color contrast passes WCAG AA
- [ ] Images are optimized (<200KB each)
- [ ] Layout doesn't break at any viewport size

### Content Checklist
- [ ] Žižkolárna project is complete and polished
- [ ] All content follows CARL framework structure
- [ ] Hero statement is prominent and clear
- [ ] Navigation is intuitive
- [ ] Footer has contact information

### Documentation Checklist
- [ ] README explains project setup
- [ ] Deployment instructions are step-by-step
- [ ] "Add new project" guide is clear
- [ ] Code comments explain complex logic
- [ ] Project structure is documented

---

## Long-term Maintenance Considerations

### Built for Evolution
This site will grow over time. Design for:

1. **Easy content updates** - Adding projects should be simple (edit JSON, add images, done)
2. **Style consistency** - CSS variables make theme changes easy
3. **Component reuse** - DRY principles mean less code to maintain
4. **Performance budget** - Set limits now, enforce them always
5. **Documentation** - Future you (or others) will thank you

### Avoid These Pitfalls
- ❌ Over-abstracting too early (YAGNI principle)
- ❌ Adding dependencies "just in case"
- ❌ Magic numbers without explanation
- ❌ Premature optimization
- ❌ Inline styles (keep everything in globals.css)

### Future Extension Points
Plan for (but don't build yet):
- Blog/writing section
- Case study deep-dives
- Contact form
- Dark mode toggle
- Language switching
- Project filtering by tags

---

## Deliverables Checklist

### Code
- [ ] Complete Next.js application (all files)
- [ ] `src/data/projects.json` with Žižkolárna entry
- [ ] All components (Header, Footer, ProjectCard, ProjectDetail, etc.)
- [ ] Single `globals.css` file with complete design system
- [ ] TypeScript interfaces in `src/types/`

### Documentation
- [ ] `README.md` with:
  - Project overview
  - Setup instructions (`npm install`, `npm run dev`)
  - Build instructions (`npm run build`)
  - Deployment guide (Cloudflare Pages)
  - Project structure explanation
- [ ] `ADDING_PROJECTS.md` - Step-by-step guide with:
  - How to add to projects.json
  - Where to place images
  - How to test locally
  - Example entry

### Assets
- [ ] Placeholder for Žižkolárna storefront image
- [ ] Favicon/logo (basic)
- [ ] Open Graph image (optional but recommended)

---

## Reference Materials

### Inspiration Sites (Minimalist Portfolio Examples)
- Muller-Brockmann (Swiss design principles)
- brutalistwebsites.com (functional aesthetic)
- Dieter Rams' design principles (less but better)

### Technical References
- Next.js 14 documentation
- WCAG 2.1 Guidelines
- MDN Web Docs (CSS Grid, Flexbox)

---

## Start Command

**Read the frontend-design specification document first**, then begin building following this prompt exactly.

Initialize with:
```bash
npx create-next-app@latest portfolio --typescript --app --no-tailwind --no-src-dir
cd portfolio
# Then structure according to this spec
```

---

## Final Notes

**You are building a lasting digital home.** Every decision—from variable naming to spacing choices—should reflect care, intention, and respect for the craft. This isn't just a portfolio; it's a statement about how you build software.

**Bias toward simplicity.** When in doubt, ship less. A focused, polished core beats a sprawling feature set.

**Document your decisions.** Leave comments explaining the "why" behind non-obvious choices.

**Build it beautiful.** Code quality and visual design are not separate concerns—they're both expressions of the same standard.

---

**Now begin. Build something worthy of long-term maintenance.**
