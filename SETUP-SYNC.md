# Ativar a família online — uma única vez

O endereço do aplicativo continua o mesmo. A versão preparada ainda funciona localmente enquanto `cloud-config.js` estiver vazio. Publicar o código sozinho NÃO ativa a sincronização.

## Configuração do serviço

1. Entre em https://supabase.com/dashboard e crie um projeto próprio. Guarde a senha do banco com você. Confira as condições e limites do plano antes de confirmar qualquer contratação.
2. No SQL Editor, execute o conteúdo de `supabase/schema.sql`. Ele cria tabelas privadas e funções que exigem uma conta autorizada.
3. Em Authentication → Users, crie duas contas de e-mail/senha, uma para cada responsável, confirmadas. Cada pessoa guarda sua senha. Desative cadastros públicos nas configurações de Auth se não forem necessários; contas não vinculadas à família não têm acesso aos registros mesmo se criadas.
4. Copie o UUID de cada usuário. Abra `supabase/provision-family.sql` no SQL Editor, substitua os UUIDs e escolha um PIN familiar privado de 6 a 12 dígitos. Execute uma vez. Não publique esse SQL preenchido no repositório.
5. Localize a URL do projeto e a chave **publishable** nas configurações/API Keys. Esses dois valores públicos vão em `cloud-config.js`. Pode enviá-los ao desenvolvedor para configurar e publicar. **Não envie senha do banco, senha das contas, PIN, chave secret nem service_role.**
6. Publique a configuração no mesmo GitHub Pages. Feche e reabra o app com internet. Toque no indicador abaixo do cabeçalho e entre com a conta do primeiro responsável.
7. Só no primeiro aparelho, confirme o PIN para iniciar os registros da família. Revise os dados desse aparelho antes: eles serão o ponto de partida. No segundo aparelho, entre com a outra conta. Os registros online serão carregados, sem somar ou substituir pelo saldo local antigo.

## Conferência antes de usar

Marque uma etapa em um aparelho. Aguarde “salvo online”. No outro, aguarde até cinco segundos com a tela aberta, ou toque em “Atualizar agora”. Confira a mesma marcação, desfaça e confira de novo. Teste também uma entrada pequena pela área do pai e corrija o saldo depois. Esta conferência em produção ainda é necessária: os testes automatizados usam um serviço local, não um projeto Supabase real.

## Uso diário

- Cada responsável usa sua conta no mesmo link. O aparelho da criança pode ficar conectado por um responsável; marcar tarefas não exige o PIN. Compartilhar apenas o link não dá acesso à família.
- Valores, aprovação de recompensas e edição de tarefas exigem o PIN, verificado no servidor. O PIN online é o escolhido na configuração, não necessariamente o antigo 2026.
- Aguarde a confirmação de cada alteração. Sem internet, uma alteração fica pendente neste aparelho; novas alterações ficam bloqueadas até concluir o envio. Não apague os dados do navegador com alterações pendentes.
- A atualização automática ocorre a cada cinco segundos com a tela visível; durante a edição na área do pai, a tela não é substituída automaticamente.
- Marcações simultâneas compatíveis são combinadas. Alterações de dinheiro concorrentes não são somadas às cegas: a segunda precisa ser revisada e repetida. Uma cópia do conflito fica localmente em `missaoFamilyConflict`.
- Use uma aba ativa do aplicativo por aparelho. Fechar e reabrir preserva a sessão e a operação pendente.
- Sair encerra a sessão neste navegador, mas preserva a cópia local do histórico. Use aparelhos de confiança. Mudanças feitas deslogado NÃO são enviadas automaticamente quando entrar de novo.
- O serviço online não substitui uma política de backup. Confira a disponibilidade, os limites e as opções de recuperação do seu projeto Supabase. Esta entrega não inclui backups automáticos externos nem recuperação de senha por e-mail configurada.

## Verificação técnica

`npm ci`, `npm test`, `npm run test:browser` (este último usa Microsoft Edge instalado).

Os testes cobrem regras da rotina, valores, mesclagem, isolamento, permissões de dinheiro, conflito de revisão, reenvio idempotente, dois navegadores, interrupção de rede e recarga. PostgreSQL local via PGlite executa as funções SQL; apenas Auth e a comparação de hash são simulados. O bcrypt real e a integração Supabase devem ser conferidos na ativação.

Referências oficiais: [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys), [autenticação por senha](https://supabase.com/docs/guides/auth/passwords), [segurança de tabelas](https://supabase.com/docs/guides/database/postgres/row-level-security).
