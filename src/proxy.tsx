import {
  Action,
  ActionPanel,
  Color,
  Detail,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useState, useEffect } from "react";
import {
  Server,
  TraefikRouter,
  TraefikService,
  listServers,
  coolifyUrl,
  validateServer,
  fetchTraefikRawData,
} from "./api";
import { traefikStatusColor, traefikStatusIcon, extractHostFromRule } from "./helpers";

export default function ProxyCommand() {
  const traefikConfigured = Boolean(getPreferenceValues<{ traefikUrl?: string }>().traefikUrl);
  const [servers, setServers] = useState<Server[]>([]);
  const [routers, setRouters] = useState<TraefikRouter[]>([]);
  const [services, setServices] = useState<TraefikService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const [serverData, traefikData] = await Promise.all([listServers(), fetchTraefikRawData()]);
      setServers(serverData);
      setRouters(traefikData.routers);
      setServices(traefikData.services);
    } catch (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load data", message: String(err) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRestart(server: Server) {
    if (
      await confirmAlert({
        title: "Restart Proxy",
        message: `Are you sure you want to validate/restart the proxy on "${server.name}"? This will trigger a server validation which checks the proxy.`,
        primaryAction: { title: "Restart", style: Alert.ActionStyle.Destructive },
      })
    ) {
      try {
        await showToast({ style: Toast.Style.Animated, title: "Validating server & proxy…" });
        await validateServer(server.uuid);
        await showToast({ style: Toast.Style.Success, title: "Server validation triggered" });
        load();
      } catch (err) {
        await showToast({ style: Toast.Style.Failure, title: "Failed", message: String(err) });
      }
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter servers and routes…">
      <List.Section title="Servers">
        {servers.map((server) => (
          <List.Item
            key={server.uuid}
            icon={{ source: Icon.Globe, tintColor: server.settings?.is_reachable ? Color.Green : Color.Red }}
            title={server.name}
            subtitle={`${server.ip}:${server.port} — Proxy: ${server.proxy?.type || "traefik"}`}
            accessories={[
              {
                tag: {
                  value: server.settings?.is_reachable ? "reachable" : "unreachable",
                  color: server.settings?.is_reachable ? Color.Green : Color.Red,
                },
              },
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open Server in Coolify" url={coolifyUrl(`/server/${server.uuid}`)} />
                <Action
                  title="Validate / Restart Proxy"
                  icon={Icon.ArrowClockwise}
                  onAction={() => handleRestart(server)}
                />
                <Action.OpenInBrowser title="Open Proxy Dashboard" url={coolifyUrl(`/server/${server.uuid}/proxy`)} />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={load}
                />
                {/* eslint-disable-next-line @raycast/prefer-title-case */}
                <Action.CopyToClipboard title="Copy Server IP" content={server.ip} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {routers.length > 0 && (
        <List.Section title="Traefik Routes">
          {routers.map((router) => {
            const hostname = extractHostFromRule(router.rule);
            return (
              <List.Item
                key={router.name}
                icon={{ source: traefikStatusIcon(router.status), tintColor: traefikStatusColor(router.status) }}
                title={hostname || router.name}
                subtitle={router.service}
                accessories={[
                  { tag: { value: router.status, color: traefikStatusColor(router.status) } },
                  { text: router.entryPoints.join(", ") },
                ]}
                actions={
                  <ActionPanel>
                    <Action.Push title="View Details" icon={Icon.Eye} target={<RouterDetail router={router} />} />
                    {hostname && <Action.OpenInBrowser title="Open in Browser" url={`https://${hostname}`} />}
                    <Action.CopyToClipboard title="Copy Rule" content={router.rule} />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={load}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}

      {services.length > 0 && (
        <List.Section title="Traefik Services">
          {services.map((service) => {
            const backendCount = service.loadBalancer?.servers?.length ?? 0;
            return (
              <List.Item
                key={service.name}
                icon={{ source: traefikStatusIcon(service.status), tintColor: traefikStatusColor(service.status) }}
                title={service.name}
                subtitle={`${backendCount} backend${backendCount !== 1 ? "s" : ""}`}
                accessories={[{ tag: { value: service.status, color: traefikStatusColor(service.status) } }]}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View Details"
                      icon={Icon.Eye}
                      target={<TraefikServiceDetail service={service} />}
                    />
                    <Action.CopyToClipboard title="Copy Service Name" content={service.name} />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={load}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}

      {!traefikConfigured && !isLoading && (
        <List.Section title="Traefik Dashboard">
          <List.Item
            icon={{ source: Icon.Info, tintColor: Color.SecondaryText }}
            title="Traefik Dashboard Not Configured"
            subtitle="Set your Traefik URL in extension preferences to see routes and services"
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="View Setup Guide"
                  url="https://coolify.io/docs/knowledge-base/proxy/traefik/dashboard"
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
    </List>
  );
}

function RouterDetail({ router }: { router: TraefikRouter }) {
  const hostname = extractHostFromRule(router.rule);

  const md = [
    `# ${hostname || router.name}`,
    "",
    `**Rule:** \`${router.rule}\``,
    "",
    `**Entrypoints:** ${router.entryPoints.join(", ")}`,
    "",
    `**Service:** ${router.service}`,
    "",
    `**Provider:** ${router.provider}`,
  ];

  if (router.middlewares?.length) {
    md.push("", `**Middlewares:** ${router.middlewares.join(", ")}`);
  }

  if (router.tls) {
    md.push("", `**TLS:** ${router.tls.certResolver ? `cert resolver: ${router.tls.certResolver}` : "enabled"}`);
  }

  return (
    <Detail
      markdown={md.join("\n")}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={router.status} color={traefikStatusColor(router.status)} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Service" text={router.service} />
          <Detail.Metadata.Label title="Provider" text={router.provider} />
          <Detail.Metadata.Label title="Entrypoints" text={router.entryPoints.join(", ")} />
          {router.middlewares?.length ? (
            <Detail.Metadata.Label title="Middlewares" text={router.middlewares.join(", ")} />
          ) : null}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {hostname && <Action.OpenInBrowser title="Open in Browser" url={`https://${hostname}`} />}
          <Action.CopyToClipboard title="Copy Rule" content={router.rule} />
        </ActionPanel>
      }
    />
  );
}

function TraefikServiceDetail({ service }: { service: TraefikService }) {
  const backends = service.loadBalancer?.servers ?? [];
  const serverStatus = service.serverStatus ?? {};

  const md = [`# ${service.name}`, ""];

  if (backends.length > 0) {
    md.push("## Backend Servers", "");
    md.push("| URL | Status |", "|---|---|");
    for (const backend of backends) {
      const status = serverStatus[backend.url] ?? "unknown";
      md.push(`| \`${backend.url}\` | ${status} |`);
    }
  } else {
    md.push("*No backend servers configured.*");
  }

  if (service.usedBy?.length) {
    md.push("", "## Used By", "");
    for (const router of service.usedBy) {
      md.push(`- ${router}`);
    }
  }

  const backendUrls = backends.map((b) => b.url).join("\n");

  return (
    <Detail
      markdown={md.join("\n")}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={service.status} color={traefikStatusColor(service.status)} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Provider" text={service.provider} />
          <Detail.Metadata.Label title="Backends" text={String(backends.length)} />
          {service.type ? <Detail.Metadata.Label title="Type" text={service.type} /> : null}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Service Name" content={service.name} />
          {backendUrls && <Action.CopyToClipboard title="Copy Backend Urls" content={backendUrls} />}
        </ActionPanel>
      }
    />
  );
}
