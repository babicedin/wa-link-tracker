import { createClient, type Client } from "@libsql/client";

export type Employee = {
  id: number;
  name: string;
  slug: string;
  whatsapp_number: string;
  whatsapp_message: string;
  active: number;
  created_at: string;
};

export type EmployeeWithStats = Employee & {
  clicks_today: number;
  clicks_week: number;
  clicks_month: number;
  clicks_all: number;
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
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_employee_id ON clicks(employee_id)`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at)`,
  ]);
}

export async function getEmployeeBySlug(slug: string): Promise<Employee | null> {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM employees WHERE slug = ? AND active = 1",
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return rowToEmployee(result.rows[0]);
}

export async function insertClick(
  employeeId: number,
  referrer: string | null
): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: "INSERT INTO clicks (employee_id, referrer) VALUES (?, ?)",
    args: [employeeId, referrer],
  });
}

export async function getEmployeesWithStats(): Promise<EmployeeWithStats[]> {
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
    ...rowToEmployee(row),
    clicks_today: Number(row.clicks_today),
    clicks_week: Number(row.clicks_week),
    clicks_month: Number(row.clicks_month),
    clicks_all: Number(row.clicks_all),
  }));
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = getClient();
  const result = await db.execute("SELECT * FROM employees ORDER BY name ASC");
  return result.rows.map(rowToEmployee);
}

export async function createEmployee(data: {
  name: string;
  slug: string;
  whatsapp_number: string;
  whatsapp_message: string;
}): Promise<Employee> {
  const db = getClient();
  const result = await db.execute({
    sql: `INSERT INTO employees (name, slug, whatsapp_number, whatsapp_message)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [data.name, data.slug, data.whatsapp_number, data.whatsapp_message],
  });

  return rowToEmployee(result.rows[0]);
}

export async function updateEmployee(
  id: number,
  data: {
    name: string;
    slug: string;
    whatsapp_number: string;
    whatsapp_message: string;
    active: boolean;
  }
): Promise<Employee | null> {
  const db = getClient();
  const result = await db.execute({
    sql: `UPDATE employees
          SET name = ?, slug = ?, whatsapp_number = ?, whatsapp_message = ?, active = ?
          WHERE id = ?
          RETURNING *`,
    args: [
      data.name,
      data.slug,
      data.whatsapp_number,
      data.whatsapp_message,
      data.active ? 1 : 0,
      id,
    ],
  });

  if (result.rows.length === 0) return null;
  return rowToEmployee(result.rows[0]);
}

export async function deleteEmployee(id: number): Promise<boolean> {
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

function rowToEmployee(row: Record<string, unknown>): Employee {
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

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "");
}
