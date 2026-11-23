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
        /* Dados salvos de uma versão anterior dos exemplos são descartados */
        if (dados && dados.versao === 2) { AP.db = dados; return; }
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
    avancar: '<path d="m9 5 7 7-7 7"/>',
    olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    externo: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copiar: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-1-1.7V5a2 2 0 0 1 2-2h9.3A2 2 0 0 1 16 4"/>',
    recarregar: '<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/>',
    computador: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    tablet: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M11 18.5h2"/>',
    celular: '<rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M11 18.5h2"/>',
    apresentar: '<path d="M7 4.5v15l12.5-7.5z"/>',
    minimizar: '<path d="m6 15 6-6 6 6"/>',
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

  function rotaDoHash() {
    const { caminho, query } = AP.lerHash();
    let rota = null; let params = {};
    for (const r of AP.rotas) { const m = casar(r.caminho, caminho); if (m) { rota = r; params = m; break; } }
    if (!rota) rota = AP.rotas.find((r) => r.caminho === '/');
    return { rota, ctx: { params, query, caminho } };
  }

  AP.renderizar = function (navegou) {
    if (navegou && deveTransicionar(rotaDoHash().rota)) { transicaoDeTinta(); return; }
    desenhar(navegou);
  };

  function desenhar(navegou) {
    const { rota, ctx } = rotaDoHash();
    const scroll = window.scrollY;
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    AP.rotaAtual = rota;
    hashDesenhado = location.hash;

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
  }

  /* ================= Transição de tinta =================
   * Ao trocar de tela, uma mancha de tinta de caneta se espalha a partir do ponto clicado até cobrir tudo,
   * a tela nova é montada por baixo e a tinta se recolhe de volta para o mesmo ponto.
   * Desenhos 200 × 200 com centro em 100,100; o miolo sólido tem raio de pelo menos 53. */
  const MANCHAS = ['M184.2 100C185 103 183.4 106.3 182.2 109.3C180.9 112.2 178.5 114.9 176.8 117.5C175.2 120.2 173.9 122.9 172.2 125.3C170.6 127.7 168.8 130.1 166.6 132.1C164.5 134.1 161.5 135.4 159.5 137.4C157.5 139.3 155.8 141 154.7 143.6C153.6 146.2 153.9 150 153 153C152.1 156 151.3 159.8 149.2 161.7C147 163.5 143.4 163.9 140.2 164C137 164.1 132.9 162.2 129.9 162C126.8 161.8 124.4 161.9 121.9 162.6C119.5 163.4 117.6 165.7 115.2 166.7C112.9 167.7 110.3 168.6 107.7 168.5C105.2 168.5 102.5 167 100 166.3C97.5 165.7 95.2 164.8 92.7 164.5C90.3 164.2 87.7 164.7 85.3 164.4C82.9 164 80.4 163.3 78.2 162.3C76 161.3 74.3 159.1 71.9 158.3C69.5 157.5 67.2 157.2 63.7 157.7C60.3 158.2 55.4 160.6 51.1 161.3C46.8 162 41.3 163.1 37.9 162.1C34.6 161 32.2 158.2 30.8 155.2C29.5 152.1 30.1 147.6 29.9 144C29.8 140.5 30 137 30 133.7C29.9 130.5 29.3 127.7 29.6 124.6C29.8 121.6 30.6 118.5 31.4 115.7C32.2 112.8 34 110 34.4 107.4C34.8 104.8 34.4 102.5 33.9 100C33.4 97.5 31.5 94.8 31.3 92.3C31.2 89.7 31.7 87 33.1 84.7C34.4 82.5 37.8 80.8 39.6 78.9C41.4 76.9 43.4 75.5 43.9 73C44.4 70.5 43.1 67.3 42.8 64.1C42.5 60.9 41.4 56.7 42.1 53.8C42.7 50.9 44.7 48.6 46.8 46.8C48.8 44.9 52 44.3 54.5 43C57 41.7 59.4 40.4 61.8 39.2C64.2 37.9 66.4 36.3 68.9 35.4C71.4 34.6 74.3 34.6 76.9 34.1C79.5 33.6 82.1 33.9 84.6 32.4C87 31 89 28.1 91.6 25.4C94.2 22.7 97 18 100 16.1C103 14.1 106.7 12.9 109.7 13.7C112.7 14.4 115.6 17.9 118.1 20.6C120.6 23.3 122.5 27.2 124.6 29.7C126.8 32.2 129 33.7 131 35.6C133.1 37.5 135.4 38.9 137 41.1C138.7 43.3 139.7 46.2 140.9 48.7C142.1 51.1 142.8 53.8 144.2 55.8C145.6 57.8 147.8 58.9 149.5 60.5C151.3 62.1 153.6 63.5 154.8 65.6C156 67.6 156 70.4 156.6 72.8C157.1 75.1 156.6 77.6 158.1 79.7C159.6 81.7 162.5 83.1 165.7 85C169 86.9 174.4 88.8 177.5 91.3C180.6 93.8 183.4 97 184.2 100ZM178.7 127.2a5 5 0 1 0 10 0a5 5 0 1 0 -10 0ZM85.4 190.3a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0ZM14.3 132.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM37.5 27.7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM144.2 24.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM182 58.8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0Z', 'M181 100C182.5 102.9 183.4 106.4 182.3 109.3C181.2 112.1 177.6 114.9 174.4 117C171.1 119.1 166 120.4 162.8 122C159.6 123.6 156.7 124.6 155 126.5C153.3 128.3 153.2 130.6 152.4 132.9C151.7 135.3 151.7 138.2 150.6 140.3C149.5 142.5 147.6 144.2 145.7 145.7C143.8 147.2 141.1 147.7 139.2 149.2C137.3 150.7 135.8 152.2 134.5 154.8C133.1 157.5 132.6 161.5 131.4 165.1C130.1 168.7 128.8 173.6 126.7 176.3C124.6 179.1 121.6 181.4 118.7 181.8C115.7 182.2 112 180.6 108.9 178.9C105.8 177.2 102.7 173.9 100 171.7C97.3 169.5 95 167.3 92.6 165.8C90.2 164.4 88 163.8 85.6 163.1C83.2 162.4 80.8 162.2 78.4 161.7C76 161.2 73.5 160.7 71.1 160.1C68.6 159.4 66.1 158.8 63.6 157.9C61.2 156.9 58.6 156.1 56.4 154.6C54.3 153.2 52.2 151.4 50.7 149.3C49.1 147.3 48.2 144.5 47.2 142.1C46.2 139.7 45.8 137 44.5 134.8C43.3 132.7 41.7 130.9 39.7 129C37.7 127.2 34.6 125.7 32.3 123.7C30.1 121.6 27.4 119.4 26.1 116.9C24.9 114.3 24.6 111.3 24.7 108.5C24.8 105.7 26.2 102.8 26.7 100C27.3 97.2 27.8 94.7 27.8 91.9C27.8 89.1 26.6 86.1 26.6 83.3C26.6 80.4 26.3 77.1 27.8 74.7C29.3 72.4 32.4 70.3 35.8 69.1C39.2 67.9 44.6 68 48.3 67.5C52 67.1 56 67.7 58 66.5C60.1 65.4 60.4 63.5 60.6 60.6C60.7 57.6 59.2 52.8 59.1 48.7C59 44.7 58.8 39.6 60 36.3C61.1 33 63.4 30.5 65.8 29C68.2 27.4 71.6 27.4 74.5 27C77.4 26.6 80.4 26.8 83.2 26.5C86.1 26.2 88.8 25.4 91.6 25.2C94.4 25 97.3 24.7 100 25.3C102.7 25.8 105.5 27.2 108 28.8C110.5 30.3 112.7 32.8 114.9 34.5C117.2 36.3 119.1 38 121.3 39.2C123.5 40.4 125.7 41 128 41.8C130.4 42.5 132.9 43 135.3 43.8C137.7 44.7 140 45.8 142.3 47C144.5 48.2 146.7 49.7 148.8 51.2C151 52.7 153.3 54.2 155.1 56C157 57.9 158.9 59.9 160.1 62.2C161.3 64.5 161.9 67.3 162.3 70C162.8 72.6 162.3 75.5 162.8 78C163.4 80.5 163.9 82.7 165.6 85C167.3 87.3 170.5 89.3 173 91.8C175.6 94.3 179.5 97.1 181 100ZM153.4 168.9a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM40.4 172.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM15.7 63.2a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM93.3 9.1a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0ZM181.7 92.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z'];
  const RAIO_MIOLO = 53;
  let hashDesenhado = null;
  let emTransicao = false;
  let ultimoToque = null;

  /* Lembra de onde veio a navegação: o ponto do clique ou o elemento ativado pelo teclado */
  document.addEventListener('pointerdown', (e) => { ultimoToque = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const r = document.activeElement && document.activeElement.getBoundingClientRect ? document.activeElement.getBoundingClientRect() : null;
    if (r && r.width) ultimoToque = { x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now() };
  }, true);
  function pontoDeOrigem() {
    if (ultimoToque && Date.now() - ultimoToque.t < 1500) return ultimoToque;
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  /* Só anima troca de tela de verdade: abas, filtros e outra conversa da mesma lista trocam sem tinta */
  function deveTransicionar(rota) {
    const ant = AP.rotaAtual;
    if (!AP._jaRenderizou || !ant || ant === rota) return false;
    if (ant.familia && ant.familia === rota.familia) return false;
    if (document.body.classList.contains('limpo')) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }

  function camadaDeTinta() {
    let el = document.querySelector('.tinta');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'tinta';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = MANCHAS.map((d, i) => `<svg class="tinta__mancha tinta__mancha--${i + 1}" viewBox="0 0 200 200" focusable="false"><path d="${d}"/></svg>`).join('');
    document.body.appendChild(el);
    return el;
  }

  function animarTinta(camada, { x, y }, cobrir) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const distancia = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));
    const escala = (distancia / RAIO_MIOLO) * 1.04;
    const manchas = [...camada.querySelectorAll('.tinta__mancha')];
    /* Trava de segurança: se o navegador não desenhar quadros (aba em segundo plano), a navegação segue mesmo assim */
    const limite = new Promise((ok) => { setTimeout(ok, 420 + 70 * manchas.length + 500); });
    return Promise.race([limite, Promise.all(manchas.map((m, i) => {
      m.getAnimations().forEach((a) => a.cancel());
      m.style.left = `${x}px`;
      m.style.top = `${y}px`;
      const vazio = 'rotate(0deg) scale(0)';
      const cheio = `rotate(${i ? -28 : 22}deg) scale(${escala})`;
      /* Ao cobrir, a tinta clara vai na frente; ao recolher, a escura (por cima) sai primeiro */
      const atraso = (cobrir ? i : manchas.length - 1 - i) * 70;
      const anim = m.animate(cobrir ? [{ transform: vazio }, { transform: cheio }] : [{ transform: cheio }, { transform: vazio }], {
        duration: 420,
        delay: atraso,
        easing: cobrir ? 'cubic-bezier(.5, 0, .25, 1)' : 'cubic-bezier(.65, 0, .8, .45)',
        fill: 'both',
      });
      return anim.finished.catch(() => {});
    }))]);
  }

  async function transicaoDeTinta() {
    /* Se já está cobrindo, a tela nova será lida do endereço na hora da troca */
    if (emTransicao) return;
    emTransicao = true;
    const camada = camadaDeTinta();
    const ponto = pontoDeOrigem();
    try {
      document.querySelectorAll('dialog[open]').forEach((d) => d.close());
      camada.classList.add('tinta--ativa');
      await animarTinta(camada, ponto, true);
      desenhar(true);
      await animarTinta(camada, ponto, false);
    } finally {
      camada.classList.remove('tinta--ativa');
      camada.querySelectorAll('.tinta__mancha').forEach((m) => m.getAnimations().forEach((a) => a.cancel()));
      emTransicao = false;
    }
    /* O endereço mudou enquanto a tinta se recolhia (voltar rápido, clique duplo): leva para a tela certa */
    if (location.hash !== hashDesenhado) AP.renderizar(true);
  }

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
      <div class="barra__acoes"><a href="#/mapa">Mapa de telas</a><button type="button" data-restaurar>Restaurar dados</button></div>
      <button type="button" class="barra__minimizar" data-minimizar aria-expanded="true" aria-controls="barra-prototipo" title="Minimizar a barra (vira um botão no canto da tela)">${AP.icone('minimizar')}<span>Minimizar</span></button>
    </div>`;
    /* Botão que aparece no lugar da barra minimizada: mostra com qual ator você está vendo o protótipo */
    const ator = (perfis.find(([, , areas]) => areas.includes(rota.area)) || [])[0];
    const btn = document.getElementById('mostrar-barra');
    btn.innerHTML = `<span class="mostrar-barra__marca" aria-hidden="true">+</span><span>Protótipo</span>${ator ? `<span class="mostrar-barra__ator">${ator}</span>` : ''}`;
    btn.setAttribute('aria-label', `Mostrar a barra do protótipo${ator ? ` (vendo como ${ator})` : ''}`);
  };

  /* Barra minimizada: o estado e o canto do botão ficam guardados neste navegador */
  const CHAVE_BARRA = 'apprenda-barra-prototipo';
  const CANTOS = ['baixo-dir', 'baixo-esq', 'cima-dir', 'cima-esq'];
  function lerBarra() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(CHAVE_BARRA)) || {}; } catch (e) { /* sem armazenamento */ }
    return { minimizada: !!p.minimizada, canto: CANTOS.includes(p.canto) ? p.canto : 'baixo-dir' };
  }
  function gravarBarra(p) { try { localStorage.setItem(CHAVE_BARRA, JSON.stringify(p)); } catch (e) { /* sem armazenamento */ } }

  function iniciarBarraMinimizada() {
    const btn = document.getElementById('mostrar-barra');
    const pref = lerBarra();
    btn.dataset.canto = pref.canto;
    btn.title = 'Mostrar a barra do protótipo. Arraste para levar o botão a outro canto.';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'barra-prototipo');
    document.body.classList.toggle('barra-minimizada', pref.minimizada);

    AP.minimizarBarra = function (minimizar, focar = true) {
      pref.minimizada = minimizar;
      gravarBarra(pref);
      document.body.classList.toggle('barra-minimizada', minimizar);
      if (!focar) return;
      const alvo = minimizar ? btn : document.querySelector('[data-minimizar]');
      if (alvo) alvo.focus();
    };

    /* Arrastar: o botão segue o ponteiro e, ao soltar, encaixa no canto mais próximo */
    let arrasto = null;
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      delete btn.dataset.arrastou;
      arrasto = { x: e.clientX, y: e.clientY, moveu: false, ret: btn.getBoundingClientRect() };
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointermove', (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.x;
      const dy = e.clientY - arrasto.y;
      if (!arrasto.moveu && Math.hypot(dx, dy) < 6) return;
      arrasto.moveu = true;
      btn.classList.add('arrastando');
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const soltar = (e) => {
      if (!arrasto) return;
      const a = arrasto;
      arrasto = null;
      btn.classList.remove('arrastando');
      if (!a.moveu) return;
      btn.dataset.arrastou = '1';
      const cx = a.ret.left + a.ret.width / 2 + (e.clientX - a.x);
      const cy = a.ret.top + a.ret.height / 2 + (e.clientY - a.y);
      const antes = btn.getBoundingClientRect();
      pref.canto = `${cy < window.innerHeight / 2 ? 'cima' : 'baixo'}-${cx < window.innerWidth / 2 ? 'esq' : 'dir'}`;
      gravarBarra(pref);
      btn.style.transform = '';
      btn.dataset.canto = pref.canto;
      /* Desliza da posição em que foi solto até o canto */
      const depois = btn.getBoundingClientRect();
      btn.style.transition = 'none';
      btn.style.transform = `translate(${antes.left - depois.left}px, ${antes.top - depois.top}px)`;
      btn.getBoundingClientRect();
      btn.style.transition = 'transform .22s ease-out';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 260);
    };
    btn.addEventListener('pointerup', soltar);
    btn.addEventListener('pointercancel', soltar);
    btn.addEventListener('click', () => {
      if (btn.dataset.arrastou) { delete btn.dataset.arrastou; return; }
      AP.minimizarBarra(false);
    });
  }

  AP.iniciar = function () {
    AP.carregar();
    if (/[?&]limpo\b/.test(location.search)) document.body.classList.add('limpo');

    document.getElementById('barra-prototipo').addEventListener('click', async (e) => {
      if (e.target.closest('[data-restaurar]')) {
        const ok = await AP.confirmar({ titulo: 'Restaurar dados de exemplo?', texto: 'Tudo o que você fez no protótipo (cadastros, solicitações, mensagens) será apagado e os dados iniciais voltam.', botao: 'Restaurar dados' });
        if (ok) { AP.restaurar(); AP.renderizar(true); AP.avisar('Dados de exemplo restaurados.'); }
      }
      if (e.target.closest('[data-minimizar]')) AP.minimizarBarra(true);
    });
    iniciarBarraMinimizada();
    document.getElementById('pular').addEventListener('click', () => { const m = document.getElementById('conteudo'); if (m) m.focus(); });
    window.addEventListener('hashchange', () => AP.renderizar(true));
    AP.renderizar(true);
  };
})();
