/**
 * Seed sản phẩm: tự động upload ảnh lên Cloudinary + insert vào DB.
 *
 * Chạy: npm run seed:products
 * Idempotent: skip sản phẩm đã tồn tại theo slug.
 *
 * Yêu cầu .env có:
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
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

// Màu nền theo brand (cho placeholder image)
const BRAND_COLORS = {
    apple: { bg: "1d1d1f", fg: "ffffff" },
    samsung: { bg: "1428a0", fg: "ffffff" },
    xiaomi: { bg: "ff6900", fg: "ffffff" },
    oppo: { bg: "19af40", fg: "ffffff" },
    asus: { bg: "0a8acd", fg: "ffffff" },
    dell: { bg: "0076ce", fg: "ffffff" },
    lenovo: { bg: "e2231a", fg: "ffffff" },
    sony: { bg: "111111", fg: "ffffff" },
    hp: { bg: "0096d6", fg: "ffffff" },
    acer: { bg: "83b81a", fg: "ffffff" },
};

const placeholderUrl = (name, brand) => {
    const c = BRAND_COLORS[brand] || { bg: "555555", fg: "ffffff" };
    const text = encodeURIComponent(name.replace(/\s+/g, "\n").slice(0, 60));
    return `https://placehold.co/800x800/${c.bg}/${c.fg}.png?text=${text}&font=montserrat`;
};

// ============================================================
// DANH SÁCH SẢN PHẨM
// ============================================================
const PRODUCTS = [
    // === ĐIỆN THOẠI (10) ===
    { name: "iPhone 15 Pro Max 256GB", category: "dien-thoai", brand: "apple",
      price: 29990000, oldPrice: 34990000, badge: "HOT", sold: 1234, stock: 50,
      description: "Chip A17 Pro mới nhất, khung Titanium siêu nhẹ, camera Tetraprism zoom 5x quang học." },
    { name: "iPhone 15 128GB", category: "dien-thoai", brand: "apple",
      price: 19990000, oldPrice: 22990000, badge: null, sold: 2150, stock: 80,
      description: "Chip A16 Bionic, camera 48MP, cổng USB-C, màu Hồng/Vàng/Xanh." },
    { name: "iPhone 14 128GB", category: "dien-thoai", brand: "apple",
      price: 16990000, oldPrice: 19990000, badge: "-15%", sold: 3400, stock: 100,
      description: "Chip A15 Bionic, màn Super Retina XDR 6.1 inch, camera kép 12MP." },
    { name: "Samsung Galaxy S24 Ultra 256GB", category: "dien-thoai", brand: "samsung",
      price: 27990000, oldPrice: 31990000, badge: "MỚI", sold: 980, stock: 40,
      description: "Khung Titanium, S Pen tích hợp, camera 200MP, AI Galaxy Assist." },
    { name: "Samsung Galaxy S24 5G", category: "dien-thoai", brand: "samsung",
      price: 18990000, oldPrice: 22990000, badge: null, sold: 1500, stock: 60,
      description: "Chip Snapdragon 8 Gen 3, màn Dynamic AMOLED 2X 120Hz, pin 4000mAh." },
    { name: "Samsung Galaxy A55 5G", category: "dien-thoai", brand: "samsung",
      price: 8990000, oldPrice: 10490000, badge: null, sold: 2400, stock: 120,
      description: "Khung kim loại, màn Super AMOLED 120Hz, camera chính 50MP, pin 5000mAh." },
    { name: "Xiaomi 14 Pro 5G", category: "dien-thoai", brand: "xiaomi",
      price: 18990000, oldPrice: 22990000, badge: null, sold: 540, stock: 35,
      description: "Snapdragon 8 Gen 3, camera Leica, sạc 120W siêu nhanh, màn LTPO 120Hz." },
    { name: "Xiaomi Redmi Note 13 Pro", category: "dien-thoai", brand: "xiaomi",
      price: 6990000, oldPrice: 7990000, badge: "-12%", sold: 4200, stock: 150,
      description: "Camera 200MP, sạc 67W, màn AMOLED 120Hz, chip Snapdragon 7s Gen 2." },
    { name: "OPPO Find X7 Ultra", category: "dien-thoai", brand: "oppo",
      price: 23990000, oldPrice: 26990000, badge: null, sold: 320, stock: 25,
      description: "Camera Hasselblad zoom 6x, chip Snapdragon 8 Gen 3, sạc nhanh 100W." },
    { name: "OPPO Reno 12 5G", category: "dien-thoai", brand: "oppo",
      price: 11990000, oldPrice: 13990000, badge: null, sold: 880, stock: 70,
      description: "Camera AI, sạc 80W, màn Cong AMOLED 120Hz, thiết kế siêu mỏng." },

    // === LAPTOP (8) ===
    { name: "MacBook Pro 14 M3 Pro", category: "laptop", brand: "apple",
      price: 52990000, oldPrice: 58990000, badge: "HOT", sold: 412, stock: 25,
      description: "Chip M3 Pro 12-core CPU, 18-core GPU, RAM 18GB, SSD 512GB, màn Liquid Retina XDR." },
    { name: "MacBook Air 13 M3", category: "laptop", brand: "apple",
      price: 28990000, oldPrice: 32990000, badge: "MỚI", sold: 850, stock: 45,
      description: "Chip M3 8-core, RAM 8GB, SSD 256GB, mỏng nhẹ chỉ 1.24kg, pin 18 giờ." },
    { name: "ASUS ROG Strix G16 (2024)", category: "laptop", brand: "asus",
      price: 35990000, oldPrice: 39990000, badge: null, sold: 215, stock: 30,
      description: "Intel Core i9-14900HX, RTX 4070 8GB, RAM 16GB DDR5, SSD 1TB, màn 165Hz." },
    { name: "ASUS ZenBook 14 OLED", category: "laptop", brand: "asus",
      price: 22990000, oldPrice: 25990000, badge: null, sold: 380, stock: 50,
      description: "Intel Core Ultra 7, RAM 16GB, SSD 512GB, màn OLED 2.8K, vỏ kim loại sang trọng." },
    { name: "Dell XPS 15 9530", category: "laptop", brand: "dell",
      price: 42990000, oldPrice: 46990000, badge: null, sold: 178, stock: 20,
      description: "Intel Core i7-13700H, RTX 4050, RAM 16GB, SSD 512GB, màn 3.5K OLED." },
    { name: "Dell Inspiron 16 Plus", category: "laptop", brand: "dell",
      price: 18990000, oldPrice: 21990000, badge: null, sold: 290, stock: 60,
      description: "Intel Core i5-1340P, RAM 16GB, SSD 512GB, màn 16 inch 2.5K." },
    { name: "Lenovo ThinkPad X1 Carbon Gen 12", category: "laptop", brand: "lenovo",
      price: 39990000, oldPrice: 44990000, badge: null, sold: 142, stock: 22,
      description: "Intel Core Ultra 7 vPro, RAM 16GB, SSD 1TB, màn 14 OLED 2.8K, vỏ carbon." },
    { name: "Lenovo IdeaPad Slim 5 Pro", category: "laptop", brand: "lenovo",
      price: 16990000, oldPrice: 19490000, badge: "-13%", sold: 520, stock: 75,
      description: "AMD Ryzen 7 7735H, RAM 16GB, SSD 512GB, màn 14 inch 2.2K, pin 12 giờ." },

    // === MÁY TÍNH BẢNG (6) ===
    { name: "iPad Pro M4 11 inch (2024)", category: "tablet", brand: "apple",
      price: 27990000, oldPrice: 30990000, badge: "MỚI", sold: 654, stock: 30,
      description: "Chip M4 thế hệ mới, màn Ultra Retina XDR Tandem OLED, hỗ trợ Apple Pencil Pro." },
    { name: "iPad Air 11 inch M2", category: "tablet", brand: "apple",
      price: 16990000, oldPrice: 18990000, badge: null, sold: 489, stock: 55,
      description: "Chip M2 8-core, màn Liquid Retina 11 inch, hỗ trợ Apple Pencil USB-C, mỏng 6.1mm." },
    { name: "iPad 10 (2022) 64GB", category: "tablet", brand: "apple",
      price: 10490000, oldPrice: 12990000, badge: null, sold: 1100, stock: 100,
      description: "Chip A14 Bionic, màn Liquid Retina 10.9 inch, hỗ trợ Apple Pencil 1, USB-C." },
    { name: "Samsung Galaxy Tab S9 Ultra", category: "tablet", brand: "samsung",
      price: 22990000, oldPrice: 26990000, badge: null, sold: 234, stock: 28,
      description: "Snapdragon 8 Gen 2, màn Super AMOLED 14.6 inch 120Hz, S Pen đi kèm, pin 11.200mAh." },
    { name: "Samsung Galaxy Tab S9 FE", category: "tablet", brand: "samsung",
      price: 11990000, oldPrice: 13990000, badge: null, sold: 410, stock: 65,
      description: "Exynos 1380, màn 10.9 inch 90Hz, S Pen đi kèm, kháng nước IP68." },
    { name: "Xiaomi Pad 6 Pro", category: "tablet", brand: "xiaomi",
      price: 9990000, oldPrice: 12490000, badge: null, sold: 312, stock: 50,
      description: "Snapdragon 8+ Gen 1, màn 11 inch 144Hz, sạc 67W, pin 8600mAh, 4 loa stereo." },

    // === PHỤ KIỆN (8) ===
    { name: "AirPods Pro 2 (USB-C)", category: "phu-kien", brand: "apple",
      price: 5490000, oldPrice: 6490000, badge: "HOT", sold: 2310, stock: 120,
      description: "Chống ồn chủ động, âm thanh không gian cá nhân, hộp sạc USB-C, định vị Find My." },
    { name: "AirPods Max", category: "phu-kien", brand: "apple",
      price: 12990000, oldPrice: 14990000, badge: null, sold: 320, stock: 30,
      description: "Tai nghe chụp tai cao cấp, driver động học, audio Lossless qua USB-C, 5 màu." },
    { name: "Apple Watch Series 9 GPS 45mm", category: "phu-kien", brand: "apple",
      price: 10990000, oldPrice: 12490000, badge: null, sold: 540, stock: 40,
      description: "Chip S9, màn Always-On Retina sáng 2000 nits, double-tap gesture, theo dõi sức khoẻ." },
    { name: "Sony WH-1000XM5", category: "phu-kien", brand: "sony",
      price: 7990000, oldPrice: 9490000, badge: null, sold: 845, stock: 50,
      description: "Tai nghe chống ồn hàng đầu, pin 30 giờ, kết nối đa thiết bị, sạc nhanh 3 phút = 3 giờ." },
    { name: "Sony PlayStation 5 Slim", category: "phu-kien", brand: "sony",
      price: 13990000, oldPrice: 14990000, badge: null, sold: 280, stock: 35,
      description: "Phiên bản mỏng hơn 30%, ổ đĩa Blu-ray tháo lắp, SSD 1TB, 8K HDR." },
    { name: "Samsung Galaxy Watch 7", category: "phu-kien", brand: "samsung",
      price: 6990000, oldPrice: 7990000, badge: null, sold: 380, stock: 60,
      description: "Chip Exynos W1000, đo huyết áp, ECG, AGE & Body Composition, Wear OS 5." },
    { name: "Sạc nhanh Apple 20W USB-C", category: "phu-kien", brand: "apple",
      price: 490000, oldPrice: 690000, badge: null, sold: 3200, stock: 300,
      description: "Củ sạc chính hãng Apple, công suất 20W, hỗ trợ Fast Charge cho iPhone 8 trở lên." },
    { name: "Chuột Logitech MX Master 3S", category: "phu-kien", brand: "lenovo",
      price: 2390000, oldPrice: 2890000, badge: "-17%", sold: 1145, stock: 90,
      description: "Cảm biến 8000 DPI, click yên tĩnh, MagSpeed scroll, kết nối Bluetooth + USB-C." },

    // === ĐIỆN THOẠI BỔ SUNG (8) ===
    { name: "iPhone 16 Pro Max 512GB", category: "dien-thoai", brand: "apple",
      price: 37990000, oldPrice: 41990000, badge: "MỚI", sold: 412, stock: 30,
      description: "Chip A18 Pro, màn hình ProMotion 6.9 inch, hệ thống camera 48MP nâng cấp, nút Camera Control." },
    { name: "iPhone 13 128GB", category: "dien-thoai", brand: "apple",
      price: 13990000, oldPrice: 16990000, badge: "-18%", sold: 2480, stock: 120,
      description: "Chip A15 Bionic, camera kép 12MP, pin trâu cả ngày, giá tốt cho người dùng đầu tiên." },
    { name: "Samsung Galaxy Z Fold 6", category: "dien-thoai", brand: "samsung",
      price: 47990000, oldPrice: 52990000, badge: "HOT", sold: 156, stock: 15,
      description: "Smartphone gập màn hình 7.6 inch, Snapdragon 8 Gen 3, Galaxy AI, camera 50MP." },
    { name: "Samsung Galaxy Z Flip 6", category: "dien-thoai", brand: "samsung",
      price: 25990000, oldPrice: 28990000, badge: null, sold: 290, stock: 25,
      description: "Smartphone gập vỏ sò, Snapdragon 8 Gen 3, RAM 12GB, pin 4000mAh, camera 50MP." },
    { name: "Samsung Galaxy M55 5G", category: "dien-thoai", brand: "samsung",
      price: 8490000, oldPrice: 9990000, badge: null, sold: 720, stock: 100,
      description: "Snapdragon 7 Gen 1, màn hình Super AMOLED 6.7\", pin 5000mAh, sạc 45W." },
    { name: "Xiaomi POCO X7 Pro", category: "dien-thoai", brand: "xiaomi",
      price: 9490000, oldPrice: 11490000, badge: "MỚI", sold: 410, stock: 70,
      description: "Dimensity 8400-Ultra, sạc nhanh 90W, AMOLED 120Hz, camera 50MP OIS." },
    { name: "OPPO A60 4GB/128GB", category: "dien-thoai", brand: "oppo",
      price: 4690000, oldPrice: 5290000, badge: null, sold: 1320, stock: 200,
      description: "Snapdragon 680, pin 5000mAh, sạc nhanh 45W, kháng nước IP54, giá học sinh." },
    { name: "OPPO Reno 13 Pro 5G", category: "dien-thoai", brand: "oppo",
      price: 14990000, oldPrice: 16990000, badge: "MỚI", sold: 198, stock: 40,
      description: "Dimensity 8350, camera Sony 50MP, AI Editor, màn hình cong 120Hz, pin 5800mAh." },

    // === LAPTOP BỔ SUNG (7) ===
    { name: "MacBook Pro 16 M4 Max", category: "laptop", brand: "apple",
      price: 89990000, oldPrice: 94990000, badge: "MỚI", sold: 85, stock: 12,
      description: "Chip M4 Max 16-core CPU, 40-core GPU, RAM 48GB, SSD 1TB, màn Liquid Retina XDR." },
    { name: "MacBook Air 15 M3", category: "laptop", brand: "apple",
      price: 32990000, oldPrice: 35990000, badge: null, sold: 420, stock: 35,
      description: "Chip M3 8-core, RAM 16GB, SSD 512GB, màn 15.3\" Liquid Retina, pin 18 giờ, mỏng 11.5mm." },
    { name: "ASUS ROG Zephyrus G14 (2024)", category: "laptop", brand: "asus",
      price: 45990000, oldPrice: 49990000, badge: "GAMING", sold: 145, stock: 18,
      description: "Ryzen 9 8945HS, RTX 4060, OLED 120Hz 14\", AniMe Matrix LED, nhẹ 1.5kg." },
    { name: "ASUS TUF Gaming F15", category: "laptop", brand: "asus",
      price: 21990000, oldPrice: 24990000, badge: null, sold: 290, stock: 50,
      description: "Intel Core i7-13620H, RTX 4050, 144Hz FHD, MIL-STD-810H bền bỉ, RAM 16GB." },
    { name: "Dell Latitude 7450", category: "laptop", brand: "dell",
      price: 38990000, oldPrice: 42990000, badge: null, sold: 75, stock: 20,
      description: "Intel Core Ultra 7, Intel AI Boost, RAM 32GB, SSD 1TB, vPro, dành cho doanh nhân." },
    { name: "HP Pavilion Plus 14", category: "laptop", brand: "hp",
      price: 22990000, oldPrice: 25990000, badge: null, sold: 168, stock: 40,
      description: "Intel Core Ultra 5, OLED 2.8K, RAM 16GB, SSD 512GB, sạc nhanh USB-C 65W." },
    { name: "Acer Swift Go 14", category: "laptop", brand: "acer",
      price: 19990000, oldPrice: 22990000, badge: "-13%", sold: 220, stock: 60,
      description: "Intel Core Ultra 5 125U, OLED 2.8K 90Hz, RAM 16GB, SSD 512GB, mỏng 1.49kg." },

    // === MÁY TÍNH BẢNG BỔ SUNG (4) ===
    { name: "iPad mini 7 (A17 Pro)", category: "tablet", brand: "apple",
      price: 14990000, oldPrice: 16990000, badge: "MỚI", sold: 234, stock: 45,
      description: "Chip A17 Pro, màn 8.3\" Liquid Retina, Apple Intelligence, gọn nhẹ cho người dùng di chuyển." },
    { name: "Samsung Galaxy Tab S10 Ultra", category: "tablet", brand: "samsung",
      price: 31990000, oldPrice: 34990000, badge: "MỚI", sold: 88, stock: 18,
      description: "Màn 14.6\" AMOLED 120Hz, Dimensity 9300+, S Pen kèm sẵn, Galaxy AI." },
    { name: "Xiaomi Redmi Pad SE", category: "tablet", brand: "xiaomi",
      price: 4990000, oldPrice: 5990000, badge: null, sold: 540, stock: 100,
      description: "Snapdragon 680, màn 11\" 90Hz, pin 8000mAh, 4 loa stereo, giá học sinh sinh viên." },
    { name: "Lenovo Tab P11 Pro Gen 2", category: "tablet", brand: "lenovo",
      price: 11490000, oldPrice: 12990000, badge: null, sold: 120, stock: 25,
      description: "MediaTek Kompanio 1300T, OLED 11.2\" 120Hz, 4 loa JBL, Bút Lenovo Precision Pen 3." },

    // === PHỤ KIỆN BỔ SUNG (11) ===
    { name: "AirPods 4 với ANC", category: "phu-kien", brand: "apple",
      price: 4990000, oldPrice: 5490000, badge: "MỚI", sold: 680, stock: 150,
      description: "Chip H2, chống ồn chủ động (lần đầu trên AirPods 4), Spatial Audio cá nhân hoá." },
    { name: "Apple Watch Ultra 2", category: "phu-kien", brand: "apple",
      price: 22990000, oldPrice: 24990000, badge: "HOT", sold: 195, stock: 30,
      description: "Vỏ Titanium 49mm, màn hình 3000 nits, GPS Dual-Frequency, pin 36 giờ, kháng nước 100m." },
    { name: "Samsung Galaxy Buds 3 Pro", category: "phu-kien", brand: "samsung",
      price: 4990000, oldPrice: 5990000, badge: null, sold: 470, stock: 120,
      description: "Dual driver Planar + Dynamic, ANC, Galaxy AI live translate, IP57." },
    { name: "Sony WF-1000XM5", category: "phu-kien", brand: "sony",
      price: 7490000, oldPrice: 8990000, badge: "-17%", sold: 580, stock: 70,
      description: "Tai nghe true wireless flagship, ANC tốt nhất phân khúc, driver Dynamic Driver X 8.4mm." },
    { name: "Sony WH-CH720N", category: "phu-kien", brand: "sony",
      price: 2490000, oldPrice: 2990000, badge: null, sold: 920, stock: 180,
      description: "Tai nghe over-ear không dây, ANC, pin 35h, nhẹ 192g, có 360 Reality Audio." },
    { name: "Bàn phím Logitech MX Keys S", category: "phu-kien", brand: "lenovo",
      price: 2890000, oldPrice: 3290000, badge: null, sold: 410, stock: 80,
      description: "Phím cảm ứng đèn nền tự động, Smart Actions, kết nối 3 thiết bị, USB-C sạc." },
    { name: "Bàn phím cơ Keychron K2 Pro", category: "phu-kien", brand: "lenovo",
      price: 2890000, oldPrice: 3290000, badge: "HOT", sold: 580, stock: 60,
      description: "75% layout, hot-swap, RGB, dual-mode Bluetooth + Wired, switch Gateron G Pro." },
    { name: "Sạc dự phòng Anker MagGo 10000mAh", category: "phu-kien", brand: "apple",
      price: 1690000, oldPrice: 2090000, badge: null, sold: 820, stock: 200,
      description: "Sạc MagSafe không dây 15W, USB-C 30W, chân đứng tích hợp, 10000mAh." },
    { name: "Apple Pencil Pro", category: "phu-kien", brand: "apple",
      price: 3690000, oldPrice: 3990000, badge: "MỚI", sold: 290, stock: 80,
      description: "Squeeze cảm ứng, Barrel Roll, Hover, Find My, tương thích iPad Pro M4 / iPad Air M2." },
    { name: "Củ sạc nhanh Samsung 45W USB-C", category: "phu-kien", brand: "samsung",
      price: 690000, oldPrice: 890000, badge: null, sold: 1830, stock: 350,
      description: "Sạc Super Fast Charging 2.0, hỗ trợ PD-PPS, dùng cho mọi điện thoại USB-C." },
    { name: "Cáp Apple USB-C to Lightning 1m", category: "phu-kien", brand: "apple",
      price: 590000, oldPrice: 690000, badge: null, sold: 2640, stock: 500,
      description: "Cáp chính hãng Apple, hỗ trợ sạc nhanh PD, độ dài 1m, bền bỉ." },
];

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
        DB_HOST = "localhost",
        DB_PORT = 3306,
        DB_USER = "root",
        DB_PASSWORD = "",
        DB_NAME = "viqitech",
    } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.error("✗ Chưa cấu hình Cloudinary trong backend/.env");
        console.error("  Cần CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
        process.exit(1);
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });

    console.log(`[seed-products] MySQL: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log(`[seed-products] Cloudinary: ${CLOUDINARY_CLOUD_NAME}\n`);

    const conn = await mysql.createConnection({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const slug = slugify(p.name);
        const num = `[${i + 1}/${PRODUCTS.length}]`;

        try {
            // Idempotent: nếu đã có thì kiểm tra image, có thì skip, không thì upload và UPDATE
            const [existing] = await conn.query(
                "SELECT id, image FROM products WHERE slug = ? OR name = ?",
                [slug, p.name]
            );
            if (existing.length > 0) {
                const hasImage = existing[0].image && existing[0].image.trim().length > 0;
                if (hasImage) {
                    console.log(`${num} ⊘ Skip:   ${p.name} (đã có ảnh)`);
                    skipped++;
                    continue;
                }
                // Có sản phẩm nhưng chưa có ảnh → upload + UPDATE
                const imgUrl = placeholderUrl(p.name, p.brand);
                process.stdout.write(`${num} ↻ Update ảnh: ${p.name}...`);
                const result = await cloudinary.uploader.upload(imgUrl, {
                    folder: "viqitech/products",
                    public_id: slug,
                    overwrite: true,
                    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
                });
                await conn.query(
                    "UPDATE products SET image = ? WHERE id = ?",
                    [result.secure_url, existing[0].id]
                );
                process.stdout.write(` ✓\n`);
                updated++;
                continue;
            }

            // Upload ảnh lên Cloudinary (từ placehold.co URL)
            const imgUrl = placeholderUrl(p.name, p.brand);
            process.stdout.write(`${num} ↑ Upload: ${p.name}...`);
            const result = await cloudinary.uploader.upload(imgUrl, {
                folder: "viqitech/products",
                public_id: slug,
                overwrite: true,
                transformation: [{ quality: "auto:good", fetch_format: "auto" }],
            });

            // Insert vào DB
            await conn.query(
                `INSERT INTO products
                 (name, slug, category_id, brand_id, price, old_price, image, badge, description, sold, stock)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    p.name, slug, p.category, p.brand,
                    p.price, p.oldPrice, result.secure_url,
                    p.badge || null, p.description || null,
                    p.sold || 0, p.stock || 0,
                ]
            );

            process.stdout.write(` ✓\n`);
            added++;
        } catch (err) {
            process.stdout.write(` ✗ (${err.message.slice(0, 80)})\n`);
            failed++;
        }
    }

    await conn.end();

    console.log(`\n[seed-products] Hoàn tất:`);
    console.log(`  ✓ Thêm mới:   ${added}`);
    console.log(`  ↻ Update ảnh: ${updated}`);
    console.log(`  ⊘ Bỏ qua:     ${skipped}`);
    console.log(`  ✗ Lỗi:        ${failed}`);
    console.log(`\nMở trang chủ frontend để thấy sản phẩm mới.`);
};

main().catch((err) => {
    console.error("\n✗ Lỗi không mong đợi:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});
