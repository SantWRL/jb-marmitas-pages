import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import Wrapper from "./Wrapper";

export default function MenuNav({ onAuthClick }) {
  const location = useLocation().pathname;
  const routes = [
    { label: "Início", to: "/" },
    { label: "Cardápio", to: "/cardapio" },
    { label: "Sobre", to: "/sobre" },
  ];

  return (
    <Wrapper>
      <NavigationMenu.Root className="flex flex-col gap-5 py-5 tablet:flex-row tablet:gap-16">
        <h2 className="text-3xl font-italiana text-dark">JB Marmitas</h2>
        <NavigationMenu.List className="flex h-24 items-center justify-around tablet:h-full tablet:justify-center">
          {routes.map((rota, index) => (
            <NavigationMenu.Item key={index} className="h-full list-none px-5">
              <NavLink
                to={rota.to}
                className="group relative flex h-full cursor-pointer items-center justify-center text-2xl font-semibold text-dark no-underline duration-300 ease-in-out desktop_md:hover:text-darkGray"
              >
                {rota.label}
                <span
                  className={clsx(
                    "duration-300 ease-in-out",
                    {
                      ["absolute bottom-5 h-1 w-[calc(100%_-_30%)] rounded-3xl bg-red tablet:bottom-1 group-hover:desktop_lg:bg-dark"]:
                        location === rota.to,
                    }
                  )}
                />
              </NavLink>
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>
        {onAuthClick && (
          <button
            type="button"
            onClick={onAuthClick}
            className="tablet:ml-auto self-start rounded-sm border border-darkGray px-4 py-2 text-xs font-bold uppercase tracking-wide text-dark transition-colors hover:cursor-pointer hover:border-red hover:text-red tablet:self-center"
          >
            Entrar / cadastrar
          </button>
        )}
      </NavigationMenu.Root>
    </Wrapper>
  );
}
