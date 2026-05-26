const svg = (label, sub, bg) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
      <rect width='400' height='400' fill='${bg}'/>
      <text x='50%' y='46%' fill='white' font-family='Arial' font-size='22' font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${label}</text>
      <text x='50%' y='56%' fill='rgba(255,255,255,0.6)' font-family='Arial' font-size='13' text-anchor='middle' dominant-baseline='middle'>${sub}</text>
    </svg>`
    )}`;

const tint = (label, bg) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' fill='${bg}'/>
      <text x='50%' y='52%' fill='white' font-family='Arial' font-size='10' font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${label}</text>
    </svg>`
    )}`;

const VARIANTS_BY_CATEGORY = {
    "dien-thoai": [
        { id: "256gb", label: "256GB", priceDelta: 0 },
        { id: "512gb", label: "512GB", priceDelta: 5000000 },
        { id: "1tb", label: "1TB", priceDelta: 10000000 },
        { id: "2tb", label: "2TB", priceDelta: 18000000 },
    ],
    laptop: [
        { id: "16-512", label: "16GB / 512GB", priceDelta: 0 },
        { id: "32-1tb", label: "32GB / 1TB", priceDelta: 8000000 },
        { id: "64-2tb", label: "64GB / 2TB", priceDelta: 18000000 },
    ],
    tablet: [
        { id: "128", label: "128GB", priceDelta: 0 },
        { id: "256", label: "256GB", priceDelta: 3000000 },
        { id: "512", label: "512GB", priceDelta: 7000000 },
        { id: "1tb", label: "1TB", priceDelta: 13000000 },
    ],
};

const COLORS_BY_BRAND = {
    apple: [
        { id: "natural", name: "Natural Titanium", bg: "#9c9893", priceDelta: 0 },
        { id: "blue", name: "Blue Titanium", bg: "#3c4a5e", priceDelta: 0 },
        { id: "white", name: "White Titanium", bg: "#e6e6e6", priceDelta: 0 },
        { id: "black", name: "Black Titanium", bg: "#1f1f1f", priceDelta: 0 },
    ],
    samsung: [
        { id: "black", name: "Titanium Black", bg: "#0f0f0f", priceDelta: 0 },
        { id: "grey", name: "Titanium Grey", bg: "#6d6f72", priceDelta: 0 },
        { id: "violet", name: "Titanium Violet", bg: "#7d6b9e", priceDelta: 200000 },
    ],
    xiaomi: [
        { id: "orange", name: "Cam Mercury", bg: "#ff6900", priceDelta: 0 },
        { id: "black", name: "Đen Nguyên Tử", bg: "#1a1a1a", priceDelta: 0 },
        { id: "white", name: "Trắng Polar", bg: "#eaeaea", priceDelta: 0 },
    ],
    oppo: [
        { id: "green", name: "Xanh Lá", bg: "#19af40", priceDelta: 0 },
        { id: "purple", name: "Tím Sương", bg: "#9a7bd4", priceDelta: 0 },
        { id: "black", name: "Đen", bg: "#1a1a1a", priceDelta: 0 },
    ],
    asus: [
        { id: "black", name: "Eclipse Gray", bg: "#1f1f1f", priceDelta: 0 },
        { id: "white", name: "Off Black", bg: "#3b3b3b", priceDelta: 200000 },
    ],
    dell: [
        { id: "platinum", name: "Platinum Silver", bg: "#cccccc", priceDelta: 0 },
        { id: "graphite", name: "Graphite", bg: "#3a3a3a", priceDelta: 200000 },
    ],
    lenovo: [
        { id: "carbon", name: "Carbon Black", bg: "#1f1f1f", priceDelta: 0 },
        { id: "stone", name: "Stone Grey", bg: "#7a7a7a", priceDelta: 0 },
    ],
    sony: [
        { id: "black", name: "Đen", bg: "#000000", priceDelta: 0 },
        { id: "silver", name: "Bạc", bg: "#c0c0c0", priceDelta: 0 },
        { id: "midnight", name: "Midnight Blue", bg: "#0d2545", priceDelta: 0 },
    ],
};

export const getVariants = (product) => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) return product.variants;
    return VARIANTS_BY_CATEGORY[product?.category] || [];
};

export const getColors = (product) => {
    if (Array.isArray(product?.colors) && product.colors.length > 0) return product.colors;
    if (!["dien-thoai", "laptop", "tablet"].includes(product?.category)) return [];
    const base = COLORS_BY_BRAND[product.brand] || COLORS_BY_BRAND.apple;
    return base.map((c) => ({ ...c, image: tint(c.name.slice(0, 8), c.bg) }));
};

export const getGallery = (product) => {
    if (Array.isArray(product?.gallery) && product.gallery.length > 0) return product.gallery;
    if (!product) return [];
    const name = (product.name || "").slice(0, 22);
    const colors = COLORS_BY_BRAND[product.brand] || COLORS_BY_BRAND.apple;
    const accents = ["Mặt trước", "Mặt sau", "Góc nghiêng", "Camera", "Cận cảnh"];
    return [
        product.image,
        ...accents.map((sub, i) => svg(name, sub, colors[i % colors.length].bg)),
    ];
};

export const getVouchers = (product) => {
    if (Array.isArray(product?.vouchers) && product.vouchers.length > 0) return product.vouchers;
    const vs = [
        {
            code: "VQ500K",
            label: "Giảm 500K",
            desc: "Áp dụng cho đơn từ 10 triệu",
            discount: 500000,
            minOrder: 10000000,
        },
        {
            code: "FREESHIP",
            label: "Miễn phí vận chuyển",
            desc: "Áp dụng cho mọi đơn hàng",
            discount: 30000,
            minOrder: 0,
        },
    ];
    if (product?.price >= 20000000) {
        vs.unshift({
            code: "TRAGOP0",
            label: "Trả góp 0%",
            desc: "Qua thẻ tín dụng / công ty tài chính",
            discount: 0,
            minOrder: 0,
        });
    }
    return vs;
};
