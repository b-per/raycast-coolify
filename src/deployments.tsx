import { Action, ActionPanel, Detail, Icon, Keyboard, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { Deployment, listApplications, listDeploymentsByApp, cancelDeployment, coolifyUrl } from "./api";
import { deploymentStatusColor, deploymentStatusIcon, parseDeploymentLogs } from "./helpers";

function DeploymentLogs({ deployment }: { deployment: Deployment }) {
  const logs = parseDeploymentLogs(deployment.logs);

  return (
    <Detail
      navigationTitle="Deployment Logs"
      markdown={`\`\`\`\n${logs}\n\`\`\``}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Application" text={deployment.application_name || "—"} />
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={deployment.status} color={deploymentStatusColor(deployment.status)} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Commit" text={deployment.commit ? deployment.commit.substring(0, 8) : "—"} />
          {deployment.commit_message && <Detail.Metadata.Label title="Message" text={deployment.commit_message} />}
          <Detail.Metadata.Label title="Server" text={deployment.server_name || "—"} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Created" text={new Date(deployment.created_at).toLocaleString()} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {deployment.deployment_url && (
            <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(deployment.deployment_url)} />
          )}
          <Action.CopyToClipboard title="Copy Logs" content={logs} />
        </ActionPanel>
      }
    />
  );
}

export default function DeploymentsCommand() {
  const { push } = useNavigation();
  const {
    data: deployments = [],
    isLoading,
    revalidate,
  } = useCachedPromise(async () => {
    const apps = await listApplications();
    const perApp = await Promise.all(apps.map((a) => listDeploymentsByApp(a.uuid, 0, 10).catch(() => [])));
    return perApp.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  async function handleCancel(deployment: Deployment) {
    try {
      await showToast({ style: Toast.Style.Animated, title: "Cancelling deployment…" });
      await cancelDeployment(deployment.deployment_uuid);
      await showToast({ style: Toast.Style.Success, title: "Deployment cancelled" });
      revalidate();
    } catch (err) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to cancel", message: String(err) });
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter deployments…">
      <List.EmptyView title="No Deployments" description="No deployments found across your applications" />
      {deployments.map((d) => (
        <List.Item
          key={d.deployment_uuid}
          icon={{ source: deploymentStatusIcon(d.status), tintColor: deploymentStatusColor(d.status) }}
          title={d.application_name || `App ${d.application_id}`}
          subtitle={d.commit_message || (d.commit ? d.commit.substring(0, 8) : "")}
          accessories={[
            { tag: { value: d.status, color: deploymentStatusColor(d.status) } },
            { text: d.server_name || "" },
            { date: new Date(d.created_at), tooltip: new Date(d.created_at).toLocaleString() },
          ]}
          actions={
            <ActionPanel>
              <Action title="View Logs" icon={Icon.Terminal} onAction={() => push(<DeploymentLogs deployment={d} />)} />
              {d.deployment_url && <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(d.deployment_url)} />}
              {(d.status === "in_progress" || d.status === "queued") && (
                <Action
                  title="Cancel Deployment"
                  icon={Icon.Stop}
                  style={Action.Style.Destructive}
                  onAction={() => handleCancel(d)}
                />
              )}
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={Keyboard.Shortcut.Common.Refresh}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
