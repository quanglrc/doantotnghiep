/**
 * Thay ảnh placeholder bằng ảnh thật từ Unsplash + manufacturer CDN.
 *
 * Chạy: npm run update:images
 *
 * Cách hoạt động:
 *   1. Lấy tất cả sản phẩm từ DB
 *   2. Với mỗi sản phẩm, chọn URL ảnh thật phù hợp (dựa vào tên + category + brand)
 *   3. Upload ảnh lên Cloudinary (overwrite ảnh cũ)
 *   4. UPDATE products.image
 *
 * Idempotent: chạy nhiều lần vẫn ra kết quả như nhau.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { v2 as cloudinary } from "cloudinary";

const slugify = (s) =>
    s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// ============================================================
// MAPPING ảnh thật theo từng dòng sản phẩm
// (Unsplash photo IDs — đã verify tồn tại và stable)
// ============================================================
const u = (id) => `https://images.unsplash.com/photo-${id}?w=900&h=900&fit=crop&q=85&auto=format`;

const SPECIFIC_IMAGES = [
    // === iPhone series === (đã đổi sang các URL đã verify)
    { match: /iphone 16 pro|iphone 16/i,         url: u("1591337676887-a217a6970a8a") },
    { match: /iphone 15 pro max|iphone 15 pro/i, url: u("1592286927505-1def25115558") },
    { match: /iphone 15/i,                       url: u("1591337676887-a217a6970a8a") },
    { match: /iphone 14/i,                       url: u("1592286927505-1def25115558") },
    { match: /iphone 13/i,                       url: u("1591337676887-a217a6970a8a") },
    { match: /iphone/i,                          url: u("1591337676887-a217a6970a8a") },

    // === Samsung phones ===
    { match: /galaxy z fold/i,                   url: u("1610792516307-ea5acd9c3b00") },
    { match: /galaxy z flip/i,                   url: u("1610792516307-ea5acd9c3b00") },
    { match: /galaxy s24 ultra/i,                url: u("1610792516307-ea5acd9c3b00") },
    { match: /galaxy s24/i,                      url: u("1610792516307-ea5acd9c3b00") },
    { match: /galaxy a55/i,                      url: u("1610945265064-0e34e5519bbf") },
    { match: /galaxy m\d+|galaxy a\d+/i,         url: u("1592890288564-76628a30a657") },
    { match: /samsung.*phone|galaxy/i,           url: u("1565849904461-04a58ad377e0") },

    // === Xiaomi / Poco / Redmi ===
    { match: /xiaomi 14 pro/i,                   url: u("1574944985070-8f3ebc6b79d2") },
    { match: /poco/i,                            url: u("1574944985070-8f3ebc6b79d2") },
    { match: /redmi/i,                           url: u("1604671801908-6f0c6a092c05") },
    { match: /xiaomi/i,                          url: u("1574944985070-8f3ebc6b79d2") },

    // === OPPO ===
    { match: /oppo find x/i,                     url: u("1585060544812-6b45742d762f") },
    { match: /oppo reno/i,                       url: u("1592434134753-a70baf7979d5") },
    { match: /oppo a/i,                          url: u("1565849904461-04a58ad377e0") },
    { match: /oppo/i,                            url: u("1585060544812-6b45742d762f") },

    // === Apple Laptops ===
    { match: /macbook pro 16/i,                  url: u("1517336714731-489689fd1ca8") },
    { match: /macbook pro 14/i,                  url: u("1611186871348-b1ce696e52c9") },
    { match: /macbook pro/i,                     url: u("1517336714731-489689fd1ca8") },
    { match: /macbook air 15/i,                  url: u("1496181133206-80ce9b88a853") },
    { match: /macbook air 13|macbook air/i,      url: u("1496181133206-80ce9b88a853") },
    { match: /macbook/i,                         url: u("1496181133206-80ce9b88a853") },

    // === ASUS Laptops ===
    { match: /rog zephyrus|rog/i,                url: u("1603302576837-37561b2e2302") },
    { match: /tuf gaming/i,                      url: u("1593642632559-0c6d3fc62b89") },
    { match: /zenbook/i,                         url: u("1541807084-5c52b6b3adef") },
    { match: /asus/i,                            url: u("1541807084-5c52b6b3adef") },

    // === Dell ===
    { match: /xps/i,                             url: u("1588872657578-7efd1f1555ed") },
    { match: /latitude/i,                        url: u("1517336714731-489689fd1ca8") },
    { match: /inspiron/i,                        url: u("1496181133206-80ce9b88a853") },
    { match: /dell/i,                            url: u("1588872657578-7efd1f1555ed") },

    // === Lenovo / HP / Acer ===
    { match: /thinkpad/i,                        url: u("1525547719571-a2d4ac8945e2") },
    { match: /ideapad/i,                         url: u("1496181133206-80ce9b88a853") },
    { match: /lenovo.*tab/i,                     url: u("1561154464-82e9adf32764") },
    { match: /lenovo/i,                          url: u("1525547719571-a2d4ac8945e2") },
    { match: /hp pavilion|hp/i,                  url: u("1593642632559-0c6d3fc62b89") },
    { match: /acer/i,                            url: u("1541807084-5c52b6b3adef") },

    // === iPad / Tablets ===
    { match: /ipad pro/i,                        url: u("1561154464-82e9adf32764") },
    { match: /ipad air/i,                        url: u("1561154464-82e9adf32764") },
    { match: /ipad mini/i,                       url: u("1585790050230-5dd28404ccb9") },
    { match: /ipad/i,                            url: u("1561154464-82e9adf32764") },
    { match: /galaxy tab s10|galaxy tab s9 ultra/i, url: u("1623126908029-58cb08a2b272") },
    { match: /galaxy tab/i,                      url: u("1632634571832-2c44b07b40b1") },
    { match: /xiaomi pad|redmi pad/i,            url: u("1623126908029-58cb08a2b272") },
    { match: /tab/i,                             url: u("1561154464-82e9adf32764") },

    // === Audio (AirPods, Buds, Headphones) ===
    { match: /airpods max/i,                     url: u("1583394838336-acd977736f90") },
    { match: /airpods pro/i,                     url: u("1606220588913-b3aacb4d2f46") },
    { match: /airpods/i,                         url: u("1572569511254-d8f925fe2cbb") },
    { match: /galaxy buds/i,                     url: u("1606841837239-c5a1a4a07af7") },
    { match: /wh-1000|sony.*wh|sony.*headphone/i, url: u("1505740420928-5e560c06d30e") },
    { match: /wf-1000|sony.*wf/i,                url: u("1590658268037-6bf12165a8df") },
    { match: /headphone|tai nghe/i,              url: u("1505740420928-5e560c06d30e") },

    // === Smart Watch ===
    { match: /apple watch ultra/i,               url: u("1551816230-ef5deaed4a26") },
    { match: /apple watch/i,                     url: u("1546868871-7041f2a55e12") },
    { match: /galaxy watch/i,                    url: u("1611185155138-c5cf6e3ec5d6") },
    { match: /watch/i,                           url: u("1523275335684-37898b6baf30") },

    // === Gaming console ===
    { match: /playstation|ps5/i,                 url: u("1606144042614-b2417e99c4e3") },

    // === Keyboard ===
    { match: /keychron|bàn phím cơ/i,            url: u("1587829741301-dc798b83add3") },
    { match: /mx keys|bàn phím/i,                url: u("1561883088-039e53143d73") },
    { match: /keyboard/i,                        url: u("1587829741301-dc798b83add3") },

    // === Mouse ===
    { match: /mx master|chuột|mouse/i,           url: u("1527864550417-7fd91fc51a46") },

    // === Charger / Cable / Power bank ===
    { match: /sạc dự phòng|power bank|maggo/i,  url: u("1609091839311-d5365f9ff1c5") },
    { match: /sạc nhanh|củ sạc|charger/i,        url: u("1601445638532-3c6f6c3aa1d6") },
    { match: /cáp|cable/i,                       url: u("1601445638532-3c6f6c3aa1d6") },

    // === Stylus ===
    { match: /apple pencil/i,                    url: u("1611532736597-de2d4265fba3") },
];

// Fallback theo category
const FALLBACK_BY_CATEGORY = {
    "dien-thoai": u("1511707171634-5f897ff02aa9"),
    "laptop":     u("1496181133206-80ce9b88a853"),
    "tablet":     u("1561154464-82e9adf32764"),
    "phu-kien":   u("1583394293214-28ded15ee548"),
};

const pickImageUrl = (p) => {
    for (const { match, url } of SPECIFIC_IMAGES) {
        if (match.test(p.name)) return url;
    }
    return FALLBACK_BY_CATEGORY[p.category_id] || u("1496181133206-80ce9b88a853");
};

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const {
        DB_HOST, DB_PORT = 3306, DB_USER, DB_PASSWORD, DB_NAME = "viqitech",
        CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
    } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.error("[update] ✗ Thiếu config CLOUDINARY_* trong backend/.env");
        process.exit(1);
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });

    const conn = await mysql.createConnection({
        host: DB_HOST, port: Number(DB_PORT),
        user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
    });

    const [products] = await conn.query(
        "SELECT id, name, slug, category_id, brand_id, image FROM products WHERE is_active = 1 ORDER BY id"
    );
    console.log(`[update] Có ${products.length} sản phẩm trong DB`);

    let ok = 0, failed = 0, skipped = 0;
    const onlyFlag = process.argv.includes("--placeholders-only");

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const num = `[${i + 1}/${products.length}]`;

        // Nếu --placeholders-only: chỉ update sp có image là placehold.co hoặc null
        const isPlaceholder = !p.image || p.image.includes("placehold.co");
        if (onlyFlag && !isPlaceholder) {
            console.log(`${num} ⊘ Skip:   ${p.name} (đã có ảnh thật)`);
            skipped++;
            continue;
        }

        const sourceUrl = pickImageUrl(p);
        const publicId = p.slug || slugify(p.name);

        try {
            process.stdout.write(`${num} ↻ ${p.name}...`);
            const result = await cloudinary.uploader.upload(sourceUrl, {
                folder: "viqitech/products",
                public_id: publicId,
                overwrite: true,
                transformation: [{ quality: "auto:good", fetch_format: "auto", crop: "fill", width: 800, height: 800 }],
            });
            await conn.query("UPDATE products SET image = ? WHERE id = ?", [
                result.secure_url,
                p.id,
            ]);
            process.stdout.write(` ✓\n`);
            ok++;
        } catch (err) {
            process.stdout.write(` ✗ (${(err.message || "lỗi").slice(0, 60)})\n`);
            failed++;
        }
    }

    await conn.end();
    console.log(`\n[update] Hoàn tất:`);
    console.log(`  ✓ Cập nhật ảnh: ${ok}`);
    console.log(`  ⊘ Bỏ qua:       ${skipped}`);
    console.log(`  ✗ Lỗi:          ${failed}`);
    console.log(`\n  Refresh frontend để xem ảnh mới.`);
};

main().catch((err) => {
    console.error("\n[update] ✗ Lỗi:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});
