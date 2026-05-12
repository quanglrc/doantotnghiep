import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import "../styles/Modal.css";

const ReviewModal = ({ order, onClose }) => {
    const { user } = useAuth();
    const { addReview } = useOrders();
    const toast = useToast();
    const [productId, setProductId] = useState(order.items[0]?.id);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const submit = (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.show("Vui lòng nhập nội dung đánh giá.", "error");
            return;
        }
        addReview({
            productId,
            userId: user.id,
            userName: user.name,
            rating,
            comment: comment.trim(),
        });
        toast.show("Cảm ơn bạn đã đánh giá!", "success");
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>Đánh giá sản phẩm</h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={submit} className="modal-body">
                    <div className="form-row">
                        <label>Chọn sản phẩm</label>
                        <select value={productId} onChange={(e) => setProductId(Number(e.target.value) || e.target.value)}>
                            {order.items.map((it) => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Đánh giá</label>
                        <div className="rating-input">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    type="button"
                                    key={n}
                                    onClick={() => setRating(n)}
                                    className={n <= rating ? "active" : ""}
                                    aria-label={`${n} sao`}
                                >
                                    <i className="fa-solid fa-star"></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <label>Nhận xét</label>
                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                        />
                    </div>

                    <div className="modal-foot">
                        <button type="button" className="btn-outline" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-primary">
                            <i className="fa-solid fa-paper-plane"></i> Gửi đánh giá
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
