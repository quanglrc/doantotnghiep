import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const AdminUsers = () => {
    const { users, user: current, adminCreateUser, adminUpdateUser, adminToggleLock, adminDeleteUser } = useAuth();
    const toast = useToast();
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState(null);

    const list = useMemo(() => {
        if (!q.trim()) return users;
        const s = q.toLowerCase();
        return users.filter(
            (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
        );
    }, [users, q]);

    const openCreate = () =>
        setEditing({ id: null, name: "", email: "", phone: "", password: "", role: "customer" });
    const openEdit = (u) => setEditing({ ...u, password: "" });

    const onSave = (e) => {
        e.preventDefault();
        if (!editing.name.trim() || !editing.email.trim()) {
            toast.show("Vui lòng nhập tên và email.", "error");
            return;
        }
        if (editing.id) {
            const patch = {
                name: editing.name.trim(),
                email: editing.email.trim(),
                phone: editing.phone,
                role: editing.role,
            };
            if (editing.password) patch.password = editing.password;
            adminUpdateUser(editing.id, patch);
            toast.show("Đã cập nhật người dùng.", "success");
        } else {
            const r = adminCreateUser(editing);
            if (!r.ok) {
                toast.show(r.error, "error");
                return;
            }
            toast.show("Đã thêm người dùng.", "success");
        }
        setEditing(null);
    };

    const onToggleLock = (u) => {
        if (u.id === current.id) {
            toast.show("Không thể khóa chính mình.", "error");
            return;
        }
        adminToggleLock(u.id);
        toast.show(u.locked ? "Đã mở khóa." : "Đã khóa tài khoản.", "info");
    };

    const onDelete = (u) => {
        if (u.id === current.id) {
            toast.show("Không thể xóa chính mình.", "error");
            return;
        }
        if (u.id === "admin-root") {
            toast.show("Không thể xóa tài khoản admin gốc.", "error");
            return;
        }
        if (window.confirm(`Xóa người dùng "${u.name}"?`)) {
            adminDeleteUser(u.id);
            toast.show("Đã xóa người dùng.", "info");
        }
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý người dùng</h1>
                    <p>Tổng cộng {users.length} tài khoản</p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <i className="fa-solid fa-user-plus"></i> Thêm người dùng
                </button>
            </div>

            <div className="admin-card">
                <div className="admin-toolbar">
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Tìm theo tên / email..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr className="empty-row"><td colSpan={7}>Không có người dùng phù hợp</td></tr>
                        ) : (
                            list.map((u) => (
                                <tr key={u.id}>
                                    <td><strong>{u.name}</strong></td>
                                    <td>{u.email}</td>
                                    <td>{u.phone || <span className="muted">—</span>}</td>
                                    <td><span className={`role-badge ${u.role}`}>{u.role === "admin" ? "Admin" : "Khách"}</span></td>
                                    <td><span className={`lock-badge ${u.locked ? "locked" : "active"}`}>{u.locked ? "Khóa" : "Hoạt động"}</span></td>
                                    <td>{u.createdAt}</td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button type="button" className="icon-btn" onClick={() => openEdit(u)} title="Sửa">
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                onClick={() => onToggleLock(u)}
                                                title={u.locked ? "Mở khóa" : "Khóa"}
                                            >
                                                <i className={`fa-solid ${u.locked ? "fa-lock-open" : "fa-lock"}`}></i>
                                            </button>
                                            <button type="button" className="icon-btn danger" onClick={() => onDelete(u)} title="Xóa">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="modal-backdrop" onClick={() => setEditing(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-head">
                            <h3>{editing.id ? "Sửa người dùng" : "Thêm người dùng"}</h3>
                            <button type="button" className="modal-close" onClick={() => setEditing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={onSave} className="modal-body">
                            <div className="form-row">
                                <label>Họ và tên *</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={editing.email}
                                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={editing.phone || ""}
                                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Mật khẩu {editing.id && <span className="muted">(để trống để giữ nguyên)</span>}</label>
                                <input
                                    type="text"
                                    value={editing.password}
                                    onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Vai trò</label>
                                <select
                                    value={editing.role}
                                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                                >
                                    <option value="customer">Khách hàng</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
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

export default AdminUsers;
