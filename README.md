# Missão PS5 — Agenda de desafios

PWA infantil de educação financeira transformado em uma jornada de conquista. A criança completa missões, divide recompensas entre três potes e acompanha o caminho até o PS5 com níveis, troféus e sequência semanal.

## Experiência

- Painel gamer responsivo para celular, tablet e desktop
- Avatar infantil original feito em CSS
- Saldo inicial de R$ 300 e meta padrão de R$ 4.000
- Missões semanais com recompensa, combo e bloqueio por semana
- Potes Missão PS5, Dinheiro Livre e Futuro
- Divisão 70/20/10 ajustável para novas entradas
- Simulador de compra com impacto em semanas de missão
- Oito níveis, galeria de conquistas e animação de level up
- Sequência semanal e linha do tempo
- Área do pai com PIN `2026`, bônus, ajustes e edição de missões
- Persistência local compatível com os dados da V2
- PWA instalável com ícones próprios 192/512 e cache offline

## Desenvolvimento local

O front-end é estático. Sirva esta pasta com qualquer servidor HTTP e abra `index.html`. Não há build. Para verificar: `npm ci`, `npm test` e `npm run test:browser` (Microsoft Edge instalado).

## Publicação

A branch `main` é publicada via GitHub Pages. Sem configuração, os dados permanecem apenas no navegador do aparelho. A sincronização Google Sheets usa um código familiar privado e PIN verificado no servidor para alterações do responsável.

**Caminho escolhido: Google Sheets.** A planilha está criada e a integração foi preparada. Siga [google/COMECE-AQUI.md](google/COMECE-AQUI.md) para autorizar e publicar o único arquivo no Apps Script. Sem essa etapa, o app ainda funciona localmente. O mesmo link é mantido; cada celular recebe uma vez o endereço `/exec` e o código familiar. Nunca coloque códigos familiares, senhas ou PIN no código público.

A integração Supabase anterior permanece disponível como alternativa técnica em [SETUP-SYNC.md](SETUP-SYNC.md), mas não precisa ser configurada para usar Google Sheets.
