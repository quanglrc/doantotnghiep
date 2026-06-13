import "dotenv/config";
import express from "express";
import cors from "cors";

import { authOptional } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { runMigrations } from "./config/migrations.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import productsRoutes from "./routes/products.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import vouchersRoutes from "./routes/vouchers.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(
    cors({
        origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
        credentials: true,
    })
);
app.use(express.json({ limit: "5mb" }));
app.use(authOptional);

app.get("/api/health", (_req, res) =>
    res.json({ ok: true, time: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/vouchers", vouchersRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payment", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
runMigrations()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`[viqitech] API running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("[viqitech] Migration thất bại, không thể start server:", err.message);
        process.exit(1);
    });
