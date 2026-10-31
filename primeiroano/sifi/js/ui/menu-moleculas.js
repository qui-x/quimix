/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: menu-moleculas.js
   ORIGEM:  técnica adaptada de js/molecules/presets.js do SILQ
            (SILQ.buildMolPresets / SILQ.buildPresetMiniSVG), mas
            reescrita para ler INTERMOL_MOLECULES em vez de
            MOL_PRESETS, e usando ELEMENTS.color (tabela-elementos.js)
            em vez de duplicar um mapa de cores próprio.
   ───────────────────────────────────────────────────────────────
   Duas coisas diferentes, no mesmo arquivo porque uma depende da
   outra:

   1. SIFI.buildMenuMoleculas() — monta a LISTA da Biblioteca de
      Compostos (sidebar direita): só fórmula + nome + uma bolinha
      colorida com a força dominante. Sem desenho de geometria —
      é só uma lista de nomes, como pedido, no mesmo lugar onde o
      SILQ mantém sua "Tabela Periódica" e "Moléculas Prontas"
      (controles ficam na direita; a esquerda é só os modos/módulos).

   2. SIFI.buildMoleculeMiniSVG() — desenha a estrutura 2D completa
      (átomos, ligações, polos δ+/δ−). Isso NÃO aparece mais na
      biblioteca — só é usado quando o composto é efetivamente
      colocado no canvas (ver SIFI.addMoleculeToSandbox em
      sandbox.js), porque é lá que o desenho com os polos importa de
      verdade para a mecânica de atração/repulsão.

   SIFI.moleculeLayout() é a função de coordenadas compartilhada
   entre o desenho (função 2) e o motor de física
   (js/simulation/fisica-intermolecular.js) — por isso mora aqui e
   não dentro de buildMoleculeMiniSVG.
   Depende de: js/core/namespace.js, js/core/dom-refs.js,
              js/data/tabela-elementos.js, js/data/dados-forcas-intermoleculares.js.
   Usado por: js/init/inicializacao-sifi.js (chama SIFI.buildMenuMoleculas),
              js/ui/sandbox.js, js/simulation/fisica-intermolecular.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Calcula, para uma molécula, o tamanho do desenho (W×H) e as
     funções px(x)/py(y) que convertem coordenada química (as mesmas
     usadas em dados-forcas-intermoleculares.js) em posição de pixel
     dentro desse desenho. "big" = versão maior usada no canvas;
     sem "big" = versão pequena usada no cartão do menu. */
  SIFI.moleculeLayout = function moleculeLayout(mol, big) {
    const W = big ? 78 : 60, H = big ? 58 : 44;
    const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = (maxX - minX) || 1, spanY = (maxY - minY) || 1;
    const pad = big ? 14 : 10;
    const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    const px = x => pad + (x - minX) * scale + (W - pad * 2 - spanX * scale) / 2;
    const py = y => pad + (y - minY) * scale + (H - pad * 2 - spanY * scale) / 2;
    return { W, H, px, py };
  };

  /* Desenha a estrutura 2D de uma molécula como mini-SVG — reaproveitado
     tanto pelo cartão do menu quanto pela "ficha" que fica na caixa de
     areia (js/ui/sandbox.js). */
  SIFI.buildMoleculeMiniSVG = function buildMoleculeMiniSVG(mol, big) {
    const { W, H, px, py } = SIFI.moleculeLayout(mol, big);

    // Ligações (linhas simples/duplas/triplas conforme a ordem)
    let lines = '';
    mol.bonds.forEach(({ a, b, order }) => {
      const A = mol.atoms[a], B = mol.atoms[b];
      const x1 = px(A.x), y1 = py(A.y), x2 = px(B.x), y2 = py(B.y);
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const perpX = -dy / len, perpY = dx / len;
      const offsets = order === 1 ? [0] : order === 2 ? [-1.6, 1.6] : [-2.6, 0, 2.6];
      offsets.forEach(off => {
        lines += `<line x1="${(x1 + perpX * off).toFixed(1)}" y1="${(y1 + perpY * off).toFixed(1)}" x2="${(x2 + perpX * off).toFixed(1)}" y2="${(y2 + perpY * off).toFixed(1)}" stroke="#4fc3f7" stroke-width="1.3" stroke-linecap="round"/>`;
      });
    });

    // Átomos — a cor vem de ELEMENTS (tabela-elementos.js), sem mapa duplicado
    let circles = '';
    mol.atoms.forEach(({ el, x, y }) => {
      const cx = px(x), cy = py(y);
      const data = (typeof ELEMENTS !== 'undefined' && ELEMENTS[el]) || {};
      const col = data.color || '#94a3b8';
      const r = el === 'H' ? (big ? 5.5 : 4) : (big ? 7.5 : 5.5);
      circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${col}" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>`;
      if (el !== 'H') {
        circles += `<text x="${cx.toFixed(1)}" y="${(cy + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${big ? 6.5 : 5}" font-weight="bold" fill="white" font-family="sans-serif">${el}</text>`;
      }
    });

    // Polos δ+ / δ− — mesmas cores do dipolo do SILQ (dipolo-glow-eletrons.js).
    // A classe "sifi-pole" recebe a animação de piscar (ver sifi-extra.css),
    // igual ao pedido de mostrar visualmente os polos parciais.
    let poles = '';
    (mol.poloPositivo || []).forEach(idx => {
      const a = mol.atoms[idx]; const cx = px(a.x), cy = py(a.y);
      poles += `<text class="sifi-pole" x="${cx.toFixed(1)}" y="${(cy - 8).toFixed(1)}" text-anchor="middle" font-size="${big ? 8 : 6.5}" font-weight="bold" fill="#fbbf24">δ+</text>`;
    });
    (mol.poloNegativo || []).forEach(idx => {
      const a = mol.atoms[idx]; const cx = px(a.x), cy = py(a.y);
      poles += `<text class="sifi-pole" x="${cx.toFixed(1)}" y="${(cy - 8).toFixed(1)}" text-anchor="middle" font-size="${big ? 8 : 6.5}" font-weight="bold" fill="#60a5fa">δ−</text>`;
    });

    return `<svg class="mol-card-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${lines}${circles}${poles}</svg>`;
  };

  /* Estado atual dos controles da Biblioteca — o que está digitado na
     busca, qual força está filtrada, como está ordenado. Guardado aqui
     (em vez de ler os elementos toda vez) para ficar fácil de testar. */
  SIFI.bibliotecaEstado = { busca: '', forca: 'all', ordenar: 'nome' };

  /* Aplica busca + filtro + ordenação sobre INTERMOL_MOLECULES e
     devolve só a lista que deve aparecer — não mexe no DOM. Separado
     de buildMenuMoleculas() de propósito: assim dá pra testar a LÓGICA
     de filtrar sem precisar de um DOM de verdade. */
  SIFI.filtrarMoleculas = function filtrarMoleculas() {
    const { busca, forca, ordenar } = SIFI.bibliotecaEstado;
    const termo = busca.trim().toLowerCase();

    let lista = INTERMOL_MOLECULES.filter(mol => {
      // Substâncias iônicas/simplificadas só fazem sentido no Módulo 3
      // (ver `apenasModulo3` em dados-forcas-intermoleculares.js — NaCl
      // é iônico, não covalente; Óleo não tem ponto de ebulição real).
      if (mol.apenasModulo3) return false;
      const passaForca = forca === 'all' || mol.dominantForce === forca;
      const passaBusca = !termo
        || mol.name.toLowerCase().includes(termo)
        || mol.formula.toLowerCase().includes(termo)
        || mol.key.toLowerCase().includes(termo);
      return passaForca && passaBusca;
    });

    lista = lista.slice().sort((a, b) => {
      if (ordenar === 'pe-asc') return a.boilingPoint - b.boilingPoint;
      if (ordenar === 'pe-desc') return b.boilingPoint - a.boilingPoint;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return lista;
  };

  /* Monta a lista da Biblioteca de Compostos (sidebar direita) — cada
     item mostra fórmula + nome + ponto de ebulição + uma bolinha
     colorida com a força dominante daquele composto sozinho (sem
     desenhar a geometria: o desenho completo, com os polos δ+/δ−, só
     aparece quando o composto é colocado no canvas — ver
     SIFI.buildMoleculeMiniSVG, usado por SIFI.addMoleculeToSandbox
     em sandbox.js). Chamada de novo toda vez que a busca, o filtro ou
     a ordenação mudam — ver SIFI.initBibliotecaControles(). */
  SIFI.buildMenuMoleculas = function buildMenuMoleculas() {
    const lista = SIFI.menuGrid;
    if (!lista) return;

    // Total "de verdade" pro Módulo 1 — exclui NaCl/Óleo (apenasModulo3),
    // que não aparecem aqui (ver SIFI.filtrarMoleculas, mais abaixo).
    const totalModulo1 = INTERMOL_MOLECULES.filter(m => !m.apenasModulo3).length;

    if (SIFI.statTotalMoleculas) {
      SIFI.statTotalMoleculas.textContent = totalModulo1;
    }
    if (SIFI.badgeBiblioteca) {
      SIFI.badgeBiblioteca.textContent = totalModulo1;
      SIFI.badgeBiblioteca.setAttribute('aria-label', `${totalModulo1} compostos disponíveis`);
    }

    const visiveis = SIFI.filtrarMoleculas();
    lista.innerHTML = '';

    if (SIFI.contadorBiblioteca) {
      SIFI.contadorBiblioteca.textContent = visiveis.length === totalModulo1
        ? `${totalModulo1} compostos`
        : `${visiveis.length} de ${totalModulo1} compostos`;
    }

    if (!visiveis.length) {
      lista.innerHTML = '<p class="composto-lista-vazia">Nenhum composto encontrado.</p>';
      return;
    }

    visiveis.forEach(mol => {
      const f = FORCE_TYPES[mol.dominantForce];
      const item = document.createElement('div');
      item.className = 'composto-item';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label',
        `${mol.name}, fórmula ${mol.formula}. Força dominante entre moléculas iguais: ${f.label}. ` +
        `Ponto de ebulição: ${mol.boilingPoint}°C. Pressione Enter para colocar no canvas.`
      );
      item.title = `${mol.name} — ${f.label} — PE ${mol.boilingPoint}°C`;

      item.innerHTML = `
        <span class="composto-dot" style="background:${f.color}" aria-hidden="true"></span>
        <span class="composto-formula">${mol.formula}</span>
        <span class="composto-nome">${mol.name}</span>
        <span class="composto-pe">${mol.boilingPoint}°C</span>
      `;

      item.addEventListener('click', () => SIFI.addMoleculeToSandbox(mol.key));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); SIFI.addMoleculeToSandbox(mol.key); }
      });

      lista.appendChild(item);
    });
  };

  /* Liga a caixa de busca, os botões de filtro por força e o seletor
     de ordenação da Biblioteca. Cada um só muda SIFI.bibliotecaEstado
     e manda reconstruir a lista — a lógica de filtrar/ordenar de
     verdade mora em SIFI.filtrarMoleculas(), não aqui. */
  SIFI.initBibliotecaControles = function initBibliotecaControles() {
    if (SIFI.buscaBiblioteca) {
      SIFI.buscaBiblioteca.addEventListener('input', () => {
        SIFI.bibliotecaEstado.busca = SIFI.buscaBiblioteca.value;
        SIFI.buildMenuMoleculas();
      });
    }

    if (SIFI.filtroBtns) {
      SIFI.filtroBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          SIFI.bibliotecaEstado.forca = btn.dataset.forca;
          SIFI.filtroBtns.forEach(b => {
            const ativo = b === btn;
            b.classList.toggle('active-cat', ativo);
            b.setAttribute('aria-selected', ativo ? 'true' : 'false');
          });
          SIFI.buildMenuMoleculas();
        });
      });
    }

    if (SIFI.ordenarBiblioteca) {
      SIFI.ordenarBiblioteca.addEventListener('change', () => {
        SIFI.bibliotecaEstado.ordenar = SIFI.ordenarBiblioteca.value;
        SIFI.buildMenuMoleculas();
      });
    }
  };

  /* Ângulo (em graus) do dipolo PRÓPRIO da molécula, no referencial
     dela mesma (sem nenhuma rotação aplicada ainda) — de onde para
     onde ela "aponta" quimicamente, do centro do(s) polo(s) δ− para
     o centro do(s) polo(s) δ+. Isso é o que o motor de física usa
     para saber para onde girar a molécula quando ela precisa alinhar
     seu dipolo com o de uma vizinha (ver js/simulation/fisica-intermolecular.js).
     Retorna null para moléculas apolares — não existe "direção certa"
     para uma molécula sem polo fixo (é por isso que a força de London
     não depende de orientação).
     Usa as coordenadas QUÍMICAS originais (mol.atoms[i].x/y), não as
     de pixel — o mapeamento de SIFI.moleculeLayout escala os dois
     eixos pelo mesmo fator, então o ÂNGULO é idêntico nos dois
     referenciais; calcular direto dos dados evita depender do
     tamanho do desenho (78×58, 60×44...). */
  SIFI.dipoloAngleLocal = function dipoloAngleLocal(mol) {
    if (!mol.polar || !mol.poloPositivo.length || !mol.poloNegativo.length) return null;

    const centroide = indices => {
      const pts = indices.map(i => mol.atoms[i]);
      return {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      };
    };

    const pos = centroide(mol.poloPositivo);
    const neg = centroide(mol.poloNegativo);
    return Math.atan2(pos.y - neg.y, pos.x - neg.x) * 180 / Math.PI;
  };
});
