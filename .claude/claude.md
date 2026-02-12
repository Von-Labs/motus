# Git Commit Standards

CRITICAL: Use Conventional Commits format WITHOUT co-author attribution.

## Format
```
<type>(<scope>): <description>
```

## Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

## Examples

```bash
git commit -m "feat: add user authentication"
git commit -m "feat(admin): add API usage monitoring dashboard"
git commit -m "fix(share-links): show context-appropriate usage examples"
git commit -m "refactor(ui): extract card component logic"
git commit -m "docs: update API documentation"
git commit -m "chore: update dependencies"
```

## Rules

1. **NO co-author attribution** (no `Co-Authored-By:`)
2. Lowercase description, no period at end
3. Present tense: "add" not "added"
4. Keep description concise and clear
5. Use scope when applicable to add context

## Additional Guidelines

- Keep the subject line under 50 characters
- Use body (optional) for detailed explanation
- Reference issue numbers when applicable
- One logical change per commit

# Android Build Setup

## Required Configuration

The project uses Android SDK installed via Homebrew. Before building Android app, ensure `local.properties` file exists:

**File:** `app/android/local.properties`
```
sdk.dir=/opt/homebrew/share/android-commandlinetools
```

This file is gitignored and must be created locally on each development machine.

## Build Commands

```bash
cd app
pnpm android
```

# Theme & Branding

## DeFi AI Color Palette

The app uses a custom DeFi AI theme based on the logo's color scheme:

### Primary Colors
- **Dark Background**: `#0f0f23` - Very dark navy background
- **Secondary Background**: `#1a1a2e` - Dark purple-blue for depth
- **Cyan/Teal**: `#00e5e5` - Primary accent color for interactive elements, buttons, and highlights
- **Purple**: `#a78bfa` - Secondary accent for highlights and inactive states
- **Green**: `#00ff88` - Bright green for success states and special accents
- **Dark Purple**: `#1e1e3f` - Tertiary dark color for layering

### Theme Configuration

**File:** `app/src/theme.ts`

The `defiAI` theme is the default theme and includes:
- Dark background with cyan accents
- Cyan tint color for buttons and interactive elements
- Purple for secondary highlights and inactive tab states
- Subtle cyan borders with 20% transparency
- Optimized text colors for readability on dark background

### Usage

The theme is set as default in `app/App.tsx`:
```typescript
const [theme, setTheme] = useState<string>('defiAI')
```

All components automatically inherit theme colors through React Context (`ThemeContext`).
