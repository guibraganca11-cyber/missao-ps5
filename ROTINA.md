# Rotina diária e fechamento semanal

## Para a criança

A tela inicial destaca uma missão com o botão “Fiz!”, o progresso do dia e um caminho de sete dias. Escolha qualquer desafio tocando no título do card. As etapas permitem marcar e desfazer; completar o dia mostra uma celebração sem gerar dinheiro adicional. Datas futuras continuam bloqueadas. Extras aparecem como desafios especiais e continuam sujeitos à aprovação do pai.

“Minha conquista” reúne saldo, potes, simulador e troféus. O simulador da criança não desconta valores: ela conversa com o pai para registrar a decisão.

As missões de hoje aparecem na página inicial. Toque em cada ocorrência (1, 2, 3) para marcar ou desfazer. “Ver dias da semana e extras” permite revisar os dias passados da semana e enviar realizações extras ao pai. Datas futuras e semanas pagas ficam bloqueadas.

## Para o pai

Abra Pai e use o PIN já configurado (padrão 2026).

- Semana: escolha uma semana, confira totais por tarefa e expanda os dias para corrigir marcações. A partir de domingo, aprove a recompensa se a meta foi atingida. Cada semana só pode ser paga uma vez.
- Rotina: adicione, retire ou edite tarefas, vezes por dia e dias da semana. Ajuste a porcentagem mínima e a recompensa. Mudanças valem na próxima segunda; uma semana ainda sem marcações nem pagamento pode receber a configuração imediatamente usando a opção explícita.
- Extras: cadastre nome e valor por realização, pause ou reative tarefas. Cada marcação da criança gera uma realização pendente, que o pai pode aprovar e pagar ou não aprovar. O valor é congelado no registro e não entra no percentual da rotina.
- Ajustes: meta do PS5, recompensa das próximas semanas, bônus avulso com motivo e cópia de segurança JSON.
- Histórico: entradas, bônus, extras e recompensas semanais.
- Dinheiro: registre presentes e outros valores recebidos, dividindo entre os potes. Para conferir o caixa, informe o saldo final correto de cada pote e o motivo. Correções guardam os valores anteriores e novos no histórico. Só a sessão do pai liberada pelo PIN pode lançar valores ou corrigir saldos. Zerar um pote é permitido; saldos negativos não são.

## Regras

Semana de segunda a domingo, datas locais. Configuração inicial: 66 realizações por semana, meta 80%, mínimo 53. Dever e mochila em dias úteis; as demais tarefas nos sete dias. Cada realização tem peso igual. A primeira semana também usa a meta inteira; o pai pode conferir dias anteriores. O pagamento segue para o pote PS5.

Cada semana mantém tarefas, frequência, meta e valor em um snapshot. A edição não recalcula semanas passadas. Dados antigos, saldos, PIN, histórico e bloqueios de pagamento são preservados. Na primeira migração é salva uma cópia em `missaoPs5AntesDaAgenda` e as informações anteriores permanecem no estado.

Sem configuração online, os dados ficam locais ao navegador e o PIN é apenas uma barreira de uso familiar. Com o serviço ativado conforme `SETUP-SYNC.md`, contas autorizadas compartilham os dados da família e o PIN é validado no servidor. Confira sempre o indicador “salvo online”; uma alteração pendente ainda não está confirmada para os outros aparelhos.

## Verificação

`node tests/routine-model.test.cjs` verifica a meta de 66/53, virada do ano ISO, bloqueios de data/ocorrência, pagamento único, planos congelados, migração e interrupção de sequência.
