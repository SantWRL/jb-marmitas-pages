import clsx from "clsx";
import { CATEGORIES } from "../../lib/categories.js";

// Filtro por categorias, pílulas no estilo Aluroni.
export default function Filter({ value, onChange }) {
  function handleSelectCategory(id) {
    return onChange(id);
  }

  return (
    <div className="my-5 flex flex-wrap gap-6">
      {CATEGORIES.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => handleSelectCategory(id)}
          className={clsx(
            "flex w-[150px] items-center justify-center rounded-md border-none bg-gray py-3 text-xl font-bold text-dark transition-colors hover:cursor-pointer hover:bg-blue hover:text-white",
            {
              ["bg-blue text-white"]: value === id,
            }
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
