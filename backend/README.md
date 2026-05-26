# ViQiTech Backend

REST API cho website ViQiTech — Node.js + Express + MySQL.

## Yêu cầu

- Node.js 18+ (khuyến nghị 20+ để chạy `node --watch`)
- MySQL 8.0+
- npm

## Cài đặt

```bash
cd backend
npm install
cp .env.example .env
```

Sửa `.env` theo cấu hình MySQL của bạn (port, user, password). Nếu dùng XAMPP mặc định thì giữ nguyên (`root` / mật khẩu trống).

## Khởi tạo database

### Lần đầu tiên

```bash
npm run seed
```

Script này:
1. Kiểm tra database `viqitech` — nếu **chưa tồn tại** hoặc **trống**, chạy schema để tạo bảng + dữ liệu mẫu
2. Nếu DB **đã có dữ liệu** → **GIỮ NGUYÊN** (an toàn, chạy nhiều lần không mất data)
3. Luôn đảm bảo admin (`admin@viqitech.vn`) tồn tại

Admin mặc định: `admin@viqitech.vn` / `admin123`

### Reset toàn bộ (XOÁ HẾT data)

```bash
npm run db:reset
```

Lệnh này sẽ **xoá database** và tạo lại từ đầu. Chỉ chạy khi muốn reset hoàn toàn.

### ⚠️ Lưu ý

- `npm run dev` (chạy server) **KHÔNG** động đến DB → tài khoản đã đăng ký vẫn còn
- `npm run seed` (sau lần đầu) **KHÔNG** xoá data → an toàn chạy lại
- **Chỉ** `npm run db:reset` mới xoá data

## Chạy server

```bash
npm run dev   # auto-restart khi sửa code (Node 20+)
# hoặc
npm start
```

Server chạy ở `http://localhost:4000`. Health check: `GET /api/health`.

## API endpoints

### Auth (`/api/auth`)
- `POST /register` — đăng ký khách hàng
- `POST /login` — đăng nhập (trả JWT)
- `GET /me` — thông tin user hiện tại (Bearer token)
- `PUT /me` — cập nhật profile
- `PUT /me/password` — đổi mật khẩu

### Users (`/api/users`) — admin only
- `GET /` · `POST /` · `PUT /:id` · `PATCH /:id/lock` · `DELETE /:id`

### Catalog
- `GET /api/products` (public, query `?cat=&brand=&q=`) · `GET /:id`
- `POST /api/products` · `PUT /:id` · `DELETE /:id` — admin
- `GET /api/categories` · `POST` · `PUT /:id` · `DELETE /:id`
- `GET /api/brands` · `POST` · `PUT /:id` · `DELETE /:id`

### Orders (`/api/orders`)
- `POST /` — tạo đơn (cần login)
- `GET /me` — đơn của tôi
- `GET /` — tất cả đơn (admin)
- `GET /:id` — chi tiết đơn
- `PATCH /:id/status` — admin đổi trạng thái
- `PATCH /:id/cancel` — khách / admin hủy đơn

### Reviews (`/api/reviews`)
- `GET /?product_id=` · `POST /` (cần đã mua) · `DELETE /:id` (admin)

### Chatbot (`/api/chatbot`)
- `GET /` — cấu hình + quick replies + rules + `geminiEnabled` (public)
- `POST /chat` — body `{ message, history: [{role, text}] }` → trả `{ reply, source: "gemini"|"rules"|"error" }`
- `PUT /config` · `PUT /quick-replies` · `POST /rules` · `DELETE /rules/:id` (admin)

#### Bật gửi email thật (quên mật khẩu)

Mặc định: chế độ demo (hiển thị link reset trên UI). Để gửi email thật qua Gmail:

1. Mở Google Account → bật **xác minh 2 bước** (2FA) tại https://myaccount.google.com/security
2. Vào https://myaccount.google.com/apppasswords → **Create app password** (tên: ViQiTech) → copy chuỗi 16 ký tự
3. Mở `backend/.env`, điền:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop      # App password 16 ký tự (có thể có dấu cách hoặc không)
   SMTP_FROM_NAME=ViQiTech
   SMTP_FROM_EMAIL=your_email@gmail.com
   ```
4. Restart backend (`npm run dev`)
5. Console hiển thị `[mailer] ✓ SMTP sẵn sàng: smtp.gmail.com:587` là OK

Test: vào `/quen-mat-khau`, nhập email tài khoản đã đăng ký → kiểm tra hộp thư (kể cả Spam).

**Nhà cung cấp khác** (Outlook/Yahoo/SendGrid...): chỉ cần thay `SMTP_HOST`, `SMTP_PORT`, credentials phù hợp. Nodemailer hỗ trợ hầu hết SMTP providers.

#### Bật chatbot AI (Gemini)

1. Truy cập https://aistudio.google.com/apikey (đăng nhập Google), bấm **Create API key**
2. Copy key, dán vào `backend/.env`:
   ```
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Restart backend (`npm run dev`)
4. Nếu để `GEMINI_API_KEY` trống → chatbot fallback về rule keyword (đã seed mẫu trong DB)

Model `gemini-2.5-flash` có **free tier** rộng rãi cho demo. Có thể đổi sang `gemini-2.5-pro` (chính xác hơn, chậm hơn) hoặc `gemini-2.5-flash-lite` (nhẹ nhất).

Bot được nạp sẵn context về danh mục, top 20 sản phẩm bán chạy, brands và chính sách shop nên có thể tư vấn giá/sản phẩm cụ thể.

### Stats (`/api/stats`) — admin only
- `GET /dashboard` · `GET /revenue?year=` · `GET /top-products`

## JWT

Khi login/register, server trả `{ user, token }`. Frontend lưu `token` ở localStorage và gửi qua header:
```
Authorization: Bearer <token>
```

## Cấu trúc thư mục

```
backend/
├── database/
│   └── schema.sql
├── src/
│   ├── config/db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── error.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── products.routes.js
│   │   ├── categories.routes.js
│   │   ├── brands.routes.js
│   │   ├── orders.routes.js
│   │   ├── reviews.routes.js
│   │   ├── chatbot.routes.js
│   │   └── stats.routes.js
│   ├── seed.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Troubleshooting

- **`ER_ACCESS_DENIED_ERROR`**: Sai user/password MySQL. Kiểm tra `.env`.
- **`ECONNREFUSED`**: MySQL chưa chạy. Mở XAMPP/MySQL Workbench để start.
- **CORS lỗi**: Sửa `CORS_ORIGIN` trong `.env` cho khớp frontend (mặc định `http://localhost:5173`).
