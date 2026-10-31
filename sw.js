/* ================================================================
   sw.js — SERVICE WORKER DO PWA
   ================================================================
   Responsável por duas coisas:
   1. Deixar o Chrome/Android saber que este site "pode virar app"
      (é um dos requisitos, junto do manifest.json, pra aparecer o
      botão de instalar).
   2. Guardar em cache o que já foi visitado, pra funcionar (pelo
      menos parcialmente) sem internet depois da primeira visita —
      útil porque a maioria dos simuladores roda inteiramente no
      navegador, sem precisar de rede nenhuma depois de carregados.

   ESTRATÉGIA: "rede primeiro" — com internet, busca sempre a versão
   atual (e guarda uma cópia); sem internet, responde com a cópia do
   cache. Antes era "stale-while-revalidate" (responde com o cache e
   atualiza para a PRÓXIMA visita): num laboratório atualizado com
   frequência, cada correção só aparecia na segunda abertura de cada
   página — e cada ?theme= diferente era uma página à parte no cache.
   Subir CACHE_NAME apaga o cache velho de quem já visitou.

   O QUE NUNCA ENTRA NO CACHE:
   - Requisições que não são GET (o login/cadastro/admin usam POST
     pra falar com o Apps Script — cachear isso não faz sentido e
     poderia até causar bug de sessão).
   - Chamadas para script.google.com (o backend de login): sempre
     precisam ir na rede de verdade, nunca responder com algo velho.
   ================================================================ */

const CACHE_NAME = 'quimix-cache-v4';

// Alguns arquivos "essenciais" da página inicial são pré-carregados
// assim que o service worker instala, pra primeira visita offline já
// funcionar. O resto (todos os outros simuladores, imagens, etc.) vai
// entrando no cache sozinho, conforme a pessoa for navegando por eles
// — não precisamos (nem devemos) listar os 287 arquivos aqui.
//
// As bibliotecas e fontes abaixo eram carregadas de CDN externo
// (cdnjs, d3js.org, fonts.googleapis.com) — foram trazidas pra dentro
// do projeto (ver vendor/) justamente pra não depender de nenhum
// domínio de fora funcionando na primeira visita offline. Sem essa
// lista aqui, elas só entrariam em cache DEPOIS de alguém abrir o
// SILQ/SIFI/SIE/SITP pelo menos uma vez com internet — pré-carregar
// evita essa pegadinha.
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.svg',
  './favicon-32.png',
  './favicon-16.png',
  './favicon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/fonts/fontes-locais.css',
  './vendor/js/gsap-3.12.5.min.js',
  './vendor/js/matter-0.19.0.min.js',
  './vendor/js/d3-7.min.js',
];

// Nunca cachear (nem tentar responder do cache) requisições que
// contenham qualquer um desses trechos na URL.
const NUNCA_CACHEAR = [
  'script.google.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requisicao = event.request;

  if (requisicao.method !== 'GET') return;
  if (NUNCA_CACHEAR.some((trecho) => requisicao.url.includes(trecho))) return;

  event.respondWith(
    fetch(requisicao)
      .then((respostaDaRede) => {
        // Guarda em cache respostas normais (mesmo domínio) e
        // também respostas "opacas" (recursos de outro domínio,
        // tipo fontes do Google — não dá pra checar se deram certo,
        // mas ainda vale guardar pra funcionar offline).
        if (respostaDaRede && (respostaDaRede.ok || respostaDaRede.type === 'opaque')) {
          const copia = respostaDaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(requisicao, copia));
        }
        return respostaDaRede;
      })
      // sem internet: a cópia do cache; se o endereço mudou só nos
      // parâmetros (?theme=...), serve a mesma página guardada
      .catch(() => caches.match(requisicao)
        .then((r) => r || caches.match(requisicao, { ignoreSearch: true })))
  );
});
