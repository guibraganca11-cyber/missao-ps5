# Ativar a base Google da Missão Bentinho

A planilha já foi criada e o script já contém o identificador dela. Você não precisa criar banco, tabelas, contas para cada pessoa ou preencher código com IDs.

Planilha: https://docs.google.com/spreadsheets/d/1XRHyBTS8dvAz45pP6iq7zOkhxpa-ataLUGtw4RW5zHI/edit

Aplicativo (mesmo endereço): https://guibraganca11-cyber.github.io/missao-ps5/

## 1. Colar o único arquivo de código

No computador, abra a planilha acima. Entre em **Extensões → Apps Script**.

No arquivo inicial `Código.gs` ou `Code.gs`, substitua somente o exemplo inicial pelo conteúdo completo do arquivo `Code.gs` fornecido junto deste guia. Não acrescente crases ou os marcadores de Markdown. Salve. Pode nomear o projeto como “Missão Bentinho”.

O script deve ficar vinculado a essa planilha; não crie um projeto separado. O identificador da planilha e o endereço do aplicativo já estão preenchidos.

## 2. Escolher o PIN uma única vez

Volte à planilha e recarregue a página. Aparecerá o menu **Missão Bentinho**. Se ele não aparecer, no editor selecione `onOpen`, clique em Executar e volte à planilha.

No menu, escolha **1. Ativar família**. O Google pode pedir sua autorização para o script acessar planilhas da sua conta. Confira que o projeto é o que você acabou de criar, na sua própria conta. Ele não solicita acesso a e-mail, contatos nem pagamentos. Se as permissões forem diferentes, pare e peça ajuda.

Escolha um PIN de 6 a 12 dígitos para a área do pai. Guarde-o. O código familiar será gerado automaticamente, separado do PIN. Ativar de novo não apaga nem reinicia os dados.

## 3. Publicar a conexão

No editor Apps Script: **Implantar → Nova implantação → tipo Aplicativo da Web**.

- Executar como: **você, dono da planilha**.
- Quem pode acessar: **Qualquer pessoa** (inclusive sem login Google).

Confirme a implantação e a autorização do seu próprio projeto quando solicitado. Essa opção libera a ponte de conexão, não a planilha: todas as leituras e gravações exigem o código familiar longo gerado no passo anterior. Dinheiro e configurações exigem também o PIN. Não use “qualquer pessoa com conta Google”, pois o app usa uma conexão incorporada sem tela de login Google.

Se sua conta não oferecer “Qualquer pessoa”, pode haver uma restrição da conta. Não mude políticas da organização; peça ajuda.

A planilha continua privada no Drive. Não publique a planilha na Web nem habilite edição para qualquer pessoa com o link.

## 4. Conectar os celulares

Volte à planilha. Abra **Missão Bentinho → 2. Ver conexão dos celulares**. O endereço do serviço e o código familiar estarão prontos para copiar.

No aplicativo, toque em **Neste aparelho · conectar família pelo Google**. Cole o endereço do serviço (termina em `/exec`) e o código familiar. Toque em **Entrar na família**. Não é senha da sua conta Google.

No primeiro celular, confira os dados locais e use **Iniciar família com estes dados**, informando seu novo PIN. Isso envia uma única vez os registros desse aparelho. No segundo celular, use os mesmos endereço e código: ele carregará a base compartilhada, sem somar saldos nem enviar dados antigos.

Compartilhe o código somente com a família. Quem tiver esse código consegue ler os registros e marcar tarefas. Ele fica guardado no navegador conectado; use aparelhos de confiança. O PIN dá acesso à área do pai para os responsáveis que o conhecem.

## Conferência final

Marque uma etapa no primeiro aparelho e espere **salvo online**. No outro, toque em **Atualizar agora**, ou aguarde cerca de 15 segundos com a tela aberta. Confira que a etapa apareceu. Desfaça e confira novamente.

O teste no Google real ainda precisa ser feito depois da implantação: os testes locais passaram, mas simulam os serviços Google e não substituem essa conferência. Se não conectar, envie a mensagem de erro e o endereço público `/exec`; não envie seu código familiar, PIN ou senha Google.

## Depois de ativar

- Tarefas, extras, bônus e saldos continuam sendo editados pela área do pai no app.
- As abas Resumo, Rotina, Marcações e Dinheiro são consultas automáticas. Não precisam de preenchimento manual; alterações feitas nelas serão substituídas pela próxima atualização do app.
- Os parâmetros 4.000 / 10 / 80% e as seis tarefas foram pré-preenchidos a partir dos padrões do app. Os saldos e as marcações reais virão do primeiro celular. Não inventamos o que já foi realizado.
- Extras pendentes e planos futuros também são preservados na base técnica, mesmo quando não aparecem nas quatro consultas.
- A aba técnica oculta `_Estado` mantém as versões gravadas. Não exclua, edite nem ordene essa aba. Ocultar não é uma barreira de segurança: quem tiver permissão de editar a planilha pode acessá-la.
- Se o app disser que a consulta da planilha está pendente, use **Atualizar consultas** no menu. Os dados confirmados da base continuam preservados.
- Aguarde a confirmação de cada toque. Sem internet, uma alteração fica pendente; novas alterações ficam bloqueadas até o envio. Não limpe os dados do navegador com operações pendentes.
- Se dois aparelhos editarem dinheiro ao mesmo tempo, a segunda alteração exigirá revisão; ela não substitui automaticamente o saldo mais recente.
- Use uma aba ativa por aparelho. Sair da família preserva a cópia local; alterações feitas deslogado não entram automaticamente na base quando reconectar.
- Esta solução é para uso familiar pequeno. Há limites e disponibilidade do Apps Script; não é um serviço financeiro nem oferece garantia de disponibilidade. O histórico de versões na mesma planilha não é um backup externo. Não apague a planilha.

## Para manutenção

O front-end continua no GitHub Pages. `google-transport.js` usa uma ponte Apps Script com origem autorizada, canal aleatório e mensagens verificadas; não usa JSONP nem coloca códigos ou PIN em URLs. `cloud.js` mantém fila local, controle de revisão e reenvio com o mesmo identificador.

O único arquivo a colar no Google é `google/Code.gs`. As funções privadas terminam em `_` e não podem ser chamadas remotamente pelo navegador. A função pública `mission` exige o código familiar antes de acessar a base. Gravações usam LockService, revisão e identificador de operação; o PIN tem limite de cinco erros em cinco minutos. O PIN é guardado como hash com sal, e o código familiar fica nas propriedades do script, não nas células.

Se atualizar o código depois: salve, abra **Implantar → Gerenciar implantações**, edite a implantação existente e selecione **Nova versão**. Assim, o endereço `/exec` permanece o mesmo.

Testes: `npm test` e `npm run test:browser`. O teste Google executa o arquivo real `Code.gs` em uma simulação de planilhas/propriedades/locks e usa dois navegadores Edge com uma ponte de frames aninhados simulada. Publicação, autorizações, cotas e comportamento do serviço Google real ainda dependem da conferência final acima.

Documentação oficial: https://developers.google.com/apps-script/guides/web
https://developers.google.com/apps-script/guides/html/communication
https://developers.google.com/apps-script/guides/services/quotas
