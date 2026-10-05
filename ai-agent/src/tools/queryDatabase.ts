import * as mysql from "mysql2/promise";

interface QueryResult {
  success: boolean;
  rows?: any[];
  error?: string;
}

export async function queryDatabase(sql: string): Promise<QueryResult> {
  const cleanSql = sql.trim();

  if (!/^select\b/i.test(cleanSql)) {
    return {
      success: false,
      error: "Access denied: Only SELECT queries are allowed to prevent data corruption.",
    };
  }

  const destructiveKeywords = /\b(insert|update|delete|drop|alter|truncate|replace|create|grant|revoke|rename)\b/i;
  if (destructiveKeywords.test(cleanSql)) {
    return {
      success: false,
      error: "Access denied: Destructive operations or modifications detected in the query.",
    };
  }

  let connection: mysql.Connection | null = null;

  try {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Execution blocked: Running database queries on production is disabled by default.",
      };
    }

    const dbConfig: mysql.ConnectionOptions = {
      host: process.env.DB_HOST ?? "localhost",
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "alpha_crm",
      connectTimeout: 5000,
    };

    connection = await mysql.createConnection(dbConfig);

    const queryPromise = connection.query(cleanSql);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query execution timeout exceeded (max 5000ms).")), 5000)
    );

    const [rows] = await Promise.race([queryPromise, timeoutPromise]);

    if (Array.isArray(rows)) {
      const limitedRows = rows.slice(0, 50);
      return {
        success: true,
        rows: limitedRows,
      };
    }

    return { success: true, rows: [] };

  } catch (error: any) {
    return {
      success: false,
      error: `Database error: ${error.message}`,
    };
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }
}
