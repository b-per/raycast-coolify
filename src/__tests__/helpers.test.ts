/**
 * Tests for pure helper functions.
 *
 * We mock @raycast/api to provide Color and Icon enums as plain strings
 * so the tests run in Node without the full Raycast runtime.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("@raycast/api", () => ({
  Color: {
    Green: "green",
    Red: "red",
    Yellow: "yellow",
    Orange: "orange",
    SecondaryText: "secondaryText",
  },
  Icon: {
    CheckCircle: "checkCircle",
    XMarkCircle: "xMarkCircle",
    Clock: "clock",
    Hourglass: "hourglass",
    MinusCircle: "minusCircle",
    QuestionMarkCircle: "questionMarkCircle",
    CircleDisabled: "circleDisabled",
  },
}));

import {
  deploymentStatusColor,
  deploymentStatusIcon,
  resourceStatusColor,
  resourceStatusIcon,
  proxyStatusColor,
  proxyStatusText,
  parseDeploymentLogs,
  traefikStatusColor,
  traefikStatusIcon,
  extractHostFromRule,
} from "../helpers";
import type { Server } from "../api";

// ── deploymentStatusColor ───────────────────────────────────────────

describe("deploymentStatusColor", () => {
  it("returns Green for finished", () => {
    expect(deploymentStatusColor("finished")).toBe("green");
  });

  it("returns Red for failed", () => {
    expect(deploymentStatusColor("failed")).toBe("red");
  });

  it("returns Red for error", () => {
    expect(deploymentStatusColor("error")).toBe("red");
  });

  it("returns Yellow for in_progress", () => {
    expect(deploymentStatusColor("in_progress")).toBe("yellow");
  });

  it("returns Yellow for queued", () => {
    expect(deploymentStatusColor("queued")).toBe("yellow");
  });

  it("returns Orange for cancelled", () => {
    expect(deploymentStatusColor("cancelled")).toBe("orange");
  });

  it("returns SecondaryText for unknown status", () => {
    expect(deploymentStatusColor("whatever")).toBe("secondaryText");
  });

  it("returns SecondaryText for empty string", () => {
    expect(deploymentStatusColor("")).toBe("secondaryText");
  });
});

// ── deploymentStatusIcon ────────────────────────────────────────────

describe("deploymentStatusIcon", () => {
  it("returns CheckCircle for finished", () => {
    expect(deploymentStatusIcon("finished")).toBe("checkCircle");
  });

  it("returns XMarkCircle for failed", () => {
    expect(deploymentStatusIcon("failed")).toBe("xMarkCircle");
  });

  it("returns XMarkCircle for error", () => {
    expect(deploymentStatusIcon("error")).toBe("xMarkCircle");
  });

  it("returns Clock for in_progress", () => {
    expect(deploymentStatusIcon("in_progress")).toBe("clock");
  });

  it("returns Hourglass for queued", () => {
    expect(deploymentStatusIcon("queued")).toBe("hourglass");
  });

  it("returns MinusCircle for cancelled", () => {
    expect(deploymentStatusIcon("cancelled")).toBe("minusCircle");
  });

  it("returns QuestionMarkCircle for unknown", () => {
    expect(deploymentStatusIcon("xyz")).toBe("questionMarkCircle");
  });
});

// ── resourceStatusColor ─────────────────────────────────────────────

describe("resourceStatusColor", () => {
  it("returns Green for running", () => {
    expect(resourceStatusColor("running")).toBe("green");
  });

  it("returns Green for running:healthy", () => {
    expect(resourceStatusColor("running:healthy")).toBe("green");
  });

  it("returns Green for finished", () => {
    expect(resourceStatusColor("finished")).toBe("green");
  });

  it("returns Red for stopped", () => {
    expect(resourceStatusColor("stopped")).toBe("red");
  });

  it("returns Red for exited", () => {
    expect(resourceStatusColor("exited")).toBe("red");
  });

  it("returns Yellow for starting", () => {
    expect(resourceStatusColor("starting")).toBe("yellow");
  });

  it("returns Yellow for restarting", () => {
    expect(resourceStatusColor("restarting")).toBe("yellow");
  });

  it("returns SecondaryText for empty string", () => {
    expect(resourceStatusColor("")).toBe("secondaryText");
  });

  it("returns SecondaryText for unknown status", () => {
    expect(resourceStatusColor("pending")).toBe("secondaryText");
  });
});

// ── resourceStatusIcon ──────────────────────────────────────────────

describe("resourceStatusIcon", () => {
  it("returns CheckCircle for running", () => {
    expect(resourceStatusIcon("running")).toBe("checkCircle");
  });

  it("returns CheckCircle for healthy", () => {
    expect(resourceStatusIcon("running:healthy")).toBe("checkCircle");
  });

  it("returns XMarkCircle for stopped", () => {
    expect(resourceStatusIcon("stopped")).toBe("xMarkCircle");
  });

  it("returns XMarkCircle for exited", () => {
    expect(resourceStatusIcon("exited")).toBe("xMarkCircle");
  });

  it("returns Clock for starting", () => {
    expect(resourceStatusIcon("starting")).toBe("clock");
  });

  it("returns Clock for restarting", () => {
    expect(resourceStatusIcon("restarting")).toBe("clock");
  });

  it("returns QuestionMarkCircle for empty string", () => {
    expect(resourceStatusIcon("")).toBe("questionMarkCircle");
  });

  it("returns CircleDisabled for unknown status", () => {
    expect(resourceStatusIcon("pending")).toBe("circleDisabled");
  });
});

// ── proxyStatusColor ────────────────────────────────────────────────

describe("proxyStatusColor", () => {
  function server(overrides: Partial<Server> = {}): Server {
    return {
      id: 1,
      uuid: "srv-1",
      name: "test",
      description: null,
      ip: "10.0.0.1",
      user: "root",
      port: 22,
      proxy: { type: "traefik", status: "running" },
      settings: { is_reachable: true, is_usable: true },
      ...overrides,
    };
  }

  it("returns Red when server is unreachable", () => {
    expect(proxyStatusColor(server({ settings: { is_reachable: false } }))).toBe("red");
  });

  it("returns Green when proxy is running", () => {
    expect(proxyStatusColor(server())).toBe("green");
  });

  it("returns Red when proxy is stopped", () => {
    expect(proxyStatusColor(server({ proxy: { status: "stopped" } }))).toBe("red");
  });

  it("returns Red when proxy is exited", () => {
    expect(proxyStatusColor(server({ proxy: { status: "exited" } }))).toBe("red");
  });

  it("returns SecondaryText for unknown proxy status", () => {
    expect(proxyStatusColor(server({ proxy: { status: "unknown" } }))).toBe("secondaryText");
  });

  it("returns SecondaryText when proxy is undefined", () => {
    expect(proxyStatusColor(server({ proxy: undefined }))).toBe("secondaryText");
  });
});

// ── proxyStatusText ─────────────────────────────────────────────────

describe("proxyStatusText", () => {
  function server(overrides: Partial<Server> = {}): Server {
    return {
      id: 1,
      uuid: "srv-1",
      name: "test",
      description: null,
      ip: "10.0.0.1",
      user: "root",
      port: 22,
      proxy: { type: "traefik", status: "running" },
      settings: { is_reachable: true, is_usable: true },
      ...overrides,
    };
  }

  it("returns 'unreachable' when server is not reachable", () => {
    expect(proxyStatusText(server({ settings: { is_reachable: false } }))).toBe("unreachable");
  });

  it("returns proxy status when reachable", () => {
    expect(proxyStatusText(server())).toBe("running");
  });

  it("returns 'unknown' when proxy status is undefined", () => {
    expect(proxyStatusText(server({ proxy: {} }))).toBe("unknown");
  });

  it("returns 'unknown' when proxy is undefined", () => {
    expect(proxyStatusText(server({ proxy: undefined }))).toBe("unknown");
  });
});

// ── parseDeploymentLogs ─────────────────────────────────────────────

describe("parseDeploymentLogs", () => {
  it("parses JSON array of log entries into output lines", () => {
    const raw = JSON.stringify([
      { output: "Starting build", type: "stdout", hidden: false },
      { output: "Build complete", type: "stdout", hidden: false },
    ]);
    expect(parseDeploymentLogs(raw)).toBe("Starting build\nBuild complete");
  });

  it("includes hidden (debug) entries", () => {
    const raw = JSON.stringify([
      { output: "visible", type: "stdout", hidden: false },
      { output: "debug", type: "stdout", hidden: true },
    ]);
    expect(parseDeploymentLogs(raw)).toBe("visible\ndebug");
  });

  it("filters out entries with empty output", () => {
    const raw = JSON.stringify([
      { output: "", type: "stdout", hidden: false },
      { output: "line", type: "stdout", hidden: false },
    ]);
    expect(parseDeploymentLogs(raw)).toBe("line");
  });

  it("returns fallback for null", () => {
    expect(parseDeploymentLogs(null)).toBe("No logs available.");
  });

  it("returns fallback for undefined", () => {
    expect(parseDeploymentLogs(undefined)).toBe("No logs available.");
  });

  it("returns fallback for empty string", () => {
    expect(parseDeploymentLogs("")).toBe("No logs available.");
  });

  it("returns plain string if not valid JSON", () => {
    expect(parseDeploymentLogs("plain log text")).toBe("plain log text");
  });

  it("returns raw string if JSON parses to non-array", () => {
    expect(parseDeploymentLogs('{"key":"val"}')).toBe('{"key":"val"}');
  });

  it("includes entries even if all are hidden", () => {
    const raw = JSON.stringify([{ output: "debug only", type: "stdout", hidden: true }]);
    expect(parseDeploymentLogs(raw)).toBe("debug only");
  });
});

// ── traefikStatusColor ──────────────────────────────────────────────

describe("traefikStatusColor", () => {
  it("returns Green for enabled", () => {
    expect(traefikStatusColor("enabled")).toBe("green");
  });

  it("returns Red for disabled", () => {
    expect(traefikStatusColor("disabled")).toBe("red");
  });

  it("returns SecondaryText for unknown status", () => {
    expect(traefikStatusColor("warning")).toBe("secondaryText");
  });

  it("returns SecondaryText for empty string", () => {
    expect(traefikStatusColor("")).toBe("secondaryText");
  });
});

// ── traefikStatusIcon ───────────────────────────────────────────────

describe("traefikStatusIcon", () => {
  it("returns CheckCircle for enabled", () => {
    expect(traefikStatusIcon("enabled")).toBe("checkCircle");
  });

  it("returns XMarkCircle for disabled", () => {
    expect(traefikStatusIcon("disabled")).toBe("xMarkCircle");
  });

  it("returns QuestionMarkCircle for unknown", () => {
    expect(traefikStatusIcon("something")).toBe("questionMarkCircle");
  });
});

// ── extractHostFromRule ─────────────────────────────────────────────

describe("extractHostFromRule", () => {
  it("extracts hostname from Host rule", () => {
    expect(extractHostFromRule("Host(`app.example.com`)")).toBe("app.example.com");
  });

  it("extracts hostname when combined with other matchers", () => {
    expect(extractHostFromRule("Host(`app.example.com`) && PathPrefix(`/api`)")).toBe("app.example.com");
  });

  it("returns null for non-Host rules", () => {
    expect(extractHostFromRule("PathPrefix(`/api`)")).toBeNull();
  });

  it("returns null for empty rule", () => {
    expect(extractHostFromRule("")).toBeNull();
  });

  it("extracts first host when multiple Host matchers exist", () => {
    expect(extractHostFromRule("Host(`first.example.com`) || Host(`second.example.com`)")).toBe("first.example.com");
  });
});
