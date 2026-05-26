import "dotenv/config";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESET = process.argv.includes("--reset") || process.argv.includes("-r");

// Parser tôn trọng DELIMITER (cho CREATE TRIGGER ... DELIMITER //)
// và bỏ qua các dòng comment / dòng trống nằm giữa các statement.
const parseStatements = (sql) => {
    const lines = sql.split(/\r?\n/);
    const stmts = [];
    let buf = "";
    let delim = ";";
    for (const raw of lines) {
        const m = raw.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
        if (m) {
            if (buf.trim()) {
                stmts.push(buf.trim());
                buf = "";
            }
            delim = m[1];
            continue;
        }
        // Bỏ qua dòng trống / comment khi buffer chưa có nội dung
        if (!buf.trim() && (/^\s*$/.test(raw) || /^\s*--/.test(raw))) continue;

        buf += raw + "\n";
        const trimmed = buf.trimEnd();
        if (trimmed.endsWith(delim)) {
            const s = trimmed.slice(0, trimmed.length - delim.length).trim();
            if (s) stmts.push(s);
            buf = "";
        }
    }
    if (buf.trim()) stmts.push(buf.trim());
    return stmts;
};

const main = async () => {
    const envPath = join(__dirname, "..", ".env");
    if (!existsSync(envPath)) {
        console.warn(`[seed] ⚠️  Không tìm thấy backend/.env`);
        console.warn(`[seed] ⚠️  Hãy copy: cp .env.example .env (hoặc copy thủ công)`);
        console.warn(`[seed] ⚠️  rồi điền DB_PASSWORD MySQL của bạn.\n`);
    }

    const {
        DB_HOST = "localhost",
        DB_PORT = 3306,
        DB_USER = "root",
        DB_PASSWORD = "vinhquang33",
        DB_NAME = "viqitech",
        ADMIN_EMAIL = "admin@viqitech.vn",
        ADMIN_PASSWORD = "admin123",
        ADMIN_NAME = "Quản trị viên",
    } = process.env;

    console.log(`[seed] MySQL: ${DB_USER}@${DB_HOST}:${DB_PORT} (password: ${DB_PASSWORD ? "***" : "(rỗng)"})`);
    if (RESET) console.log(`[seed] 🔥 --reset flag: SẼ XOÁ DỮ LIỆU CŨ`);

    // Kết nối KHÔNG chỉ định DB (vì có thể chưa tồn tại)
    let conn;
    try {
        conn = await mysql.createConnection({
            host: DB_HOST,
            port: Number(DB_PORT),
            user: DB_USER,
            password: DB_PASSWORD,
            multipleStatements: false,
        });
    } catch (err) {
        if (err.code === "ER_ACCESS_DENIED_ERROR") {
            console.error(`\n[seed] ✗ MySQL từ chối truy cập.`);
            console.error(`[seed]   - Mở backend/.env và đặt DB_PASSWORD đúng với MySQL của bạn`);
            console.error(`[seed]   - XAMPP mặc định: root / (rỗng)`);
            console.error(`[seed]   - MySQL installer mặc định: root / mật khẩu đã đặt khi cài`);
            process.exit(1);
        }
        if (err.code === "ECONNREFUSED") {
            console.error(`\n[seed] ✗ Không kết nối được tới ${DB_HOST}:${DB_PORT}`);
            console.error(`[seed]   - Kiểm tra MySQL đã chạy chưa (XAMPP Control / Services)`);
            process.exit(1);
        }
        throw err;
    }

    // --reset: xoá DB cũ trước
    if (RESET) {
        console.log(`[seed] Đang xoá database '${DB_NAME}'...`);
        await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    }

    // Kiểm tra DB đã tồn tại với dữ liệu chưa
    let needsInit = true;
    try {
        const [dbs] = await conn.query("SHOW DATABASES LIKE ?", [DB_NAME]);
        if (dbs.length > 0) {
            await conn.query(`USE \`${DB_NAME}\``);
            const [tables] = await conn.query("SHOW TABLES");
            if (tables.length > 0) {
                needsInit = false;
                const [usersRow] = await conn.query("SELECT COUNT(*) AS n FROM users").catch(() => [[{ n: 0 }]]);
                console.log(
                    `[seed] ✓ Database '${DB_NAME}' đã tồn tại với ${tables.length} bảng, ${usersRow[0].n} user.`
                );
                console.log(`[seed]   → BỎ QUA schema, GIỮ NGUYÊN dữ liệu hiện có.`);
                console.log(`[seed]   → Muốn xoá hết và tạo lại: chạy 'npm run db:reset'`);
            }
        }
    } catch (err) {
        if (err.code !== "ER_BAD_DB_ERROR") throw err;
    }

    if (needsInit) {
        const schemaPath = join(__dirname, "..", "database", "schema.sql");
        console.log(`[seed] Đọc schema: ${schemaPath}`);
        const sqlText = await readFile(schemaPath, "utf-8");
        const stmts = parseStatements(sqlText);
        console.log(`[seed] Đã parse ${stmts.length} câu lệnh SQL`);
        console.log(`[seed] Đang chạy schema...`);

        let i = 0;
        for (const s of stmts) {
            i++;
            try {
                await conn.query(s);
                if (i % 5 === 0 || i === stmts.length) {
                    process.stdout.write(`\r[seed]   ${i}/${stmts.length}...`);
                }
            } catch (err) {
                console.error(`\n[seed] ✗ Lỗi tại statement #${i}:`);
                console.error("---");
                console.error(s.slice(0, 400));
                console.error("---");
                console.error(err.message);
                await conn.end();
                process.exit(1);
            }
        }
        process.stdout.write("\n");
    }

    // Luôn đảm bảo có admin (idempotent)
    console.log(`[seed] Kiểm tra admin (${ADMIN_EMAIL})...`);
    await conn.query(`USE \`${DB_NAME}\``);
    const [existing] = await conn.query("SELECT id FROM users WHERE email = ?", [ADMIN_EMAIL]);

    if (existing.length === 0) {
        // Chưa có → tạo mới với mật khẩu hash
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await conn.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
            [ADMIN_NAME, ADMIN_EMAIL, hash]
        );
        console.log(`[seed] ✓ Đã tạo admin mới.`);
    } else if (needsInit) {
        // Schema vừa chạy lại → cập nhật password (vì placeholder hash trong schema không khớp)
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await conn.query("UPDATE users SET password_hash = ?, name = ? WHERE email = ?", [
            hash, ADMIN_NAME, ADMIN_EMAIL,
        ]);
        console.log(`[seed] ✓ Đã cập nhật mật khẩu admin.`);
    } else {
        // Đã có admin và schema không bị reset → giữ nguyên mật khẩu hiện tại
        console.log(`[seed] ✓ Admin đã tồn tại, giữ nguyên mật khẩu hiện tại.`);
    }

    await conn.end();
    console.log(`\n[seed] ✓ Thành công!`);
    console.log(`[seed]   Database: ${DB_NAME}`);
    if (needsInit) {
        console.log(`[seed]   Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    } else {
        console.log(`[seed]   Admin:    ${ADMIN_EMAIL} (mật khẩu hiện tại)`);
    }
};

main().catch((err) => {
    console.error("\n[seed] ✗ Lỗi không mong đợi:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});
