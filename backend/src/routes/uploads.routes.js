import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

// Cấu hình Cloudinary từ env
const configureCloudinary = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });
    return true;
};

const isCloudinaryReady = () =>
    !!(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET);

// Multer lưu vào RAM (buffer) → upload thẳng lên Cloudinary, không ghi đĩa
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpe?g|png|webp|gif|bmp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
        else cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF, BMP, SVG)."));
    },
});

const uploadBufferToCloudinary = (buffer, folder = "viqitech") =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { quality: "auto:good", fetch_format: "auto" }, // tự WebP nếu browser hỗ trợ
                ],
            },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
    });

// GET /api/uploads/status — debug + để frontend biết Cloudinary có active không
router.get("/status", (_req, res) => {
    res.json({
        ok: isCloudinaryReady(),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    });
});

// POST /api/uploads/image — upload 1 file ảnh, trả về URL Cloudinary
router.post(
    "/image",
    adminOnly,
    (req, res, next) => {
        if (!configureCloudinary()) {
            return res.status(500).json({
                error: "Chưa cấu hình Cloudinary. Đặt CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong backend/.env.",
            });
        }
        upload.single("image")(req, res, (err) => {
            if (err) return res.status(400).json({ error: err.message });
            next();
        });
    },
    asyncH(async (req, res) => {
        if (!req.file) return res.status(400).json({ error: "Thiếu file (field name: image)." });

        const folder = (req.body.folder || "viqitech/products").replace(/[^a-zA-Z0-9_/-]/g, "");
        const result = await uploadBufferToCloudinary(req.file.buffer, folder);

        res.status(201).json({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        });
    })
);

// DELETE /api/uploads/image — xoá ảnh khỏi Cloudinary theo public_id
router.delete(
    "/image",
    adminOnly,
    asyncH(async (req, res) => {
        if (!configureCloudinary()) {
            return res.status(500).json({ error: "Chưa cấu hình Cloudinary." });
        }
        const { publicId } = req.body || {};
        if (!publicId) return res.status(400).json({ error: "Thiếu publicId." });
        const result = await cloudinary.uploader.destroy(publicId);
        res.json({ ok: result.result === "ok", result });
    })
);

export default router;
