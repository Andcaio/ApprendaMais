/* Apprenda+ — telas usadas por aluno e tutor
 * UC09.1 Visualizar agenda, UC09.2 Cancelar aula, UC10.1 Informar link, UC10.2 Disponibilizar link,
 * UC11.1 Trocar mensagens, UC11.2 Visualizar histórico, UC02.3 Editar perfil
 */
(function () {
  const AP = window.AP;
  const $ = (el, s) => el.querySelector(s);
  const GRUPO = { aluno: 'Aluno', tutor: 'Tutor' };

  /* ---------- respostas do tutor às solicitações (UC08.3), usadas em várias telas ---------- */
  AP.aceitarSolicitacao = function (id) {
    const g = AP.agendamento(id);
    if (!g || g.status !== 'PENDENTE') return;
    g.status = 'CONFIRMADA';
    g.confirmadoEm = g.dataResposta = AP.isoLocal(AP.agora());
    AP.salvar();
    const al = AP.usuario(g.alunoId);
    AP.avisar(`Aula confirmada. O chat com ${AP.primeiroNome(al.nome)} foi liberado.${g.modalidade === 'ONLINE' ? ' Informe o link da videochamada na agenda.' : ''}`);
    AP.atualizar();
  };
  AP.recusarSolicitacao = async function (id) {
    const g = AP.agendamento(id);
    if (!g || g.status !== 'PENDENTE') return;
    const al = AP.usuario(g.alunoId);
    const ok = await AP.confirmar({
      titulo: 'Recusar a solicitação?',
      texto: `${AP.esc(al.nome)} pediu ${AP.esc(g.disciplina)} para ${AP.fmtDiaHora(g.inicio)}. Ao recusar, o horário volta a ficar livre para outros alunos.`,
      botao: 'Recusar solicitação', perigo: true,
    });
    if (!ok) return;
    g.status = 'RECUSADA';
    g.dataResposta = AP.isoLocal(AP.agora());
    AP.salvar();
    AP.avisar('Solicitação recusada. O horário voltou a ficar disponível.');
    AP.atualizar();
  };
  AP.ligarRespostas = function (el) {
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-aceitar]');
      if (a) AP.aceitarSolicitacao(a.dataset.aceitar);
      const r = e.target.closest('[data-recusar]');
      if (r) AP.recusarSolicitacao(r.dataset.recusar);
    });
  };

  /* ================= Agenda ================= */
  function formLink(g, valor = '') {
    return `<form class="form-link" data-form-link="${g.id}" novalidate>
      <p class="form-link__topo">${AP.selo('Link pendente', 'ambar')}<span>O aluno vê o link assim que você salvar.</span></p>
      <div class="campo"><label for="lk-${g.id}">Link da videochamada (Google Meet, Zoom ou Microsoft Teams)</label>
        <div class="linha-campo"><input id="lk-${g.id}" type="url" inputmode="url" placeholder="https://meet.google.com/abc-defg-hij" value="${AP.esc(valor)}"><button class="btn btn--primario" type="submit">Salvar link</button></div>
      </div>
    </form>`;
  }

  function blocoLink(g, papel) {
    if (g.link && AP.ui.editandoLink !== g.id) {
      return `<div class="link-aula">
        <p class="link-aula__topo">${AP.selo('Link disponível', 'verde')}<span class="link-aula__url">${AP.esc(g.link.url)}</span></p>
        <div class="acoes"><a class="btn btn--primario btn--pequeno" href="${AP.esc(g.link.url)}" target="_blank" rel="noopener noreferrer">${AP.icone('video')}Entrar na aula pelo ${AP.esc(g.link.plataforma)}</a>
        ${papel === 'tutor' ? `<button type="button" class="btn btn--texto btn--pequeno" data-editar-link="${g.id}">Trocar link</button>` : ''}</div>
      </div>`;
    }
    if (papel === 'aluno') {
      return `<p class="link-aula link-aula--pendente">${AP.selo('Link pendente', 'ambar')}<span>O tutor ainda vai enviar o link da videochamada. Ele aparece aqui assim que for informado.</span></p>`;
    }
    return formLink(g, g.link ? g.link.url : '');
  }

  function itemAula(g, papel) {
    const outro = AP.contraparte(g, papel);
    const dt = AP.dataLocal(g.inicio);
    const futura = AP.ehFutura(g);
    let extra = '';
    if (g.status === 'CONFIRMADA' && futura) {
      extra += g.modalidade === 'ONLINE' ? blocoLink(g, papel) : `<p class="aula__nota">${AP.icone('local')}Aula presencial. Combine o endereço pelo chat.</p>`;
    }
    if (g.status === 'CONFIRMADA' && !futura) extra += `<p class="aula__nota">${AP.icone('check')}Aula realizada em ${AP.fmtData(g.inicio)}.</p>`;
    if (g.status === 'PENDENTE') {
      extra += papel === 'aluno'
        ? `<p class="aula__nota">${AP.icone('relogio')}Aguardando a resposta do tutor. O horário está reservado para você.</p>`
        : `<p class="aula__nota">${AP.icone('caixa')}Solicitada em ${AP.fmtDataHora(g.dataSolicitacao)}. Responda para liberar ou confirmar o horário.</p>`;
    }
    if (g.status === 'CANCELADA') {
      const quem = g.canceladoPor === papel ? 'você' : g.canceladoPor === 'aluno' ? 'o aluno' : 'o tutor';
      extra += `<p class="aula__nota">Cancelada por ${quem} em ${AP.fmtData(g.dataCancelamento)}. Motivo: “${AP.esc(g.motivoCancelamento)}”</p>`;
    }
    if (g.status === 'RECUSADA') extra += `<p class="aula__nota">${papel === 'aluno' ? 'O tutor recusou esta solicitação.' : 'Você recusou esta solicitação.'} O horário voltou a ficar livre.</p>`;

    let acoes = '';
    if (g.status === 'PENDENTE' && papel === 'tutor') acoes += `<button type="button" class="btn btn--sucesso btn--pequeno" data-aceitar="${g.id}">Aceitar</button><button type="button" class="btn btn--perigo-contorno btn--pequeno" data-recusar="${g.id}">Recusar</button>`;
    if (AP.chatLiberado(g)) acoes += `<a class="btn btn--secundario btn--pequeno" href="#/${papel}/conversas/${g.id}">${AP.icone('chat')}${AP.chatAberto(g) ? 'Abrir conversa' : 'Ver conversa'}</a>`;
    if (g.status === 'CONFIRMADA' && futura) {
      const pode = AP.horasAte(g.inicio) >= 24;
      acoes += `<button type="button" class="btn btn--perigo-texto btn--pequeno" data-cancelar="${g.id}"${pode ? '' : ' aria-disabled="true" aria-describedby="cn-' + g.id + '"'}>Cancelar aula</button>`;
      if (!pode) acoes += `<span class="aula__aviso" id="cn-${g.id}">${AP.icone('cadeado')}Faltam menos de 24 h. O cancelamento pelo site está encerrado.</span>`;
    }
    return `<li class="aula${AP.ui.destaque === g.id ? ' aula--destaque' : ''}" id="aula-${g.id}">
      <div class="aula__data" aria-hidden="true"><span class="aula__semana">${AP.DIAS_CURTOS[dt.getDay()]}</span><span class="aula__dia">${AP.pad(dt.getDate())}</span><span class="aula__mes">${AP.MESES_CURTOS[dt.getMonth()]}</span></div>
      <div class="aula__corpo">
        <div class="aula__topo"><h3>${AP.esc(g.disciplina)} <span class="aula__nivel">${AP.nivelNome(g.nivel)}</span></h3>${AP.seloAgendamento(g.status)}</div>
        <ul class="aula__meta">
          <li>${AP.icone('calendario')}${AP.fmtExtenso(g.inicio)}, ${AP.fmtIntervalo(g.inicio)}</li>
          <li>${AP.icone(g.modalidade === 'ONLINE' ? 'video' : 'local')}${AP.MODALIDADES[g.modalidade]}</li>
          <li>${AP.avatar(outro, 'p')}${papel === 'aluno' ? 'Tutor' : 'Aluno'}: ${AP.esc(outro.nome)}</li>
          <li>${AP.moeda(g.valor)}</li>
        </ul>
        ${extra || acoes ? `<div class="aula__extra"><div class="aula__info">${extra}</div>${acoes ? `<div class="acoes aula__acoes">${acoes}</div>` : ''}</div>` : ''}
      </div>
    </li>`;
  }

  function abrirCancelamento(g, papel) {
    const outro = AP.contraparte(g, papel);
    const d = AP.dialogo({
      titulo: 'Cancelar aula',
      corpo: `<p><strong>${AP.esc(g.disciplina)}</strong> com ${AP.esc(outro.nome)}, ${AP.fmtExtenso(g.inicio)}, ${AP.fmtIntervalo(g.inicio)}.</p>
        <div class="campo"><label for="motivo">Motivo do cancelamento</label><textarea id="motivo" rows="3" maxlength="500"></textarea>
          <p class="ajuda">${AP.esc(AP.primeiroNome(outro.nome))} vai ver este motivo na agenda.</p></div>
        <p class="ajuda">Ao confirmar, o status passa para Cancelada e o horário volta a ficar livre na agenda do tutor.</p>`,
      acoes: '<button type="button" class="btn btn--secundario" data-fechar>Manter aula</button><button type="submit" class="btn btn--perigo">Confirmar cancelamento</button>',
    });
    const form = d.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      AP.limparErros(form);
      const campo = d.querySelector('#motivo');
      const m = campo.value.trim();
      if (m.length < 5) { AP.erro(campo, 'Informe o motivo do cancelamento.'); campo.focus(); return; }
      if (AP.horasAte(g.inicio) < 24) { AP.erro(campo, 'Faltam menos de 24 horas para a aula. O cancelamento não é mais permitido.'); return; }
      g.status = 'CANCELADA';
      g.motivoCancelamento = m;
      g.canceladoPor = papel;
      g.dataCancelamento = AP.isoLocal(AP.agora());
      AP.salvar();
      d.close();
      AP.avisar('Aula cancelada. O horário voltou a ficar livre na agenda do tutor.');
      AP.atualizar();
    });
  }

  function telaAgenda(papel) {
    return {
      caminho: `/${papel}/agenda`, area: papel, titulo: 'Minha agenda', grupo: GRUPO[papel], exemplo: `#/${papel}/agenda`,
      uc: papel === 'aluno' ? ['UC09.1', 'UC09.2', 'UC10.2'] : ['UC09.1', 'UC09.2', 'UC10.1', 'UC10.2'],
      variacoes: [['Histórico de aulas', `#/${papel}/agenda?aba=historico`]],
      render({ query }) {
        const u = AP.logado(papel);
        const aba = query.aba === 'historico' ? 'historico' : 'proximas';
        const todos = AP.agendamentosDe(papel, u.id);
        const proximas = todos.filter((g) => AP.ehFutura(g) && (g.status === 'PENDENTE' || g.status === 'CONFIRMADA')).sort((a, b) => a.inicio.localeCompare(b.inicio));
        const historico = todos.filter((g) => !proximas.includes(g)).sort((a, b) => b.inicio.localeCompare(a.inicio));
        const lista = aba === 'historico' ? historico : proximas;
        const desc = papel === 'aluno'
          ? 'Acompanhe suas solicitações e aulas. Você pode cancelar uma aula confirmada até 24 horas antes do início.'
          : 'Suas aulas e solicitações. Nas aulas online confirmadas, informe aqui o link da videochamada.';
        const vazio = aba === 'historico'
          ? AP.vazio('Nada no histórico ainda', 'Aulas realizadas, canceladas e recusadas aparecem aqui.')
          : papel === 'aluno'
            ? AP.vazio('Você ainda não tem aulas na agenda', 'Busque um tutor, escolha um horário livre e envie uma solicitação.', '<a class="btn btn--primario" href="#/aluno/buscar">Buscar tutores</a>')
            : AP.vazio('Nenhuma aula na agenda', 'Quando um aluno pedir uma aula, ela aparece aqui para você aceitar ou recusar.');
        return `<header class="cabecalho"><div><h1>Minha agenda</h1><p>${desc}</p></div></header>
          <nav class="abas" aria-label="Filtrar aulas">
            <a href="#/${papel}/agenda"${aba === 'proximas' ? ' aria-current="page"' : ''}>Próximas aulas <span class="abas__n">${proximas.length}</span></a>
            <a href="#/${papel}/agenda?aba=historico"${aba === 'historico' ? ' aria-current="page"' : ''}>Histórico <span class="abas__n">${historico.length}</span></a>
          </nav>
          ${lista.length ? `<ul class="aulas">${lista.map((g) => itemAula(g, papel)).join('')}</ul>` : vazio}`;
      },
      montar(el) {
        AP.ligarRespostas(el);
        const dest = AP.ui.destaque && $(el, '#aula-' + AP.ui.destaque);
        if (dest) dest.scrollIntoView({ block: 'center' });
        AP.ui.destaque = null;
        el.addEventListener('click', (e) => {
          const c = e.target.closest('[data-cancelar]');
          if (c) {
            const g = AP.agendamento(c.dataset.cancelar);
            if (AP.horasAte(g.inicio) < 24) { AP.avisar('Faltam menos de 24 horas para esta aula. O cancelamento pelo site só é permitido até 24 horas antes do início.', 'erro'); return; }
            abrirCancelamento(g, papel);
          }
          const t = e.target.closest('[data-editar-link]');
          if (t) { AP.ui.editandoLink = t.dataset.editarLink; AP.atualizar(); const i = $(document, '#lk-' + t.dataset.editarLink); if (i) i.focus(); }
        });
        el.addEventListener('submit', (e) => {
          const form = e.target.closest('[data-form-link]');
          if (!form) return;
          e.preventDefault();
          AP.limparErros(form);
          const g = AP.agendamento(form.dataset.formLink);
          const input = form.querySelector('input');
          const url = input.value.trim();
          if (!url) { AP.erro(input, 'Cole o link da reunião. Enquanto ele não for informado, a aula aparece como “Link pendente” para o aluno.'); input.focus(); return; }
          if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url)) { AP.erro(input, 'O link precisa ser um endereço completo, começando com https://'); input.focus(); return; }
          g.link = { url, plataforma: AP.plataforma(url), data: AP.isoLocal(AP.agora()) };
          AP.ui.editandoLink = null;
          AP.salvar();
          AP.avisar(`Link salvo. ${AP.primeiroNome(AP.usuario(g.alunoId).nome)} já pode ver o acesso à aula.`);
          AP.atualizar();
        });
      },
    };
  }
  AP.rota(telaAgenda('aluno'));
  AP.rota(telaAgenda('tutor'));

  /* ================= Conversas ================= */
  const ultimaAtividade = (g) => { const m = AP.mensagensDe(g.id); return m.length ? m[m.length - 1].dataHora : g.confirmadoEm || g.inicio; };

  function chatHTML(g, papel, u) {
    const outro = AP.contraparte(g, papel);
    const msgs = AP.mensagensDe(g.id);
    const aberto = AP.chatAberto(g);
    const limite = AP.limiteChat(g);
    let prazo;
    if (aberto) prazo = `<p class="chat__prazo chat__prazo--aberto">${AP.icone('relogio')}Envio de mensagens liberado até ${AP.fmtDiaHora(limite)}, 24 horas depois do fim da aula.</p>`;
    else if (g.status === 'CANCELADA') prazo = `<p class="chat__prazo">${AP.icone('cadeado')}A aula foi cancelada. O histórico fica disponível só para consulta.</p>`;
    else prazo = `<p class="chat__prazo">${AP.icone('cadeado')}Conversa encerrada em ${AP.fmtDiaHora(limite)}. O histórico fica disponível só para consulta.</p>`;

    let itens = '';
    let diaAnt = '';
    msgs.forEach((m) => {
      const dia = m.dataHora.slice(0, 10);
      if (dia !== diaAnt) { itens += `<li class="chat__dia"><span>${AP.rotuloDia(m.dataHora)}</span></li>`; diaAnt = dia; }
      const minha = m.remetenteId === u.id;
      itens += `<li class="msg${minha ? ' msg--minha' : ''}"><span class="sr">${minha ? 'Você' : AP.esc(outro.nome)}:</span>${AP.esc(m.texto)}<time datetime="${m.dataHora}">${AP.fmtHora(m.dataHora)}</time></li>`;
    });
    if (!msgs.length) {
      const dica = !aberto ? '' : papel === 'aluno'
        ? ' Conte ao tutor o conteúdo que você quer estudar, a sua dificuldade e o objetivo da aula.'
        : ' Pergunte ao aluno o conteúdo, a dificuldade e o objetivo da aula.';
      itens = `<li class="chat__vazio"><strong>Nenhuma mensagem ainda.</strong>${dica}</li>`;
    }
    const envio = aberto
      ? `<form class="chat__envio" id="form-msg" novalidate>
          <div class="campo"><label for="msg-texto" class="sr">Mensagem para ${AP.esc(outro.nome)}</label>
          <textarea id="msg-texto" rows="2" placeholder="Escreva sua mensagem" aria-describedby="msg-cont"></textarea></div>
          <div class="chat__envio-rodape"><span class="contador" id="msg-cont">0 / 2.000</span><span class="ajuda chat__dica">Enter envia. Shift + Enter quebra a linha.</span><button class="btn btn--primario" type="submit">Enviar</button></div>
        </form>`
      : '<p class="chat__fechado">Não é possível enviar novas mensagens nesta conversa.</p>';
    return `<section class="chat" aria-labelledby="chat-titulo">
      <header class="chat__topo">
        <a class="btn btn--texto btn--pequeno chat__voltar" href="#/${papel}/conversas">${AP.icone('voltar')}<span class="sr">Voltar para a lista de conversas</span></a>
        ${AP.avatar(outro)}
        <div class="chat__quem"><h2 id="chat-titulo">${AP.esc(outro.nome)}</h2><p>${AP.esc(g.disciplina)}, ${AP.nivelNome(g.nivel)}. Aula ${AP.fmtDiaHora(g.inicio)}</p></div>
        <a class="btn btn--secundario btn--pequeno" href="#/${papel}/agenda${AP.ehFutura(g) ? '' : '?aba=historico'}">Ver na agenda</a>
      </header>
      ${prazo}
      <ol class="chat__mensagens" id="mensagens" aria-label="Mensagens em ordem cronológica" tabindex="0">${itens}</ol>
      ${envio}
    </section>`;
  }

  function telaConversas(papel, comId) {
    return {
      caminho: comId ? `/${papel}/conversas/:id` : `/${papel}/conversas`, area: papel, menu: `/${papel}/conversas`, titulo: 'Conversas', grupo: GRUPO[papel], familia: `${papel}-conversas`,
      uc: ['UC11.1', 'UC11.2'], exemplo: comId ? (papel === 'aluno' ? '#/aluno/conversas/g1' : '#/tutor/conversas/g9') : null,
      variacoes: comId && papel === 'aluno' ? [['Conversa encerrada (somente leitura)', '#/aluno/conversas/g4'], ['Conversa sem mensagens', '#/aluno/conversas/g3'], ['Aula ainda não confirmada', '#/aluno/conversas/g2']] : null,
      render({ params }) {
        const u = AP.logado(papel);
        const lista = AP.agendamentosDe(papel, u.id).filter(AP.chatLiberado).sort((a, b) => ultimaAtividade(b).localeCompare(ultimaAtividade(a)));
        const sel = params.id ? AP.agendamento(params.id) : null;
        let painel;
        if (!params.id) {
          painel = `<div class="chat chat--neutro">${AP.vazio('Escolha uma conversa', 'Cada aula confirmada tem o seu chat. Ele fica aberto até 24 horas depois do fim da aula.')}</div>`;
        } else if (!sel || (papel === 'aluno' ? sel.alunoId : sel.tutorId) !== u.id) {
          painel = `<div class="chat chat--neutro">${AP.vazio('Conversa não encontrada', 'Você não tem acesso a esta conversa.')}</div>`;
        } else if (!AP.chatLiberado(sel)) {
          painel = `<div class="chat chat--neutro">${AP.vazio('O chat ainda não foi liberado', `A conversa abre quando o tutor confirmar a aula de ${AP.esc(sel.disciplina)} (${AP.fmtDiaHora(sel.inicio)}). Por enquanto, acompanhe a solicitação pela agenda.`, `<a class="btn btn--secundario" href="#/${papel}/agenda">Ver agenda</a>`)}</div>`;
        } else {
          painel = chatHTML(sel, papel, u);
        }
        const itens = lista.map((g) => {
          const outro = AP.contraparte(g, papel);
          const msgs = AP.mensagensDe(g.id);
          const ult = msgs[msgs.length - 1];
          return `<li><a class="conversa-item" href="#/${papel}/conversas/${g.id}"${params.id === g.id ? ' aria-current="page"' : ''}>
            ${AP.avatar(outro)}
            <span class="conversa-item__texto"><strong>${AP.esc(outro.nome)}</strong><span>${AP.esc(g.disciplina)}, ${AP.fmtDia(g.inicio)}</span>
            <span class="conversa-item__ult">${ult ? (ult.remetenteId === u.id ? 'Você: ' : '') + AP.esc(ult.texto) : 'Nenhuma mensagem'}</span></span>
            ${AP.chatAberto(g) ? '' : `<span class="conversa-item__estado" title="Somente leitura">${AP.icone('cadeado')}<span class="sr">Somente leitura</span></span>`}
          </a></li>`;
        }).join('');
        return `<header class="cabecalho"><div><h1>Conversas</h1><p>Combine com ${papel === 'aluno' ? 'o tutor' : 'o aluno'} o conteúdo, a dificuldade e o objetivo de cada aula.</p></div></header>
          <div class="conversas${params.id ? ' conversas--aberta' : ''}">
            <nav class="conversas__lista" aria-label="Conversas por aula"><ul>${itens || '<li class="conversas__nenhuma">Nenhuma conversa ainda. O chat aparece quando uma aula é confirmada.</li>'}</ul></nav>
            ${painel}
          </div>`;
      },
      montar(el, { params }) {
        const ol = $(el, '#mensagens');
        if (ol) ol.scrollTop = ol.scrollHeight;
        const form = $(el, '#form-msg');
        if (!form) return;
        const g = AP.agendamento(params.id);
        const ta = $(el, '#msg-texto');
        const cont = $(el, '#msg-cont');
        const contar = () => {
          const n = ta.value.length;
          cont.textContent = `${n.toLocaleString('pt-BR')} / 2.000`;
          cont.classList.toggle('contador--excedido', n > 2000);
        };
        ta.addEventListener('input', contar);
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
        if (AP.ui.focarChat) { ta.focus(); AP.ui.focarChat = false; }
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          AP.limparErros(form);
          const texto = ta.value.trim();
          if (!texto) { ta.focus(); return; }
          if (texto.length > 2000) { AP.erro(ta, `A mensagem tem ${texto.length.toLocaleString('pt-BR')} caracteres. Reduza para até 2.000 para enviar.`); ta.focus(); return; }
          if (!AP.chatAberto(g)) { AP.erro(ta, 'O prazo para enviar mensagens nesta conversa terminou.'); return; }
          AP.db.mensagens.push({ id: AP.novoId('m'), agendamentoId: g.id, remetenteId: AP.db.sessao[papel], texto, dataHora: AP.isoLocal(AP.agora()) });
          AP.salvar();
          AP.ui.focarChat = true;
          AP.atualizar();
        });
      },
    };
  }
  AP.rota(telaConversas('aluno', false));
  AP.rota(telaConversas('aluno', true));
  AP.rota(telaConversas('tutor', false));
  AP.rota(telaConversas('tutor', true));

  /* ================= UC02.3 Meu perfil ================= */
  function telaPerfil(papel) {
    return {
      caminho: `/${papel}/perfil`, area: papel, titulo: 'Editar perfil', uc: ['UC02.3'], grupo: GRUPO[papel], exemplo: `#/${papel}/perfil`,
      render() {
        const u = AP.logado(papel);
        const ags = AP.agendamentosDe(papel, u.id);
        const conta = (f) => ags.filter(f).length;
        const futuras = conta((g) => g.status === 'CONFIRMADA' && AP.ehFutura(g));
        const realizadas = conta((g) => g.status === 'CONFIRMADA' && !AP.ehFutura(g));
        const pend = conta((g) => g.status === 'PENDENTE');
        const numeros = papel === 'aluno'
          ? [['Próximas aulas', futuras], ['Aulas realizadas', realizadas], ['Aguardando o tutor', pend], ['Canceladas', conta((g) => g.status === 'CANCELADA')]]
          : [['Próximas aulas', futuras], ['Aulas realizadas', realizadas], ['Solicitações pendentes', pend], ['Ofertas publicadas', AP.ofertasDo(u.id).length]];
        const papelTxt = papel === 'aluno' ? `Aluno, ${AP.nivelNome(u.nivelEscolar)}` : `Tutor, ${AP.esc(u.formacao.curso)}`;
        const r = u.responsavelId ? AP.responsavel(u.responsavelId) : null;
        const aut = r ? AP.autorizacoesDo(u.id).find((x) => x.status === 'CONFIRMADA') : null;

        const extraDados = papel === 'aluno'
          ? `<div class="campo"><label for="pf-nivel">Nível escolar</label><select id="pf-nivel">${AP.opcoesNivel(u.nivelEscolar)}</select></div>`
          : `<div class="campo"><label for="pf-cidade">Cidade</label><input id="pf-cidade" value="${AP.esc(u.cidade)}"></div>
             <div class="campo largo"><label for="pf-apres">Apresentação</label><textarea id="pf-apres" rows="5" maxlength="1000">${AP.esc(u.apresentacao)}</textarea><p class="ajuda">Aparece na sua página pública. Mínimo de 80 caracteres.</p></div>`;

        return `<header class="cabecalho"><div><h1>Meu perfil</h1><p>Confira seus dados e mantenha o contato atualizado.</p></div></header>
        <div class="perfil">
          <aside class="perfil__lado painel">
            <div class="perfil__foto">${AP.avatar(u, 'xg')}
              <div class="acoes"><label class="btn btn--secundario btn--pequeno" for="pf-foto">Trocar foto</label>
              ${u.foto ? '<button type="button" class="btn btn--texto btn--pequeno" data-remover-foto>Remover</button>' : ''}</div>
              <input type="file" id="pf-foto" class="sr" accept="image/png,image/jpeg">
              <p class="ajuda">JPG ou PNG, até 2 MB.</p>
            </div>
            <div><p class="perfil__nome">${AP.esc(u.nome)}</p><p class="perfil__papel">${papelTxt}</p></div>
            <p>${AP.seloConta(u.status)}${papel === 'tutor' ? ' ' + AP.seloAprovacao(u.statusAprovacao) : ''}</p>
            <p class="ajuda">Na plataforma desde ${AP.fmtData(u.dataCadastro)}</p>
            <h2>Resumo de atividades</h2>
            <dl class="numeros">${numeros.map(([t, n]) => `<div><dt>${t}</dt><dd>${n}</dd></div>`).join('')}</dl>
          </aside>
          <div class="perfil__forms">
            <form id="form-dados" class="painel" novalidate>
              <h2>Dados pessoais</h2>
              <div class="grade-campos">
                <div class="campo largo"><label for="pf-nome">Nome completo</label><input id="pf-nome" value="${AP.esc(u.nome)}" autocomplete="name"></div>
                <div class="campo"><label for="pf-cpf">CPF</label><input id="pf-cpf" value="${AP.formatarCPF(u.cpf)}" readonly aria-describedby="pf-cpf-ajuda"><p class="ajuda" id="pf-cpf-ajuda">Não pode ser alterado.</p></div>
                <div class="campo"><label for="pf-nasc">Data de nascimento</label><input id="pf-nasc" value="${AP.fmtData(u.dataNascimento)}" readonly></div>
                <div class="campo"><label for="pf-tel">Telefone</label><input id="pf-tel" type="tel" value="${AP.esc(u.telefone)}" autocomplete="tel"></div>
                <div class="campo"><label for="pf-email">E-mail</label><input id="pf-email" type="email" value="${AP.esc(u.email)}" autocomplete="email"></div>
                ${extraDados}
              </div>
              <div class="form-rodape"><button type="submit" class="btn btn--primario">Salvar alterações</button></div>
            </form>
            ${r ? `<section class="painel">
              <h2>Responsável legal</h2>
              <dl class="dados">
                <div><dt>Nome</dt><dd>${AP.esc(r.nomeCompleto)}</dd></div>
                <div><dt>E-mail</dt><dd>${AP.esc(r.email)}</dd></div>
                <div><dt>Autorização</dt><dd>${aut ? `${AP.seloAutorizacao('CONFIRMADA')} <small>em ${AP.fmtData(aut.dataResposta)}</small>` : AP.seloAutorizacao('PENDENTE')}</dd></div>
              </dl>
              <p class="ajuda">Para trocar o responsável, fale com a equipe do Apprenda+.</p>
            </section>` : ''}
            ${papel === 'tutor' ? `<section class="painel">
              <h2>Formação</h2>
              <dl class="dados">
                <div><dt>Curso</dt><dd>${AP.esc(u.formacao.curso)}</dd></div>
                <div><dt>Instituição</dt><dd>${AP.esc(u.formacao.instituicao)}, ${u.formacao.ano}</dd></div>
                <div><dt>Níveis habilitados</dt><dd>${u.niveis.map(AP.nivelNome).join(', ')}</dd></div>
              </dl>
              <p class="ajuda">A formação foi conferida pela equipe e não pode ser editada por aqui.</p>
            </section>` : ''}
            <form id="form-senha" class="painel" novalidate>
              <h2>Senha</h2>
              <div class="grade-campos">
                <div class="campo largo"><label for="ps-atual">Senha atual</label><input id="ps-atual" type="password" autocomplete="current-password"></div>
                <div class="campo"><label for="ps-nova">Nova senha</label><input id="ps-nova" type="password" autocomplete="new-password"><ul class="criterios-senha" id="ps-criterios"></ul></div>
                <div class="campo"><label for="ps-nova2">Repita a nova senha</label><input id="ps-nova2" type="password" autocomplete="new-password"></div>
              </div>
              <div class="form-rodape"><button type="submit" class="btn btn--secundario">Alterar senha</button></div>
            </form>
          </div>
        </div>`;
      },
      montar(el) {
        const u = AP.logado(papel);
        const v = (id) => $(el, '#' + id);
        AP.mascaraTelefone(v('pf-tel'));
        const crit = v('ps-criterios');
        AP.desenharCriterios(crit, '');
        v('ps-nova').addEventListener('input', () => AP.desenharCriterios(crit, v('ps-nova').value));

        v('pf-foto').addEventListener('change', () => {
          const f = v('pf-foto').files[0];
          if (!f) return;
          if (!/^image\/(png|jpeg)$/.test(f.type)) { AP.avisar('Envie uma imagem JPG ou PNG.', 'erro'); return; }
          if (f.size > 2 * 1024 * 1024) { AP.avisar('A foto precisa ter até 2 MB.', 'erro'); return; }
          const fr = new FileReader();
          fr.onload = () => { u.foto = fr.result; AP.salvar(); AP.avisar('Foto atualizada.'); AP.atualizar(); };
          fr.readAsDataURL(f);
        });
        const rem = $(el, '[data-remover-foto]');
        if (rem) rem.addEventListener('click', () => { delete u.foto; AP.salvar(); AP.avisar('Foto removida.'); AP.atualizar(); });

        const fd = v('form-dados');
        fd.addEventListener('submit', (e) => {
          e.preventDefault();
          AP.limparErros(fd);
          const nome = v('pf-nome').value.trim();
          const tel = v('pf-tel').value.trim();
          const email = v('pf-email').value.trim().toLowerCase();
          if (nome.split(/\s+/).length < 2) AP.erro(v('pf-nome'), 'Informe seu nome completo.');
          if (AP.soDigitos(tel).length < 10) AP.erro(v('pf-tel'), 'Informe um telefone com DDD.');
          if (!AP.validarEmail(email)) AP.erro(v('pf-email'), 'Informe um e-mail válido, como nome@email.com.');
          else if (AP.db.usuarios.some((x) => x.id !== u.id && x.email.toLowerCase() === email)) AP.erro(v('pf-email'), 'Este e-mail já pertence a outra conta do Apprenda+.');
          if (papel === 'tutor') {
            if (!v('pf-cidade').value.trim()) AP.erro(v('pf-cidade'), 'Informe a cidade.');
            if (v('pf-apres').value.trim().length < 80) AP.erro(v('pf-apres'), 'A apresentação precisa ter pelo menos 80 caracteres.');
          }
          if (fd.querySelector('[aria-invalid]')) { AP.focarErro(fd); return; }
          u.nome = nome; u.telefone = AP.formatarTelefone(tel); u.email = email;
          if (papel === 'aluno') u.nivelEscolar = v('pf-nivel').value;
          else { u.cidade = v('pf-cidade').value.trim(); u.apresentacao = v('pf-apres').value.trim(); }
          AP.salvar();
          AP.avisar('Alterações salvas.');
          AP.atualizar();
        });

        const fs = v('form-senha');
        fs.addEventListener('submit', (e) => {
          e.preventDefault();
          AP.limparErros(fs);
          if (!v('ps-atual').value) AP.erro(v('ps-atual'), 'Informe sua senha atual.');
          if (!AP.senhaValida(v('ps-nova').value)) AP.erro(v('ps-nova'), 'A nova senha precisa ter 8 caracteres ou mais, com letras e números.');
          else if (v('ps-nova').value !== v('ps-nova2').value) AP.erro(v('ps-nova2'), 'As senhas não são iguais.');
          if (fs.querySelector('[aria-invalid]')) { AP.focarErro(fs); return; }
          fs.reset();
          AP.desenharCriterios(crit, '');
          AP.avisar('Senha alterada.');
        });
      },
    };
  }
  AP.rota(telaPerfil('aluno'));
  AP.rota(telaPerfil('tutor'));
})();
