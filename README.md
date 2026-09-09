# SEVEN / KI — projeto completo para edição

Exportação da versão 16 do jogo 2D de Rodrigo. Inclui a Saga Saiyajin, a Saga Freeza em Namekusei, mapas, sprites, interface, controles de teclado/toque/Xbox, sons e testes.

## Abrir e jogar no computador

1. Extraia o ZIP inteiro. Não abra o projeto dentro do arquivo compactado.
2. Tenha o Node.js 22 ou superior instalado no computador.
3. No Visual Studio Code, use **Arquivo → Abrir Pasta** e selecione `seven-ki-v16`. Também pode abrir `SEVEN-KI.code-workspace`. No Visual Studio, use **Abrir → Pasta**.
4. Abra o terminal nessa pasta e execute:

   ```bash
   npm start
   ```

5. Abra **http://localhost:4173** no navegador. Para encerrar, pressione Ctrl+C no terminal.

Não é preciso executar `npm install` para jogar nem para os testes de combate. O servidor local usa apenas recursos do Node.js. O jogo precisa desse servidor porque usa módulos JavaScript: abrir `dist/index.html` por duplo clique não é o fluxo correto.

Salve uma edição e atualize o navegador para ver a mudança. Para depurar no VS Code com o Chrome instalado, pressione F5 e escolha **Jogar e depurar SEVEN KI (Chrome)**.

## Onde editar

| Arquivo ou pasta | Conteúdo |
| --- | --- |
| `dist/index.html` | Telas, menus, HUD e botões |
| `dist/style.css` | Estilo, posições e adaptação ao celular |
| `dist/game.js` | Desenho do jogo, animações, efeitos e interface |
| `dist/engine.js` | Regras, física, dano e andamento da fase |
| `dist/saiyan-combat.js` | Novos combos e diálogos dos chefes da Saga Saiyajin |
| `dist/combat-data.js` | Dados de golpes e perfis de combate |
| `dist/combat-ai.js` | Decisões e reações dos inimigos |
| `dist/gamepad.js` | Comandos do Xbox |
| `dist/touch-layout.js`, `dist/controls-config.js` | Controles de toque |
| `dist/saga.js`, `dist/campaign.js` | Capítulos, mapas, habilidades, diálogos e progresso |
| `dist/audio.js` | Música e efeitos sonoros gerados com Web Audio |
| `dist/vfx-pool.js` | Partículas |
| `dist/sprite-frames.js` | Identificação dos recortes completos dos novos sprites |
| `dist/assets/` | Todas as imagens originais usadas ou mantidas no projeto |
| `tests/` | Testes do jogo |

Apesar do nome `dist`, os arquivos JavaScript são o código editável, sem minificação. Não há uma pasta de código-fonte ausente nem uma etapa obrigatória de compilação.

## Sprites

`goku-combos-v16.png` contém 24 poses. O arquivo original tem um fundo neutro que o carregador remove ao preparar a textura em memória. O recorte usa o contorno de cada pose, pois algumas mãos e pés ultrapassam as divisões de uma grade regular. Preserve `buildAtlas` em `game.js` e `sprite-frames.js` ao alterar essa parte. Não substitua os recortes por divisões fixas sem conferir os quadros.

As imagens antigas permanecem incluídas para manter as demais fases e as animações de repouso, voo, defesa e especiais. Não há arquivos de áudio MP3 ou WAV faltando: os sons são sintetizados por `audio.js`.

## Testes

```bash
npm test
```

O pacote inclui os 48 testes de combate, controles e campanha. A conferência opcional dos sprites usa uma dependência adicional:

```bash
npm install
npm run check:sprites
```

Ela gera `output/saiyan-sprite-check.png` com os 24 recortes. Esse comando opcional requer que `@napi-rs/canvas` seja instalado com sucesso para seu sistema. O jogo e `npm test` funcionam sem essa dependência.

## Progresso e publicação

O progresso e as preferências ficam no armazenamento do navegador. Ao executar em `localhost`, o jogo usa um progresso separado do site publicado; os dados pessoais salvos no celular não estão neste ZIP. O conteúdo das fases e o sistema de salvamento estão completos.

Editar esta cópia não altera automaticamente o site publicado. Os arquivos `.openai/hosting.json` preservam a referência de hospedagem original e não são necessários para executar localmente. O pacote não inclui credenciais ou o histórico interno do Git.

Base exportada: `0b2fb680accee02902499aaadc38073d7d77ec49`. Os acréscimos desta exportação são o servidor local, as configurações do editor, as instruções e a adaptação do teste opcional de sprites para rodar fora do ambiente original.
