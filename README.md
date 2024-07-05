# Amplenote Plugin Embed Starter Project

This project provides a basic starting point for developing a
React-based application that can be rendered in an Amplenote
embed.

# Getting Started

1. Clone this repository
2. Install dependencies with `yarn install`
3. Create a build with `yarn build`

# Output

The output of the build step is a markdown note that can be
used as a plugin note in Amplenote. Import this note and
enable it as a plugin in your Amplenote account.

The following plugin actions are implemented in the plugin:

- `appOption` triggering the plugin via the quick open menu will open a sidebar embed for the plugin
- `renderEmbed` handles rendering the sidebar embed, rendering this application in the sidebar
- `onEmbedCall` called when `window.callAmplenotePlugin` is called from the embed code in this project

The `renderEmbed` action output by this plugin can remain unchanged in the final plugin, but it's likely that the
`appOption` and `onEmbedCall` actions will need to be customized to fit the needs of the final plugin.

# Development

Run `yarn dev` to serve the application locally, with automatic reloading on filesystem changes.
