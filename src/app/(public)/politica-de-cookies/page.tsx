"use client";
import { PublicHeader } from "@/app/components/PublicHeader";
import Link from "next/link";
export default function politicaDeCookies() {
  return (
    <div className="w-screen">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <main className="flex flex-col items-start pt-8 px-4 w-full max-w-[90%] xl:max-w-screen-xl text-left leading-8 text-base mt-16">
          <h1 className="text-2xl">Política de Cookies</h1>
          <p className="mt-8">
            A presente Política de Cookies é um documento complementar à Política de Privacidade da Unity Brindes,
            disponível neste link. Aqui, você encontrará informações objetivas e claras sobre o que são Cookies, quais
            Cookies utilizamos em nossas aplicações, qual papel desempenham e como configurá-los.
          </p>
          <p className="mt-6">1. O que são Cookies?</p>
          <p className="mt-6">
            Cookies são pequenos arquivos de texto ou fragmentos de informação que são baixados em seu computador,
            smartphone ou qualquer outro dispositivo com acesso à internet quando você visita nossa aplicação.
          </p>
          <p className="mt-6">
            Eles contêm informações sobre a sua navegação em nossas páginas e retêm apenas informações relacionadas às
            suas preferências.
          </p>
          <p className="mt-6">
            Assim, essa página consegue armazenar e recuperar os dados sobre os seus hábitos de navegação, de forma a
            melhorar a experiência de uso.
          </p>
          <p className="mt-6">
            É importante frisar que eles não contêm informações pessoais específicas, como dados sensíveis ou bancários.
          </p>
          <p className="mt-6">
            O seu navegador armazena os cookies no disco rígido, mas ocupam um espaço de memória mínimo, que não afetam
            o desempenho do seu computador. A maioria das informações são apagadas logo ao encerrar a sessão, como você
            verá no próximo tópico.
          </p>
          <p className="mt-6">1.1. Tipos de Cookies</p>
          <p className="mt-6">Os cookies, quanto a seus proprietários, podem ser:</p>
          <ul className="mt-4 pl-8 flex flex-col gap-4">
            <li>
              1. <span className="font-plutoSans mr-2">Cookies proprietários:</span> são cookies definidos por nós ou
              por terceiros em nosso nome
            </li>
            <li>
              2. <span className="font-plutoSans mr-2">Cookies de terceiros:</span> são cookies definidos por terceiros
              confiáveis em nossa aplicação
            </li>
          </ul>
          <p className="mt-6">Os cookies, quanto ao seu tempo de vida, podem ser:</p>
          <ul className="mt-4 pl-8 flex flex-col gap-4">
            <li>
              1. <span className="font-plutoSans mr-2">Cookies de sessão ou temporários:</span> são cookies que expiram
              assim que você fecha o seu navegador, encerrando a sessão.
            </li>
            <li>
              2. <span className="font-plutoSans mr-2">Cookies persistentes ou permanentes:</span>
              são cookies que permanecem no seu dispositivo durante um período determinado ou até que você os exclua.
            </li>
            <li>
              <span className="font-plutoSans mr-2"></span>
            </li>
          </ul>
          <p className="mt-6">Os cookies, quanto a sua finalidade, podem ser:</p>
          <ul className="mt-4 pl-8 flex flex-col gap-4">
            <li>
              1. <span className="font-plutoSans mr-2">Cookies necessários:</span> são cookies essenciais que
              possibilitam a navegação em nossas aplicações e o acesso a todos os recursos; se estes, nossos serviços
              podem apresentar mal desempenho ou não funcionar.
            </li>
            <li>
              2. <span className="font-plutoSans mr-2">Cookies de desempenho:</span>
              são cookies que otimizam a forma que nossas aplicações funcionam, coletando informações anônimas sobre as
              páginas acessadas.
            </li>
            <li>
              3.
              <span className="font-plutoSans mr-2">Cookies de funcionalidade:</span>
              são cookies que memorizam suas preferências e escolhas (como seu nome de usuário)
            </li>
            <li>
              4.
              <span className="font-plutoSans mr-2">Cookies de publicidade:</span>
              são cookies que direcionam anúncios em função dos seus interesses e limitam a quantidade de vezes que o
              anúncio aparece.
            </li>
          </ul>

          <p className="mt-6">2. Por que usamos Cookies?</p>
          <p className="mt-6">
            A Unity Brindes utiliza Cookies para fornecer a melhor experiência de uso, tornando nossas aplicações mais
            fáceis e personalizadas, tendo por base suas escolhas e comportamento de navegação.
          </p>
          <p className="mt-6">
            Assim, buscamos entender como você utiliza nossas aplicações e ajustar o conteúdo para torná-lo mais
            relevante para você, além de lembrar de suas preferências.
          </p>
          <p className="mt-6">
            Os Cookies participam deste processo porquanto armazenam, leem e executam os dados necessários para cumprir
            com o nosso objetivo.
          </p>
          <p className="mt-6">3. Que tipo de Cookies utilizamos?</p>
          <p className="mt-6">
            Abaixo listamos todos os Cookies que podem ser utilizados pela Unity Brindes. É importante lembrar que você
            pode gerenciar a permissão concedida para cada Cookie em seu navegador.
          </p>
          <p className="mt-6">
            Além disso, uma vez que os Cookies capturam dados sobre você, aconselhamos a leitura de nossa Política de
            Privacidade, disponível neste link.
          </p>
          <p className="mt-6">3.1. Cookies necessários</p>
          <table className="mt-6 w-full">
            <thead>
              <tr className="border-y-2 font-semibold font-plutoSans">
                <th>Cookie</th>
                <th>Tempo</th>
                <th>Propriedade</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>token</td>
                <td>Temporário</td>
                <td>Proprietário</td>
                <td>Cookie de sessão</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-6">4. Gerenciamento dos Cookies</p>
          <p className="mt-6">
            A instalação dos cookies está sujeita ao seu consentimento. Apesar da maioria dos navegadores estar
            inicialmente configurada para aceitar cookies de forma automática, você pode rever suas permissões a
            qualquer tempo, de forma a bloqueá-los, aceitá-los ou ativar notificações para quando alguns cookies forem
            enviados ao seu dispositivo.
          </p>
          <p className="mt-6">
            Atualmente, na primeira vez que você acessa nossas aplicações, será requerida a sua concordância com a
            instalação destes. Apenas após a sua aceitação eles serão ativados.
          </p>
          <p className="mt-6">
            Para tanto, utilizamos um sistema de (banner de informações ou outro mecanismo que alerta e solicita o
            consentimento) na página inicial de Unity Brindes. Dessa maneira, não apenas solicitamos sua concordância,
            mas também informamos que a navegação continuada em nossos sites será entendida como consentimento.
          </p>
          <p className="mt-6">
            Como já dito, você pode, a qualquer tempo e sem nenhum custo, alterar as permissões, bloquear ou recusar os
            Cookies. Você também pode configurá-los caso a caso. Todavia, a revogação do consentimento de determinados
            Cookies pode inviabilizar o funcionamento correto de alguns recursos da plataforma.
          </p>
          <p className="mt-6">
            Para gerenciar os cookies do seu navegador, basta fazê-lo diretamente nas configurações do navegador, na
            área de gestão de Cookies.
          </p>
          <p className="mt-6">Você pode acessar tutoriais sobre o tema diretamente nos links abaixo:</p>
          <div className="mt-4 pl-8 flex flex-col gap-4 text-blue-500">
            <Link
              className="hover:underline"
              href={
                "https://support.microsoft.com/pt-br/windows/excluir-e-gerenciar-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
              }
            >
              Se você usa o Internet Explorer.
            </Link>
            <Link
              className="hover:underline"
              href={"https://support.mozilla.org/pt-BR/kb/gerencie-configuracoes-de-armazenamento-local-de-s"}
            >
              Se você usa o Firefox.
            </Link>
            <Link className="hover:underline" href={"https://support.apple.com/pt-br/guide/safari/sfri11471/mac"}>
              Se você usa o Safari.
            </Link>
            <Link
              className="hover:underline"
              href={"https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DDesktop&oco=1&hl=pt-BR"}
            >
              Se você usa o Google Chrome.
            </Link>
            <Link
              className="hover:underline"
              href={"https://support.microsoft.com/pt-br/help/4027947/microsoft-edge-delete-cookies"}
            >
              Se você usa o Microsoft Edge.
            </Link>
            <Link className="hover:underline" href={"https://help.opera.com/en/latest/web-preferences/#cookies"}>
              Se você usa o Opera.
            </Link>
          </div>
          <p className="mt-6">5. Disposições finais</p>
          <p className="mt-6">
            Para a Unity Brindes, a privacidade e confiança são fundamentais para a nossa relação com você. Estamos
            sempre nos atualizando para manter os mais altos padrões de segurança.
          </p>
          <p className="mt-6">
            Assim, reservamo-nos o direito de alterar esta Política de Cookies a qualquer tempo. A(s) mudança(s)
            entra(m/rão) em vigor logo após a publicação, e você será avisado.
          </p>
          <p className="mt-6">
            Ao continuar a navegação nas nossas aplicações após essa(s) mudança(s) se tornar(em) eficaz(es), você
            concorda com ela(s). Aconselhamos que você sempre verifique esta Política, bem como a nossa Política de
            Privacidade.
          </p>
          <p className="mt-6">
            Em caso de dúvidas sobre esta Política de Cookies, entre em contato conosco pelos seguintes meios:
          </p>
          <p className="mt-6">Fone: (11) 2039-1713</p>
          <p className="mt-6">Email: comercial@unitybrindes.com.br</p>
          <p className="my-6">Esta Política de Cookies foi atualizada pela última vez: 23-07-2021</p>
        </main>
      </div>
    </div>
  );
}
