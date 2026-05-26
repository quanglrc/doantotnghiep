import { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";

const iconChoices = [
    "fa-mobile-screen", "fa-laptop", "fa-tablet-screen-button", "fa-headphones",
    "fa-tv", "fa-camera", "fa-keyboard", "fa-computer-mouse", "fa-gamepad",
    "fa-clock", "fa-battery-full", "fa-tag",
];

const AdminCategories = () => {
    const { categories, products, addCategory, updateCategory, deleteCategory } = useShop();
    const toast = useToast();
    const [editing, setEditing] = useState(null);

    const openCreate = () => setEditing({ id: null, name: "", icon: "fa-tag" });
    const openEdit = (c) => setEditing({ ...c });

    const onSave = (e) => {
        e.preventDefault();
        if (!editing.name.trim()) {
            toast.show("Vui lòng nhập tên danh mục.", "error");
            return;
        }
        if (editing.id) {
            updateCategory(editing.id, { name: editing.name.trim(), icon: editing.icon });
            toast.show("Đã cập nhật danh mục.", "success");
        } else {
            const slug = editing.name.toLowerCase()
                .normalize("NFD").replace(/[̀-ͯ]/g, "")
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            addCategory({ id: slug || `cat-${Date.now()}`, name: editing.name.trim(), icon: editing.icon });
            toast.show("Đã thêm danh mục.", "success");
        }
        setEditing(null);
    };

    const onDelete = (c) => {
        const used = products.filter((p) => p.category === c.id).length;
        if (used > 0) {
            if (!window.confirm(`Có ${used} sản phẩm thuộc danh mục "${c.name}". Vẫn xóa?`)) return;
        } else if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return;
        deleteCategory(c.id);
        toast.show("Đã xóa danh mục.", "info");
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý danh mục</h1>
                    <p>Tổng cộng {categories.length} danh mục</p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <i className="fa-solid fa-plus"></i> Thêm danh mục
                </button>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Tên danh mục</th>
                            <th>Mã (ID)</th>
                            <th>Số sản phẩm</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr className="empty-row"><td colSpan={5}>Chưa có danh mục nào</td></tr>
                        ) : (
                            categories.map((c) => {
                                const count = products.filter((p) => p.category === c.id).length;
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <div className="cat-icon" style={{ width: 40, height: 40, fontSize: 16 }}>
                                                <i className={`fa-solid ${c.icon || "fa-tag"}`}></i>
                                            </div>
                                        </td>
                                        <td><strong>{c.name}</strong></td>
                                        <td><code className="muted">{c.id}</code></td>
                                        <td>{count}</td>
                                        <td>
                                            <div className="tbl-actions">
                                                <button type="button" className="icon-btn" onClick={() => openEdit(c)}>
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button type="button" className="icon-btn danger" onClick={() => onDelete(c)}>
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
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-head">
                            <h3>{editing.id ? "Sửa danh mục" : "Thêm danh mục"}</h3>
                            <button type="button" className="modal-close" onClick={() => setEditing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={onSave} className="modal-body">
                            <div className="form-row">
                                <label>Tên danh mục *</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Icon</label>
                                <div className="icon-picker">
                                    {iconChoices.map((ic) => (
                                        <button
                                            type="button"
                                            key={ic}
                                            className={editing.icon === ic ? "active" : ""}
                                            onClick={() => setEditing({ ...editing, icon: ic })}
                                        >
                                            <i className={`fa-solid ${ic}`}></i>
                                        </button>
                                    ))}
                                </div>
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

export default AdminCategories;
