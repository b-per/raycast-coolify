# Coolify API Limitations

Tracked limitations of the Coolify REST API (`/api/v1`) that affect this extension. Revisit when Coolify ships new API versions.

API reference: https://coolify.io/docs/api-reference/api/

## How to check for changes

1. Open https://coolify.io/docs/api-reference/api/ and look for new endpoints
2. Check the Coolify changelog: https://github.com/coollabsio/coolify/releases
3. Search GitHub issues/discussions for `api` label: https://github.com/coollabsio/coolify/issues?q=label%3Aapi

---

## Services

### No deploy / redeploy / force-pull endpoint

Services only support `start`, `stop`, `restart`. There is no way to force-pull updated images and redeploy via the API. Restart just restarts existing containers.

**Available:** `GET /services/{uuid}/start|stop|restart`
**Missing:** deploy, redeploy, pull

### No service logs endpoint

`GET /services/{uuid}/logs` does not exist (returns 404). Service sub-applications are also not accessible via `/applications/{uuid}` endpoints, so there's no way to fetch logs for individual service containers.

**Workaround:** Link to Coolify UI for log viewing.

### No service deployment history

Unlike applications, services have no `/deployments` endpoint. There is no way to see deployment history or rollback.

---

## Environments

### Databases returned under engine-specific keys

`GET /projects/{uuid}/{envName}` does not return a `databases` field. Instead, databases are split across `postgresqls`, `mysqls`, `mariadbs`, `mongodbs`, and `redis` keys. The extension merges these into a single list.

**Workaround implemented:** `getEnvironmentDetails()` in `api.ts` normalizes the response.
**Check for:** a unified `databases` key in future API versions.

---

## Applications (Docker Compose)

### Per-container logs not working via API

For docker-compose applications, `GET /applications/{uuid}/logs` ignores the `container_name` query parameter and always returns the same logs. The Coolify UI shows per-container logs via Livewire/websockets, not the REST API.

See `TODO-container-logs.md` for full investigation notes.

---

## Servers / Proxy

### No proxy logs endpoint

There is no API endpoint to retrieve Traefik proxy logs. The only way to access them is via `docker logs coolify-proxy` directly on the server.

**Available:** `GET /servers/{uuid}` (includes proxy status), `GET /servers/{uuid}/validate`
**Missing:** proxy logs, proxy restart (validate is the closest)

### No dedicated proxy restart

There is no `POST /servers/{uuid}/proxy/restart`. Server validation (`GET /servers/{uuid}/validate`) is the closest action — it checks the server and its proxy but isn't a direct restart.

---

## Databases

### No database logs endpoint

Database resources have `start`, `stop`, `restart` but no logs endpoint via the API.

**Available:** `GET /databases/{uuid}/start|stop|restart`, backup management
**Missing:** database container logs

### No deploy / redeploy / force-pull endpoint

Same as services — databases only support `start`, `stop`, `restart`. No way to force-pull a newer image version via the API.
