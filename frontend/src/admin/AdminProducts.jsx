import { useMemo, useState } from "react";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../data/products";

const emptyForm = {
    id: null,
    name: "",
    category: "",
    brand: "",
    price: "",
    oldPrice: "",
    image: "",
    badge: "",
};

const AdminProducts = () => {
    const { products, categories, brands, addProduct, updateProduct, deleteProduct } = useShop();
    const toast = useToast();
    const [q, setQ] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [editing, setEditing] = useState(null);

    const list = useMemo(() => {
        let arr = products.slice();
        if (filterCat) arr = arr.filter((p) => p.category === filterCat);
        if (q.trim()) {
            const s = q.toLowerCase();
            arr = arr.filter((p) => p.name.toLowerCase().includes(s));
        }
        return arr;
    }, [products, q, filterCat]);

    const openCreate = () => setEditing({ ...emptyForm, category: categories[0]?.id || "", brand: brands[0]?.id || "" });
    const openEdit = (p) => setEditing({ ...emptyForm, ...p, price: String(p.price), oldPrice: String(p.oldPrice || "") });

    const onSave = async (e) => {
        e.preventDefault();
        if (!editing.name.trim()) {
            toast.show("Vui lòng nhập tên sản phẩm.", "error");
            return;
        }
        const data = {
            name: editing.name.trim(),
            category_id: editing.category,
            brand_id: editing.brand,
            price: Number(editing.price) || 0,
            old_price: Number(editing.oldPrice) || 0,
            image: editing.image || `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='%231e6fff'/><text x='50%' y='50%' fill='white' font-family='Arial' font-size='22' font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${editing.name.slice(0, 18)}</text></svg>`)}`,
            badge: editing.badge || null,
        };
        try {
            if (editing.id) {
                await updateProduct(editing.id, data);
                toast.show("Đã cập nhật sản phẩm.", "success");
            } else {
                await addProduct(data);
                toast.show("Đã thêm sản phẩm.", "success");
            }
            setEditing(null);
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const onDelete = async (p) => {
        if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
        try {
            await deleteProduct(p.id);
            toast.show("Đã xóa sản phẩm.", "info");
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý sản phẩm</h1>
                    <p>Tổng cộng {products.length} sản phẩm</p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <i className="fa-solid fa-plus"></i> Thêm sản phẩm
                </button>
            </div>

            <div className="admin-card">
                <div className="admin-toolbar">
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Tìm theo tên sản phẩm..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        className="admin-search"
                        style={{ flex: "0 0 200px", cursor: "pointer" }}
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Thương hiệu</th>
                            <th>Giá</th>
                            <th>Đã bán</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr className="empty-row"><td colSpan={7}>Không có sản phẩm nào</td></tr>
                        ) : (
                            list.map((p) => {
                                const cat = categories.find((c) => c.id === p.category);
                                const brand = brands.find((b) => b.id === p.brand);
                                return (
                                    <tr key={p.id}>
                                        <td><img src={p.image} alt={p.name} /></td>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{cat?.name || <span className="muted">—</span>}</td>
                                        <td>{brand?.name || <span className="muted">—</span>}</td>
                                        <td>{formatPrice(p.price)}</td>
                                        <td>{p.sold}</td>
                                        <td>
                                            <div className="tbl-actions">
                                                <button type="button" className="icon-btn" onClick={() => openEdit(p)} title="Sửa">
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button type="button" className="icon-btn danger" onClick={() => onDelete(p)} title="Xóa">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="modal-backdrop" onClick={() => setEditing(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-head">
                            <h3>{editing.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
                            <button type="button" className="modal-close" onClick={() => setEditing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={onSave} className="modal-body">
                            <div className="form-row">
                                <label>Tên sản phẩm *</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-row">
                                    <label>Danh mục</label>
                                    <select
                                        value={editing.category}
                                        onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label>Thương hiệu</label>
                                    <select
                                        value={editing.brand}
                                        onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                                    >
                                        {brands.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-row">
                                    <label>Giá bán (đ)</label>
                                    <input
                                        type="number"
                                        value={editing.price}
                                        onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Giá cũ (đ)</label>
                                    <input
                                        type="number"
                                        value={editing.oldPrice}
                                        onChange={(e) => setEditing({ ...editing, oldPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <label>URL hình ảnh (để trống = ảnh tự sinh)</label>
                                <input
                                    type="text"
                                    placeholder="https://... hoặc để trống"
                                    value={editing.image && !editing.image.startsWith("data:") ? editing.image : ""}
                                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Nhãn (HOT, MỚI, -20%...)</label>
                                <input
                                    type="text"
                                    value={editing.badge || ""}
                                    onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                                />
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary">
                                    <i className="fa-solid fa-floppy-disk"></i> Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminProducts;
