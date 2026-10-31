/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: js/data/ebulicao.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 3 — PONTO DE EBULIÇÃO (SIFO). Conjuntos CURADOS: cada um
   isola UMA variável, como num experimento controlado.

   Temperaturas de ebulição em °C, a 1 atm. Valores de referência do
   CRC Handbook of Chemistry and Physics; os que variam entre fontes
   foram conferidos (a fonte está no composto). A massa molar, a
   função e a presença de O–H/N–H NÃO estão aqui: o módulo calcula da
   estrutura, pelo mesmo motor do Módulo 1.

   Nenhum conjunto tem dois valores a menos de 3 °C um do outro: a
   ordem precisa ser inequívoca. Ficou de fora, de propósito, a
   propan-2-amina (32,4 °C): primária, ferve ABAIXO da secundária
   linear (34 °C) — a ramificação pesa mais que o N–H extra, o que
   confundiria justamente a variável que o conjunto das aminas isola.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var CRC = 'CRC Handbook of Chemistry and Physics';
  /* a ordem dos grupos no painel (o primeiro conjunto do primeiro grupo é o inicial) */
  Q3.EBULICAO_GRUPOS = ['Força entre as moléculas', 'Ligação de hidrogênio', 'Séries homólogas', 'Tamanho e forma', 'Halogênios e anéis'];

  Q3.EBULICAO = [
    { id: 'massas', grupo: 'Força entre as moléculas', nome: 'Massas parecidas, funções diferentes', variavel: 'a força entre as moléculas',
      explicacao: 'Com massas molares parecidas, quem decide é a força entre as moléculas. O propano só tem dispersão de London; o éter e o aldeído são polares (dipolo-dipolo); o etanol forma ligações de hidrogênio pelo O–H; o ácido forma duas por molécula, em pares (dímeros).',
      compostos: [
        { nome: 'propano', smiles: 'CCC', teb: -42.1, forca: 'dispersão de London', fonte: CRC },
        { nome: 'metoximetano', smiles: 'COC', teb: -24.8, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'etanal', smiles: 'CC=O', teb: 20.1, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'etanol', smiles: 'CCO', teb: 78.3, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'ácido metanoico', smiles: 'OC=O', teb: 101, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'homologa', grupo: 'Séries homólogas', nome: 'Série homóloga dos alcanos', variavel: 'o tamanho da cadeia',
      explicacao: 'Na série homóloga, cada CH₂ a mais aumenta a superfície de contato entre as moléculas e a dispersão de London: a ebulição sobe a cada carbono.',
      compostos: [
        { nome: 'metano', smiles: 'C', teb: -161.5, forca: 'dispersão de London', fonte: CRC },
        { nome: 'etano', smiles: 'CC', teb: -88.6, forca: 'dispersão de London', fonte: CRC },
        { nome: 'propano', smiles: 'CCC', teb: -42.1, forca: 'dispersão de London', fonte: CRC },
        { nome: 'butano', smiles: 'CCCC', teb: -0.5, forca: 'dispersão de London', fonte: CRC },
        { nome: 'pentano', smiles: 'CCCCC', teb: 36.1, forca: 'dispersão de London', fonte: CRC },
        { nome: 'hexano', smiles: 'CCCCCC', teb: 68.7, forca: 'dispersão de London', fonte: CRC }
      ] },
    { id: 'ramificacao', grupo: 'Tamanho e forma', nome: 'Ramificação (C₅H₁₂)', variavel: 'a forma da molécula',
      explicacao: 'Mesma fórmula e mesma força (dispersão de London). Quanto mais ramificada, mais compacta a molécula e menor a superfície de contato com as vizinhas: a ebulição cai.',
      compostos: [
        { nome: '2,2-dimetilpropano', smiles: 'CC(C)(C)C', teb: 9.5, forca: 'dispersão de London', fonte: CRC },
        { nome: '2-metilbutano', smiles: 'CCC(C)C', teb: 27.8, forca: 'dispersão de London', fonte: CRC },
        { nome: 'pentano', smiles: 'CCCCC', teb: 36.1, forca: 'dispersão de London', fonte: CRC }
      ] },
    { id: 'alcooleter', grupo: 'Ligação de hidrogênio', nome: 'Álcool ou éter (C₄H₁₀O)', variavel: 'a presença de O–H',
      explicacao: 'Os éteres não têm O–H: sem ligação de hidrogênio entre as moléculas, fervem muito abaixo dos álcoois de mesma fórmula. Entre os álcoois, a ramificação reduz o contato, e a ebulição cai.',
      compostos: [
        { nome: 'etoxietano', smiles: 'CCOCC', teb: 34.5, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: '1-metoxipropano', smiles: 'CCCOC', teb: 38.8, forca: 'dipolo-dipolo', fonte: 'Merck Index' },
        { nome: '2-metilpropan-2-ol', smiles: 'CC(C)(C)O', teb: 82.4, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'butan-2-ol', smiles: 'CCC(C)O', teb: 99.5, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'butan-1-ol', smiles: 'CCCCO', teb: 117.7, forca: 'ligação de hidrogênio', fonte: CRC }
      ] },
    { id: 'aminas', grupo: 'Ligação de hidrogênio', nome: 'Aminas (C₃H₉N)', variavel: 'quantos N–H',
      explicacao: 'Quanto mais N–H, mais ligações de hidrogênio: a amina primária (dois N–H) ferve acima da secundária (um N–H); a terciária, sem N–H, fica muito abaixo.',
      compostos: [
        { nome: 'N,N-dimetilmetanamina', smiles: 'CN(C)C', teb: 2.9, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'N-metiletanamina', smiles: 'CCNC', teb: 34, forca: 'ligação de hidrogênio', fonte: 'Thermo Scientific (33–34 °C)' },
        { nome: 'propan-1-amina', smiles: 'CCCN', teb: 47.2, forca: 'ligação de hidrogênio', fonte: CRC }
      ] },
    { id: 'tres', grupo: 'Força entre as moléculas', nome: 'Três carbonos, funções diferentes', variavel: 'o grupo funcional',
      explicacao: 'Aldeído e cetona são polares (dipolo-dipolo), mas não têm O–H. O álcool forma ligações de hidrogênio; o ácido carboxílico, duas por molécula, em pares (dímeros).',
      compostos: [
        { nome: 'propanal', smiles: 'CCC=O', teb: 48, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'propanona', smiles: 'CC(C)=O', teb: 56.1, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'propan-1-ol', smiles: 'CCCO', teb: 97.2, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'ácido propanoico', smiles: 'CCC(O)=O', teb: 141.2, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'massas60', grupo: 'Força entre as moléculas', nome: 'Massas ≈ 60 g/mol, funções diferentes', variavel: 'a força entre as moléculas',
      explicacao: 'De novo com massas parecidas (58 a 60 g/mol): o butano só tem dispersão de London; o éter e o aldeído são polares; o álcool forma ligações de hidrogênio; o ácido, duas por molécula (dímeros).',
      compostos: [
        { nome: 'butano', smiles: 'CCCC', teb: -0.5, forca: 'dispersão de London', fonte: CRC },
        { nome: 'metoxietano', smiles: 'CCOC', teb: 7.4, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'propanal', smiles: 'CCC=O', teb: 48, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'propan-1-ol', smiles: 'CCCO', teb: 97.2, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'ácido etanoico', smiles: 'CC(O)=O', teb: 117.9, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'quatro', grupo: 'Força entre as moléculas', nome: 'Quatro carbonos, funções diferentes', variavel: 'o grupo funcional',
      explicacao: 'Mesmo esqueleto de quatro carbonos: o alcano só tem London; aldeído e cetona são polares; o álcool forma ligações de hidrogênio; o ácido, duas por molécula.',
      compostos: [
        { nome: 'butano', smiles: 'CCCC', teb: -0.5, forca: 'dispersão de London', fonte: CRC },
        { nome: 'butanal', smiles: 'CCCC=O', teb: 74.8, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'butanona', smiles: 'CCC(C)=O', teb: 79.6, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'butan-1-ol', smiles: 'CCCCO', teb: 117.7, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'ácido butanoico', smiles: 'CCCC(O)=O', teb: 163.8, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'esteracido', grupo: 'Força entre as moléculas', nome: 'Ácido ou éster (C₄H₈O₂)', variavel: 'a presença de O–H',
      explicacao: 'Mesma fórmula: o éster não tem O–H e não forma ligação de hidrogênio entre as suas moléculas, por isso ferve muito abaixo dos ácidos. Entre os ácidos, a ramificação reduz o contato.',
      compostos: [
        { nome: 'etanoato de etila', smiles: 'CCOC(C)=O', teb: 77.1, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'ácido 2-metilpropanoico', smiles: 'CC(C)C(O)=O', teb: 154.4, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC },
        { nome: 'ácido butanoico', smiles: 'CCCC(O)=O', teb: 163.8, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'butanois', grupo: 'Ligação de hidrogênio', nome: 'Butanóis (C₄H₁₀O)', variavel: 'a ramificação e a posição do OH',
      explicacao: 'Todos formam ligações de hidrogênio. O que muda é o acesso ao O–H e o contato entre as moléculas: quanto mais ramificado e mais escondido o OH, menor a ebulição.',
      compostos: [
        { nome: '2-metilpropan-2-ol', smiles: 'CC(C)(C)O', teb: 82.4, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'butan-2-ol', smiles: 'CCC(C)O', teb: 99.5, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: '2-metilpropan-1-ol', smiles: 'CC(C)CO', teb: 107.9, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'butan-1-ol', smiles: 'CCCCO', teb: 117.7, forca: 'ligação de hidrogênio', fonte: CRC }
      ] },
    { id: 'ohnh', grupo: 'Ligação de hidrogênio', nome: 'O–H ou N–H', variavel: 'O–H contra N–H',
      explicacao: 'O oxigênio é mais eletronegativo que o nitrogênio: a ligação de hidrogênio pelo O–H é mais forte. Cada álcool ferve bem acima da amina de tamanho parecido; em cada família, a ebulição sobe com a cadeia.',
      compostos: [
        { nome: 'metanamina', smiles: 'CN', teb: -6.3, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'etanamina', smiles: 'CCN', teb: 16.6, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'propan-1-amina', smiles: 'CCCN', teb: 47.2, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'metanol', smiles: 'CO', teb: 64.7, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'etanol', smiles: 'CCO', teb: 78.3, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'propan-1-ol', smiles: 'CCCO', teb: 97.2, forca: 'ligação de hidrogênio', fonte: CRC }
      ] },
    { id: 'alcoois', grupo: 'Séries homólogas', nome: 'Série homóloga dos álcoois', variavel: 'o tamanho da cadeia',
      explicacao: 'Todos formam ligações de hidrogênio pelo O–H; o que cresce, a cada CH₂, é a parte apolar e a dispersão de London: a ebulição sobe cerca de 20 °C por carbono.',
      compostos: [
        { nome: 'metanol', smiles: 'CO', teb: 64.7, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'etanol', smiles: 'CCO', teb: 78.3, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'propan-1-ol', smiles: 'CCCO', teb: 97.2, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'butan-1-ol', smiles: 'CCCCO', teb: 117.7, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'pentan-1-ol', smiles: 'CCCCCO', teb: 138, forca: 'ligação de hidrogênio', fonte: CRC },
        { nome: 'hexan-1-ol', smiles: 'CCCCCCO', teb: 157.6, forca: 'ligação de hidrogênio', fonte: CRC }
      ] },
    { id: 'acidos', grupo: 'Séries homólogas', nome: 'Série homóloga dos ácidos', variavel: 'o tamanho da cadeia',
      explicacao: 'Os ácidos formam pares ligados por duas ligações de hidrogênio (dímeros), e fervem alto. A cada CH₂, a dispersão de London cresce, e a ebulição também.',
      compostos: [
        { nome: 'ácido metanoico', smiles: 'OC=O', teb: 101, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC },
        { nome: 'ácido etanoico', smiles: 'CC(O)=O', teb: 117.9, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC },
        { nome: 'ácido propanoico', smiles: 'CCC(O)=O', teb: 141.2, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC },
        { nome: 'ácido butanoico', smiles: 'CCCC(O)=O', teb: 163.8, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC },
        { nome: 'ácido pentanoico', smiles: 'CCCCC(O)=O', teb: 186.1, forca: 'ligação de hidrogênio (dímeros)', fonte: CRC }
      ] },
    { id: 'hexanos', grupo: 'Tamanho e forma', nome: 'Ramificação (C₆H₁₄)', variavel: 'a forma da molécula',
      explicacao: 'Mesma fórmula e mesma força (London). Cada ramificação deixa a molécula mais compacta e reduz o contato com as vizinhas: a ebulição cai.',
      compostos: [
        { nome: '2,2-dimetilbutano', smiles: 'CCC(C)(C)C', teb: 49.7, forca: 'dispersão de London', fonte: CRC },
        { nome: '2,3-dimetilbutano', smiles: 'CC(C)C(C)C', teb: 58, forca: 'dispersão de London', fonte: CRC },
        { nome: '3-metilpentano', smiles: 'CCC(C)CC', teb: 63.3, forca: 'dispersão de London', fonte: CRC },
        { nome: 'hexano', smiles: 'CCCCCC', teb: 68.7, forca: 'dispersão de London', fonte: CRC }
      ] },
    { id: 'ligacoes', grupo: 'Tamanho e forma', nome: 'Simples, dupla ou tripla (C₅)', variavel: 'o tipo de ligação',
      explicacao: 'Os três só têm dispersão de London, e as diferenças são pequenas. A tripla deixa a ponta da molécula linear e mais polarizável: o alcino ferve um pouco acima do alcano, e o alceno, um pouco abaixo.',
      compostos: [
        { nome: 'pent-1-eno', smiles: 'C=CCCC', teb: 30, forca: 'dispersão de London', fonte: CRC },
        { nome: 'pentano', smiles: 'CCCCC', teb: 36.1, forca: 'dispersão de London', fonte: CRC },
        { nome: 'pent-1-ino', smiles: 'C#CCCC', teb: 40.2, forca: 'dispersão de London', fonte: 'CRC; Wikipedia' }
      ] },
    { id: 'ciclico', grupo: 'Tamanho e forma', nome: 'Aberta ou fechada (C₆)', variavel: 'a cadeia fechada',
      explicacao: 'O anel é rígido e plano o bastante para as moléculas se encaixarem bem umas nas outras: mais contato, mais dispersão de London. O ciclo-hexano ferve acima do hexano.',
      compostos: [
        { nome: 'hex-1-eno', smiles: 'C=CCCCC', teb: 63.4, forca: 'dispersão de London', fonte: CRC },
        { nome: 'hexano', smiles: 'CCCCCC', teb: 68.7, forca: 'dispersão de London', fonte: CRC },
        { nome: 'ciclo-hexano', smiles: 'C1CCCCC1', teb: 80.7, forca: 'dispersão de London', fonte: CRC }
      ] },
    { id: 'haletos', grupo: 'Halogênios e anéis', nome: 'Halogênios (C₂H₅X)', variavel: 'o tamanho do halogênio',
      explicacao: 'Do flúor ao iodo, o halogênio fica maior e mais polarizável: a dispersão de London cresce muito, e é ela que manda na ordem — mesmo com o C–F sendo a ligação mais polar.',
      compostos: [
        { nome: 'fluoroetano', smiles: 'CCF', teb: -37.7, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'cloroetano', smiles: 'CCCl', teb: 12.3, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'bromoetano', smiles: 'CCBr', teb: 38.4, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'iodoetano', smiles: 'CCI', teb: 72.3, forca: 'dipolo-dipolo', fonte: CRC }
      ] },
    { id: 'aneis', grupo: 'Halogênios e anéis', nome: 'Benzeno e derivados', variavel: 'o grupo preso ao anel',
      explicacao: 'O benzeno só tem London; a metila aumenta a molécula; o cloro a torna polar; o O–H do fenol forma ligações de hidrogênio — e ele ferve muito acima dos outros.',
      compostos: [
        { nome: 'benzeno', smiles: 'C1=CC=CC=C1', teb: 80.1, forca: 'dispersão de London', fonte: CRC },
        { nome: 'metilbenzeno', smiles: 'CC1=CC=CC=C1', teb: 110.6, forca: 'dispersão de London', fonte: CRC },
        { nome: 'clorobenzeno', smiles: 'ClC1=CC=CC=C1', teb: 131.7, forca: 'dipolo-dipolo', fonte: CRC },
        { nome: 'fenol', smiles: 'OC1=CC=CC=C1', teb: 181.7, forca: 'ligação de hidrogênio', fonte: CRC }
      ] }
  ];

  /* massa molar a partir da estrutura (massas atômicas IUPAC, arredondadas) */
  var MASSA = { C: 12.011, H: 1.008, O: 15.999, N: 14.007, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.904, S: 32.06 };
  Q3.massaMolar = function (g) {
    var m = 0;
    g.pesados().forEach(function (id) { m += MASSA[g.atomos[id].el] || 0; m += g.hidrogenios(id) * MASSA.H; });
    return m;
  };
  /* há O–H ou N–H? (o que permite ligação de hidrogênio entre as moléculas) */
  Q3.temOHouNH = function (g) {
    return g.pesados().some(function (id) { var el = g.atomos[id].el; return (el === 'O' || el === 'N') && g.hidrogenios(id) > 0; });
  };

})(typeof window !== 'undefined' ? window : globalThis);
