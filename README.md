# Coolify

Manage your [Coolify](https://coolify.io) deployments, projects, and Traefik proxy from Raycast.

This is an alternative to the [Coolify extension on the Raycast Store](https://www.raycast.com/xmok/coolify), designed for single-server setups with an emphasis on monitoring deployments and retrieving deployment and application logs.

## Commands

| Command | Description |
|---|---|
| **Deployments** | View latest deployments across all projects. See status, commit info, and logs. |
| **Projects** | Browse projects, environments, and their resources (applications, services, databases). Start, stop, restart, and view logs. |
| **Traefik Proxy** | View server proxy status, Traefik routes and services. Trigger server validation to restart the proxy. |

## Setup

1. Install the extension
2. Set your **Coolify Server URL** (e.g. `https://coolify.example.com`)
3. Set your **API Token** — create one in Coolify under *Keys & Tokens* settings

### Traefik Dashboard (optional)

The Traefik Proxy command can optionally connect to your Traefik dashboard API to display routes and services directly in Raycast. To enable this:

1. Open the Traefik Proxy command preferences
2. Set your **Traefik Dashboard URL** (e.g. `https://traefik.example.com`)
3. Set **Traefik Username** and **Password** if Basic Auth is enabled

See the [Coolify Traefik Dashboard docs](https://coolify.io/docs/knowledge-base/proxy/traefik/dashboard) for how to expose the Traefik dashboard on your server.
