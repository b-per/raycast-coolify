# Per-Container Logs for Docker Compose Applications

## Goal

For docker-compose applications (like the Dagster stack), the Coolify UI shows logs for each individual container/service (e.g. 4 separate log views for dagit, daemon, user_code, etc.). We want to replicate this in the Raycast extension.

## What we tried

- `GET /applications/{uuid}/logs?lines=N` — returns logs but always the same ones regardless of params
- `GET /applications/{uuid}/logs?lines=N&container_name=X` — tried with:
  - Plain service names from `docker_compose_domains`: `docker_example_dagit`, `gofit_user_code`, etc.
  - UUID-prefixed names: `k4wwo4g84ckg0c8skk8044wc-docker_example_dagit`
  - Guessed names: `dagster_daemon`, `dagster_dagit`
- **All returned identical logs** — the `container_name` param seems to be ignored or the API doesn't differentiate

## What we know

- The app `k4wwo4g84ckg0c8skk8044wc` has `build_pack: dockercompose`
- `docker_compose_domains` contains: `docker_example_dagit`, `docker_example_user_code`, `gofit_user_code`
- The `docker_compose` and `docker_compose_raw` fields are both empty/null via the API
- The app status is `running:unknown`
- The Coolify web UI does show separate logs per container — it likely uses a different mechanism (websocket? internal Livewire call?)

## Ideas to investigate

1. **Check the Coolify source code** — look at how the frontend fetches per-container logs. The UI uses Laravel Livewire, so the log streaming might go through a Livewire component or websocket, not the REST API.
2. **Check if the `container_name` query param uses a different naming convention** — maybe the actual Docker container name on the host (inspect via `docker ps`).
3. **Check newer Coolify API versions** — the endpoint may have been updated to support a `service_name` or `container` param differently.
4. **Alternative approach**: if the API can't do per-container logs, we could show a dropdown/list of containers and note that per-container filtering isn't available via the API, linking to the Coolify UI instead.
