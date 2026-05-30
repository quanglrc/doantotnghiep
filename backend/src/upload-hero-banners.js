/**
 * Upload 3 ảnh hero banner lên Cloudinary.
 * Chạy: node src/upload-hero-banners.js
 */
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const IMAGES = [
    {
        publicId: "hero-iphone-15-pro-max",
        url: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTtjXumIpQR1zDTKTJFu05ML5tACXXE4IFGnuEC3J3D5ie8ri2nMIqflMWeNeXpyFQQLEw8ZeBwTjt_mKQxFUOWij2uWzCqdluCN682DWpOPoUD1DxwnOQhDTUVNxhAYSwYJks50g&usqp=CAc",
    },
    {
        publicId: "hero-laptop-gaming",
        url: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRTz9MsZPijyIgrmcACVtf0UbqdJ6XU2lFLD7JCCpd_9BmoGXdpS07VkeI_saBOrUWwCp45awV0Gwq5Qeafh6XM3wkWFW9YR6Zh6dK-Le2JZux9iBfB31GrtecMN-vfE-vnNfEhiwKCNg&usqp=CAc",
    },
];

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const main = async () => {
    for (const img of IMAGES) {
        try {
            process.stdout.write(`↑ ${img.publicId}...`);
            const result = await cloudinary.uploader.upload(img.url, {
                folder: "viqitech/banners",
                public_id: img.publicId,
                overwrite: true,
                transformation: [{ quality: "auto:good", fetch_format: "auto" }],
            });
            console.log(` ✓\n   ${result.secure_url}`);
        } catch (err) {
            console.log(` ✗ ${err.message}`);
        }
    }
    console.log("\n[hero] Hoàn tất. Paste URL Cloudinary vào HeroBanner.jsx");
};

main().catch((err) => {
    console.error("Lỗi:", err.message);
    process.exit(1);
});
