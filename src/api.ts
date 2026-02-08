import fetch from "node-fetch";
import { useFetch } from "@raycast/utils";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  serverUrl: string;
  apiToken: string;
}

function prefs() {
  return getPreferenceValues<Preferences>();
}

function baseUrl() {
  return prefs().serverUrl.replace(/\/+$/, "") + "/api/v1";
}

function headers() {
  return {
    Authorization: `Bearer ${prefs().apiToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Build a URL to the Coolify web UI */
export function coolifyUrl(path: string) {
  return prefs().serverUrl.replace(/\/+$/, "") + path;
}

// ── Generic fetch helpers ────────────────────────────────────────────

async function api<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: opts?.method ?? "GET",
    headers: headers(),
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/** Hook wrapper around useFetch with auth headers */
export function useCoolify<T>(path: string, options?: { execute?: boolean }) {
  return useFetch<T>(`${baseUrl()}${path}`, {
    headers: headers(),
    ...options,
  });
}

// ── Types ────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  environments?: Environment[];
}

export interface Environment {
  id: number;
  uuid: string;
  name: string;
  project_id: number;
  created_at: string;
  updated_at: string;
  description: string | null;
  applications?: Application[];
  services?: Service[];
  databases?: Database[];
}

export interface Application {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  fqdn: string | null;
  status: string;
  git_repository: string | null;
  git_branch: string | null;
  build_pack: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  service_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceApplication {
  uuid: string;
  name: string;
  status: string;
  image: string | null;
  fqdn: string | null;
  ports: string | null;
  last_online_at: string | null;
}

export interface ServiceDatabase {
  uuid: string;
  name: string;
  status: string;
  image: string | null;
  last_online_at: string | null;
}

export interface ServiceDetail extends Service {
  applications?: ServiceApplication[];
  databases?: ServiceDatabase[];
}

export interface Database {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDetail extends Database {
  image: string | null;
  is_public: boolean;
  public_port: number | null;
  internal_db_url: string | null;
  external_db_url: string | null;
  limits_memory: string | null;
  limits_cpus: string | null;
}

export interface Deployment {
  id: number;
  application_id: string;
  deployment_uuid: string;
  pull_request_id: number;
  force_rebuild: boolean;
  commit: string;
  commit_message: string | null;
  status: string;
  is_webhook: boolean;
  is_api: boolean;
  logs: string | null;
  current_process_id: string | null;
  restart_only: boolean;
  rollback: boolean;
  git_type: string | null;
  server_id: number;
  server_name: string | null;
  application_name: string | null;
  deployment_url: string | null;
  destination_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Server {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  ip: string;
  user: string;
  port: number;
  proxy?: {
    type?: string;
    status?: string;
  };
  settings?: {
    is_reachable?: boolean;
    is_usable?: boolean;
  };
}

// ── API functions ────────────────────────────────────────────────────

// Projects
export const listProjects = () => api<Project[]>("/projects");
export const getProject = (uuid: string) => api<Project>(`/projects/${uuid}`);
export const getEnvironmentDetails = async (projectUuid: string, envName: string): Promise<Environment> => {
  const raw = await api<
    Omit<Environment, "databases"> & {
      postgresqls?: Database[];
      mysqls?: Database[];
      mariadbs?: Database[];
      mongodbs?: Database[];
      redis?: Database[];
    }
  >(`/projects/${projectUuid}/${envName}`);
  return {
    ...raw,
    databases: [
      ...(raw.postgresqls || []),
      ...(raw.mysqls || []),
      ...(raw.mariadbs || []),
      ...(raw.mongodbs || []),
      ...(raw.redis || []),
    ],
  };
};

// Applications
export const listApplications = () => api<Application[]>("/applications");
export const getApplication = (uuid: string) => api<Application>(`/applications/${uuid}`);
export const getApplicationLogs = (uuid: string, lines = 100) =>
  api<{ logs: string[] } | string[]>(`/applications/${uuid}/logs?lines=${lines}`).then((r) =>
    Array.isArray(r) ? r : Array.isArray(r.logs) ? r.logs : [String(r.logs)],
  );
export const restartApplication = (uuid: string) => api<{ message: string }>(`/applications/${uuid}/restart`);
export const stopApplication = (uuid: string) => api<{ message: string }>(`/applications/${uuid}/stop`);
export const startApplication = (uuid: string) => api<{ message: string }>(`/applications/${uuid}/start`);

// Deployments
export const listDeployments = () => api<Deployment[]>("/deployments");
export const getDeployment = (uuid: string) => api<Deployment>(`/deployments/${uuid}`);
export const listDeploymentsByApp = (appUuid: string, skip = 0, take = 20) =>
  api<{ deployments: Deployment[] } | Deployment[]>(
    `/deployments/applications/${appUuid}?skip=${skip}&take=${take}`,
  ).then((r) => (Array.isArray(r) ? r : r.deployments));
export const cancelDeployment = (uuid: string) => api<void>(`/deployments/${uuid}/cancel`, { method: "POST" });

// Servers
export const listServers = () => api<Server[]>("/servers");
export const getServer = (uuid: string) => api<Server>(`/servers/${uuid}`);

// Services
export const listServices = () => api<Service[]>("/services");
export const getService = (uuid: string) => api<ServiceDetail>(`/services/${uuid}`);
export const startService = (uuid: string) => api<{ message: string }>(`/services/${uuid}/start`);
export const stopService = (uuid: string) => api<{ message: string }>(`/services/${uuid}/stop`);
export const restartService = (uuid: string) => api<{ message: string }>(`/services/${uuid}/restart`);

// Databases
export const getDatabase = (uuid: string) => api<DatabaseDetail>(`/databases/${uuid}`);
export const startDatabase = (uuid: string) => api<{ message: string }>(`/databases/${uuid}/start`);
export const stopDatabase = (uuid: string) => api<{ message: string }>(`/databases/${uuid}/stop`);
export const restartDatabase = (uuid: string) => api<{ message: string }>(`/databases/${uuid}/restart`);

// Servers — validation
export const validateServer = (uuid: string) => api<void>(`/servers/${uuid}/validate`);

// System
export const getVersion = () => api<string>("/version");
