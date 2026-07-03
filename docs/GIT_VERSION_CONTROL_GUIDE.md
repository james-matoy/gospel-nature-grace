# Git Version Control Guide

A comprehensive guide to Git version control for the Gospel, Nature, and Grace project, covering best practices, workflows, and commit message conventions.

## 🎯 Git Workflow Overview

### Branch Strategy
- **`main`**: Production-ready code (deploys to Cloudflare Pages)
- **`blog`**: Blog content only (for content management and organization)
- **Feature branches**: `feature/*` for new features
- **Bugfix branches**: `fix/*` for bug fixes
- **Documentation branches**: `docs/*` for documentation updates

### Basic Workflow
```bash
# Start from main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit often
git add .
git commit -m "feat: add new feature description"

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# After approval, merge to main
```

## 📝 Commit Message Conventions

### Format
```
type(scope): short description

- Bullet point 1 explaining the change
- Bullet point 2 with additional details
- Bullet point 3 if needed
```

### Commit Types
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(blog): add image optimization` |
| `fix` | Bug fix | `fix(ui): correct dark theme colors` |
| `docs` | Documentation | `docs: add git version control guide` |
| `style` | Formatting, missing semicolons, etc. | `style: format code with Prettier` |
| `refactor` | Code refactoring | `refactor: extract shared components` |
| `perf` | Performance improvements | `perf: optimize image loading` |
| `test` | Adding or updating tests | `test: add blog post tests` |
| `chore` | Build process, dependencies | `chore: update npm packages` |

### Scope
- Optional but recommended
- Specifies the area of the codebase affected
- Examples: `(blog)`, `(ui)`, `(docs)`, `(about)`, `(contact)`

### Best Practices
1. **Subject line**: 50-72 characters max
2. **Body**: Bullet points for detailed explanation
3. **Use imperative mood**: "Add feature" not "Added feature"
4. **Be specific**: Explain what and why, not just what

### Good Examples
```bash
# Feature with details
git commit -m "feat(blog): implement image optimization

- Replace native <img> with Astro <Image> component
- Add width, height, format, and loading attributes
- Resolve Astro DevTools warnings about optimization
- Document changes in PERFORMANCE_AUDIT_LOG.md"

# Simple fix
git commit -m "fix(ui): correct blog search input color in dark theme

- Change dark theme text color to #42425C
- Maintain placeholder color at #a4a8a3"

# Documentation update
git commit -m "docs: add comprehensive git version control guide

- Document branch strategy and workflow
- Explain commit message conventions
- Add common git commands reference
- Include troubleshooting section"
```

## 🔧 Common Git Commands

### Basic Commands
```bash
# Check status
git status

# Add files to staging
git add <file>
git add .  # Add all changes

# Commit changes
git commit -m "your message"
git commit -a -m "your message"  # Add and commit tracked files

# Push changes
git push origin <branch-name>

# Pull latest changes
git pull origin <branch-name>
```

### Branch Management
```bash
# Create new branch
git branch <branch-name>
git checkout -b <branch-name>  # Create and switch

# Switch branches
git checkout <branch-name>
git switch <branch-name>  # Modern alternative

# Delete branch (local)
git branch -d <branch-name>

# Delete branch (remote)
git push origin --delete <branch-name>

# List branches
git branch -a  # All branches
git branch -r  # Remote branches
```

### Undoing Changes
```bash
# Discard unstaged changes
git restore <file>
git restore .  # Discard all unstaged changes

# Unstage file (keep changes)
git restore --staged <file>

# Amend last commit (change message)
git commit --amend -m "new message"

# Revert commit (create new undo commit)
git revert <commit-hash>

# Reset to previous commit (DANGER: rewrites history)
git reset --hard HEAD~1
```

### Advanced Commands
```bash
# Interactive rebase (edit commits)
git rebase -i HEAD~3

# Squash last 3 commits
git reset --soft HEAD~3
git commit -m "squashed message"

# Stash changes (temporarily save)
git stash
git stash pop  # Restore

# View commit history
git log --oneline
git log --pretty=format:"%h %s" --graph

# Show changes in working directory
git diff

