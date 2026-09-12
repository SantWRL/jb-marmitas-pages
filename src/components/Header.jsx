// Hero da loja: fundo preto com a arte da logo JB Marmitas (sem foto de
// comida). O degradê/brilho vem do CSS (.header-banner), aqui entram o
// conteúdo e a imagem da logo.
export default function Header() {
  return (
    <header className="header-banner">
      <div className="hero-content">
        <img
          src="/assets/img/logo-jb-marmitas.jpeg"
          alt="Logo JB Marmitas"
          className="hero-logo"
        />
        <h1>A marmita mais recheada da região</h1>
        <p>Marmitas caseiras feitas no dia, entregues quentinhas em Balsas - MA.</p>
        <div className="hero-actions">
          <a className="hero-button hero-button-primary" href="#cardapio">
            Ver cardápio
          </a>
          <a
            className="hero-button hero-button-secondary"
            href="https://wa.me/5599999042932"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pedir no WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
