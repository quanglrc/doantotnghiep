import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../HomePage/Navbar";
import Footer from "./Footer";
import ChatbotWidget from "./ChatbotWidget";

const Layout = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }, [pathname]);

    return (
        <div className="app-shell">
            <Navbar />
            <main className="app-main">
                <Outlet />
            </main>
            <Footer />
            <ChatbotWidget />
        </div>
    );
};

export default Layout;
