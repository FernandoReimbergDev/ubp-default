// export const dynamic = 'force-dynamic' // deletar isso depois, somente aprendizado
//COMPONENTES
import { Container } from "../../components/Container";
import { GridProducts } from "../../components/GridProducts";
import { TitleSection } from "../../components/TitleSection";

import { ShoppingBag } from "lucide-react";

export default function Search() {
  return (
    <div className="bg-body-bg pb-1 pt-16 min-h-[90vh]">
      <Container>
        <TitleSection text="Resultado da busca" icon={<ShoppingBag size={24} className="text-green-600" />} />
        <GridProducts />
      </Container>
    </div>
  );
}
