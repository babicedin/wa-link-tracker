import { createClient, type Client } from "@libsql/client";
import { normalizeSlug } from "./slug";

export type Link = {
  id: number;
  name: string;
  slug: string;
  whatsapp_number: string;
  whatsapp_message: string;
  active: number;
  created_at: string;
};

export type LinkWithStats = Link & {
  clicks_today: number;
  clicks_week: number;
  clicks_month: number;
  clicks_all: number;
};

export type CountryClickStat = {
  country: string | null;
  count: number;
};

export type DailyClickStat = {
  date: string;
  count: number;
};

export type LinkAnalytics = {
  link: Link;
  clicks_today: number;
  clicks_week: number;
  clicks_month: number;
  clicks_all: number;
  by_country: CountryClickStat[];
  by_day: DailyClickStat[];
};

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set");
    }

    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  return client;
}

export async function migrate(): Promise<void> {
  const db = getClient();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      whatsapp_number TEXT NOT NULL,
      whatsapp_message TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
      referrer TEXT,
      country TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_employee_id ON clicks(employee_id)`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at)`,
  ]);

  const columns = await db.execute("PRAGMA table_info(clicks)");
  const hasCountry = columns.rows.some((row) => row.name === "country");
  if (!hasCountry) {
    await db.execute("ALTER TABLE clicks ADD COLUMN country TEXT");
  }
}

export async function getLinkBySlug(slug: string): Promise<Link | null> {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM employees WHERE slug = ? AND active = 1",
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return rowToLink(result.rows[0]);
}

export async function getLinkById(id: number): Promise<Link | null> {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM employees WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToLink(result.rows[0]);
}

export async function insertClick(
  linkId: number,
  referrer: string | null,
  country: string | null
): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: "INSERT INTO clicks (employee_id, referrer, country) VALUES (?, ?, ?)",
    args: [linkId, referrer, country],
  });
}

export async function getLinksWithStats(): Promise<LinkWithStats[]> {
  const db = getClient();
  const result = await db.execute(`
    SELECT
      e.*,
      COALESCE(SUM(CASE WHEN date(c.clicked_at) = date('now') THEN 1 ELSE 0 END), 0) AS clicks_today,
      COALESCE(SUM(CASE WHEN c.clicked_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END), 0) AS clicks_week,
      COALESCE(SUM(CASE WHEN c.clicked_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) AS clicks_month,
      COALESCE(COUNT(c.id), 0) AS clicks_all
    FROM employees e
    LEFT JOIN clicks c ON c.employee_id = e.id
    GROUP BY e.id
    ORDER BY e.name ASC
  `);

  return result.rows.map((row) => ({
    ...rowToLink(row),
    clicks_today: Number(row.clicks_today),
    clicks_week: Number(row.clicks_week),
    clicks_month: Number(row.clicks_month),
    clicks_all: Number(row.clicks_all),
  }));
}

export async function getLinkAnalytics(id: number): Promise<LinkAnalytics | null> {
  const link = await getLinkById(id);
  if (!link) return null;

  const db = getClient();

  const statsResult = await db.execute({
    sql: `
      SELECT
        COALESCE(SUM(CASE WHEN date(clicked_at) = date('now') THEN 1 ELSE 0 END), 0) AS clicks_today,
        COALESCE(SUM(CASE WHEN clicked_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END), 0) AS clicks_week,
        COALESCE(SUM(CASE WHEN clicked_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) AS clicks_month,
        COALESCE(COUNT(id), 0) AS clicks_all
      FROM clicks
      WHERE employee_id = ?
    `,
    args: [id],
  });

  const countryResult = await db.execute({
    sql: `
      SELECT country, COUNT(*) AS count
      FROM clicks
      WHERE employee_id = ?
      GROUP BY country
      ORDER BY count DESC
    `,
    args: [id],
  });

  const dailyResult = await db.execute({
    sql: `
      SELECT date(clicked_at) AS date, COUNT(*) AS count
      FROM clicks
      WHERE employee_id = ?
        AND clicked_at >= datetime('now', '-30 days')
      GROUP BY date(clicked_at)
      ORDER BY date ASC
    `,
    args: [id],
  });

  const stats = statsResult.rows[0];

  return {
    link,
    clicks_today: Number(stats.clicks_today),
    clicks_week: Number(stats.clicks_week),
    clicks_month: Number(stats.clicks_month),
    clicks_all: Number(stats.clicks_all),
    by_country: countryResult.rows.map((row) => ({
      country: row.country == null ? null : String(row.country),
      count: Number(row.count),
    })),
    by_day: dailyResult.rows.map((row) => ({
      date: String(row.date),
      count: Number(row.count),
    })),
  };
}

export async function createLink(data: {
  name: string;
  whatsapp_number: string;
  whatsapp_message: string;
}): Promise<Link> {
  const db = getClient();
  const slug = await generateUniqueSlug(data.name);

  const result = await db.execute({
    sql: `INSERT INTO employees (name, slug, whatsapp_number, whatsapp_message)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [data.name, slug, data.whatsapp_number, data.whatsapp_message],
  });

  return rowToLink(result.rows[0]);
}

export async function updateLink(
  id: number,
  data: {
    name: string;
    whatsapp_number: string;
    whatsapp_message: string;
    active: boolean;
  }
): Promise<Link | null> {
  const db = getClient();
  const result = await db.execute({
    sql: `UPDATE employees
          SET name = ?, whatsapp_number = ?, whatsapp_message = ?, active = ?
          WHERE id = ?
          RETURNING *`,
    args: [
      data.name,
      data.whatsapp_number,
      data.whatsapp_message,
      data.active ? 1 : 0,
      id,
    ],
  });

  if (result.rows.length === 0) return null;
  return rowToLink(result.rows[0]);
}

export async function deleteLink(id: number): Promise<boolean> {
  const db = getClient();
  await db.execute({
    sql: "DELETE FROM clicks WHERE employee_id = ?",
    args: [id],
  });
  const result = await db.execute({
    sql: "DELETE FROM employees WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

async function generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
  const db = getClient();
  const base = normalizeSlug(name) || "link";
  let slug = base;
  let suffix = 2;

  while (true) {
    const result = await db.execute({
      sql: "SELECT id FROM employees WHERE slug = ?",
      args: [slug],
    });

    if (
      result.rows.length === 0 ||
      (excludeId != null && Number(result.rows[0].id) === excludeId)
    ) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix++;
  }
}

function rowToLink(row: Record<string, unknown>): Link {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    whatsapp_number: String(row.whatsapp_number),
    whatsapp_message: String(row.whatsapp_message ?? ""),
    active: Number(row.active),
    created_at: String(row.created_at),
  };
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const cleaned = number.replace(/\D/g, "");
  const base = `https://wa.me/${cleaned}`;
  if (!message.trim()) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "");
}

// Backward-compatible aliases
export type Employee = Link;
export type EmployeeWithStats = LinkWithStats;
export const getEmployeeBySlug = getLinkBySlug;
export const getEmployeesWithStats = getLinksWithStats;
export const createEmployee = createLink;
export const updateEmployee = updateLink;
export const deleteEmployee = deleteLink;
