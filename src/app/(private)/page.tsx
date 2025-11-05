// export const dynamic = 'force-dynamic' // deletar isso depois, somente aprendizado
//COMPONENTES
import { Banner } from "../components/Banner";
import { Categories } from "../components/Categories";
import { Container } from "../components/Container";
import { GridProducts } from "../components/GridProducts";
import { Slider } from "../components/Slider";
import { TitleSection } from "../components/TitleSection";

//DATA
import { categorias } from "../../../data/categoriasLoja";

//ICONES
import { Filter, ShoppingBag } from "lucide-react";

//ASSETS
const Logo = "../assets/logo-header.png";

export default function Search() {
  return (
    <div className="bg-body-bg pb-1">
      <Slider />

      <Container>
        <TitleSection
          text="Busque por Categoria"
          icon={<Filter size={28} className="text-green-600" fill="currentColor" stroke="none" />}
        />
        <div className="Categorias grid grid-cols-3 lg:grid-cols-6 gap-4">
          {categorias.map((categoria) => {
            const IconComponent = categoria.icone;
            return (
              <Categories
                key={categoria.id}
                text={categoria.text}
                icon={<IconComponent size={32} />}
              // href={categoria.url}
              />
            );
          })}
        </div>
      </Container>

      <Container>
        <TitleSection text="Explore os Produtos" icon={<ShoppingBag size={24} className="text-green-600" />} />
        <GridProducts />
      </Container>
      <Container>
        <Banner imgSrc={Logo} alt="Logotipo da empresa" />
      </Container>
    </div>
  );
}
