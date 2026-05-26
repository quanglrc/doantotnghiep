-- =====================================================================
-- ViQiTech - Database Schema (MySQL 8.0+)
-- Đồ án tốt nghiệp: Website bán điện thoại, laptop, máy tính bảng
-- =====================================================================

DROP DATABASE IF EXISTS viqitech;
CREATE DATABASE viqitech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE viqitech;

-- =====================================================================
-- 1. NGƯỜI DÙNG (khách hàng + admin)
-- =====================================================================
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    address       VARCHAR(500),
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    locked        BOOLEAN NOT NULL DEFAULT FALSE,
    avatar        VARCHAR(500),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. DANH MỤC SẢN PHẨM
-- =====================================================================
CREATE TABLE categories (
    id         VARCHAR(50) PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. THƯƠNG HIỆU
-- =====================================================================
CREATE TABLE brands (
    id         VARCHAR(50) PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    logo       VARCHAR(500),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brands_active (is_active)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SẢN PHẨM
-- =====================================================================
CREATE TABLE products (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) UNIQUE,
    category_id  VARCHAR(50),
    brand_id     VARCHAR(50),
    price        DECIMAL(15,2) NOT NULL DEFAULT 0,
    old_price    DECIMAL(15,2),
    image        VARCHAR(1000),
    badge        VARCHAR(50),                 -- HOT, MỚI, -20%...
    description  TEXT,
    rating       DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    sold         INT NOT NULL DEFAULT 0,
    stock        INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_products_category (category_id),
    INDEX idx_products_brand    (brand_id),
    INDEX idx_products_price    (price),
    INDEX idx_products_active   (is_active),
    FULLTEXT INDEX ft_products_name (name)
) ENGINE=InnoDB;

-- Thư viện ảnh (gallery)
CREATE TABLE product_images (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    url        VARCHAR(1000) NOT NULL,
    alt_text   VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id, sort_order)
) ENGINE=InnoDB;

-- Phiên bản (256GB / 512GB / 1TB / 2TB hoặc cấu hình laptop)
CREATE TABLE product_variants (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    product_id  INT NOT NULL,
    code        VARCHAR(50) NOT NULL,         -- 256gb, 1tb, 16-512...
    label       VARCHAR(100) NOT NULL,        -- '256GB', '16GB / 512GB'
    price_delta DECIMAL(15,2) NOT NULL DEFAULT 0,
    stock       INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_variant (product_id, code),
    INDEX idx_variants_product (product_id)
) ENGINE=InnoDB;

