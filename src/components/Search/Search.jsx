import { CgSearch } from "react-icons/cg";

// Campo de busca do cardápio, no estilo Aluroni.
export default function Search({ search, setSearch }) {
  return (
    <form
      className="flex w-full items-center justify-between gap-5 rounded-md bg-gray px-4 tablet:w-[400px]"
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        type="text"
        placeholder="Buscar"
        aria-label="Buscar no cardápio"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full border-none bg-gray py-3 text-xl font-bold text-dark outline-none placeholder:text-dark"
      />
      <CgSearch size={20} className="text-dark" />
    </form>
  );
}
