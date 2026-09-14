// Página de Política de Privacidade (LGPD — Lei 13.709/2018).
// Estática de propósito: nada aqui consulta o Supabase, então a página
// funciona mesmo sem variáveis de ambiente e carrega instantâneo.
export default function PrivacyPolicy() {
  return (
    <main>
      <header className="privacy-header">
        <a className="hero-button hero-button-secondary" href="./index.html">
          ⬅ Voltar ao cardápio
        </a>
      </header>

      <article className="privacy-card">
        <span className="menu-heading-tag">Transparência</span>
        <h1>Política de Privacidade</h1>
        <p className="privacy-updated">Última atualização: 13 de setembro de 2026</p>

        <section className="privacy-section">
          <h2>1. Quem trata seus dados</h2>
          <p>
            <strong>JB Marmitas</strong> (Balsas - MA) é a responsável pelo tratamento dos
            dados pessoais coletados neste site, na condição de controladora, conforme a
            Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).
          </p>
          <p>
            Encarregado de dados (DPO): atendimento pelo WhatsApp{" "}
            <a href="https://wa.me/5599999042932" target="_blank" rel="noreferrer">
              (55) 99990-4293
            </a>{" "}
            ou pelo Instagram{" "}
            <a href="https://instagram.com/jbmarmitasdelivery" target="_blank" rel="noreferrer">
              @jbmarmitasdelivery
            </a>
            .
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li>
              <strong>Dados que você informa no pedido:</strong> nome, número de WhatsApp,
              endereço de entrega (rua, número, complemento, bairro e ponto de referência),
              itens do pedido e forma de pagamento indicada.
            </li>
            <li>
              <strong>Consentimento:</strong> a marcação do checkbox de autorização é
              registrada com data e hora junto ao pedido.
            </li>
          </ul>
          <p>
            Este site <strong>não usa cookies de rastreamento, anúncios ou criação de
            perfil</strong>. Nada do que você digita é usado para publicidade.
          </p>
        </section>

        <section className="privacy-section">
          <h2>3. Para que usamos e por quê (bases legais)</h2>
          <ul>
            <li>
              <strong>Receber, confirmar e entregar seu pedido</strong> — execução de
              contrato (art. 7º, V, da LGPD).
            </li>
            <li>
              <strong>Comunicar o pedido pelo WhatsApp</strong> — consentimento que você
              dá no checkout, registrado com data e hora (art. 7º, I, e art. 8º).
            </li>
            <li>
              <strong>Cumprir obrigações legais</strong>, quando aplicável (art. 7º, II) —
              por exemplo, emissão de comprovante fiscal.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Com quem seus dados são compartilhados</h2>
          <ul>
            <li>
              <strong>WhatsApp (Meta)</strong> — o resumo do pedido (nome, telefone,
              endereço e itens) é enviado para o WhatsApp da marmitaria para confirmação
              e entrega.
            </li>
            <li>
              <strong>Supabase</strong> — armazenamento seguro do pedido (banco de dados
              na infraestrutura do Supabase).
            </li>
            <li>
              <strong>Vercel</strong> — hospedagem do site (o acesso passa por servidores
              da Vercel).
            </li>
          </ul>
          <p>
            <strong>Não vendemos, alugamos ou cedemos seus dados</strong> a terceiros
            para qualquer outra finalidade.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Por quanto tempo guardamos</h2>
          <p>
            Os pedidos ficam guardados apenas pelo tempo necessário para atender à sua
            solicitação, resolver questões de entrega e cumprir obrigações legais. Você
            pode pedir a exclusão dos seus dados a qualquer momento pelo WhatsApp: o
            pedido correspondente é apagado do nosso banco de dados.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Seus direitos (art. 18 da LGPD)</h2>
          <p>A qualquer momento e de graça, você pode pedir pelo WhatsApp:</p>
          <ul>
            <li>confirmação de que tratamos seus dados e acesso a eles;</li>
            <li>correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>portabilidade dos seus dados;</li>
            <li>informação sobre com quem compartilhamos seus dados;</li>
            <li>revogação do consentimento (sem prejuízo dos pedidos já feitos).</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>7. Segurança</h2>
          <ul>
            <li>Todo o tráfego do site é criptografado (HTTPS).</li>
            <li>
              Os pedidos ficam em banco com regras de acesso (Row Level Security): só a
              administração, autenticada por senha, consegue ler ou gerenciar pedidos.
            </li>
            <li>
              Nenhum dado de cliente é exibido publicamente no site — somente o cardápio.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>8. Crianças e adolescentes</h2>
          <p>
            Este site não é direcionado a crianças e adolescentes. Pedidos feitos por
            menores devem ter ciência de um responsável; responsáveis podem solicitar a
            exclusão dos dados pelo WhatsApp.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Decisões automatizadas</h2>
          <p>
            Não tomamos decisões automatizadas com base nos seus dados e não criamos
            perfis comportamentais.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Mudanças nesta política</h2>
          <p>
            Se esta política mudar, a nova versão será publicada nesta página com a data
            de atualização. Mudanças relevantes no uso dos dados serão comunicadas antes
            de novo pedido.
          </p>
        </section>
      </article>
    </main>
  );
}
