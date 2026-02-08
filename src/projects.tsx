import { Action, ActionPanel, Detail, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  Application,
  Deployment,
  Environment,
  Project,
  Service,
  ServiceDetail,
  listProjects,
  getProject,
  getEnvironmentDetails,
  getService,
  getApplicationLogs,
  listDeploymentsByApp,
  restartApplication,
  stopApplication,
  startApplication,
  restartService,
  stopService,
  startService,
  coolifyUrl,
} from "./api";
import { resourceStatusColor, resourceStatusIcon, deploymentStatusColor, parseDeploymentLogs } from "./helpers";

// ── Application Logs View ────────────────────────────────────────────

function AppLogsView({ app }: { app: Application }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getApplicationLogs(app.uuid)
      .then(setLogs)
      .catch((err) => showToast({ style: Toast.Style.Failure, title: "Failed to load logs", message: String(err) }))
      .finally(() => setIsLoading(false));
  }, [app.uuid]);

  const logText = logs.length > 0 ? logs.join("\n") : "No logs available.";

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={`Logs — ${app.name}`}
      markdown={`\`\`\`\n${logText}\n\`\`\``}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Logs" content={logText} />
          <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(`/project/${app.uuid}`)} />
        </ActionPanel>
      }
    />
  );
}

// ── Deployment Logs View (reused from deployments) ───────────────────

