import { useState } from "react";
import Filter from "components/Filter/Filter";
import Items from "components/Items/Items";
import Ordenador from "components/Ordenador/Ordenador";
import Search from "components/Search/Search";

// Página do cardápio no estilo Aluroni: fundo claro, busca, pílulas de
// filtro, ordenador e cards empilhados. A categoria "Pratos" começa ativa.
export default function Menu({ products = [], loading = false, onAdd, onOpenDetails }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("pratos");
  const [ordenador, setOrdenador] = useState("");

  return (
    <section id="cardapio" className="bg-lightGray py-[50px]">
      <div className="w-full px-5 desktop_lg:mx-auto desktop_lg:max-w-7xl desktop_lg:px-0">
        <h2 className="mb-8 text-5xl text-dark font-italiana">Cardápio</h2>

        <Search search={search} setSearch={setSearch} />

        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <Filter value={category} onChange={setCategory} />
          <Ordenador value={ordenador} onChange={setOrdenador} />
        </div>

        <Items
          products={products}
          loading={loading}
          search={search}
          category={category}
          ordenador={ordenador}
          onAdd={onAdd}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </section>
  );
}
