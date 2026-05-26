import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/",
    asyncH(async (req, res) => {
        const { cat, brand, q } = req.query;
        const where = ["is_active = 1"];
        const params = {};
        if (cat) { where.push("category_id = :cat"); params.cat = cat; }
        if (brand) { where.push("brand_id = :brand"); params.brand = brand; }
        if (q) { where.push("name LIKE :q"); params.q = `%${q}%`; }
        const sql = `SELECT * FROM products WHERE ${where.join(" AND ")} ORDER BY created_at DESC`;
        const rows = await query(sql, params);
        res.json(rows.map(formatProduct));
    })
);

router.get(
    "/:id",
    asyncH(async (req, res) => {
        const p = await one("SELECT * FROM products WHERE id = :id", { id: Number(req.params.id) });
        if (!p) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
        const [images, variants, colors] = await Promise.all([
            query("SELECT id, url, alt_text, sort_order FROM product_images WHERE product_id = :id ORDER BY sort_order", { id: p.id }),
            query("SELECT id, code, label, price_delta, stock, sort_order FROM product_variants WHERE product_id = :id AND is_active = 1 ORDER BY sort_order", { id: p.id }),
            query("SELECT id, code, name, color_hex, image, price_delta, stock, sort_order FROM product_colors WHERE product_id = :id ORDER BY sort_order", { id: p.id }),
        ]);
        res.json({ ...formatProduct(p), images, variants, colors });
    })
);

router.post(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const { name, slug, category_id, brand_id, price, old_price, image, badge, description, stock } = req.body || {};
        if (!name) return res.status(400).json({ error: "Thiếu tên sản phẩm." });
        const result = await query(
            `INSERT INTO products (name, slug, category_id, brand_id, price, old_price, image, badge, description, stock)
             VALUES (:name, :slug, :category_id, :brand_id, :price, :old_price, :image, :badge, :description, :stock)`,
            {
                name, slug: slug || null,
                category_id: category_id || null, brand_id: brand_id || null,
                price: Number(price) || 0, old_price: Number(old_price) || null,
                image: image || null, badge: badge || null,
                description: description || null, stock: Number(stock) || 0,
            }
        );
        const p = await one("SELECT * FROM products WHERE id = :id", { id: result.insertId });
        res.status(201).json(formatProduct(p));
    })
);

router.put(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const id = Number(req.params.id);
        const { name, slug, category_id, brand_id, price, old_price, image, badge, description, stock, is_active } = req.body || {};
        await query(
            `UPDATE products SET
                name = COALESCE(:name, name),
                slug = COALESCE(:slug, slug),
                category_id = COALESCE(:category_id, category_id),
                brand_id = COALESCE(:brand_id, brand_id),
                price = COALESCE(:price, price),
                old_price = :old_price,
                image = COALESCE(:image, image),
                badge = :badge,
                description = COALESCE(:description, description),
                stock = COALESCE(:stock, stock),
                is_active = COALESCE(:is_active, is_active)
             WHERE id = :id`,
            {
                id,
                name: name ?? null,
                slug: slug ?? null,
                category_id: category_id ?? null,
                brand_id: brand_id ?? null,
                price: price != null ? Number(price) : null,
                old_price: old_price != null ? Number(old_price) : null,
                image: image ?? null,
                badge: badge ?? null,
                description: description ?? null,
                stock: stock != null ? Number(stock) : null,
                is_active: is_active != null ? (is_active ? 1 : 0) : null,
            }
        );
        const p = await one("SELECT * FROM products WHERE id = :id", { id });
        res.json(formatProduct(p));
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM products WHERE id = :id", { id: Number(req.params.id) });
        res.json({ ok: true });
    })
);

const formatProduct = (p) =>
    p && {
        ...p,
        price: Number(p.price),
        old_price: p.old_price != null ? Number(p.old_price) : null,
        rating: Number(p.rating),
        is_active: !!p.is_active,
        // alias for frontend
        oldPrice: p.old_price != null ? Number(p.old_price) : null,
        category: p.category_id,
        brand: p.brand_id,
    };

export default router;
