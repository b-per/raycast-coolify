import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node-fetch", () => ({ default: vi.fn() }));
vi.mock("@raycast/api", () => ({ getPreferenceValues: vi.fn() }));
vi.mock("@raycast/utils", () => ({ useFetch: vi.fn() }));

import fetch from "node-fetch";
import { getPreferenceValues } from "@raycast/api";
import {
  fakeResponse,
  sampleDeployment,
  sampleProject,
  sampleServer,
  sampleApplication,
  sampleService,
} from "./fixtures";

const mockFetch = vi.mocked(fetch);
const mockPrefs = vi.mocked(getPreferenceValues);

// Import api functions after mocks are set up
import {
  coolifyUrl,
  listProjects,
  getProject,
  getEnvironmentDetails,
  listApplications,
  getApplication,
  getApplicationLogs,
  restartApplication,
  stopApplication,
  startApplication,
  listDeployments,
  getDeployment,
  listDeploymentsByApp,
  cancelDeployment,
  listServers,
  getServer,
  validateServer,
  listServices,
  getService,
  startService,
  stopService,
  restartService,
  getDatabase,
  startDatabase,
  stopDatabase,
  restartDatabase,
  getVersion,
  fetchTraefikRawData,
} from "../api";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrefs.mockReturnValue({
    serverUrl: "https://coolify.example.com",
    apiToken: "test-token-123",
  });
});

// ── coolifyUrl ──────────────────────────────────────────────────────

describe("coolifyUrl", () => {
  it("builds a URL from the server base", () => {
    expect(coolifyUrl("/project/abc")).toBe("https://coolify.example.com/project/abc");
  });

  it("strips trailing slashes from serverUrl", () => {
    mockPrefs.mockReturnValue({ serverUrl: "https://coolify.example.com///", apiToken: "t" });
    expect(coolifyUrl("/foo")).toBe("https://coolify.example.com/foo");
  });
});

// ── Generic fetch behaviour ─────────────────────────────────────────

describe("api() internals (via listProjects)", () => {
  it("sends GET with auth headers", async () => {
    mockFetch.mockResolvedValue(fakeResponse([]) as never);
    await listProjects();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://coolify.example.com/api/v1/projects",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token-123",
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      }),
    );
  });

  it("sends POST when method is specified", async () => {
    mockFetch.mockResolvedValue(fakeResponse({}) as never);
    await cancelDeployment("dep-1");

    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }));
  });

  it("throws on 4xx response", async () => {
    mockFetch.mockResolvedValue(fakeResponse("Not Found", 404) as never);
    await expect(listProjects()).rejects.toThrow("API 404: Not Found");
  });

  it("throws on 5xx response", async () => {
    mockFetch.mockResolvedValue(fakeResponse("Internal Server Error", 500) as never);
    await expect(listProjects()).rejects.toThrow("API 500");
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(listProjects()).rejects.toThrow("ECONNREFUSED");
  });

  it("returns empty object for empty response body", async () => {
    mockFetch.mockResolvedValue(fakeResponse("", 200) as never);
    const result = await listProjects();
    expect(result).toEqual({});
  });

  it("returns raw text for non-JSON response", async () => {
    mockFetch.mockResolvedValue(fakeResponse("plain text") as never);
    // The response is plain text so JSON.parse fails, returning the raw string
    const result = await getVersion();
    expect(result).toBe("plain text");
  });

  it("strips trailing slashes from serverUrl in API calls", async () => {
    mockPrefs.mockReturnValue({ serverUrl: "https://coolify.example.com/", apiToken: "t" });
    mockFetch.mockResolvedValue(fakeResponse([]) as never);
    await listProjects();

    expect(mockFetch).toHaveBeenCalledWith("https://coolify.example.com/api/v1/projects", expect.anything());
  });
});

// ── Projects ────────────────────────────────────────────────────────

describe("project endpoints", () => {
  it("listProjects hits /projects", async () => {
    mockFetch.mockResolvedValue(fakeResponse([sampleProject]) as never);
    const result = await listProjects();
    expect(result).toEqual([sampleProject]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/projects"), expect.anything());
  });

  it("getProject hits /projects/:uuid", async () => {
    mockFetch.mockResolvedValue(fakeResponse(sampleProject) as never);
    const result = await getProject("proj-uuid-1");
    expect(result).toEqual(sampleProject);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/projects/proj-uuid-1"), expect.anything());
  });

  it("getEnvironmentDetails hits /projects/:uuid/:envName", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ id: 1, name: "production" }) as never);
    await getEnvironmentDetails("proj-uuid-1", "production");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/projects/proj-uuid-1/production"),
      expect.anything(),
    );
  });
});

// ── Applications ────────────────────────────────────────────────────

