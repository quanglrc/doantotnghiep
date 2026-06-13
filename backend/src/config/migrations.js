import { pool } from "./db.js";

// Migrations idempotent - chạy khi server khởi động, không xoá data cũ
export const runMigrations = async () => {
    const conn = await pool.getConnection();
    try {
        // Bảng password reset tokens
        await conn.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_user (user_id, used)
            ) ENGINE=InnoDB
        `);

        // Dọn token cũ > 7 ngày để bảng không phình to
        await conn.query(
            "DELETE FROM password_reset_tokens WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );

        // Bảng lịch sử kho (inventory_log)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS inventory_log (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                product_id       INT NOT NULL,
                type             ENUM('import', 'export', 'order', 'cancel', 'update') NOT NULL,
                quantity_change  INT NOT NULL,
                reason           VARCHAR(500),
                created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_by       INT,
                
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_inventory_log_product (product_id, created_at)
            ) ENGINE=InnoDB
        `);

        console.log("[migrations] ✓ Đã kiểm tra/cập nhật schema phụ");
    } catch (err) {
        console.error("[migrations] ✗ Lỗi:", err.message);
        throw err;
    } finally {
        conn.release();
    }
};
