import casa from "assets/img/marmita-placeholder.svg";
import massa1 from "assets/img/marmita-placeholder.svg";
import massa2 from "assets/img/marmita-placeholder.svg";

const images = [massa1, massa2];

export default function About() {
  return (
    <section className="my-20 flex flex-col">
      <h2 className="mb-16 text-5xl text-dark font-italiana">Sobre</h2>
      <div className="mb-5 flex flex-col gap-5 desktop_md:mb-16 desktop_md:flex-row">
        <img src={casa} alt="Nossa casa" />
        <div className="flex flex-col justify-center gap-5 py-5 font-josefinSans text-2xl tracking-normal text-white">
          <p>
            Nós do JB Marmitas oferecemos a vocês, nossos queridos clientes, a comida
            caseira mais saborosa e tradicional de Balsas! Prezamos pelos ingredientes
            frescos e de excelente qualidade para que sua experiência seja ainda mais
            intensa!
          </p>
          <p>
            Também possuímos um cardápio variado com muitas opções de acordo com o seu
            gosto!
          </p>
          <p>
            Para acompanhar nossas marmitas, a JB Marmitas possui uma seleção especial
            de bebidas, que harmonizam perfeitamente com o seu refeição.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-5">
        {images.map((img, i) => (
          <div key={i} className="w-full desktop_md:w-[600px]">
            <img src={img} alt="Imagem de comida" className="w-full rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}
