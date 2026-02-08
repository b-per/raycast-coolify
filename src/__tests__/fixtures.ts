import type { Deployment, Project, Server, Application, Service } from "../api";

/** Build a mock fetch Response */
export function fakeResponse(body: unknown, status = 200) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(text),
  };
}

export const sampleDeployment: Deployment = {
  id: 1,
  application_id: "app-abc",
  deployment_uuid: "dep-uuid-1",
  pull_request_id: 0,
  force_rebuild: false,
  commit: "abc1234567890",
  commit_message: "fix: resolve login bug",
  status: "finished",
  is_webhook: false,
  is_api: false,
  logs: "Build completed successfully.",
  current_process_id: null,
  restart_only: false,
  rollback: false,
  git_type: null,
  server_id: 1,
  server_name: "prod-server",
  application_name: "my-app",
  deployment_url: "/deployments/dep-uuid-1",
  destination_id: null,
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:05:00Z",
};

export const sampleApplication: Application = {
  id: 1,
  uuid: "app-uuid-1",
  name: "my-app",
  description: "A sample application",
  fqdn: "https://app.example.com",
  status: "running",
  git_repository: "https://github.com/example/app",
  git_branch: "main",
  build_pack: "nixpacks",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

export const sampleProject: Project = {
  id: 1,
  uuid: "proj-uuid-1",
  name: "My Project",
  description: "A test project",
  environments: [
    {
      id: 1,
      uuid: "env-uuid-1",
      name: "production",
      project_id: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-10T00:00:00Z",
      description: null,
    },
  ],
};

export const sampleService: Service = {
  id: 1,
  uuid: "svc-uuid-1",
  name: "immich",
  description: "Photo management",
  service_type: "immich",
  status: "running:healthy",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

export const sampleServer: Server = {
  id: 1,
  uuid: "srv-uuid-1",
  name: "prod-server",
  description: "Production server",
  ip: "10.0.0.1",
  user: "root",
  port: 22,
  proxy: { type: "traefik", status: "running" },
  settings: { is_reachable: true, is_usable: true },
};
