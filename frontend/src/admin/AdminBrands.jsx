import { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";

const AdminBrands = () => {
    const { brands, products, addBrand, updateBrand, deleteBrand } = useShop();
    const toast = useToast();
    const [editing, setEditing] = useState(null);

    const openCreate = () => setEditing({ id: null, name: "" });
    const openEdit = (b) => setEditing({ ...b });

    const onSave = async (e) => {
        e.preventDefault();
        if (!editing.name.trim()) {
            toast.show("Vui lòng nhập tên thương hiệu.", "error");
            return;
        }
        try {
            if (editing.id) {
                await updateBrand(editing.id, { name: editing.name.trim() });
                toast.show("Đã cập nhật thương hiệu.", "success");
            } else {
                const slug = editing.name.toLowerCase()
                    .normalize("NFD").replace(/[̀-ͯ]/g, "")
                    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                await addBrand({ id: slug || `br-${Date.now()}`, name: editing.name.trim() });
                toast.show("Đã thêm thương hiệu.", "success");
            }
            setEditing(null);
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const onDelete = async (b) => {
        const used = products.filter((p) => p.brand === b.id).length;
        if (used > 0) {
            if (!window.confirm(`Có ${used} sản phẩm thuộc thương hiệu "${b.name}". Vẫn xóa?`)) return;
        } else if (!window.confirm(`Xóa thương hiệu "${b.name}"?`)) return;
        try {
            await deleteBrand(b.id);
            toast.show("Đã xóa thương hiệu.", "info");
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý thương hiệu</h1>
                    <p>Tổng cộng {brands.length} thương hiệu</p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <i className="fa-solid fa-plus"></i> Thêm thương hiệu
                </button>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Tên thương hiệu</th>
                            <th>Mã (ID)</th>
                            <th>Số sản phẩm</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.length === 0 ? (
                            <tr className="empty-row"><td colSpan={4}>Chưa có thương hiệu nào</td></tr>
                        ) : (
                            brands.map((b) => {
                                const count = products.filter((p) => p.brand === b.id).length;
                                return (
                                    <tr key={b.id}>
                                        <td><strong>{b.name}</strong></td>
                                        <td><code className="muted">{b.id}</code></td>
                                        <td>{count}</td>
                                        <td>
                                            <div className="tbl-actions">
                                                <button type="button" className="icon-btn" onClick={() => openEdit(b)}>
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button type="button" className="icon-btn danger" onClick={() => onDelete(b)}>
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
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-head">
                            <h3>{editing.id ? "Sửa thương hiệu" : "Thêm thương hiệu"}</h3>
                            <button type="button" className="modal-close" onClick={() => setEditing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={onSave} className="modal-body">
                            <div className="form-row">
                                <label>Tên thương hiệu *</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Hủy</button>
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

export default AdminBrands;
