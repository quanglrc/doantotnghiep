import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "viqitech",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true,
    dateStrings: true,
    charset: "utf8mb4",
});

export const query = async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
};

export const one = async (sql, params) => {
    const rows = await query(sql, params);
    return rows[0] || null;
};
