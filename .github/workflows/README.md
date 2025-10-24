# GitHub Actions Workflows

## Publish to npm

The `publish.yml` workflow automates the process of publishing new versions to npm.

### Setup Requirements

Before using this workflow, you need to configure the following secrets in your GitHub repository:

1. **NPM_TOKEN**: Your npm authentication token
   - Go to [npmjs.com](https://www.npmjs.com/)
   - Navigate to Access Tokens in your account settings
   - Generate a new "Automation" token with "Read and Write" permissions
   - Add it as a secret in your GitHub repository: Settings → Secrets and variables → Actions → New repository secret

### How to Use

1. Go to the **Actions** tab in your GitHub repository
2. Select the **Publish to npm** workflow
3. Click **Run workflow**
4. Select the branch you want to publish from using the branch dropdown
5. Choose the **Version bump type**:
   - `patch` (0.1.0 → 0.1.1) - Bug fixes and small changes
   - `minor` (0.1.0 → 0.2.0) - New features, backward compatible
   - `major` (0.1.0 → 1.0.0) - Breaking changes
6. Click **Run workflow**

### What the Workflow Does

1. **Checkout code** from the selected branch
2. **Setup Node.js** environment with npm registry configuration
3. **Enable Corepack** for Yarn 4 support
4. **Install dependencies** using Yarn
5. **Run linter** to ensure code quality
6. **Build project** to compile TypeScript
7. **Bump version** in package.json according to selected type
8. **Commit version change** back to the branch
9. **Create Git tag** (e.g., `v0.1.1`)
10. **Publish to npm** with provenance
11. **Create GitHub Release** with installation instructions

### Version Strategy (SemVer)

The workflow follows [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes that are not backward compatible
  - Example: Removing or renaming public APIs, changing CLI behavior significantly

- **Minor (0.X.0)**: New features that are backward compatible
  - Example: Adding new commands, new models support, new features

- **Patch (0.0.X)**: Bug fixes and small improvements
  - Example: Fixing bugs, improving error messages, documentation updates

### Notes

- The workflow creates a commit with the version bump, so the selected branch will be updated
- A Git tag is automatically created and pushed
- A GitHub Release is created with the tag
- The package is published to npm with public access
- Provenance is enabled for supply chain security