-- Màu sắc
CREATE TABLE product_colors (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    product_id  INT NOT NULL,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    color_hex   VARCHAR(20),                  -- '#3c4a5e'
    image       VARCHAR(1000),
    price_delta DECIMAL(15,2) NOT NULL DEFAULT 0,
    stock       INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_color (product_id, code),
    INDEX idx_colors_product (product_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. VOUCHER / KHUYẾN MÃI
-- =====================================================================
CREATE TABLE vouchers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(50) NOT NULL UNIQUE,
    label          VARCHAR(100) NOT NULL,
    description    TEXT,
    discount_type  ENUM('amount','percent','freeship') NOT NULL DEFAULT 'amount',
    discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_order      DECIMAL(15,2) NOT NULL DEFAULT 0,
    max_discount   DECIMAL(15,2),
    max_uses       INT,
    used_count     INT NOT NULL DEFAULT 0,
    start_at       DATETIME,
    end_at         DATETIME,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_vouchers_code (code),
    INDEX idx_vouchers_active (is_active, end_at)
) ENGINE=InnoDB;

-- Áp dụng voucher cho sản phẩm cụ thể (NULL = áp dụng toàn bộ)
CREATE TABLE product_vouchers (
    product_id INT NOT NULL,
    voucher_id INT NOT NULL,
    PRIMARY KEY (product_id, voucher_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Voucher user đã thu thập
CREATE TABLE user_vouchers (
    user_id      INT NOT NULL,
    voucher_id   INT NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at      TIMESTAMP NULL,
    order_id     VARCHAR(50),
    PRIMARY KEY (user_id, voucher_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    INDEX idx_user_vouchers_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. GIỎ HÀNG (lưu server-side - optional, vì frontend đang dùng localStorage)
-- =====================================================================
CREATE TABLE carts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL UNIQUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    cart_id    INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    color_id   INT,
    qty        INT NOT NULL DEFAULT 1,
    added_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cart_id)    REFERENCES carts(id)            ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (color_id)   REFERENCES product_colors(id)   ON DELETE SET NULL,
    INDEX idx_cart_items_cart (cart_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. ĐƠN HÀNG
-- =====================================================================
CREATE TABLE orders (
    id              VARCHAR(50) PRIMARY KEY,   -- 'VQ-20260520-0001'
    user_id         INT,
    customer_name   VARCHAR(100) NOT NULL,
    customer_email  VARCHAR(150),
    customer_phone  VARCHAR(20),
    customer_address VARCHAR(500),
    subtotal        DECIMAL(15,2) NOT NULL,
    shipping        DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL,
    status          ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL DEFAULT 'pending',
    payment_method  ENUM('cod','bank','card','momo','zalopay') NOT NULL DEFAULT 'cod',
    payment_status  ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
    voucher_code    VARCHAR(50),
    cancel_reason   VARCHAR(500),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_user    (user_id),
    INDEX idx_orders_status  (status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      VARCHAR(50) NOT NULL,
    product_id    INT,
    product_name  VARCHAR(255) NOT NULL,     -- snapshot tại thời điểm đặt
    product_image VARCHAR(1000),
    variant_label VARCHAR(100),
    color_name    VARCHAR(100),
    price         DECIMAL(15,2) NOT NULL,
    qty           INT NOT NULL,
    subtotal      DECIMAL(15,2) NOT NULL,

    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- Lịch sử trạng thái đơn hàng (để theo dõi)
CREATE TABLE order_status_history (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    order_id   VARCHAR(50) NOT NULL,
    status     ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL,
    note       VARCHAR(500),
    changed_by INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)  ON DELETE SET NULL,
    INDEX idx_status_history_order (order_id, created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. ĐÁNH GIÁ SẢN PHẨM
-- =====================================================================
CREATE TABLE reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    product_id  INT NOT NULL,
    user_id     INT NOT NULL,
    order_id    VARCHAR(50),
    rating      TINYINT NOT NULL,
    comment     TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE SET NULL,
    INDEX idx_reviews_product (product_id, is_approved),
    INDEX idx_reviews_user    (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. CHATBOT AI
-- =====================================================================
CREATE TABLE chatbot_config (
    id              TINYINT PRIMARY KEY DEFAULT 1,
    welcome_message TEXT NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_chatbot_singleton CHECK (id = 1)
) ENGINE=InnoDB;

CREATE TABLE chatbot_quick_replies (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    label      VARCHAR(150) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE chatbot_rules (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    keyword    VARCHAR(150) NOT NULL,
    answer     TEXT NOT NULL,
    priority   INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chatbot_rules_keyword (keyword, is_active)
) ENGINE=InnoDB;

-- Lịch sử hội thoại (nếu cần phân tích/cải thiện chatbot)
CREATE TABLE chat_sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at   TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_chat_sessions_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role       ENUM('user','bot') NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_chat_messages_session (session_id, created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. CMS PHỤ
-- =====================================================================
-- Tin tức / blog
CREATE TABLE news_posts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) UNIQUE,
    excerpt      VARCHAR(500),
    content      TEXT,
    thumbnail    VARCHAR(1000),
    author_id    INT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_news_published (is_published, published_at)
) ENGINE=InnoDB;

-- Form liên hệ
CREATE TABLE contact_submissions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150),
    phone      VARCHAR(20),
    message    TEXT NOT NULL,
    resolved   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_resolved (resolved, created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 11. VIEW HỖ TRỢ THỐNG KÊ
-- =====================================================================
-- Doanh thu theo tháng
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    YEAR(created_at)  AS year,
    MONTH(created_at) AS month,
    COUNT(*)          AS order_count,
    SUM(total)        AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY YEAR(created_at), MONTH(created_at);

-- Top sản phẩm bán chạy
CREATE OR REPLACE VIEW v_top_products AS
SELECT
    oi.product_id,
    oi.product_name,
    SUM(oi.qty)      AS total_qty,
    SUM(oi.subtotal) AS total_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_qty DESC;

-- Đánh giá trung bình theo sản phẩm
CREATE OR REPLACE VIEW v_product_ratings AS
SELECT
    product_id,
    COUNT(*)          AS review_count,
    AVG(rating)       AS avg_rating
FROM reviews
WHERE is_approved = TRUE
GROUP BY product_id;

-- =====================================================================
-- 12. SEED DATA
-- =====================================================================

-- Admin gốc (mật khẩu: admin123 - thay bằng hash bcrypt thực tế)
INSERT INTO users (name, email, phone, address, password_hash, role) VALUES
('Quản trị viên', 'admin@viqitech.vn', '0900000000', 'Trụ sở ViQiTech',
 '$2a$10$REPLACE_WITH_BCRYPT_HASH_OF_admin123', 'admin');

-- Categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
('dien-thoai', 'Điện thoại',     'fa-mobile-screen',           1),
('laptop',     'Laptop',          'fa-laptop',                  2),
('tablet',     'Máy tính bảng',   'fa-tablet-screen-button',    3),
('phu-kien',   'Phụ kiện',        'fa-headphones',              4);

-- Brands
INSERT INTO brands (id, name) VALUES
('apple',   'Apple'),
('samsung', 'Samsung'),
('xiaomi',  'Xiaomi'),
('oppo',    'OPPO'),
('asus',    'ASUS'),
('dell',    'Dell'),
('lenovo',  'Lenovo'),
('sony',    'Sony');

-- Sản phẩm mẫu
INSERT INTO products (name, slug, category_id, brand_id, price, old_price, badge, sold, stock, description) VALUES
('iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'dien-thoai', 'apple',
 29990000, 34990000, 'HOT', 1234, 50,
 'Chip A17 Pro mới nhất, khung Titanium siêu nhẹ, camera Tetraprism zoom 5x.'),
('Samsung Galaxy S24 Ultra', 'galaxy-s24-ultra', 'dien-thoai', 'samsung',
 27990000, 31990000, 'MỚI', 980, 40, NULL),
('MacBook Pro 14 M3 Pro', 'macbook-pro-14-m3-pro', 'laptop', 'apple',
 52990000, 58990000, 'HOT', 412, 25, NULL),
('iPad Pro M4 11 inch', 'ipad-pro-m4-11', 'tablet', 'apple',
 27990000, 30990000, 'MỚI', 654, 30, NULL),
('AirPods Pro 2 (USB-C)', 'airpods-pro-2-usb-c', 'phu-kien', 'apple',
 5490000, 6490000, 'HOT', 2310, 120, NULL);

-- Phiên bản cho iPhone 15 Pro Max (id=1)
INSERT INTO product_variants (product_id, code, label, price_delta, stock, sort_order) VALUES
(1, '256gb', '256GB',  0,         20, 1),
(1, '512gb', '512GB',  5000000,   15, 2),
(1, '1tb',   '1TB',    10000000,  10, 3),
(1, '2tb',   '2TB',    18000000,  5,  4);

-- Màu sắc cho iPhone 15 Pro Max
INSERT INTO product_colors (product_id, code, name, color_hex, price_delta, stock, sort_order) VALUES
(1, 'natural', 'Natural Titanium', '#9c9893',  0,       15, 1),
(1, 'blue',    'Blue Titanium',    '#3c4a5e',  0,       12, 2),
(1, 'white',   'White Titanium',   '#e6e6e6',  0,       10, 3),
(1, 'black',   'Black Titanium',   '#1f1f1f',  0,       13, 4);

-- Vouchers
INSERT INTO vouchers (code, label, description, discount_type, discount_value, min_order, max_uses, end_at) VALUES
('VQ500K',   'Giảm 500K',             'Áp dụng cho đơn từ 10 triệu',           'amount',   500000, 10000000, 1000, '2027-12-31 23:59:59'),
('FREESHIP', 'Miễn phí vận chuyển',  'Áp dụng cho mọi đơn hàng',              'freeship', 30000,  0,        NULL, NULL),
('SALE10',   'Giảm 10%',              'Tối đa 1.000.000đ cho đơn từ 5 triệu', 'percent',  10,     5000000,  500,  '2027-06-30 23:59:59');

-- Áp dụng voucher VQ500K cho iPhone (product_id=1)
INSERT INTO product_vouchers (product_id, voucher_id) VALUES (1, 1);

-- Chatbot config
INSERT INTO chatbot_config (id, welcome_message) VALUES
(1, 'Xin chào! Tôi là trợ lý ảo của ViQiTech. Bạn cần hỗ trợ gì hôm nay?');

INSERT INTO chatbot_quick_replies (label, sort_order) VALUES
('Tư vấn điện thoại', 1),
('Tư vấn laptop',     2),
('Chính sách bảo hành', 3),
('Phương thức thanh toán', 4);

INSERT INTO chatbot_rules (keyword, answer, priority) VALUES
('iphone',     'Bạn có thể xem các mẫu iPhone mới nhất tại danh mục Điện thoại.', 10),
('macbook',    'MacBook Pro M3 và Air M3 đang được ưu đãi tới 6 triệu, trả góp 0%.', 10),
('bảo hành',   'ViQiTech bảo hành chính hãng từ 12-24 tháng tùy sản phẩm.', 8),
('thanh toán', 'Hỗ trợ: tiền mặt, chuyển khoản, thẻ tín dụng, trả góp 0%.', 8),
('giao hàng',  'Miễn phí giao hàng toàn quốc cho đơn từ 500.000đ.', 6);

-- =====================================================================
-- 13. TRIGGER hỗ trợ
-- =====================================================================
DELIMITER //

-- Tự động cập nhật rating của product khi có review mới
CREATE TRIGGER trg_review_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE products
    SET rating = (
        SELECT COALESCE(AVG(rating), 5) FROM reviews
        WHERE product_id = NEW.product_id AND is_approved = TRUE
    )
    WHERE id = NEW.product_id;
END//

-- Tự động cập nhật sold khi đơn hoàn thành
CREATE TRIGGER trg_order_completed
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        UPDATE products p
        JOIN order_items oi ON oi.product_id = p.id
        SET p.sold = p.sold + oi.qty
        WHERE oi.order_id = NEW.id;
    END IF;
END//

-- Ghi log đổi trạng thái đơn hàng
CREATE TRIGGER trg_order_status_log
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO order_status_history (order_id, status, note)
        VALUES (NEW.id, NEW.status, CONCAT('Đổi từ ', OLD.status, ' sang ', NEW.status));
    END IF;
END//

DELIMITER ;


