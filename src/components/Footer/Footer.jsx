import Wrapper from "../Wrapper";
import IconList from "./IconList";

export default function Footer({
  backgroundColor = "bg-red",
  textColor = "text-white",
  iconColor = "fill-white",
  hoverIconColor = "group-hover:desktop_lg:fill-dark",
}) {
  return (
    <footer className={`w-full text-base ${backgroundColor} ${textColor}`}>
      <Wrapper>
        <div className="flex flex-wrap items-center justify-center gap-5 py-7 desktop_lg:justify-between">
          <IconList iconColor={iconColor} hoverIconColor={hoverIconColor} />
          <p className="">
            Desenvolvido por{" "}
            <a
              className="font-bold"
              href="https://www.jbmarmitas.com"
              target="_blank"
              rel="noreferrer"
              title="JB Marmitas"
            >
              JB Marmitas
            </a>
            .
          </p>
        </div>
        {/* LGPD: aviso de privacidade sempre visível no rodapé. */}
        <p className="footer-legal">
          Seus dados são usados apenas para pedidos. Consulte a{" "}
          <a href="./privacidade.html">Política de Privacidade</a>.
        </p>
      </Wrapper>
    </footer>
  );
}
