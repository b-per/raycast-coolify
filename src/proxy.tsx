import { Action, ActionPanel, Color, Icon, List, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { useState, useEffect } from "react";
import { Server, listServers, coolifyUrl, validateServer } from "./api";

export default function ProxyCommand() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const data = await listServers();
      setServers(data);
    } catch (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load servers", message: String(err) });
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
    <List isLoading={isLoading} searchBarPlaceholder="Filter servers…">
      {servers.map((server) => {
        return (
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
        );
      })}
    </List>
  );
}
