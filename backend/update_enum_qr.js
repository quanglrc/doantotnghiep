import { query, pool } from "./src/config/db.js";

async function main() {
    try {
        await query("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cod','bank','card','momo','zalopay','vnpay','qr') NOT NULL DEFAULT 'cod';");
        console.log("Successfully updated orders table enum to include qr.");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}
main();
