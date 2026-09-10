import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DefaultPage from "components/DefaultPage";
import Home from "pages/home";
import Menu from "pages/menu";
import About from "pages/about";
import FoodDetail from "pages/foodDetail";
import PageNotFound from "pages/pageNotFound";

// Dados dinâmicos que serão injetados pelo Supabase
const CATEGORIES = [
  ["pratos", "Pratos"],
  ["porcoes", "Porções"],
  ["bebidas", "Bebidas"],
  ["sobremesas", "Sobremesas"],
  ["combos", "Combos"],
];

export default function AppRouter({ products = [], categories = CATEGORIES, sortOptions = SORT_OPTIONS }) {
  return (
    <main className="flex min-h-screen flex-col justify-between overflow-hidden bg-dark">
      <Router>
        <Routes>
          <Route path="/" element={<DefaultPage />}>
            <Route index element={<Home />} />
            <Route
              path="cardapio"
              element={
                <Menu
                  categories={categories}
                  sortOptions={sortOptions}
                  products={products}
                />
              }
            />
            <Route path="sobre" element={<About />} />
          </Route>
          <Route path="prato/:id/*" element={<FoodDetail />} />
          <Route path="404" element={<PageNotFound />} />
          <Route path="*" element={<Navigate to="404" />} />
        </Routes>
      </Router>
    </main>
  );
}
