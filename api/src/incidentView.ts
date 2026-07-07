import { Incident } from "./incidents";

type IncidentStatusFilter = "all" | "open" | "resolved";

export function renderIncidentPage(params: {
  incidents: Incident[];
  allIncidents: Incident[];
  activeFilter: IncidentStatusFilter;
}): string {
  const total = params.allIncidents.length;
  const open = params.allIncidents.filter(
    (incident) => incident.status === "open",
  ).length;
  const resolved = params.allIncidents.filter(
    (incident) => incident.status === "resolved",
  ).length;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SLA Guardian - Incidentes</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #64748b;
      --border: #dbe3ef;
      --open-bg: #fff1f2;
      --open-text: #be123c;
      --resolved-bg: #ecfdf3;
      --resolved-text: #047857;
      --link: #2563eb;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }

    main {
      width: min(1180px, calc(100% - 32px));
      margin: 32px auto;
    }

    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    a {
      color: var(--link);
      text-decoration: none;
    }

    .filter {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      font-size: 14px;
    }

    .filter.active {
      border-color: var(--link);
      color: var(--link);
      font-weight: 700;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }

    .label {
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 4px;
    }

    .value {
      font-size: 28px;
      font-weight: 700;
    }

    .table-wrap {
      overflow-x: auto;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    th, td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }

    th {
      background: #f8fafc;
      color: #334155;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .badge {
      display: inline-flex;
      min-width: 76px;
      justify-content: center;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge.open {
      background: var(--open-bg);
      color: var(--open-text);
    }

    .badge.resolved {
      background: var(--resolved-bg);
      color: var(--resolved-text);
    }

    .service {
      max-width: 320px;
      word-break: break-word;
      font-family: Consolas, Monaco, monospace;
      font-size: 13px;
    }

    .error {
      max-width: 260px;
      color: #475569;
      word-break: break-word;
    }

    .empty {
      padding: 36px;
      text-align: center;
      color: var(--muted);
    }

    @media (max-width: 760px) {
      main {
        width: min(100% - 20px, 1180px);
        margin: 20px auto;
      }

      header {
        display: block;
      }

      .actions {
        justify-content: flex-start;
        margin-top: 14px;
      }

      .summary {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Incidentes</h1>
        <p class="subtitle">Visualização simples dos incidentes registrados pelo SLA Guardian.</p>
      </div>
      <nav class="actions" aria-label="Filtros">
        ${renderFilterLink("Todos", "/incidents/ui", "all", params.activeFilter)}
        ${renderFilterLink("Abertos", "/incidents/ui?status=open", "open", params.activeFilter)}
        ${renderFilterLink("Resolvidos", "/incidents/ui?status=resolved", "resolved", params.activeFilter)}
      </nav>
    </header>

    <section class="summary" aria-label="Resumo">
      ${renderSummaryCard("Total", total)}
      ${renderSummaryCard("Abertos", open)}
      ${renderSummaryCard("Resolvidos", resolved)}
    </section>

    <section class="table-wrap">
      ${
        params.incidents.length > 0
          ? renderIncidentTable(params.incidents)
          : '<div class="empty">Nenhum incidente encontrado para este filtro.</div>'
      }
    </section>
  </main>
</body>
</html>`;
}

function renderFilterLink(
  label: string,
  href: string,
  filter: IncidentStatusFilter,
  activeFilter: IncidentStatusFilter,
): string {
  const activeClass = filter === activeFilter ? " active" : "";
  return `<a class="filter${activeClass}" href="${href}">${escapeHtml(label)}</a>`;
}

function renderSummaryCard(label: string, value: number): string {
  return `<article class="card">
    <div class="label">${escapeHtml(label)}</div>
    <div class="value">${value}</div>
  </article>`;
}

function renderIncidentTable(incidents: Incident[]): string {
  return `<table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Serviço</th>
        <th>Falhas</th>
        <th>Erro</th>
        <th>Início</th>
        <th>Última falha</th>
        <th>Resolvido em</th>
        <th>Duração</th>
      </tr>
    </thead>
    <tbody>
      ${incidents.map(renderIncidentRow).join("")}
    </tbody>
  </table>`;
}

function renderIncidentRow(incident: Incident): string {
  return `<tr>
    <td><span class="badge ${incident.status}">${escapeHtml(incident.status)}</span></td>
    <td class="service">${escapeHtml(incident.service_url)}</td>
    <td>${incident.failure_count}</td>
    <td class="error">${escapeHtml(incident.error_message || "-")}</td>
    <td>${formatDate(incident.started_at)}</td>
    <td>${formatDate(incident.last_failure_at)}</td>
    <td>${formatDate(incident.resolved_at)}</td>
    <td>${formatDuration(incident.last_duration_ms)}</td>
  </tr>`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return escapeHtml(
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date),
  );
}

function formatDuration(value: number | null): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value}ms`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