function DeploymentLogsView({ deployment }: { deployment: Deployment }) {
  const logs = parseDeploymentLogs(deployment.logs);

  return (
    <Detail
      navigationTitle="Deployment Logs"
      markdown={`\`\`\`\n${logs}\n\`\`\``}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={deployment.status} color={deploymentStatusColor(deployment.status)} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Commit" text={deployment.commit ? deployment.commit.substring(0, 8) : "—"} />
          {deployment.commit_message && <Detail.Metadata.Label title="Message" text={deployment.commit_message} />}
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

// ── App Deployments List ─────────────────────────────────────────────

function AppDeploymentsView({ app }: { app: Application }) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    listDeploymentsByApp(app.uuid)
      .then((data) =>
        setDeployments([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())),
      )
      .catch((err) =>
        showToast({ style: Toast.Style.Failure, title: "Failed to load deployments", message: String(err) }),
      )
      .finally(() => setIsLoading(false));
  }, [app.uuid]);

  return (
    <List isLoading={isLoading} navigationTitle={`Deployments — ${app.name}`}>
      {deployments.map((d) => (
        <List.Item
          key={d.deployment_uuid}
          icon={{ source: Icon.Hammer, tintColor: deploymentStatusColor(d.status) }}
          title={d.commit_message || d.commit?.substring(0, 8) || "Deployment"}
          subtitle={d.status}
          accessories={[
            { tag: { value: d.status, color: deploymentStatusColor(d.status) } },
            { date: new Date(d.created_at) },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="View Logs"
                icon={Icon.Terminal}
                onAction={() => push(<DeploymentLogsView deployment={d} />)}
              />
              {d.deployment_url && <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(d.deployment_url)} />}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ── Resource Detail (Application) ────────────────────────────────────

function ApplicationDetail({ app }: { app: Application }) {
  const { push } = useNavigation();
  const fqdns = app.fqdn ? app.fqdn.split(",").map((f) => f.trim()) : [];

  return (
    <Detail
      navigationTitle={app.name}
      markdown={`# ${app.name}\n\n${app.description || ""}\n\n**Build pack:** ${app.build_pack || "—"}  \n**Git:** ${app.git_repository || "—"} (${app.git_branch || "—"})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={app.status || "unknown"} color={resourceStatusColor(app.status)} />
          </Detail.Metadata.TagList>
          {fqdns.length > 0 && (
            <>
              <Detail.Metadata.Separator />
              {fqdns.map((url) => (
                <Detail.Metadata.Link key={url} title="URL" target={url} text={url.replace(/https?:\/\//, "")} />
              ))}
            </>
          )}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="UUID" text={app.uuid} />
          <Detail.Metadata.Label title="Created" text={new Date(app.created_at).toLocaleString()} />
          <Detail.Metadata.Label title="Updated" text={new Date(app.updated_at).toLocaleString()} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Navigate">
            {fqdns.map((url) => (
              <Action.OpenInBrowser key={url} title={`Open ${url.replace(/https?:\/\//, "")}`} url={url} />
            ))}
            <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(`/project/${app.uuid}`)} />
          </ActionPanel.Section>
          <ActionPanel.Section title="Actions">
            <Action
              title="View Deployments"
              icon={Icon.Hammer}
              onAction={() => push(<AppDeploymentsView app={app} />)}
            />
            <Action title="View Logs" icon={Icon.Terminal} onAction={() => push(<AppLogsView app={app} />)} />
          </ActionPanel.Section>
          <ActionPanel.Section title="Lifecycle">
            <Action
              title="Restart"
              icon={Icon.ArrowClockwise}
              onAction={async () => {
                try {
                  await showToast({ style: Toast.Style.Animated, title: "Restarting…" });
                  await restartApplication(app.uuid);
                  await showToast({ style: Toast.Style.Success, title: "Restart triggered" });
                } catch (err) {
                  await showToast({ style: Toast.Style.Failure, title: "Restart failed", message: String(err) });
                }
              }}
            />
            <Action
              title="Stop"
              icon={Icon.Stop}
              style={Action.Style.Destructive}
              onAction={async () => {
                try {
                  await showToast({ style: Toast.Style.Animated, title: "Stopping…" });
                  await stopApplication(app.uuid);
                  await showToast({ style: Toast.Style.Success, title: "Stopped" });
                } catch (err) {
                  await showToast({ style: Toast.Style.Failure, title: "Stop failed", message: String(err) });
                }
              }}
            />
            <Action
              title="Start"
              icon={Icon.Play}
              onAction={async () => {
                try {
                  await showToast({ style: Toast.Style.Animated, title: "Starting…" });
                  await startApplication(app.uuid);
                  await showToast({ style: Toast.Style.Success, title: "Started" });
                } catch (err) {
                  await showToast({ style: Toast.Style.Failure, title: "Start failed", message: String(err) });
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

// ── Service Detail View ──────────────────────────────────────────────

function ServiceDetailView({
  service,
  projectUuid,
  envName,
}: {
  service: Service;
  projectUuid: string;
  envName: string;
}) {
  const [detail, setDetail] = useState<ServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getService(service.uuid)
      .then(setDetail)
      .catch((err) => showToast({ style: Toast.Style.Failure, title: "Failed to load service", message: String(err) }))
      .finally(() => setIsLoading(false));
  }, [service.uuid]);

  const svcApps = detail?.applications || [];
  const svcDbs = detail?.databases || [];

  return (
    <List isLoading={isLoading} navigationTitle={service.name} searchBarPlaceholder="Filter components…">
      <List.Section title="Service">
        <List.Item
          icon={{
            source: resourceStatusIcon(detail?.status || service.status),
            tintColor: resourceStatusColor(detail?.status || service.status),
          }}
          title={service.name}
          subtitle={service.service_type || ""}
          accessories={[
            {
              tag: {
                value: detail?.status || service.status || "unknown",
                color: resourceStatusColor(detail?.status || service.status),
              },
            },
          ]}
          actions={
            <ActionPanel>
              <ActionPanel.Section title="Lifecycle">
                <Action
                  title="Restart"
                  icon={Icon.ArrowClockwise}
                  onAction={async () => {
                    try {
                      await showToast({ style: Toast.Style.Animated, title: "Restarting…" });
                      await restartService(service.uuid);
                      await showToast({ style: Toast.Style.Success, title: "Restart triggered" });
                    } catch (err) {
                      await showToast({ style: Toast.Style.Failure, title: "Restart failed", message: String(err) });
                    }
                  }}
                />
                <Action
                  title="Stop"
                  icon={Icon.Stop}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    try {
                      await showToast({ style: Toast.Style.Animated, title: "Stopping…" });
                      await stopService(service.uuid);
                      await showToast({ style: Toast.Style.Success, title: "Stopped" });
                    } catch (err) {
                      await showToast({ style: Toast.Style.Failure, title: "Stop failed", message: String(err) });
                    }
                  }}
                />
                <Action
                  title="Start"
                  icon={Icon.Play}
                  onAction={async () => {
                    try {
                      await showToast({ style: Toast.Style.Animated, title: "Starting…" });
                      await startService(service.uuid);
                      await showToast({ style: Toast.Style.Success, title: "Started" });
                    } catch (err) {
                      await showToast({ style: Toast.Style.Failure, title: "Start failed", message: String(err) });
                    }
                  }}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="Navigate">
                <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(`/project/${projectUuid}/${envName}`)} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      </List.Section>
      {svcApps.length > 0 && (
        <List.Section title="Applications">
          {svcApps.map((app) => (
            <List.Item
              key={app.uuid}
              icon={{ source: resourceStatusIcon(app.status), tintColor: resourceStatusColor(app.status) }}
              title={app.name}
              subtitle={app.image || ""}
              accessories={[
                { tag: { value: app.status || "unknown", color: resourceStatusColor(app.status) } },
                ...(app.last_online_at ? [{ date: new Date(app.last_online_at), tooltip: "Last online" }] : []),
              ]}
              actions={
                <ActionPanel>
                  {app.fqdn && <Action.OpenInBrowser title="Open App URL" url={app.fqdn.split(",")[0].trim()} />}
                  {app.ports && <Action.CopyToClipboard title="Copy Ports" content={app.ports} />}
                  <Action.OpenInBrowser
                    title="Open in Coolify"
                    url={coolifyUrl(`/project/${projectUuid}/${envName}`)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      {svcDbs.length > 0 && (
        <List.Section title="Databases">
          {svcDbs.map((db) => (
            <List.Item
              key={db.uuid}
              icon={{ source: resourceStatusIcon(db.status), tintColor: resourceStatusColor(db.status) }}
              title={db.name}
              subtitle={db.image || ""}
              accessories={[
                { tag: { value: db.status || "unknown", color: resourceStatusColor(db.status) } },
                ...(db.last_online_at ? [{ date: new Date(db.last_online_at), tooltip: "Last online" }] : []),
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Coolify"
                    url={coolifyUrl(`/project/${projectUuid}/${envName}`)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

// ── Environment Resources View ───────────────────────────────────────

function EnvironmentView({ project, env }: { project: Project; env: Environment }) {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    getEnvironmentDetails(project.uuid, env.name)
      .then(setEnvironment)
      .catch((err) =>
        showToast({ style: Toast.Style.Failure, title: "Failed to load environment", message: String(err) }),
      )
      .finally(() => setIsLoading(false));
  }, [project.uuid, env.name]);

  const apps = environment?.applications || [];
  const services = environment?.services || [];
  const databases = environment?.databases || [];

  return (
    <List
      isLoading={isLoading}
      navigationTitle={`${project.name} / ${env.name}`}
      searchBarPlaceholder="Filter resources…"
    >
      {apps.length > 0 && (
        <List.Section title="Applications">
          {apps.map((app) => (
            <List.Item
              key={app.uuid}
              icon={{ source: resourceStatusIcon(app.status), tintColor: resourceStatusColor(app.status) }}
              title={app.name}
              subtitle={app.fqdn?.replace(/https?:\/\//, "").split(",")[0] || ""}
              accessories={[
                { tag: { value: app.status || "unknown", color: resourceStatusColor(app.status) } },
                { text: app.build_pack || "" },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="View Details"
                    icon={Icon.Sidebar}
                    onAction={() => push(<ApplicationDetail app={app} />)}
                  />
                  {app.fqdn && <Action.OpenInBrowser title="Open App URL" url={app.fqdn.split(",")[0].trim()} />}
                  <Action
                    title="View Deployments"
                    icon={Icon.Hammer}
                    onAction={() => push(<AppDeploymentsView app={app} />)}
                  />
                  <Action title="View Logs" icon={Icon.Terminal} onAction={() => push(<AppLogsView app={app} />)} />
                  <Action.OpenInBrowser
                    title="Open in Coolify"
                    url={coolifyUrl(`/project/${project.uuid}/${env.name}`)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      {services.length > 0 && (
        <List.Section title="Services">
          {services.map((svc) => (
            <List.Item
              key={svc.uuid}
              icon={{ source: resourceStatusIcon(svc.status), tintColor: resourceStatusColor(svc.status) }}
              title={svc.name}
              subtitle={svc.service_type || ""}
              accessories={[{ tag: { value: svc.status || "unknown", color: resourceStatusColor(svc.status) } }]}
              actions={
                <ActionPanel>
                  <Action
                    title="View Details"
                    icon={Icon.Sidebar}
                    onAction={() =>
                      push(<ServiceDetailView service={svc} projectUuid={project.uuid} envName={env.name} />)
                    }
                  />
                  <Action.OpenInBrowser
                    title="Open in Coolify"
                    url={coolifyUrl(`/project/${project.uuid}/${env.name}`)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      {databases.length > 0 && (
        <List.Section title="Databases">
          {databases.map((db) => (
            <List.Item
              key={db.uuid}
              icon={Icon.HardDrive}
              title={db.name}
              subtitle={db.type || ""}
              accessories={[{ tag: { value: db.status || "unknown", color: resourceStatusColor(db.status) } }]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Coolify"
                    url={coolifyUrl(`/project/${project.uuid}/${env.name}`)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

// ── Project Environments View ────────────────────────────────────────

function ProjectView({ project }: { project: Project }) {
  const [fullProject, setFullProject] = useState<Project>(project);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    getProject(project.uuid)
      .then(setFullProject)
      .catch((err) => showToast({ style: Toast.Style.Failure, title: "Failed to load project", message: String(err) }))
      .finally(() => setIsLoading(false));
  }, [project.uuid]);

  const envs = fullProject.environments || [];

  return (
    <List isLoading={isLoading} navigationTitle={fullProject.name} searchBarPlaceholder="Filter environments…">
      {envs.map((env) => (
        <List.Item
          key={env.uuid}
          icon={Icon.Layers}
          title={env.name}
          subtitle={env.description || ""}
          accessories={[{ date: new Date(env.updated_at) }]}
          actions={
            <ActionPanel>
              <Action
                title="View Resources"
                icon={Icon.AppWindowList}
                onAction={() => push(<EnvironmentView project={project} env={env} />)}
              />
              <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(`/project/${project.uuid}/${env.name}`)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ── Main Projects Command ────────────────────────────────────────────

export default function ProjectsCommand() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  async function load() {
    setIsLoading(true);
    try {
      const summaries = await listProjects();
      const detailed = await Promise.all(summaries.map((p) => getProject(p.uuid)));
      setProjects(detailed);
    } catch (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load projects", message: String(err) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter projects…">
      {projects.map((p) => {
        const envCount = p.environments?.length || 0;
        return (
          <List.Item
            key={p.uuid}
            icon={Icon.Folder}
            title={p.name}
            subtitle={p.description || ""}
            accessories={[{ text: `${envCount} env${envCount !== 1 ? "s" : ""}` }]}
            actions={
              <ActionPanel>
                <Action
                  title="View Environments"
                  icon={Icon.Layers}
                  onAction={() => push(<ProjectView project={p} />)}
                />
                <Action.OpenInBrowser title="Open in Coolify" url={coolifyUrl(`/project/${p.uuid}`)} />
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
    </List>
  );
}