describe("application endpoints", () => {
  it("listApplications hits /applications", async () => {
    mockFetch.mockResolvedValue(fakeResponse([sampleApplication]) as never);
    const result = await listApplications();
    expect(result).toEqual([sampleApplication]);
  });

  it("getApplication hits /applications/:uuid", async () => {
    mockFetch.mockResolvedValue(fakeResponse(sampleApplication) as never);
    const result = await getApplication("app-uuid-1");
    expect(result).toEqual(sampleApplication);
  });

  it("restartApplication hits /applications/:uuid/restart", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await restartApplication("app-uuid-1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/applications/app-uuid-1/restart"),
      expect.anything(),
    );
  });

  it("stopApplication hits /applications/:uuid/stop", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await stopApplication("app-uuid-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/applications/app-uuid-1/stop"), expect.anything());
  });

  it("startApplication hits /applications/:uuid/start", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await startApplication("app-uuid-1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/applications/app-uuid-1/start"),
      expect.anything(),
    );
  });
});

// ── getApplicationLogs — 3 response shapes ──────────────────────────

describe("getApplicationLogs", () => {
  it("handles { logs: string[] } response", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ logs: ["line1", "line2"] }) as never);
    const result = await getApplicationLogs("app-1");
    expect(result).toEqual(["line1", "line2"]);
  });

  it("handles direct string[] response", async () => {
    mockFetch.mockResolvedValue(fakeResponse(["line1", "line2"]) as never);
    const result = await getApplicationLogs("app-1");
    expect(result).toEqual(["line1", "line2"]);
  });

  it("handles { logs: string } response (wraps in array)", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ logs: "single log line" }) as never);
    const result = await getApplicationLogs("app-1");
    expect(result).toEqual(["single log line"]);
  });

  it("passes lines parameter in query string", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ logs: [] }) as never);
    await getApplicationLogs("app-1", 50);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/applications/app-1/logs?lines=50"),
      expect.anything(),
    );
  });

  it("defaults to 100 lines", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ logs: [] }) as never);
    await getApplicationLogs("app-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("lines=100"), expect.anything());
  });
});

// ── Deployments ─────────────────────────────────────────────────────

describe("deployment endpoints", () => {
  it("listDeployments hits /deployments", async () => {
    mockFetch.mockResolvedValue(fakeResponse([sampleDeployment]) as never);
    const result = await listDeployments();
    expect(result).toEqual([sampleDeployment]);
  });

  it("getDeployment hits /deployments/:uuid", async () => {
    mockFetch.mockResolvedValue(fakeResponse(sampleDeployment) as never);
    const result = await getDeployment("dep-uuid-1");
    expect(result).toEqual(sampleDeployment);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/deployments/dep-uuid-1"), expect.anything());
  });

  it("cancelDeployment sends POST to /deployments/:uuid/cancel", async () => {
    mockFetch.mockResolvedValue(fakeResponse({}) as never);
    await cancelDeployment("dep-uuid-1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/deployments/dep-uuid-1/cancel"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ── listDeploymentsByApp — unwrap logic ─────────────────────────────

describe("listDeploymentsByApp", () => {
  it("unwraps { deployments: [...] } response", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ deployments: [sampleDeployment] }) as never);
    const result = await listDeploymentsByApp("app-1");
    expect(result).toEqual([sampleDeployment]);
  });

  it("passes through direct array response", async () => {
    mockFetch.mockResolvedValue(fakeResponse([sampleDeployment]) as never);
    const result = await listDeploymentsByApp("app-1");
    expect(result).toEqual([sampleDeployment]);
  });

  it("includes skip and take query params", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ deployments: [] }) as never);
    await listDeploymentsByApp("app-1", 10, 5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/deployments/applications/app-1?skip=10&take=5"),
      expect.anything(),
    );
  });

  it("uses default skip=0 and take=20", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ deployments: [] }) as never);
    await listDeploymentsByApp("app-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("skip=0&take=20"), expect.anything());
  });
});

// ── Servers ─────────────────────────────────────────────────────────

describe("server endpoints", () => {
  it("listServers hits /servers", async () => {
    mockFetch.mockResolvedValue(fakeResponse([sampleServer]) as never);
    const result = await listServers();
    expect(result).toEqual([sampleServer]);
  });

  it("getServer hits /servers/:uuid", async () => {
    mockFetch.mockResolvedValue(fakeResponse(sampleServer) as never);
    const result = await getServer("srv-uuid-1");
    expect(result).toEqual(sampleServer);
  });

  it("validateServer hits /servers/:uuid/validate", async () => {
    mockFetch.mockResolvedValue(fakeResponse({}) as never);
    await validateServer("srv-uuid-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/servers/srv-uuid-1/validate"), expect.anything());
  });
});

// ── Services ────────────────────────────────────────────────────────

describe("service endpoints", () => {
  it("listServices hits /services", async () => {
    mockFetch.mockResolvedValue(fakeResponse([]) as never);
    await listServices();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/services"), expect.anything());
  });

  it("getService hits /services/:uuid", async () => {
    const detail = { ...sampleService, applications: [], databases: [] };
    mockFetch.mockResolvedValue(fakeResponse(detail) as never);
    const result = await getService("svc-uuid-1");
    expect(result).toEqual(detail);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/services/svc-uuid-1"), expect.anything());
  });

  it("startService hits /services/:uuid/start", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await startService("svc-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/services/svc-1/start"), expect.anything());
  });

  it("stopService hits /services/:uuid/stop", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await stopService("svc-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/services/svc-1/stop"), expect.anything());
  });

  it("restartService hits /services/:uuid/restart", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await restartService("svc-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/services/svc-1/restart"), expect.anything());
  });
});

