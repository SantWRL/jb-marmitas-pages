import { useNavigate } from "react-router-dom";
import { FoodProps } from "types/itemsMenu";
import itemsMenuData from "data/productsData.json";

export default function Home() {
  const navigate = useNavigate();
  let recommendedFood = [...itemsMenuData];
  recommendedFood = recommendedFood.sort(() => 0.5 - Math.random()).splice(0, 3);

  function handleFoodDetail(food) {
    navigate(`/prato/${food.id}`, { state: { food }, replace: true });
  }

  return (
    <section className="my-20 flex flex-col">
      <h2 className="mb-16 text-5xl text-dark font-italiana">Recomendações da cozinha</h2>
      <div className="mb-16 flex flex-wrap justify-between gap-8 rounded-sm">
        {recommendedFood.map((food) => (
          <div key={food.id} className="w-full desktop_md:w-auto">
            <div className="mb-3 overflow-hidden rounded-lg desktop_md:w-[300px]">
              <img
                src={food.image_url || "/assets/img/marmita-placeholder.svg"}
                alt={food.title}
                className="w-full rounded-lg duration-1000 ease-in-out hover:scale-125"
              />
            </div>
            <button
              onClick={() => handleFoodDetail(food)}
              className="w-full cursor-pointer rounded-md border-none bg-red py-3 text-xl font-bold text-white duration-500 ease-in-out hover:bg-redDark desktop_md:w-[300px]"
            >
              Ver mais
            </button>
          </div>
        ))}
      </div>
      <h2 className="mb-16 text-5xl text-dark font-italiana">Nossa casa</h2>
      <div className="relative mb-24 w-full desktop_md:mb-16">
        <img
          src="/assets/img/marmita-placeholder.svg"
          alt="Nossa casa"
          className="h-[300px] w-full rounded-md object-cover desktop_md:h-auto"
        />
        <address className="absolute bottom-0 left-1/2 inline-flex w-5/6 translate-y-[80%] -translate-x-1/2 justify-center rounded-md bg-dark px-7 py-5 text-center text-lg font-bold not-italic leading-10 text-white desktop_md:w-auto desktop_md:translate-y-1/2">
          Rua Exemplo, 123 - Centro<br />
          Balsas - MA
        </address>
      </div>
    </section>
  );
}
