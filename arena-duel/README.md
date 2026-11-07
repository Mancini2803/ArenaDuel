# Arena Duel

Jogo de arena em pixel art para **2 jogadores no mesmo teclado** ou **1 jogador contra um bot**. Feito com HTML, CSS e JavaScript puro: sem frameworks, sem build, sem dependências.

## Recursos

- Melhor de 3 rounds, com câmera lenta no K.O.
- 3 mapas (Clássico, Pilares e Caixote), todos espelhados para ficar justos
- Tiros que ricocheteiam uma vez, caixas destrutíveis e dash
- Power-ups: coração, raio (tiro rápido), escudo e tiro triplo
- Bot com 3 dificuldades (Fácil, Normal e Difícil)
- Estatística de precisão de tiro no fim da partida
- Preferências (mapa, dificuldade e som) salvas no navegador
- Partículas, tremor de tela e efeitos sonoros gerados com WebAudio (nenhum arquivo de áudio)
- Pausa automática quando você troca de aba

## Como jogar

Abra o `index.html` no navegador, clique na tela e use o teclado. Não precisa instalar nada.

| | Jogador 1 | Jogador 2 |
|---|---|---|
| Mover | W A S D | Setas |
| Atirar | F ou Espaço | L |
| Dash | G | K |

No modo solo, o Jogador 1 também pode usar as setas, L e K. Em qualquer momento: **P** pausa, **M** liga/desliga o som e **Esc** volta ao menu.

## Estrutura do projeto

```
arena-duel/
├── index.html            Página e ordem de carregamento dos scripts
├── css/
│   └── style.css         Visual da página (cartões de controles, gabinete)
├── js/
│   ├── config.js         Constantes: tela, paleta, balanceamento, dificuldades
│   ├── state.js          Estado compartilhado do jogo (A.g)
│   ├── audio.js          Efeitos sonoros (WebAudio)
│   ├── storage.js        Salvar/carregar preferências
│   ├── input.js          Teclado
│   ├── maps.js           Mapas, colisão e linha de visão
│   ├── effects.js        Partículas, textos flutuantes, tremor
│   ├── draw.js           Primitivas de pixel art (retângulo, texto, sprites)
│   ├── powerups.js       Itens da arena
│   ├── projectiles.js    Tiros, ricochete e dano em caixas
│   ├── player.js         Jogador: movimento, dash, tiro
│   ├── ai.js             Bot
│   ├── game.js           Regras da partida e máquina de estados
│   ├── menu.js           Menu inicial
│   ├── render.js         Desenho de cada frame (arena, HUD, telas)
│   └── main.js           Ponto de entrada e laço principal
├── tests/
│   └── smoke.js          Testes sem navegador
├── .github/workflows/
│   └── test.yml          Roda os testes a cada push
└── package.json
```

Os scripts são arquivos comuns (não módulos ES), cada um registrando suas funções em um objeto global `Arena`. Assim o jogo funciona ao abrir o `index.html` com duplo clique, sem precisar de servidor. **A ordem das tags `<script>` no `index.html` importa**, porque cada arquivo usa os anteriores.

## Como o jogo funciona

O jogo roda numa tela interna de 320×200 pixels, que o CSS amplia sem suavização para manter o visual de pixel art. Cada frame segue este caminho:

1. `main.js` chama `game.tick(dt)` e depois `render.frame()`.
2. `game.js` guarda o estado atual (`menu`, `countdown`, `play`, `roundend` ou `matchend`) e chama jogadores, tiros e power-ups.
3. `render.js` só desenha o que está em `Arena.g`; ele não muda regras.

### O bot

É uma IA baseada em regras, sem aprendizado de máquina. A cada frame o bot:

1. mira onde o alvo vai estar (antecipando a velocidade), com um erro aleatório e giro limitado;
2. se aproxima, recua ou anda de lado conforme a distância;
3. desvia de tiros que vêm na direção dele e pode dar dash;
4. pega power-ups próximos (coração só se estiver ferido);
5. se ficar preso, anda numa direção aleatória por um instante;
6. só atira com linha de visão e mirando perto o bastante.

A dificuldade só muda números em `DIFFS` (`js/config.js`). O código está em `js/ai.js`.

## Como personalizar

- **Balanceamento:** ajuste velocidade, vida, cooldowns e duração dos power-ups em `js/config.js`.
- **Novo mapa:** adicione um item em `LIST` no `js/maps.js`. Você escreve só a metade esquerda (10 colunas × 11 linhas) e o jogo espelha. Use `#` para parede, `c` para caixa e `.` para chão, e deixe livre a coluna 2 da linha do meio, onde o jogador nasce. O teste confere o formato automaticamente.
- **Novo power-up:** inclua o tipo em `POWER.types` e `POWER.colors` (`js/config.js`), um ícone em `js/draw.js` e o efeito em `collect` no `js/powerups.js`.

## Testes

```bash
npm test
# ou
node tests/smoke.js
```

Os testes rodam sem navegador, usando um DOM falso, e conferem mapas, colisão, tiros, ricochete, escudo, K.O., pausa, preferências salvas e partidas completas bot contra bot em todos os mapas e dificuldades.

## Publicar no GitHub Pages

1. Envie o projeto para um repositório público no GitHub.
2. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Em um ou dois minutos o jogo fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Créditos

Fontes [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) e [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch), carregadas do Google Fonts.
