export const notFound = (req, res) =>
    res.status(404).json({ error: `Không tìm thấy: ${req.method} ${req.path}` });

export const errorHandler = (err, _req, res, _next) => {
    console.error("[ERROR]", err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || "Lỗi máy chủ",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export const asyncH = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
