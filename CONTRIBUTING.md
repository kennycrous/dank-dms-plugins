# Contributing a Plugin

Thank you for contributing to this Dank Material Shell plugin registry!

## How to Add Your Plugin

1. **Fork this repository**

2. **Create a new JSON file** in the `plugins/` directory following this naming convention:
   ```
   plugins/{github-username}-{plugin-name}.json
   ```
   - Use lowercase letters
   - Separate words with hyphens
   - Example: `yourname-world-clock.json`

3. **Fill in your plugin information** using this schema:

```json
{
    "id": "pluginId",
    "name": "Plugin Name",
    "capabilities": ["dankbar-widget"],
    "category": "utilities",
    "repo": "https://github.com/yourusername/your-plugin-repo",
    "path": "optional/path/in/monorepo",
    "author": "Your Name",
    "description": "Brief description of what your plugin does",
    "dependencies": ["dependency1", "dependency2"],
    "compositors": ["niri", "hyprland"],
    "distro": ["any"],
    "screenshot": "https://url/to/screenshot.png"
}
```

### Field Descriptions

- **id** (required): Unique identifier in camelCase (e.g. `worldClock`)
  - Must start with a lowercase letter and contain only letters and digits
  - Must exactly match the `id` field in your repository's `plugin.json`
- **name** (required): Display name of your plugin
  - Must exactly match the `name` field in your repository's `plugin.json`
- **capabilities** (required): Array of capabilities, e.g. `["dankbar-widget"]`
- **category** (required): One of: `monitoring`, `utilities`, `appearance`, `system`, etc.
- **repo** (required): Full GitHub URL to your plugin repository
- **path** (optional): Subdirectory path, if your plugin lives in a monorepo
- **author** (required): Your name or GitHub username
- **description** (required): Clear, concise description of the plugin's purpose
- **dependencies** (required): Array of dependencies, use `[]` if none
- **compositors** (required): Supported Wayland compositors, e.g. `["niri", "hyprland"]` or `["any"]`
- **distro** (required): Supported distributions, e.g. `["any"]`, `["arch"]`
- **screenshot** (required): Direct URL to a screenshot showing your plugin in use

4. **Submit a Pull Request**
   - Commit your JSON file
   - Push to your fork
   - Create a PR to this repository, with a brief description of your plugin

## Guidelines

- Keep descriptions concise and informative
- Ensure your repository has proper documentation
- Test that your plugin works with the specified compositors and distros
- Capture your screenshot in a representative state — real data visible
- The `id` and `name` fields in your registry JSON **must exactly match** the corresponding fields in your plugin repository's `plugin.json` (or `{repo}/{path}/plugin.json` for monorepo plugins)
- Avoid submitting duplicates of existing plugins unless the original is unmaintained or yours offers major improvements

## Generative AI

Using an LLM to help write code, issues, or comments is fine. Submitting its output unread is not.

- You are responsible for every line you submit. You have read it, tested it, and can explain it in review.
- Say in the PR when a meaningful part of it was AI generated.
- Do not file issues or leave comments you have not verified yourself.
