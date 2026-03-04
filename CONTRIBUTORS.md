# Contributors

Thank you to everyone who has contributed to this project.

---

## Developers

| Name                      | Role                | Profile                                                            |
| ------------------------- | ------------------- | ------------------------------------------------------------------ |
| Fernando Pinto Villarroel | Creator & Developer | [LinkedIn](https://www.linkedin.com/in/fernando-pinto-villarroel/) |

---

## How to Contribute

Contributions are welcome. Whether it is a bug report, a feature suggestion, a translation improvement, or a code change, all thoughtful input is appreciated.

### Reporting Issues

Open an issue on GitHub with a clear title, a description of the problem or suggestion, and steps to reproduce if applicable. Include your device model and OS version when reporting bugs.

### Submitting a Pull Request

1. Clone the repository to your computer
2. Create a branch from `main` with a descriptive name (e.g., `fix/timer-reset`, `feat/new-exercise-icon`)
3. Make your changes following the conventions described below
4. Test your changes on a physical device or emulator using Expo Go
5. Push your commits and open a pull request with a clear description of what was changed and why
6. Assign Fernando Pinto Villarroel for review

### Code Conventions

This project follows these conventions — please respect them in any contribution:

<table>
  <thead>
    <tr>
      <th>Rule</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Language</strong></td>
      <td>All code, variable names, comments, and commit messages must be in <strong>English</strong></td>
    </tr>
    <tr>
      <td><strong>TypeScript</strong></td>
      <td>Strict mode is enforced — avoid <code>any</code> types. Run <code>npx tsc --noEmit</code> before submitting</td>
    </tr>
    <tr>
      <td><strong>No server-side storage</strong></td>
      <td>All user data must remain on-device in the local SQLite database — no external API calls for data storage</td>
    </tr>
    <tr>
      <td><strong>Theme support</strong></td>
      <td>All UI must work in both light and dark themes. Use the <code>useTheme()</code> hook and <code>createStyles(theme)</code> pattern</td>
    </tr>
    <tr>
      <td><strong>Internationalization</strong></td>
      <td>Any user-facing string must be added to <strong>both</strong> <code>en.json</code> and <code>es.json</code> — no hardcoded UI text</td>
    </tr>
    <tr>
      <td><strong>Database changes</strong></td>
      <td>Schema changes require a versioned migration in <code>src/database/init.ts</code> to avoid breaking existing users</td>
    </tr>
    <tr>
      <td><strong>State management</strong></td>
      <td>Use existing Zustand stores (<code>userStore</code>, <code>exerciseStore</code>, <code>bodyRecordsStore</code>) — create new stores only if necessary</td>
    </tr>
    <tr>
      <td><strong>Components</strong></td>
      <td>Prefer reusable components in <code>src/components/</code>. Follow existing patterns for modals, lists, and headers</td>
    </tr>
    <tr>
      <td><strong>No comments or emojis in code</strong></td>
      <td>Write self-documenting code. Use icon components for visual indicators, not emoji characters unless strictly necessary</td>
    </tr>
  </tbody>
</table>

### Running the Project Locally

See the [Getting Started](README.md#getting-started) section in the README.

### Type Checking

Before submitting, verify there are no TypeScript errors:

```bash
npx tsc --noEmit
```

---

## License Note

By submitting a contribution, you agree to the terms outlined in the [Contribution and Pull Request Policy](LICENSE.md#10-contribution-and-pull-request-policy) section of the project license. In summary, you grant the copyright holder an irrevocable right to use, modify, and distribute your contribution under this license.

---

_This file will be updated as new contributors join the project._
