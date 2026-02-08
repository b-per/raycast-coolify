import { Color, Icon } from "@raycast/api";
import type { Server } from "./api";

// ── Deployment status helpers (used in deployments.tsx + projects.tsx) ──

export function deploymentStatusColor(status: string): Color {
  switch (status) {
    case "finished":
      return Color.Green;
    case "failed":
    case "error":
      return Color.Red;
    case "in_progress":
    case "queued":
      return Color.Yellow;
    case "cancelled":
      return Color.Orange;
    default:
      return Color.SecondaryText;
  }
}

export function deploymentStatusIcon(status: string): Icon {
  switch (status) {
    case "finished":
      return Icon.CheckCircle;
    case "failed":
    case "error":
      return Icon.XMarkCircle;
    case "in_progress":
      return Icon.Clock;
    case "queued":
      return Icon.Hourglass;
    case "cancelled":
      return Icon.MinusCircle;
    default:
      return Icon.QuestionMarkCircle;
  }
}

// ── Application/resource status helpers (used in projects.tsx) ──

export function resourceStatusColor(status: string): Color {
  if (!status) return Color.SecondaryText;
  const s = status.toLowerCase();
  if (s.includes("running") || s.includes("healthy") || s === "finished") return Color.Green;
  if (s.includes("stopped") || s.includes("exited")) return Color.Red;
  if (s.includes("starting") || s.includes("restarting")) return Color.Yellow;
  return Color.SecondaryText;
}

export function resourceStatusIcon(status: string): Icon {
  if (!status) return Icon.QuestionMarkCircle;
  const s = status.toLowerCase();
  if (s.includes("running") || s.includes("healthy")) return Icon.CheckCircle;
  if (s.includes("stopped") || s.includes("exited")) return Icon.XMarkCircle;
  if (s.includes("starting") || s.includes("restarting")) return Icon.Clock;
  return Icon.CircleDisabled;
}

// ── Proxy status helpers (used in proxy.tsx) ──

export function proxyStatusColor(server: Server): Color {
  if (server.settings?.is_reachable === false) return Color.Red;
  if (server.proxy?.status === "running") return Color.Green;
  if (server.proxy?.status === "stopped" || server.proxy?.status === "exited") return Color.Red;
  return Color.SecondaryText;
}

export function proxyStatusText(server: Server): string {
  if (server.settings?.is_reachable === false) return "unreachable";
  return server.proxy?.status || "unknown";
}
