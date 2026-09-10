import { useEffect, useState } from "react";
import { getEffectivePrice } from "../../lib/format.js";
import Item from "./Item";

// Lista de itens com busca, filtro por categoria e ordenação
// (preços consideram o valor promocional).
export default function Items({ products = [], loading = false, search, category, ordenador, onAdd, onOpenDetails }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    const text = search.trim().toLowerCase();

    const filtered = products.filter((item) => {
      const matchesSearch =
        !text ||
        `${item.name} ${item.description}`.toLowerCase().includes(text);
      const matchesCategory = !category || item.category === category;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered];
    if (ordenador === "menor-preco") {
      sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (ordenador === "maior-preco") {
      sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (ordenador === "nome") {
      sorted.sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
    }

    setList(sorted);
  }, [products, search, category, ordenador]);

  if (loading) {
    return <p className="menu-empty">Carregando o cardápio...</p>;
  }

  return (
    <div className="flex w-full flex-col flex-wrap gap-10">
      {list.length === 0 ? (
        <p className="menu-empty">
          {search ? "Nada encontrado para essa busca." : "Nenhum item nesta categoria ainda."}
        </p>
      ) : (
        list.map((item) => (
          <Item
            key={item.id}
            item={item}
            onAdd={onAdd}
            onOpenDetails={onOpenDetails}
          />
        ))
      )}
    </div>
  );
}
