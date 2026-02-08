/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Coolify Server URL - The URL of your Coolify instance (e.g. https://coolify.example.com) */
  "serverUrl": string,
  /** API Token - Your Coolify API token (create one in Keys & Tokens settings) */
  "apiToken": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `deployments` command */
  export type Deployments = ExtensionPreferences & {}
  /** Preferences accessible in the `projects` command */
  export type Projects = ExtensionPreferences & {}
  /** Preferences accessible in the `proxy` command */
  export type Proxy = ExtensionPreferences & {
  /** Traefik Dashboard URL - URL of your Traefik dashboard API (e.g. https://traefik.example.com). Leave empty to skip Traefik integration. */
  "traefikUrl"?: string,
  /** Traefik Username - Username for Traefik Basic Auth */
  "traefikUser"?: string,
  /** Traefik Password - Password for Traefik Basic Auth */
  "traefikPassword"?: string
}
}

declare namespace Arguments {
  /** Arguments passed to the `deployments` command */
  export type Deployments = {}
  /** Arguments passed to the `projects` command */
  export type Projects = {}
  /** Arguments passed to the `proxy` command */
  export type Proxy = {}
}