# Show changes in staged files
git diff --staged
```

## 🔄 Git Workflow Examples

### Feature Development
```bash
# Start feature
git checkout main
git pull origin main
git checkout -b feature/image-optimization

# Make changes, commit
git add src/pages/blog/[slug].astro
git commit -m "perf(blog): optimize blog post images with Astro Image component

- Replace native <img> with Astro <Image> component
- Add width, height, format, and loading attributes
- Resolve Astro DevTools warnings about optimization"

# Push feature branch
git push origin feature/image-optimization

# Create Pull Request on GitHub
# After review and approval, merge to main
```

### Blog Content Workflow
```bash
# Work on blog content
git checkout blog
git pull origin blog

# Add new blog post
git add src/content/blog/new-post.mdoc
git add public/images/blog/new-post/
git commit -m "chore(blog): add new blog post about grace"

# Push to blog branch
git push origin blog

# Merge to main for deployment
git checkout main
git merge blog
git push origin main
```

### Hotfix Workflow
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b fix/critical-bug

# Fix issue, commit
git add .
git commit -m "fix(ui): correct mobile navigation issue

- Fix z-index problem on mobile menu
- Ensure menu appears above all content
- Test on multiple screen sizes"

# Push and create PR with high priority
git push origin fix/critical-bug

# After approval, merge to main
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Merge Conflicts
**Issue**: Merge conflicts when pulling or merging

**Solution**:
```bash
# Abort merge if needed
git merge --abort

# Resolve conflicts manually
# Edit files marked with <<<<<<<, =======, >>>>>>>
# Then continue merge
git add <resolved-files>
git commit
```

#### Detached HEAD State
**Issue**: "You are in 'detached HEAD' state"

**Solution**:
```bash
# Return to main branch
git checkout main

# Or create new branch from current state
git checkout -b temp-branch
```

#### Large File Issues
**Issue**: Git rejects large files

**Solution**:
```bash
# Add to .gitignore
echo "large-file.mp4" >> .gitignore

# Remove from git tracking (if already committed)
git rm --cached large-file.mp4
```

#### Authentication Problems
**Issue**: Git push fails with authentication error

**Solution**:
```bash
# Update credentials
git config --global credential.helper cache

# Or use SSH instead of HTTPS
git remote set-url origin git@github.com:username/repo.git
```

#### Line Ending Issues
**Issue**: Windows vs Unix line ending conflicts

**Solution**:
```bash
# Configure git to handle line endings
git config --global core.autocrlf true  # Windows
git config --global core.autocrlf input  # Unix/Mac
```

## 📚 Best Practices

### Commit Often, Push Regularly
- Small, frequent commits are easier to review and debug
- Push at least daily to avoid large, complex changes
- Atomic commits (one logical change per commit)

### Write Meaningful Messages
- Explain **what** changed and **why**
- Use bullet points for multiple related changes
- Reference issues when applicable (#123)

### Branch Strategy
- Keep `main` branch always deployable
- Use feature branches for development
- Short-lived branches (delete after merge)
- Protect `main` branch with branch protection rules

### Code Reviews
- Require PR approvals for `main` branch
- Use GitHub's review features
- Link to related issues
- Include screenshots for UI changes

### Documentation
- Update documentation with code changes
- Document breaking changes clearly
- Keep README up-to-date

## 🔗 Additional Resources

- [Git Official Documentation](https://git-scm.com/doc)
- [GitHub Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flight Rules](https://github.com/k88hudson/git-flight-rules)
- [Atlassian Git Tutorials](https://www.atlassian.com/git)

## 📜 Project-Specific Guidelines

### Branch Naming
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `chore/*` - Maintenance tasks

### Pull Request Requirements
1. **Title**: Clear, concise summary
2. **Description**: What, why, and how
3. **Linked Issues**: Reference related GitHub issues
4. **Screenshots**: For UI changes
5. **Tests**: Include test updates if applicable

### Commit Signing (Optional)
```bash
# Set up GPG key
gpg --full-generate-key

# Configure git
git config --global user.signingkey <key-id>
git config --global commit.gpgsign true
```

This guide provides a comprehensive reference for Git version control in the Gospel, Nature, and Grace project, ensuring consistent, high-quality commits and smooth collaboration.