// ── Databases ────────────────────────────────────────────────────────

describe("database endpoints", () => {
  it("getDatabase hits /databases/:uuid", async () => {
    const detail = { uuid: "db-uuid-1", name: "postgres", status: "running", image: "postgres:16" };
    mockFetch.mockResolvedValue(fakeResponse(detail) as never);
    const result = await getDatabase("db-uuid-1");
    expect(result).toEqual(detail);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/databases/db-uuid-1"), expect.anything());
  });

  it("startDatabase hits /databases/:uuid/start", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await startDatabase("db-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/databases/db-1/start"), expect.anything());
  });

  it("stopDatabase hits /databases/:uuid/stop", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await stopDatabase("db-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/databases/db-1/stop"), expect.anything());
  });

  it("restartDatabase hits /databases/:uuid/restart", async () => {
    mockFetch.mockResolvedValue(fakeResponse({ message: "ok" }) as never);
    await restartDatabase("db-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/databases/db-1/restart"), expect.anything());
  });
});

// ── System ──────────────────────────────────────────────────────────

describe("system endpoints", () => {
  it("getVersion hits /version", async () => {
    mockFetch.mockResolvedValue(fakeResponse("4.0.0") as never);
    const result = await getVersion();
    expect(result).toBe("4.0.0");
  });
});

// ── Traefik ─────────────────────────────────────────────────────────

describe("fetchTraefikRawData", () => {
  it("returns empty arrays when traefikUrl is not set", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
    });
    const result = await fetchTraefikRawData();
    expect(result).toEqual({ routers: [], services: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty arrays when traefikUrl is empty string", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "",
    });
    const result = await fetchTraefikRawData();
    expect(result).toEqual({ routers: [], services: [] });
  });

  it("sends correct Basic Auth header when credentials are provided", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com",
      traefikUser: "admin",
      traefikPassword: "secret",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ routers: {}, services: {} }),
    } as never);

    await fetchTraefikRawData();

    const expectedAuth = `Basic ${Buffer.from("admin:secret").toString("base64")}`;
    expect(mockFetch).toHaveBeenCalledWith(
      "https://traefik.example.com/api/rawdata",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expectedAuth }),
      }),
    );
  });

  it("does not send Auth header when credentials are missing", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ routers: {}, services: {} }),
    } as never);

    await fetchTraefikRawData();

    const call = mockFetch.mock.calls[0];
    const headers = (call[1] as { headers: Record<string, string> }).headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it("flattens Record response into arrays with key as name", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        routers: {
          "my-router@docker": {
            entryPoints: ["websecure"],
            service: "my-svc",
            rule: "Host(`app.example.com`)",
            status: "enabled",
            provider: "docker",
          },
        },
        services: {
          "my-svc@docker": {
            status: "enabled",
            loadBalancer: { servers: [{ url: "http://10.0.0.1:8080" }] },
            serverStatus: { "http://10.0.0.1:8080": "UP" },
            provider: "docker",
          },
        },
      }),
    } as never);

    const result = await fetchTraefikRawData();

    expect(result.routers).toHaveLength(1);
    expect(result.routers[0].name).toBe("my-router@docker");
    expect(result.routers[0].rule).toBe("Host(`app.example.com`)");
    expect(result.routers[0].entryPoints).toEqual(["websecure"]);

    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("my-svc@docker");
    expect(result.services[0].loadBalancer?.servers).toEqual([{ url: "http://10.0.0.1:8080" }]);
  });

  it("filters out internal provider entries", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        routers: {
          "api@internal": {
            entryPoints: ["traefik"],
            service: "api@internal",
            rule: "PathPrefix(`/api`)",
            status: "enabled",
            provider: "internal",
          },
          "my-app@docker": {
            entryPoints: ["websecure"],
            service: "my-app",
            rule: "Host(`app.example.com`)",
            status: "enabled",
            provider: "docker",
          },
        },
        services: {
          "api@internal": {
            status: "enabled",
            provider: "internal",
          },
          "my-app@docker": {
            status: "enabled",
            provider: "docker",
          },
        },
      }),
    } as never);

    const result = await fetchTraefikRawData();

    expect(result.routers).toHaveLength(1);
    expect(result.routers[0].name).toBe("my-app@docker");

    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("my-app@docker");
  });

  it("throws on non-OK HTTP status", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com",
    });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    } as never);

    await expect(fetchTraefikRawData()).rejects.toThrow("Traefik API 401: Unauthorized");
  });

  it("strips trailing slashes from traefikUrl", async () => {
    mockPrefs.mockReturnValue({
      serverUrl: "https://coolify.example.com",
      apiToken: "test-token-123",
      traefikUrl: "https://traefik.example.com///",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ routers: {}, services: {} }),
    } as never);

    await fetchTraefikRawData();

    expect(mockFetch).toHaveBeenCalledWith("https://traefik.example.com/api/rawdata", expect.anything());
  });
});
