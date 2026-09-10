import clsx from "clsx";
import { CATEGORY_LABELS, PLACEHOLDER_IMAGE } from "../../lib/categories.js";
import { formatPrice, getEffectivePrice } from "../../lib/format.js";

// Cor da pílula de categoria, no padrão de cores do Aluroni.
const PILL_BY_CATEGORY = {
  pratos: "bg-red text-white",
  porcoes: "bg-carnes text-white",
  bebidas: "bg-blue text-white",
  sobremesas: "bg-veganos text-white",
  combos: "bg-combos text-dark",
};

// Card de item do cardápio, no estilo Aluroni: foto à esquerda, informações
// à direita, pílula de categoria, preço em destaque e botão Pedir.
export default function Item({ item, onAdd, onOpenDetails }) {
  const promo = Number(item.promo_price) > 0 && Number(item.promo_price) < Number(item.price);
  const effective = getEffectivePrice(item);

  return (
    <div
      className={clsx(
        "flex flex-wrap overflow-hidden rounded-lg bg-white shadow-2xl transition-colors desktop_md:px-6 desktop_md:py-6 desktop_md:hover:bg-gray",
        {
          ["opacity-60"]: item.out_of_stock,
        }
      )}
    >
      <button
        type="button"
        className="product-open w-full overflow-hidden rounded-t-lg shadow-2xl tablet:max-h-[400px] desktop_md:w-auto desktop_md:min-w-[240px] desktop_md:rounded-lg"
        aria-label={`Ver detalhes de ${item.name}`}
        onClick={() => onOpenDetails(item)}
      >
        <img
          className="w-full rounded-t-lg object-cover duration-1000 ease-in-out hover:scale-125 tablet:max-h-[400px] desktop_md:rounded-lg"
          src={item.image_url || PLACEHOLDER_IMAGE}
          alt={item.name}
          loading="lazy"
        />
        {Boolean(item.best_seller) && <span className="tag-best">MAIS PEDIDO</span>}
      </button>

      <div className="mt-5 flex w-full flex-col px-5 pb-6 desktop_md:mt-0 desktop_md:w-auto desktop_md:flex-1 desktop_md:py-0 desktop_md:pl-8">
        <h3 className="mb-4 text-[2rem] font-bold text-dark">{item.name}</h3>
        <p className="mb-5 font-josefinSans text-lg font-semibold text-darkGray">
          {item.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 desktop_md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={clsx(
                "flex h-10 items-center justify-center rounded-sm px-8 py-3 font-bold shadow-2xl",
                PILL_BY_CATEGORY[item.category] || "bg-dark text-white"
              )}
            >
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
            {item.out_of_stock && <span className="tag-esgotado">ESGOTADO</span>}
            {promo && <span className="tag-promo">PROMO</span>}
            {promo && (
              <s className="font-josefinSans text-lg text-darkGray">{formatPrice(item.price)}</s>
            )}
            <span className="text-[1.7rem] font-bold text-red">{formatPrice(effective)}</span>
          </div>

          <button
            type="button"
            className="rounded-md bg-red px-6 py-3 font-bold text-white transition-colors hover:bg-redDark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={item.out_of_stock}
            onClick={() => onAdd(item)}
          >
            Pedir
          </button>
        </div>
      </div>
    </div>
  );
}
