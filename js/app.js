/* Apprenda+ — mapa de telas, apresentador e inicialização */
(function () {
  const AP = window.AP;

  /* Grupos na ordem do mapa, com o ícone de cada ator */
  const GRUPOS = [
    ['Área pública', 'casa'],
    ['Responsável legal', 'email'],
    ['Aluno', 'usuario'],
    ['Tutor', 'livro'],
    ['Administrador', 'escudo'],
  ];

  /* Tamanhos do apresentador (computador e celular são os mesmos das capturas) */
  const APARELHOS = {
    computador: { nome: 'Computador', largura: 1440, altura: 900 },
    tablet: { nome: 'Tablet', largura: 820, altura: 1180 },
    celular: { nome: 'Celular', largura: 390, altura: 844 },
  };
  const CHAVE_APARELHO = 'apprenda-mapa-aparelho';
  const lerAparelho = () => {
    let v = null;
    try { v = localStorage.getItem(CHAVE_APARELHO); } catch (e) { /* sem armazenamento */ }
    if (APARELHOS[v]) return v;
    return window.innerWidth < 700 ? 'celular' : 'computador';
  };
  const gravarAparelho = (v) => { try { localStorage.setItem(CHAVE_APARELHO, v); } catch (e) { /* sem armazenamento */ } };

  const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const idGrupo = (g) => `g-${g.replace(/\W/g, '')}`;
  /* Endereço completo de uma tela; "limpo" abre sem a barra do protótipo */
  const urlTela = (hash, limpo) => location.href.split('#')[0].split('?')[0] + (limpo ? '?limpo' : '') + hash;
  const ehCampo = (el) => !!(el && el.closest && el.closest('input, textarea, select, [contenteditable]'));

  /* Lista plana de telas (variações logo depois da tela principal) */
  let TELAS = [];
  function listarTelas() {
    const telas = [];
    GRUPOS.forEach(([grupo]) => {
      AP.rotas.filter((r) => r.grupo === grupo && r.exemplo).forEach((r) => {
        const uc = r.uc || [];
        telas.push({ titulo: r.titulo, uc, hash: r.exemplo, grupo });
        (r.variacoes || []).forEach(([titulo, hash]) => telas.push({ titulo, uc, hash, grupo, pai: r.titulo }));
      });
    });
    return telas.map((t, i) => ({ ...t, i, busca: normalizar([t.titulo, t.pai, t.grupo, t.hash, ...t.uc].join(' ')) }));
  }

  const itemTela = (t) => `<li class="tela${t.pai ? ' tela--variacao' : ''}" data-i="${t.i}">
      <div class="tela__info">
        <h3 class="tela__titulo">${t.pai ? '<span class="tela__seta" aria-hidden="true">↳</span>' : ''}${AP.esc(t.titulo)}</h3>
        <div class="tela__meta">${t.uc.map((c) => `<button type="button" class="codigo-uc" data-uc="${c}" title="Mostrar só as telas de ${c}">${c}</button>`).join('')}<code class="tela__rota">${AP.esc(t.hash)}</code></div>
      </div>
      <div class="tela__acoes">
        <button type="button" class="btn btn--secundario btn--pequeno" data-ver="${t.i}">${AP.icone('olho')}Visualizar<span class="sr"> ${AP.esc(t.titulo)}</span></button>
        <a class="btn btn--texto btn--pequeno" href="${t.hash}">Abrir<span class="sr"> ${AP.esc(t.titulo)}</span></a>
        <a class="btn-icone" href="?limpo${t.hash}" target="_blank" rel="noopener" title="Abrir sem a barra, em nova aba (para captura)" aria-label="${AP.esc(t.titulo)}: abrir sem a barra, em nova aba">${AP.icone('externo')}</a>
        <button type="button" class="btn-icone" data-copiar="${t.i}" title="Copiar link" aria-label="${AP.esc(t.titulo)}: copiar link">${AP.icone('copiar')}</button>
      </div>
    </li>`;

  async function copiarLink(t) {
    const url = urlTela(t.hash, false);
    try {
      await navigator.clipboard.writeText(url);
      AP.avisar(`Link copiado: ${t.titulo}`);
    } catch (e) {
      AP.avisar(`Não deu para copiar. Link: ${url}`, 'info');
    }
  }

  /* ================= Apresentador ================= */
  function apresentar(lista, inicio) {
    if (!lista.length) return;
    const gatilho = document.activeElement;
    let pos = Math.max(0, inicio);
    let aparelho = lerAparelho();

    const grupos = [...new Set(lista.map((t) => t.grupo))];
    const opcoes = grupos.map((g) => `<optgroup label="${AP.esc(g)}">${lista.map((t, k) => (t.grupo === g
      ? `<option value="${k}">${k + 1}. ${t.pai ? '– ' : ''}${AP.esc(t.titulo)}</option>` : '')).join('')}</optgroup>`).join('');

    const d = document.createElement('dialog');
    d.className = 'apresentador';
    d.setAttribute('aria-labelledby', 'apr-titulo');
    d.innerHTML = `
      <header class="apresentador__topo">
        <div class="apresentador__id">
          <p class="apresentador__contexto"><span class="apresentador__pos" data-pos></span><span data-contexto></span></p>
          <h2 id="apr-titulo" data-titulo></h2>
          <p class="apresentador__ucs" data-ucs></p>
        </div>
        <div class="apresentador__aparelhos" role="group" aria-label="Tamanho da tela">
          ${Object.entries(APARELHOS).map(([k, a]) => `<button type="button" data-aparelho="${k}" aria-label="${a.nome}" title="${a.nome} (${a.largura} × ${a.altura})">${AP.icone(k)}<span aria-hidden="true">${a.nome}</span></button>`).join('')}
        </div>
        <div class="apresentador__acoes">
          <button type="button" class="btn-icone" data-recarregar title="Voltar a tela ao estado inicial" aria-label="Recarregar a tela">${AP.icone('recarregar')}</button>
          <button type="button" class="btn-icone" data-copiar-apr title="Copiar link" aria-label="Copiar link da tela">${AP.icone('copiar')}</button>
          <a class="btn-icone" data-externo target="_blank" rel="noopener" title="Abrir sem a barra, em nova aba" aria-label="Abrir sem a barra, em nova aba">${AP.icone('externo')}</a>
          <a class="btn btn--secundario btn--pequeno" data-abrir>Abrir aqui</a>
          <button type="button" class="btn-icone" data-fechar title="Fechar (Esc)" aria-label="Fechar apresentação">${AP.icone('fechar')}</button>
        </div>
      </header>
      <div class="apresentador__palco papel-quadriculado">
        <button type="button" class="apresentador__seta" data-ant aria-label="Tela anterior" title="Tela anterior (←)">${AP.icone('voltar')}</button>
        <div class="apresentador__area" data-area>
          <div class="apresentador__moldura" data-moldura><iframe data-frame title="Pré-visualização da tela"></iframe></div>
        </div>
        <button type="button" class="apresentador__seta" data-prox aria-label="Próxima tela" title="Próxima tela (→)">${AP.icone('avancar')}</button>
      </div>
      <footer class="apresentador__rodape">
        <label class="apresentador__ir"><span>Ir para</span><select data-ir>${opcoes}</select></label>
        <p class="ajuda"><kbd aria-label="Seta para a esquerda">${AP.icone('voltar')}</kbd> <kbd aria-label="Seta para a direita">${AP.icone('avancar')}</kbd> passam as telas · <kbd>Esc</kbd> fecha · a tela funciona de verdade: dá para clicar, preencher e navegar.</p>
        <span class="apresentador__escala" data-escala></span>
      </footer>`;

    const $ = (s) => d.querySelector(s);
    const frame = $('[data-frame]');
    const moldura = $('[data-moldura]');
    const area = $('[data-area]');
    if (lista.length < 2) d.querySelectorAll('[data-ant], [data-prox]').forEach((b) => { b.hidden = true; });

    function ajustar() {
      const a = APARELHOS[aparelho];
      const cs = getComputedStyle(moldura);
      const bordaH = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      const bordaV = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      /* 16 px de folga para a sombra amarela da moldura */
      const escala = Math.max(0.1, Math.min(1, (area.clientWidth - bordaH - 16) / a.largura, (area.clientHeight - bordaV - 16) / a.altura));
      frame.style.width = `${a.largura}px`;
      frame.style.height = `${a.altura}px`;
      frame.style.transform = `scale(${escala})`;
      moldura.style.width = `${Math.floor(a.largura * escala)}px`;
      moldura.style.height = `${Math.floor(a.altura * escala)}px`;
      $('[data-escala]').textContent = `${a.largura} × ${a.altura} px · ${Math.round(escala * 100)}%`;
    }

    /* Em tablet e celular a barra de rolagem fica por cima, como no aparelho: a largura útil é a real (390 px) */
    function rolagemDoAparelho() {
      try { frame.contentDocument.documentElement.style.scrollbarWidth = aparelho === 'computador' ? '' : 'none'; } catch (e) { /* aberto direto do arquivo */ }
    }

    function usarAparelho(k) {
      aparelho = k;
      gravarAparelho(k);
      d.querySelectorAll('[data-aparelho]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.aparelho === k)));
      moldura.dataset.aparelho = k;
      rolagemDoAparelho();
      ajustar();
    }

    function carregar(forcar) {
      const alvo = urlTela(lista[pos].hash, true);
      try {
        if (forcar && frame.contentWindow.location.href === alvo) { frame.contentWindow.location.reload(); return; }
      } catch (e) { /* aberto direto do arquivo: o navegador não deixa ler o iframe */ }
      frame.src = alvo;
    }

    function mostrar(novo) {
      pos = (novo + lista.length) % lista.length;
      const t = lista[pos];
      $('[data-pos]').textContent = `${pos + 1} de ${lista.length}`;
      $('[data-contexto]').textContent = t.pai ? `${t.grupo} · variação de “${t.pai}”` : t.grupo;
      $('[data-titulo]').textContent = t.titulo;
      $('[data-ucs]').innerHTML = t.uc.map((c) => `<span class="codigo-uc">${c}</span>`).join('') + `<code>${AP.esc(t.hash)}</code>`;
      $('[data-ir]').value = String(pos);
      $('[data-abrir]').href = t.hash;
      $('[data-externo]').href = `?limpo${t.hash}`;
      frame.title = `Pré-visualização da tela ${t.titulo}`;
      carregar(false);
    }

    function teclas(e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || ehCampo(e.target)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(pos + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(pos - 1); }
    }
    d.addEventListener('keydown', teclas);
    /* Com o foco dentro da tela, as setas e o Esc continuam valendo (exceto em campos e diálogos da tela) */
    frame.addEventListener('load', () => {
      rolagemDoAparelho();
      try {
        frame.contentDocument.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !ehCampo(e.target) && !frame.contentDocument.querySelector('dialog[open]')) { d.close(); return; }
          teclas(e);
        });
      } catch (e) { /* aberto direto do arquivo */ }
    });

    d.addEventListener('click', (e) => {
      const ap = e.target.closest('[data-aparelho]');
      if (ap) { usarAparelho(ap.dataset.aparelho); return; }
      if (e.target.closest('[data-ant]')) { mostrar(pos - 1); return; }
      if (e.target.closest('[data-prox]')) { mostrar(pos + 1); return; }
      if (e.target.closest('[data-recarregar]')) { carregar(true); return; }
      if (e.target.closest('[data-copiar-apr]')) { copiarLink(lista[pos]); return; }
      if (e.target.closest('[data-fechar]')) { d.close(); return; }
      if (e.target.closest('[data-abrir]')) {
        e.preventDefault();
        AP.carregar();
        d.close();
        AP.ir(lista[pos].hash);
      }
    });
    $('[data-ir]').addEventListener('change', (e) => mostrar(Number(e.target.value)));

    const observador = new ResizeObserver(ajustar);
    d.addEventListener('close', () => {
      observador.disconnect();
      /* A tela no iframe pode ter mudado os dados: relê para o mapa não gravar uma cópia antiga */
      AP.carregar();
      d.remove();
      if (gatilho && gatilho.isConnected) gatilho.focus();
    });

    document.body.appendChild(d);
    d.showModal();
    usarAparelho(aparelho);
    observador.observe(area);
    mostrar(pos);
    $(lista.length > 1 ? '[data-prox]' : '[data-fechar]').focus();
  }

  /* ================= Mapa de telas ================= */
  AP.rota({
    caminho: '/mapa', area: 'mapa', titulo: 'Mapa de telas', uc: [], largo: true,
    render({ query }) {
      TELAS = listarTelas();
      const grupos = GRUPOS.map(([g, ic]) => ({ g, ic, lista: TELAS.filter((t) => t.grupo === g) })).filter((x) => x.lista.length);
      const ator = grupos.some((x) => x.g === query.ator) ? query.ator : '';
      const chips = [['', 'Todos', TELAS.length], ...grupos.map((x) => [x.g, x.g, x.lista.length])];
      const secoes = grupos.map(({ g, ic, lista }) => `<section class="mapa__grupo" data-grupo="${AP.esc(g)}" aria-labelledby="${idGrupo(g)}">
          <h2 id="${idGrupo(g)}" class="mapa__grupo-titulo">${AP.icone(ic)}<span>${g}</span><span class="mapa__grupo-n"><span data-n>${lista.length}</span><span class="sr"> telas</span></span></h2>
          <ul class="telas">${lista.map(itemTela).join('')}</ul>
        </section>`).join('');
      return `<div class="mapa">
        <header class="cabecalho mapa__cabecalho"><div><h1>Mapa de telas</h1>
          <p>Todas as telas do protótipo, agrupadas por ator, com os casos de uso que cada uma atende. <strong>Visualizar</strong> mostra a tela funcionando aqui mesmo, no tamanho de computador, tablet ou celular.</p></div>
          <button type="button" class="btn btn--primario" data-apresentar>${AP.icone('apresentar')}Apresentar telas</button>
        </header>
        <div class="mapa__layout">
          <div class="mapa__telas">
            <div class="mapa__ferramentas" role="search" aria-label="Filtrar telas">
              <label class="mapa__busca">${AP.icone('busca')}<span class="sr">Buscar tela, rota ou caso de uso</span>
                <input type="search" id="mapa-busca" value="${AP.esc(query.q || '')}" placeholder="Buscar tela ou caso de uso (ex.: UC08)" autocomplete="off" spellcheck="false"></label>
              <fieldset class="mapa__atores"><legend class="sr">Ator</legend>
                ${chips.map(([v, t, n]) => `<label class="chip"><input type="radio" name="mapa-ator" value="${AP.esc(v)}"${v === ator ? ' checked' : ''}><span>${t}</span><span class="chip__n">${n}</span></label>`).join('')}
              </fieldset>
              <p class="mapa__resultado" data-resultado aria-live="polite"></p>
            </div>
            ${secoes}
            <div class="vazio" data-vazio hidden><h2>Nenhuma tela encontrada</h2><p>Tente outro termo ou mostre todos os atores.</p><button type="button" class="btn btn--secundario" data-limpar>Limpar filtros</button></div>
          </div>
          <aside class="painel mapa__cenarios" aria-labelledby="cen">
            <h2 id="cen">Cenários prontos para demonstrar</h2>
            <ul class="lista-marcada">
              <li><strong>Reserva simultânea (UC08.2):</strong> como aluno, no perfil do Rafael, escolha seg, 23/11, 17:00 e envie.</li>
              <li><strong>Cancelamento bloqueado (UC09.2):</strong> na agenda do aluno, a aula de Redação de hoje às 19:00 está a menos de 24 h.</li>
              <li><strong>Link pendente (UC10.1/10.2):</strong> como tutor, informe o link da aula de hoje às 19:00 com a Sofia.</li>
              <li><strong>Chat somente leitura (UC11.1):</strong> a conversa da aula de 16/11 já passou do prazo de 24 h.</li>
              <li><strong>Autorização do responsável (UC01.2):</strong> códigos <code>K7Q2M9</code> (válido) e <code>R2D5LA</code> (expirado).</li>
              <li><strong>Tutor rejeitado (UC04.1):</strong> entre como Lívia para ver a justificativa e reenviar os documentos.</li>
              <li><strong>Perfil indisponível (UC06.2):</strong> <a href="#/aluno/tutor/t11">abra o perfil de um tutor bloqueado</a>.</li>
            </ul>
            <p class="ajuda">A data do protótipo é fixa em quinta-feira, 19/11/2026, às 10:00. Use “Restaurar dados” na barra superior para voltar ao estado inicial.</p>
          </aside>
        </div>
      </div>`;
    },
    montar(main) {
      const busca = main.querySelector('#mapa-busca');
      const resultado = main.querySelector('[data-resultado]');
      const vazio = main.querySelector('[data-vazio]');
      const btnApresentar = main.querySelector('[data-apresentar]');
      const itens = [...main.querySelectorAll('.tela')];
      const secoes = [...main.querySelectorAll('.mapa__grupo')];
      const atorAtual = () => (main.querySelector('[name=mapa-ator]:checked') || {}).value || '';
      const visiveis = () => itens.filter((li) => !li.hidden).map((li) => TELAS[li.dataset.i]);

      function filtrar() {
        const termos = normalizar(busca.value).split(/\s+/).filter(Boolean);
        const ator = atorAtual();
        let total = 0;
        secoes.forEach((s) => {
          const doAtor = !ator || s.dataset.grupo === ator;
          let n = 0;
          s.querySelectorAll('.tela').forEach((li) => {
            const ok = doAtor && termos.every((p) => TELAS[li.dataset.i].busca.includes(p));
            li.hidden = !ok;
            if (ok) n++;
          });
          s.hidden = n === 0;
          s.querySelector('[data-n]').textContent = n;
          total += n;
        });
        vazio.hidden = total > 0;
        btnApresentar.disabled = total === 0;
        resultado.textContent = total === TELAS.length ? `${total} telas` : `${total} de ${TELAS.length} telas`;
        /* Guarda os filtros no endereço (voltar e recarregar mantêm), sem renderizar de novo */
        const q = new URLSearchParams();
        if (busca.value.trim()) q.set('q', busca.value.trim());
        if (ator) q.set('ator', ator);
        const novo = `#/mapa${q.toString() ? `?${q}` : ''}`;
        try { if (location.hash !== novo) history.replaceState(null, '', novo); } catch (e) { /* ignora */ }
      }

      busca.addEventListener('input', filtrar);
      main.querySelector('.mapa__atores').addEventListener('change', filtrar);
      main.addEventListener('click', (e) => {
        const uc = e.target.closest('[data-uc]');
        if (uc) { busca.value = uc.dataset.uc; filtrar(); busca.focus(); return; }
        const ver = e.target.closest('[data-ver]');
        if (ver) { const lista = visiveis(); apresentar(lista, lista.findIndex((t) => t.i === Number(ver.dataset.ver))); return; }
        const cop = e.target.closest('[data-copiar]');
        if (cop) { copiarLink(TELAS[cop.dataset.copiar]); return; }
        if (e.target.closest('[data-apresentar]')) { apresentar(visiveis(), 0); return; }
        if (e.target.closest('[data-limpar]')) {
          busca.value = '';
          main.querySelector('[name=mapa-ator][value=""]').checked = true;
          filtrar();
          busca.focus();
        }
      });
      filtrar();
    },
  });

  document.addEventListener('DOMContentLoaded', AP.iniciar);
})();
