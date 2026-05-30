import { useRef, useState } from "react";
import { api, getToken } from "../api/client";
import { useToast } from "../context/ToastContext";

/**
 * ImageUpload — input upload ảnh lên Cloudinary qua API backend.
 *
 * Props:
 *   value:    URL ảnh hiện tại
 *   onChange: (url: string) => void
 *   folder:   thư mục Cloudinary (vd: "viqitech/products", "viqitech/brands")
 */
const ImageUpload = ({ value, onChange, folder = "viqitech/products" }) => {
    const toast = useToast();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [urlInput, setUrlInput] = useState("");

    const isCloudinaryUrl = (url) =>
        typeof url === "string" && url.includes("res.cloudinary.com");
    const isDataUrl = (url) => typeof url === "string" && url.startsWith("data:");
    const hasImage = value && !isDataUrl(value);

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // reset để chọn lại cùng file vẫn trigger
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.show("Ảnh quá lớn (tối đa 5MB).", "error");
            return;
        }
        if (!file.type.startsWith("image/")) {
            toast.show("Vui lòng chọn file ảnh.", "error");
            return;
        }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            fd.append("folder", folder);

            const token = getToken();
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE || `${window.location.protocol}//${window.location.hostname}:4000/api`}/uploads/image`,
                {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: fd,
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || `Upload thất bại (${res.status})`);
            }
            onChange(data.url);
            toast.show("Đã upload ảnh.", "success");
        } catch (err) {
            toast.show(err.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const applyUrl = () => {
        const u = urlInput.trim();
        if (!u) return;
        onChange(u);
        setUrlInput("");
        toast.show("Đã dán URL ảnh.", "success");
    };

    const clear = () => {
        if (window.confirm("Bỏ ảnh hiện tại?")) onChange("");
    };

    return (
        <div className="img-upload">
            {hasImage && (
                <div className="img-preview">
                    <img src={value} alt="preview" />
                    <button type="button" className="img-clear" onClick={clear} aria-label="Xoá">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    {isCloudinaryUrl(value) && (
                        <span className="img-badge"><i className="fa-solid fa-cloud"></i> Cloudinary</span>
                    )}
                </div>
            )}

            <div className="img-actions">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: "none" }}
                />
                <button
                    type="button"
                    className="btn-outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Đang upload...</>
                    ) : (
                        <><i className="fa-solid fa-cloud-arrow-up"></i> {hasImage ? "Đổi ảnh" : "Upload ảnh"}</>
                    )}
                </button>
            </div>

            <div className="img-or">— hoặc dán URL ảnh —</div>
            <div className="img-url-row">
                <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
                />
                <button type="button" onClick={applyUrl} className="btn-outline" disabled={!urlInput.trim()}>
                    Dán
                </button>
            </div>

            <small className="img-hint">
                <i className="fa-solid fa-circle-info"></i> Hỗ trợ JPG/PNG/WEBP/GIF, tối đa 5MB. Ảnh được tự động optimize qua Cloudinary CDN.
            </small>
        </div>
    );
};

export default ImageUpload;
