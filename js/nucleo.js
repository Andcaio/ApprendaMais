/* Apprenda+ — protótipo navegável
 * Núcleo: armazenamento, utilitários, roteador, casca da aplicação e componentes.
 */
(function () {
  const AP = window.AP;
  const CHAVE = 'apprenda-prototipo-v1';
  const inicioSessao = Date.now();
  AP.ui = {};

  /* ================= Armazenamento ================= */
  AP.carregar = function () {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) {
        const dados = JSON.parse(s);
        if (dados && dados.versao === 1) { AP.db = dados; return; }
      }
    } catch (e) { /* armazenamento indisponível: segue com os dados de exemplo */ }
    AP.db = AP.criarDadosIniciais();
  };
  AP.salvar = function () {
    try { localStorage.setItem(CHAVE, JSON.stringify(AP.db)); } catch (e) { /* ignora */ }
  };
  AP.restaurar = function () {
    AP.db = AP.criarDadosIniciais();
    AP.ui = {};
    AP.salvar();
  };
  AP.novoId = (prefixo) => prefixo + (++AP.db.seq);

  /* Relógio do protótipo: parte da data simulada e avança com o tempo real. */
  AP.agora = () => new Date(AP.AGORA.getTime() + (Date.now() - inicioSessao));

  /* ================= Utilitários ================= */
  const pad = (n) => String(n).padStart(2, '0');
  AP.pad = pad;
  AP.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  AP.dataLocal = function (iso) {
    const [d, t = '00:00'] = String(iso).split('T');
    const [y, m, dd] = d.split('-').map(Number);
    const [h, mi] = t.split(':').map(Number);
    return new Date(y, m - 1, dd, h || 0, mi || 0);
  };
  AP.isoLocal = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  const comoData = (v) => (v instanceof Date ? v : AP.dataLocal(v));

  AP.moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  AP.fmtHora = (v) => { const d = comoData(v); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  AP.fmtDia = (v) => { const d = comoData(v); return `${AP.DIAS_CURTOS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  AP.fmtData = (v) => { const d = comoData(v); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  AP.fmtDiaHora = (v) => `${AP.fmtDia(v)} às ${AP.fmtHora(v)}`;
  AP.fmtDataHora = (v) => `${AP.fmtData(v)} às ${AP.fmtHora(v)}`;
  AP.fmtExtenso = (v) => comoData(v).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  AP.fmtIntervalo = (v) => { const d = comoData(v); const f = new Date(d.getTime() + 36e5); return `${AP.fmtHora(d)} às ${AP.fmtHora(f)}`; };
  AP.hh = (h) => `${pad(h)}:00`;
  AP.mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  AP.rotuloDia = function (v) {
    const d = comoData(v);
    const hoje = new Date(AP.AGORA); const amanha = new Date(AP.AGORA); amanha.setDate(amanha.getDate() + 1);
    if (AP.mesmoDia(d, hoje)) return 'hoje';
    if (AP.mesmoDia(d, amanha)) return 'amanhã';
    return AP.fmtDia(d);
  };

  AP.horasAte = (iso) => (AP.dataLocal(iso) - AP.AGORA) / 36e5;
  AP.idade = function (nasc) {
    if (!nasc) return null;
    const n = AP.dataLocal(nasc);
    let i = AP.AGORA.getFullYear() - n.getFullYear();
    const m = AP.AGORA.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && AP.AGORA.getDate() < n.getDate())) i--;
    return i;
  };

  AP.soDigitos = (s) => String(s || '').replace(/\D/g, '');
  AP.formatarCPF = (c) => AP.soDigitos(c).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  AP.mascararCPF = (c) => { const d = AP.soDigitos(c); return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`; };
  AP.validarCPF = function (v) {
    const d = AP.soDigitos(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    return AP.gerarCPF(d.slice(0, 9)) === d;
  };
  AP.validarEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  AP.mascararEmail = (e) => { const [u, dom] = String(e).split('@'); return `${u.slice(0, 1)}***@${dom}`; };
  AP.criteriosSenha = (s) => [
    { ok: s.length >= 8, texto: 'Pelo menos 8 caracteres' },
    { ok: /[A-Za-zÀ-ÿ]/.test(s), texto: 'Pelo menos uma letra' },
    { ok: /\d/.test(s), texto: 'Pelo menos um número' },
  ];
  AP.senhaValida = (s) => AP.criteriosSenha(s).every((c) => c.ok);
  AP.lerValor = (texto) => { const n = Number(String(texto).replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
  AP.primeiroNome = (nome) => String(nome).split(' ')[0];
  AP.plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  AP.gerarCodigo = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r = ''; for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)]; return r; };

  AP.mascaraCPF = function (input) {
    input.addEventListener('input', () => {
      const d = AP.soDigitos(input.value).slice(0, 11);
      let v = d;
      if (d.length > 9) v = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
      else if (d.length > 6) v = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      else if (d.length > 3) v = `${d.slice(0, 3)}.${d.slice(3)}`;
      input.value = v;
    });
  };
  AP.mascaraTelefone = function (input) {
    input.addEventListener('input', () => {
      const d = AP.soDigitos(input.value).slice(0, 11);
      let v = d;
      if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      else if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      input.value = v;
    });
  };
  AP.formatarTelefone = (t) => { const d = AP.soDigitos(t); return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : t; };

  AP.plataforma = (url) => (/meet\.google\./i.test(url) ? 'Google Meet' : /zoom\.us/i.test(url) ? 'Zoom' : /teams\.(microsoft|live)\./i.test(url) ? 'Microsoft Teams' : 'plataforma externa');

  /* ================= Consultas ================= */
  AP.usuario = (id) => AP.db.usuarios.find((u) => u.id === id);
  AP.responsavel = (id) => AP.db.responsaveis.find((r) => r.id === id);
  AP.agendamento = (id) => AP.db.agendamentos.find((a) => a.id === id);
  AP.logado = (papel) => AP.usuario(AP.db.sessao[papel]);
  AP.ofertasDo = (tid) => AP.db.ofertas.filter((o) => o.tutorId === tid);
  AP.dispDo = (tid) => AP.db.disponibilidades.filter((d) => d.tutorId === tid);
  AP.documentosDo = (tid) => AP.db.documentos.filter((d) => d.tutorId === tid);
  AP.autorizacoesDo = (aid) => AP.db.autorizacoes.filter((a) => a.alunoId === aid).sort((a, b) => b.dataEnvio.localeCompare(a.dataEnvio));
  AP.ocupando = (tid) => AP.db.agendamentos.filter((a) => a.tutorId === tid && (a.status === 'PENDENTE' || a.status === 'CONFIRMADA'));
  AP.blocoOcupado = (tid, iso) => AP.ocupando(tid).some((a) => a.inicio === iso);
  AP.tutorPesquisavel = (t) => !!t && t.tipo === 'tutor' && t.statusAprovacao === 'APROVADO' && t.status === 'ATIVO' && AP.ofertasDo(t.id).length > 0;
  AP.contraparte = (ag, papel) => AP.usuario(papel === 'aluno' ? ag.tutorId : ag.alunoId);
  AP.agendamentosDe = (papel, id) => AP.db.agendamentos.filter((a) => (papel === 'aluno' ? a.alunoId === id : a.tutorId === id));

  /* Blocos de 60 min livres de um tutor nos próximos N dias (RF07 + RN03). */
  AP.blocosLivres = function (tid, dias = 7) {
    const out = [];
    const base = new Date(AP.AGORA); base.setHours(0, 0, 0, 0);
    const disp = AP.dispDo(tid);
    for (let i = 0; i < dias; i++) {
      const dia = new Date(base); dia.setDate(base.getDate() + i);
      disp.filter((x) => x.dia === dia.getDay()).forEach((x) => {
        for (let h = x.inicio; h < x.fim; h++) {
          const dt = new Date(dia); dt.setHours(h, 0, 0, 0);
          if (dt <= AP.AGORA) continue;
          const iso = AP.isoLocal(dt);
          if (!AP.blocoOcupado(tid, iso)) out.push(iso);
        }
      });
    }
    return out.sort();
  };

  AP.fimAula = (ag) => new Date(AP.dataLocal(ag.inicio).getTime() + 36e5);
  AP.limiteChat = (ag) => new Date(AP.fimAula(ag).getTime() + 24 * 36e5);
  AP.chatLiberado = (ag) => !!ag.confirmadoEm;
  AP.chatAberto = (ag) => ag.status === 'CONFIRMADA' && AP.AGORA < AP.limiteChat(ag);
  AP.ehFutura = (ag) => AP.dataLocal(ag.inicio) > AP.AGORA;
  AP.mensagensDe = (gid) => AP.db.mensagens.filter((m) => m.agendamentoId === gid).sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  /* ================= Ícones ================= */
  const ICONES = {
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.5 3.5 5.2"/>',
    casa: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    caixa: '<path d="M4 13 6.5 5h11L20 13v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
    livro: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    escudo: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    documento: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    lapis: '<path d="m4 20 1-4L16 5l3 3L8 19z"/>',
    lixeira: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    voltar: '<path d="M15 5l-7 7 7 7"/>',
    local: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    mapa: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  };
  AP.icone = (n, cls = '') => `<svg class="icone ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[n] || ''}</svg>`;

  /* ================= Componentes ================= */
  const CORES_AVATAR = ['#DCE2FB', '#D8EFE3', '#FFEDBF', '#F8DCD6', '#E5DEF6', '#D5ECF2'];
  AP.iniciais = (nome) => { const p = String(nome).trim().split(/\s+/); return ((p[0] || '')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
  AP.avatar = function (u, tam = '') {
    if (!u) return '';
    const cls = `avatar${tam ? ' avatar--' + tam : ''}`;
    if (u.foto) return `<span class="${cls}"><img src="${u.foto}" alt="Foto de ${AP.esc(u.nome)}"></span>`;
    let h = 0; for (const c of u.nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `<span class="${cls}" style="--av:${CORES_AVATAR[h % CORES_AVATAR.length]}" aria-hidden="true">${AP.esc(AP.iniciais(u.nome))}</span>`;
  };
  AP.selo = (texto, tom) => `<span class="selo selo--${tom}">${AP.esc(texto)}</span>`;
  AP.seloAgendamento = (st) => AP.selo(AP.STATUS_AGENDAMENTO[st], { PENDENTE: 'ambar', CONFIRMADA: 'verde', RECUSADA: 'vermelho', CANCELADA: 'cinza', EXPIRADA: 'cinza' }[st]);
  AP.seloConta = (st) => AP.selo(AP.STATUS_CONTA[st], { ATIVO: 'verde', PENDENTE: 'ambar', SUSPENSO: 'vermelho', BLOQUEADO: 'escuro' }[st]);
  AP.seloAprovacao = (st) => AP.selo(AP.STATUS_APROVACAO[st], { PENDENTE: 'ambar', APROVADO: 'verde', REJEITADO: 'vermelho' }[st]);
  AP.seloAutorizacao = (st) => AP.selo(AP.STATUS_AUTORIZACAO[st], { PENDENTE: 'ambar', CONFIRMADA: 'verde', RECUSADA: 'vermelho', EXPIRADA: 'cinza' }[st]);
  AP.nivelNome = (n) => (AP.NIVEIS[n] ? AP.NIVEIS[n].nome : n);
  AP.descOferta = (o) => `${o.disciplina}, ${AP.nivelNome(o.nivel)}, ${AP.MODALIDADES[o.modalidade].toLowerCase()}`;
  AP.vazio = (titulo, texto, acao = '') => `<div class="vazio"><h2>${titulo}</h2><p>${texto}</p>${acao}</div>`;
  AP.logo = () => '<a class="logo" href="#/" aria-label="Apprenda+, página inicial">Apprenda<span class="logo__mais" aria-hidden="true">+</span></a>';
  AP.opcoes = (pares, sel) => pares.map(([v, t]) => `<option value="${AP.esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${AP.esc(t)}</option>`).join('');
  AP.opcoesNivel = (sel, vazio) => (vazio ? `<option value="">${vazio}</option>` : '') + AP.opcoes(AP.ORDEM_NIVEIS.map((n) => [n, AP.NIVEIS[n].nome]), sel);
  AP.opcoesHoras = (de, ate, sel) => { const p = []; for (let h = de; h <= ate; h++) p.push([h, AP.hh(h)]); return AP.opcoes(p, sel); };

  /* Avisos (toasts) */
  AP.avisar = function (msg, tipo = 'sucesso') {
    const box = document.getElementById('avisos');
    const el = document.createElement('div');
    el.className = `aviso aviso--${tipo}`;
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('saindo'); setTimeout(() => el.remove(), 320); }, 5200);
  };

  /* Diálogos */
  AP.dialogo = function ({ titulo, corpo, acoes, classe = '' }) {
    const d = document.createElement('dialog');
    d.className = `dialogo ${classe}`;
    d.setAttribute('aria-labelledby', 'dlg-titulo');
    d.innerHTML = `<form class="dialogo__form" novalidate>
      <header class="dialogo__topo"><h2 id="dlg-titulo">${titulo}</h2>
        <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${AP.icone('fechar')}</button></header>
      <div class="dialogo__corpo">${corpo}</div>
      ${acoes ? `<footer class="dialogo__rodape">${acoes}</footer>` : ''}
    </form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => d.close()));
    d.showModal();
    const foco = d.querySelector('[autofocus], textarea, input:not([type=hidden]), select');
    if (foco) foco.focus();
    return d;
  };
  AP.confirmar = function ({ titulo, texto, botao, perigo = false }) {
    return new Promise((resolve) => {
      let ok = false;
      const d = AP.dialogo({
        titulo,
        corpo: `<p>${texto}</p>`,
        acoes: `<button type="button" class="btn btn--secundario" data-fechar>Voltar</button>
                <button type="submit" class="btn ${perigo ? 'btn--perigo' : 'btn--primario'}">${botao}</button>`,
      });
      d.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); ok = true; d.close(); });
      d.addEventListener('close', () => resolve(ok));
      d.querySelector('button[type=submit]').focus();
    });
  };

  /* Erros de formulário */
  AP.limparErros = function (form) {
    form.querySelectorAll('.erro-campo').forEach((e) => e.remove());
    form.querySelectorAll('[aria-invalid]').forEach((i) => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
    form.querySelectorAll('.nota--form').forEach((e) => e.remove());
  };
  AP.erro = function (campo, msg) {
    if (!campo) return;
    const id = (campo.id || campo.name || 'campo') + '-erro';
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', id);
    const p = document.createElement('p');
    p.className = 'erro-campo';
    p.id = id;
    p.textContent = msg;
    const alvo = campo.closest('.campo') || campo.closest('fieldset') || campo.parentElement;
    alvo.appendChild(p);
  };
  AP.focarErro = function (form) {
    const c = form.querySelector('[aria-invalid="true"]');
    if (c) c.focus();
  };
  AP.notaForm = function (form, html, tipo = 'erro', antesDe) {
    const n = document.createElement('div');
    n.className = `nota nota--${tipo} nota--form`;
    n.setAttribute('role', 'alert');
    n.innerHTML = html;
    const ref = antesDe || form.querySelector('[type=submit]');
    if (ref && ref.parentElement) ref.parentElement.insertBefore(n, ref); else form.appendChild(n);
    return n;
  };

  /* ================= Roteador ================= */
  AP.rotas = [];
  AP.rota = (def) => AP.rotas.push(def);
  function casar(padrao, caminho) {
    const p = padrao.split('/');
    const c = caminho.split('/');
    if (p.length !== c.length) return null;
    const params = {};
    for (let i = 0; i < p.length; i++) {
      if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(c[i]);
      else if (p[i] !== c[i]) return null;
    }
    return params;
  }
  AP.lerHash = function () {
    const h = location.hash.replace(/^#/, '') || '/';
    const [caminho, q = ''] = h.split('?');
    return { caminho: caminho || '/', query: Object.fromEntries(new URLSearchParams(q)) };
  };
  AP.ir = function (hash) {
    if (location.hash === hash) AP.renderizar(true);
    else location.hash = hash;
  };
  AP.atualizar = () => AP.renderizar(false);

  AP.renderizar = function (navegou) {
    const { caminho, query } = AP.lerHash();
    let rota = null; let params = {};
    for (const r of AP.rotas) { const m = casar(r.caminho, caminho); if (m) { rota = r; params = m; break; } }
    if (!rota) rota = AP.rotas.find((r) => r.caminho === '/');
    const ctx = { params, query, caminho };
    const scroll = window.scrollY;
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());

    const raiz = document.getElementById('app');
    raiz.innerHTML = AP.casca(rota, ctx);
    const main = document.getElementById('conteudo');
    main.innerHTML = rota.render(ctx);
    if (rota.montar) rota.montar(main, ctx);
    AP.atualizarBarra(rota);
    document.title = `${rota.titulo} | Apprenda+`;
    if (navegou) {
      window.scrollTo(0, 0);
      const h1 = main.querySelector('h1');
      if (h1 && AP._jaRenderizou) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    } else {
      window.scrollTo(0, scroll);
    }
    AP._jaRenderizou = true;
  };

  /* ================= Casca ================= */
  const PAPEIS = { aluno: 'Aluno', tutor: 'Tutor', admin: 'Administração' };
  AP.menu = function (area) {
    if (area === 'aluno') {
      return [
        ['#/aluno/buscar', 'Buscar tutores', 'busca'],
        ['#/aluno/agenda', 'Minha agenda', 'calendario'],
        ['#/aluno/conversas', 'Conversas', 'chat'],
        ['#/aluno/perfil', 'Meu perfil', 'usuario'],
      ];
    }
    if (area === 'tutor') {
      const pend = AP.db.agendamentos.filter((a) => a.tutorId === AP.db.sessao.tutor && a.status === 'PENDENTE').length;
      return [
        ['#/tutor/inicio', 'Início', 'casa'],
        ['#/tutor/solicitacoes', 'Solicitações', 'caixa', pend],
        ['#/tutor/agenda', 'Minha agenda', 'calendario'],
        ['#/tutor/disciplinas', 'Minhas disciplinas', 'livro'],
        ['#/tutor/disponibilidade', 'Minha disponibilidade', 'relogio'],
        ['#/tutor/conversas', 'Conversas', 'chat'],
        ['#/tutor/perfil', 'Meu perfil', 'usuario'],
      ];
    }
    const pendTut = AP.db.usuarios.filter((u) => u.tipo === 'tutor' && u.statusAprovacao === 'PENDENTE').length;
    return [
      ['#/admin/tutores', 'Análise de tutores', 'escudo', pendTut],
      ['#/admin/usuarios', 'Usuários', 'usuarios'],
    ];
  };

  AP.casca = function (rota, ctx) {
    const area = rota.area;
    if (area === 'aluno' || area === 'tutor' || area === 'admin') {
      const u = AP.logado(area);
      const itens = AP.menu(area).map(([href, rotulo, ic, cont]) => {
        const base = href.slice(1);
        const atual = ctx.caminho === base || ctx.caminho.startsWith(base + '/') || (rota.menu && rota.menu === base);
        return `<li><a href="${href}"${atual ? ' aria-current="page"' : ''}>${AP.icone(ic)}<span>${rotulo}</span>${cont ? `<span class="menu__contador" aria-label="${cont} pendentes">${cont}</span>` : ''}</a></li>`;
      }).join('');
      return `<div class="app">
        <aside class="lateral">
          ${AP.logo()}
          <p class="lateral__papel">Área do ${PAPEIS[area] === 'Administração' ? 'administrador' : PAPEIS[area].toLowerCase()}</p>
          <nav aria-label="Menu principal"><ul class="menu">${itens}</ul></nav>
          <div class="lateral__usuario">${AP.avatar(u)}<div class="lateral__nome"><strong>${AP.esc(u.nome)}</strong><a href="#/entrar">Sair</a></div></div>
        </aside>
        <main id="conteudo" class="conteudo" tabindex="-1"></main>
      </div>`;
    }
    let nav = '';
    if (area === 'publico' || area === 'mapa') nav = '<nav class="topo-publico__nav" aria-label="Conta"><a class="btn btn--texto" href="#/entrar">Entrar</a><a class="btn btn--primario btn--pequeno" href="#/cadastro">Criar conta</a></nav>';
    else if (area === 'responsavel') nav = '<span class="topo-publico__rotulo">Autorização do responsável legal</span>';
    else nav = '<nav class="topo-publico__nav" aria-label="Conta"><a class="btn btn--texto" href="#/entrar">Sair</a></nav>';
    return `<header class="topo-publico">${AP.logo()}${nav}</header>
      <main id="conteudo" class="pagina-publica${rota.largo ? ' pagina-publica--larga' : ''}" tabindex="-1"></main>
      <footer class="rodape-publico">Apprenda+ é um protótipo acadêmico da disciplina de Modelagem de Software. Palmas – TO, 2026.</footer>`;
  };

  /* Barra do protótipo (fica fora da interface do sistema) */
  AP.atualizarBarra = function (rota) {
    const el = document.getElementById('barra-prototipo');
    const perfis = [
      ['Visitante', '#/', ['publico']],
      ['Aluno', '#/aluno/buscar', ['aluno']],
      ['Tutor', '#/tutor/inicio', ['tutor']],
      ['Administrador', '#/admin/tutores', ['admin']],
      ['Responsável legal', '#/autorizacao', ['responsavel']],
    ];
    const codigos = (rota.uc || []).map((c) => `<span class="barra__codigo">${c}</span>`).join('');
    el.innerHTML = `<div class="barra">
      <p class="barra__marca"><strong>Protótipo Apprenda+</strong> <span>Data simulada: ${AP.fmtDia(AP.AGORA)}/2026, ${AP.fmtHora(AP.AGORA)}</span></p>
      <nav class="barra__perfis" aria-label="Ver o protótipo como">${perfis.map(([t, h, areas]) => `<a href="${h}"${areas.includes(rota.area) ? ' aria-current="true"' : ''}>${t}</a>`).join('')}</nav>
      <p class="barra__ref">${codigos}<span>${AP.esc(rota.titulo)}</span></p>
      <div class="barra__acoes"><a href="#/mapa">Mapa de telas</a><button type="button" data-restaurar>Restaurar dados</button><button type="button" data-ocultar>Ocultar barra</button></div>
    </div>`;
  };

  AP.iniciar = function () {
    AP.carregar();
    if (/[?&]limpo\b/.test(location.search)) document.body.classList.add('limpo');

    document.getElementById('barra-prototipo').addEventListener('click', async (e) => {
      if (e.target.closest('[data-restaurar]')) {
        const ok = await AP.confirmar({ titulo: 'Restaurar dados de exemplo?', texto: 'Tudo o que você fez no protótipo (cadastros, solicitações, mensagens) será apagado e os dados iniciais voltam.', botao: 'Restaurar dados' });
        if (ok) { AP.restaurar(); AP.renderizar(true); AP.avisar('Dados de exemplo restaurados.'); }
      }
      if (e.target.closest('[data-ocultar]')) document.body.classList.add('barra-oculta');
    });
    document.getElementById('mostrar-barra').addEventListener('click', () => document.body.classList.remove('barra-oculta'));
    document.getElementById('pular').addEventListener('click', () => { const m = document.getElementById('conteudo'); if (m) m.focus(); });
    window.addEventListener('hashchange', () => AP.renderizar(true));
    AP.renderizar(true);
  };
})();
