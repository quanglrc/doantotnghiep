import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

// Lấy danh sách lịch sử biến động kho
router.get(
    "/logs",
    adminOnly,
    asyncH(async (req, res) => {
        const rows = await query(`
            SELECT l.*, p.name as product_name, p.image as product_image, u.name as admin_name 
            FROM inventory_log l 
            LEFT JOIN products p ON l.product_id = p.id 
            LEFT JOIN users u ON l.created_by = u.id 
            ORDER BY l.created_at DESC
        `);
        res.json(rows);
    })
);

// Lấy danh sách sản phẩm sắp hết hàng (stock < 10)
router.get(
    "/low-stock",
    adminOnly,
    asyncH(async (req, res) => {
        const rows = await query(`
            SELECT id, name, image, stock, price 
            FROM products 
            WHERE stock < 10 AND is_active = 1 
            ORDER BY stock ASC
        `);
        res.json(rows);
    })
);

// Điều chỉnh tồn kho thủ công (Nhập / Xuất)
router.post(
    "/adjust",
    adminOnly,
    asyncH(async (req, res) => {
        const { product_id, type, quantity, reason } = req.body || {};
        
        if (!product_id || !type || !quantity || quantity <= 0) {
            return res.status(400).json({ error: "Thông tin không hợp lệ." });
        }
        if (!['import', 'export'].includes(type)) {
            return res.status(400).json({ error: "Loại điều chỉnh không hợp lệ." });
        }

        const p = await one("SELECT * FROM products WHERE id = :id", { id: product_id });
        if (!p) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
        }

        let newStock = p.stock;
        let qtyChange = quantity;

        if (type === 'import') {
            newStock += quantity;
        } else {
            newStock -= quantity;
            qtyChange = -quantity;
            if (newStock < 0) newStock = 0;
        }

        await query("UPDATE products SET stock = :stock WHERE id = :id", {
            stock: newStock,
            id: product_id
        });

        await query(`
            INSERT INTO inventory_log (product_id, type, quantity_change, reason, created_by) 
            VALUES (:pid, :type, :qc, :reason, :uid)
        `, {
            pid: product_id,
            type: type,
            qc: qtyChange,
            reason: reason || (type === 'import' ? 'Nhập kho thủ công' : 'Xuất kho thủ công'),
            uid: req.user.id
        });

        res.json({ message: "Điều chỉnh tồn kho thành công", newStock });
    })
);

export default router;
