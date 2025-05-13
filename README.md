# webhook-server

simple nodejs webhook server

## Setting Up the Commit Hook

To ensure code quality, this project uses husky to run ESLint and Prettier checks before each commit. Follow these steps to set up the commit hook:

1. **Install Dependencies:**

   ```bash
   yarn install
   ```

2. **Initialize Husky:**

   ```bash
   yarn prepare
   ```

3. **Verify the Pre-Commit Hook:**
   The pre-commit hook is located at `.husky/pre-commit` and runs `yarn lint:check && yarn format:check` before each commit. If any issues are found, the commit will be blocked until they are resolved.

4. **Make the Hook Executable:**
   Ensure the pre-commit hook is executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

Now, whenever you attempt to commit, husky will automatically run the linter and formatter checks.
