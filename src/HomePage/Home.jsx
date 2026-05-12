import HeroBanner from "../components/HeroBanner";
import CategoryGrid from "../components/CategoryGrid";
import FlashSale from "../components/FlashSale";
import ProductSection from "../components/ProductSection";
import BrandStrip from "../components/BrandStrip";
import { useShop } from "../context/ShopContext";

const Home = () => {
    const { products, getProductsByCategory } = useShop();
    const flashItems = products
        .filter((p) => p.oldPrice && p.price < p.oldPrice)
        .slice(0, 5);

    return (
        <>
            <HeroBanner />
            <CategoryGrid />
            <FlashSale products={flashItems} />

            <ProductSection
                title="Điện thoại nổi bật"
                icon="fa-mobile-screen"
                products={getProductsByCategory("dien-thoai")}
                viewAllHref="/san-pham?cat=dien-thoai"
            />

            <ProductSection
                title="Laptop bán chạy"
                icon="fa-laptop"
                products={getProductsByCategory("laptop")}
                viewAllHref="/san-pham?cat=laptop"
            />

            <ProductSection
                title="Máy tính bảng"
                icon="fa-tablet-screen-button"
                products={getProductsByCategory("tablet")}
                viewAllHref="/san-pham?cat=tablet"
            />

            <ProductSection
                title="Phụ kiện công nghệ"
                icon="fa-headphones"
                products={getProductsByCategory("phu-kien")}
                viewAllHref="/san-pham?cat=phu-kien"
            />

            <BrandStrip />
        </>
    );
};

export default Home;
