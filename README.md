# Dank Material Shell Plugins

A plugin registry for [Dank Material Shell](https://github.com/AvengeMedia/DankMaterialShell).

> **Note:** The official DMS plugin registry is [AvengeMedia/dms-plugin-registry](https://github.com/AvengeMedia/dms-plugin-registry). This repo follows the same plugin JSON schema.

## Structure

- `plugins/` — one JSON file per plugin, named `{github-username}-{plugin-name}.json`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full schema.

Themes are not supported here yet.

## Using this registry

DMS supports additional plugin registries alongside the official one. Add this repo with the `dms` CLI:

```bash
dms registry add dank-dms-plugins https://github.com/kennycrous/dank-dms-plugins.git
```

Then browse/install plugins as usual via the Settings UI or `dms plugins install {plugin-name}`. See `dms registry list` / `dms registry remove` to manage registries.

## Contributing

Open a pull request adding your plugin's JSON file to `plugins/`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the schema and guidelines.

## Disclaimer

Plugins listed here are created and maintained by third-party developers and are not officially supported by the Dank Material Shell team. Use them at your own risk. In case of issues, please contact the plugin author directly.
