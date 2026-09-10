// Ordenação do cardápio: dropdown no visual Aluroni (Radix Menubar).
import * as Menubar from "@radix-ui/react-menubar";
import clsx from "clsx";
import { useState } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

const OPTIONS = [
  { nome: "Menor preço", value: "menor-preco" },
  { nome: "Maior preço", value: "maior-preco" },
  { nome: "Nome (A-Z)", value: "nome" },
];

export default function Ordenador({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const label = OPTIONS.find((option) => option.value === value)?.nome ?? "Ordenar por";

  function handleOpen(event) {
    if (event.target.getAttribute("data-name") !== "TriggerBnt") {
      setOpen(!open);
    }
  }

  function handleSelect(nome, value) {
    onChange(value);
    setOpen(false);
  }

  return (
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger
          onClick={() => setOpen(!open)}
          data-name="TriggerBnt"
          aria-label="Ordenar cardápio"
          className={clsx(
            "my-5 flex min-w-[240px] items-center justify-between rounded-md bg-gray py-3 px-4 text-xl font-bold text-dark transition-all hover:cursor-pointer hover:bg-blue hover:text-white",
            {
              ["bg-blue text-white"]: open,
            }
          )}
        >
          {label}
          {open ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content
            align="start"
            sideOffset={5}
            alignOffset={-3}
            onPointerDownOutside={(event) => handleOpen(event)}
            onEscapeKeyDown={() => setOpen(!open)}
            className="mt-1 ml-1 flex min-w-[240px] flex-col gap-1 rounded-md bg-gray"
          >
            {OPTIONS.map((option) => (
              <Menubar.Item
                key={option.value}
                data-name=""
                onClick={(event) => handleOpen(event)}
                onSelect={() => handleSelect(option.nome, option.value)}
                className={clsx(
                  "flex min-h-[50px] cursor-pointer items-center rounded-md py-3 pl-6 text-xl font-bold text-dark transition-colors hover:bg-darkGray hover:text-white",
                  {
                    ["bg-blue text-white"]: value === option.value,
                  }
                )}
              >
                {option.nome}
              </Menubar.Item>
            ))}
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}
