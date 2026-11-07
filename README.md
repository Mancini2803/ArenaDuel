# Arena Duel

Jogo de arena em pixel art feito em um único arquivo HTML (canvas + JavaScript puro, sem dependências).

- 2 jogadores no mesmo teclado ou 1 jogador contra um bot (Fácil, Normal, Difícil)
- Melhor de 3 rounds
- Tiros que ricocheteiam, caixas destrutíveis, dash
- Power-ups: vida, tiro rápido, escudo e tiro triplo
- Partículas, tremor de tela e efeitos sonoros gerados com WebAudio

## Como jogar

Abra o `index.html` no navegador (no computador), clique na tela e use o teclado.

| | Jogador 1 | Jogador 2 |
|---|---|---|
| Mover | W A S D | Setas |
| Atirar | F ou Espaço | L |
| Dash | G | K |

No modo solo, o Jogador 1 também pode usar as setas, L e K. P pausa, M liga ou desliga o som e Esc volta ao menu.

## Como o bot funciona

É uma IA baseada em regras, sem aprendizado de máquina: mira com antecipação do movimento do alvo, mantém distância, anda de lado, desvia de tiros, pega power-ups e só atira com linha de visão. A dificuldade muda parâmetros como erro de mira, tempo de reação e chance de desviar. O código está na função `botInput`.

## Fontes

Press Start 2P e Chakra Petch, carregadas do Google Fonts.
