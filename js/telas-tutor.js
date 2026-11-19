/* Apprenda+ — telas do tutor
 * Painel, UC08.3 Aceitar/Recusar agendamento, UC05.1/UC05.2 Catálogo de matérias,
 * UC07.1/UC07.2 Disponibilidade de horários
 */
(function () {
  const AP = window.AP;
  const $ = (el, s) => el.querySelector(s);

  function linhaSolicitacao(g, detalhada) {
    const al = AP.usuario(g.alunoId);
    return `<li class="solicitacao">
      ${AP.avatar(al, detalhada ? 'g' : '')}
      <div class="solicitacao__info">
        <p class="solicitacao__titulo"><strong>${AP.esc(al.nome)}</strong> pediu <strong>${AP.esc(g.disciplina)}</strong></p>
        <p class="solicitacao__meta">${AP.fmtExtenso(g.inicio)}, ${AP.fmtIntervalo(g.inicio)}. ${AP.nivelNome(g.nivel)}, ${AP.MODALIDADES[g.modalidade].toLowerCase()}, ${AP.moeda(g.valor)}.</p>
        ${detalhada ? `<p class="ajuda">Aluno do ${AP.nivelNome(al.nivelEscolar)}. Solicitação enviada em ${AP.fmtDataHora(g.dataSolicitacao)}.</p>` : ''}
      </div>
      <div class="acoes">
        <button type="button" class="btn btn--sucesso btn--pequeno" data-aceitar="${g.id}">Aceitar</button>
        <button type="button" class="btn btn--perigo-contorno btn--pequeno" data-recusar="${g.id}">Recusar</button>
      </div>
    </li>`;
  }

  /* ================= Painel do tutor ================= */
  AP.rota({
    caminho: '/tutor/inicio', area: 'tutor', titulo: 'Painel do tutor', uc: ['UC08.3', 'UC10.1'], grupo: 'Tutor', exemplo: '#/tutor/inicio',
    render() {
      const t = AP.logado('tutor');
      const ags = AP.agendamentosDe('tutor', t.id);
      const pend = ags.filter((g) => g.status === 'PENDENTE' && AP.ehFutura(g)).sort((a, b) => a.inicio.localeCompare(b.inicio));
      const conf = ags.filter((g) => g.status === 'CONFIRMADA' && AP.ehFutura(g)).sort((a, b) => a.inicio.localeCompare(b.inicio));
      const semLink = conf.filter((g) => g.modalidade === 'ONLINE' && !g.link);
      const prox = conf[0];
      const livresSemana = AP.dispDo(t.id).reduce((s, d) => s + (d.fim - d.inicio), 0);
      let proxHTML = AP.vazio('Nenhuma aula confirmada por enquanto', 'Responda às solicitações para preencher sua agenda.');
      if (prox) {
        const al = AP.usuario(prox.alunoId);
        const link = prox.modalidade === 'ONLINE' ? (prox.link ? AP.selo('Link enviado', 'verde') : AP.selo('Link pendente', 'ambar')) : AP.selo('Presencial', 'tinta');
        proxHTML = `<div class="proxima__corpo">
          <p class="proxima__quando"><span class="proxima__dia">${AP.rotuloDia(prox.inicio)}</span><span class="proxima__hora">${AP.fmtHora(prox.inicio)}</span></p>
          <div>
            <p class="proxima__titulo">${AP.esc(prox.disciplina)} com ${AP.esc(al.nome)}</p>
            <p class="ajuda">${AP.nivelNome(prox.nivel)}, ${AP.fmtIntervalo(prox.inicio)} ${link}</p>
            <div class="acoes"><a class="btn btn--secundario btn--pequeno" href="#/tutor/conversas/${prox.id}">${AP.icone('chat')}Abrir conversa</a><a class="btn btn--texto btn--pequeno" href="#/tutor/agenda">Ver agenda completa</a></div>
          </div>
        </div>`;
      }
      return `<header class="cabecalho"><div><h1>Olá, ${AP.esc(AP.primeiroNome(t.nome))}</h1><p>${AP.fmtExtenso(AP.AGORA).replace(/^./, (c) => c.toUpperCase())}.</p></div></header>
      <div class="painel-tutor">
        <section class="painel proxima" aria-labelledby="p-prox"><h2 id="p-prox">Próxima aula</h2>${proxHTML}</section>
        <section class="painel" aria-labelledby="p-sol">
          <div class="painel__topo"><h2 id="p-sol">Solicitações aguardando resposta</h2><a href="#/tutor/solicitacoes">Ver todas</a></div>
          ${pend.length ? `<ul class="lista-simples">${pend.slice(0, 3).map((g) => linhaSolicitacao(g, false)).join('')}</ul>` : '<p class="texto-apoio">Nenhuma solicitação pendente.</p>'}
        </section>
        <section class="painel" aria-labelledby="p-link">
          <h2 id="p-link">Aulas online sem link</h2>
          ${semLink.length ? `<ul class="lista-simples">${semLink.map((g) => `<li><span><strong>${AP.esc(g.disciplina)}</strong> com ${AP.esc(AP.usuario(g.alunoId).nome)}<br><small class="ajuda">${AP.fmtDiaHora(g.inicio)}</small></span><a class="btn btn--secundario btn--pequeno" href="#/tutor/agenda">${AP.icone('link')}Informar link</a></li>`).join('')}</ul>`
            : '<p class="texto-apoio">Todas as aulas online confirmadas já têm link.</p>'}
        </section>
        <section class="painel painel--largo" aria-labelledby="p-cat">
          <h2 id="p-cat">Sua oferta na plataforma</h2>
          <dl class="numeros numeros--linha">
            <div><dt>Ofertas de matéria</dt><dd>${AP.ofertasDo(t.id).length}</dd></div>
            <div><dt>Horas livres por semana</dt><dd>${livresSemana}</dd></div>
            <div><dt>Aulas confirmadas</dt><dd>${conf.length}</dd></div>
          </dl>
          <div class="acoes"><a class="btn btn--secundario btn--pequeno" href="#/tutor/disciplinas">${AP.icone('livro')}Minhas disciplinas</a><a class="btn btn--secundario btn--pequeno" href="#/tutor/disponibilidade">${AP.icone('relogio')}Minha disponibilidade</a></div>
        </section>
      </div>`;
    },
    montar(el) { AP.ligarRespostas(el); },
  });

  /* ================= UC08.3 Solicitações ================= */
  AP.rota({
    caminho: '/tutor/solicitacoes', area: 'tutor', titulo: 'Aceitar ou recusar agendamento', uc: ['UC08.3'], grupo: 'Tutor', exemplo: '#/tutor/solicitacoes',
    render() {
      const t = AP.logado('tutor');
      const ags = AP.agendamentosDe('tutor', t.id);
      const pend = ags.filter((g) => g.status === 'PENDENTE').sort((a, b) => a.inicio.localeCompare(b.inicio));
      const resp = ags.filter((g) => g.dataResposta && (g.status === 'CONFIRMADA' || g.status === 'RECUSADA')).sort((a, b) => b.dataResposta.localeCompare(a.dataResposta)).slice(0, 5);
      return `<header class="cabecalho"><div><h1>Solicitações de aula</h1>
        <p>O horário de cada solicitação já está reservado. Ao aceitar, a aula é confirmada e o chat com o aluno é liberado. Ao recusar, o horário volta a ficar livre.</p></div></header>
        <section aria-labelledby="s-pend">
          <h2 id="s-pend">Aguardando sua resposta <span class="contagem">${pend.length}</span></h2>
          ${pend.length ? `<ul class="lista-solicitacoes painel">${pend.map((g) => linhaSolicitacao(g, true)).join('')}</ul>` : AP.vazio('Nenhuma solicitação aguardando resposta', 'Quando um aluno escolher um dos seus horários, a solicitação aparece aqui.')}
        </section>
        ${resp.length ? `<section class="mt-g" aria-labelledby="s-resp"><h2 id="s-resp">Respondidas recentemente</h2>
          <ul class="lista-simples painel">${resp.map((g) => `<li><span><strong>${AP.esc(AP.usuario(g.alunoId).nome)}</strong>, ${AP.esc(g.disciplina)}, ${AP.fmtDiaHora(g.inicio)}</span>${AP.seloAgendamento(g.status)}</li>`).join('')}</ul></section>` : ''}`;
    },
    montar(el) { AP.ligarRespostas(el); },
  });

  /* ================= UC05.1 / UC05.2 Minhas disciplinas ================= */
  function formOferta(o) {
    if (o) {
      return `<p>${AP.esc(AP.descOferta(o))}</p>
        <div class="campo"><label for="of-preco">Novo valor da aula de 60 minutos (R$)</label><input id="of-preco" inputmode="decimal" value="${String(o.preco).replace('.', ',')}"></div>`;
    }
    return `<div class="grade-campos">
        <div class="campo"><label for="of-disc">Disciplina</label><select id="of-disc"><option value="">Selecione</option>${AP.opcoes(AP.DISCIPLINAS.map((d) => [d, d]), '')}</select></div>
        <div class="campo"><label for="of-nivel">Nível escolar</label><select id="of-nivel">${AP.opcoesNivel('', 'Selecione')}</select></div>
      </div>
      <fieldset class="campo"><legend class="legenda">Modalidade</legend>
        <div class="opcoes">${Object.entries(AP.MODALIDADES).map(([k, n]) => `<label class="opcao"><input type="radio" name="of-mod" value="${k}">${n}</label>`).join('')}</div></fieldset>
      <div class="campo"><label for="of-preco">Valor da aula de 60 minutos (R$)</label><input id="of-preco" inputmode="decimal" placeholder="Ex.: 60,00"><p class="ajuda">Você define o valor livremente. Não há mínimo nem máximo.</p></div>
      <div id="of-msg"></div>`;
  }

  AP.rota({
    caminho: '/tutor/disciplinas', area: 'tutor', titulo: 'Minhas disciplinas', uc: ['UC05.1', 'UC05.2'], grupo: 'Tutor', exemplo: '#/tutor/disciplinas',
    render() {
      const t = AP.logado('tutor');
      if (t.statusAprovacao !== 'APROVADO') return AP.vazio('Disponível após a aprovação', 'Você poderá cadastrar disciplinas e preços quando a equipe aprovar sua formação.');
      const ofertas = AP.ofertasDo(t.id).sort((a, b) => a.disciplina.localeCompare(b.disciplina) || AP.ORDEM_NIVEIS.indexOf(a.nivel) - AP.ORDEM_NIVEIS.indexOf(b.nivel) || a.modalidade.localeCompare(b.modalidade));
      let ant = '';
      const linhas = ofertas.map((o) => {
        const nova = o.disciplina !== ant; ant = o.disciplina;
        return `<tr${nova ? ' class="grupo-inicio"' : ''}>
          <th scope="row">${nova ? AP.esc(o.disciplina) : '<span class="sr">' + AP.esc(o.disciplina) + '</span>'}</th>
          <td>${AP.nivelNome(o.nivel)}</td>
          <td>${AP.icone(o.modalidade === 'ONLINE' ? 'video' : 'local')} ${AP.MODALIDADES[o.modalidade]}</td>
          <td class="num"><strong>${AP.moeda(o.preco)}</strong></td>
          <td class="tabela__acoes"><button type="button" class="btn btn--texto btn--pequeno" data-editar="${o.id}">${AP.icone('lapis')}Editar preço</button><button type="button" class="btn btn--texto btn--pequeno btn--perigo-texto" data-remover="${o.id}">${AP.icone('lixeira')}Remover</button></td>
        </tr>`;
      }).join('');
      return `<header class="cabecalho"><div><h1>Minhas disciplinas</h1>
          <p>Cada combinação de disciplina, nível escolar e modalidade tem o seu preço. O valor é por aula individual de 60 minutos.</p></div>
          <button type="button" class="btn btn--primario" data-nova>${AP.icone('mais')}Cadastrar oferta</button></header>
        ${ofertas.length ? `<div class="painel painel--tabela"><div class="tabela-wrap"><table class="tabela">
          <caption class="sr">Ofertas de matéria cadastradas</caption>
          <thead><tr><th scope="col">Disciplina</th><th scope="col">Nível escolar</th><th scope="col">Modalidade</th><th scope="col" class="num">Valor da aula</th><th scope="col"><span class="sr">Ações</span></th></tr></thead>
          <tbody>${linhas}</tbody></table></div></div>
          <p class="ajuda mt">Mudanças de preço valem só para novas solicitações. Aulas já pedidas mantêm o valor registrado no momento da solicitação.</p>`
          : AP.vazio('Nenhuma oferta cadastrada', 'Cadastre a primeira disciplina para aparecer nas buscas dos alunos.', '<button type="button" class="btn btn--primario" data-nova>Cadastrar oferta</button>')}`;
    },
    montar(el) {
      const t = AP.logado('tutor');
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-nova]')) {
          const d = AP.dialogo({ titulo: 'Cadastrar oferta', corpo: formOferta(null), acoes: '<button type="button" class="btn btn--secundario" data-fechar>Cancelar</button><button type="submit" class="btn btn--primario">Salvar oferta</button>' });
          const form = d.querySelector('form');
          form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            AP.limparErros(form);
            const disc = d.querySelector('#of-disc').value;
            const nivel = d.querySelector('#of-nivel').value;
            const modI = d.querySelector('[name=of-mod]:checked');
            const preco = AP.lerValor(d.querySelector('#of-preco').value);
            if (!disc) AP.erro(d.querySelector('#of-disc'), 'Escolha a disciplina.');
            if (!nivel) AP.erro(d.querySelector('#of-nivel'), 'Escolha o nível escolar.');
            if (!modI) AP.erro(d.querySelector('[name=of-mod]'), 'Escolha a modalidade.');
            if (!d.querySelector('#of-preco').value.trim() || Number.isNaN(preco) || preco <= 0) AP.erro(d.querySelector('#of-preco'), 'Informe um valor maior que zero, só com números. Ex.: 60,00');
            if (disc && nivel && modI && AP.ofertasDo(t.id).some((o) => o.disciplina === disc && o.nivel === nivel && o.modalidade === modI.value)) {
              d.querySelector('#of-msg').innerHTML = `<div class="nota nota--erro nota--form" role="alert"><strong>Você já tem esta oferta.</strong><p>${AP.esc(disc)}, ${AP.nivelNome(nivel)}, ${AP.MODALIDADES[modI.value].toLowerCase()} já está no seu catálogo. Para mudar o valor, use “Editar preço”.</p></div>`;
              return;
            }
            if (form.querySelector('[aria-invalid]')) { AP.focarErro(form); return; }
            AP.db.ofertas.push({ id: AP.novoId('o'), tutorId: t.id, disciplina: disc, nivel, modalidade: modI.value, preco: Math.round(preco * 100) / 100 });
            AP.salvar();
            d.close();
            AP.avisar('Oferta cadastrada. Ela já aparece na busca dos alunos.');
            AP.atualizar();
          });
          return;
        }
        const ed = e.target.closest('[data-editar]');
        if (ed) {
          const o = AP.db.ofertas.find((x) => x.id === ed.dataset.editar);
          const afetadas = AP.ocupando(t.id).filter((g) => g.disciplina === o.disciplina && g.nivel === o.nivel && g.modalidade === o.modalidade).length;
          const d = AP.dialogo({
            titulo: 'Editar preço',
            corpo: formOferta(o) + `<p class="ajuda">O novo valor vale só para novas solicitações.${afetadas ? ` ${AP.plural(afetadas, 'aula pendente ou confirmada mantém', 'aulas pendentes ou confirmadas mantêm')} o valor registrado.` : ''}</p>`,
            acoes: '<button type="button" class="btn btn--secundario" data-fechar>Cancelar</button><button type="submit" class="btn btn--primario">Salvar preço</button>',
          });
          const form = d.querySelector('form');
          form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            AP.limparErros(form);
            const inp = d.querySelector('#of-preco');
            const preco = AP.lerValor(inp.value);
            if (!inp.value.trim() || Number.isNaN(preco) || preco <= 0) { AP.erro(inp, 'Informe um valor maior que zero, só com números. Ex.: 60,00'); inp.focus(); return; }
            o.preco = Math.round(preco * 100) / 100;
            AP.salvar();
            d.close();
            AP.avisar(`Preço atualizado para ${AP.moeda(o.preco)}.`);
            AP.atualizar();
          });
          return;
        }
        const rm = e.target.closest('[data-remover]');
        if (rm) {
          const o = AP.db.ofertas.find((x) => x.id === rm.dataset.remover);
          const ok = await AP.confirmar({ titulo: 'Remover oferta?', texto: `${AP.esc(AP.descOferta(o))} deixa de aparecer na busca. Aulas já solicitadas ou confirmadas não são afetadas.`, botao: 'Remover oferta', perigo: true });
          if (!ok) return;
          AP.db.ofertas = AP.db.ofertas.filter((x) => x.id !== o.id);
          AP.salvar();
          AP.avisar('Oferta removida do catálogo.');
          AP.atualizar();
        }
      });
    },
  });

  /* ================= UC07.1 / UC07.2 Minha disponibilidade ================= */
  /* Blocos com solicitação pendente ou aula confirmada, por dia da semana e hora */
  function reservados(tid) {
    const mapa = {};
    AP.ocupando(tid).filter(AP.ehFutura).sort((a, b) => a.inicio.localeCompare(b.inicio)).forEach((g) => {
      const d = AP.dataLocal(g.inicio);
      const k = `${d.getDay()}|${d.getHours()}`;
      if (!mapa[k]) mapa[k] = g;
    });
    return mapa;
  }
  const sobrepoe = (a, b) => a.inicio < b.fim && b.inicio < a.fim;

  function validarIntervalo(tid, dia, ini, fim, ignorarId) {
    if (!(fim > ini)) return 'O horário final precisa ser depois do horário inicial.';
    const outro = AP.dispDo(tid).find((d) => d.id !== ignorarId && d.dia === dia && sobrepoe(d, { inicio: ini, fim }));
    if (outro) return `Esse intervalo se sobrepõe a ${AP.hh(outro.inicio)} às ${AP.hh(outro.fim)} de ${AP.DIAS[dia].toLowerCase()}. Ajuste os horários.`;
    return '';
  }

  AP.rota({
    caminho: '/tutor/disponibilidade', area: 'tutor', titulo: 'Minha disponibilidade', uc: ['UC07.1', 'UC07.2'], grupo: 'Tutor', exemplo: '#/tutor/disponibilidade',
    render() {
      const t = AP.logado('tutor');
      if (t.statusAprovacao !== 'APROVADO') return AP.vazio('Disponível após a aprovação', 'Você poderá cadastrar seus horários quando a equipe aprovar sua formação.');
      const res = reservados(t.id);
      const disp = AP.dispDo(t.id);
      const total = disp.reduce((s, d) => s + d.fim - d.inicio, 0);
      const colunas = AP.ORDEM_DIAS.map((dia) => {
        const ints = disp.filter((d) => d.dia === dia).sort((a, b) => a.inicio - b.inicio);
        const corpo = ints.map((d) => {
          const blocos = [];
          for (let h = d.inicio; h < d.fim; h++) {
            const g = res[`${dia}|${h}`];
            if (g) {
              const cls = g.status === 'CONFIRMADA' ? 'bloco--confirmada' : 'bloco--pendente';
              blocos.push(`<button type="button" class="bloco ${cls}" data-reservado="${g.id}" aria-disabled="true" aria-label="${AP.DIAS[dia]}, ${AP.hh(h)}: ${AP.STATUS_AGENDAMENTO[g.status].toLowerCase()} em ${AP.fmtData(g.inicio)}">${AP.icone('cadeado')}${AP.hh(h)}<small>${AP.STATUS_AGENDAMENTO[g.status]} ${AP.pad(AP.dataLocal(g.inicio).getDate())}/${AP.pad(AP.dataLocal(g.inicio).getMonth() + 1)}</small></button>`);
            } else {
              blocos.push(`<button type="button" class="bloco" data-livre="${d.id}|${h}" aria-label="${AP.DIAS[dia]}, ${AP.hh(h)} às ${AP.hh(h + 1)}, livre">${AP.hh(h)}</button>`);
            }
          }
          return `<div class="intervalo">
            <div class="intervalo__topo"><span>${AP.hh(d.inicio)} às ${AP.hh(d.fim)}</span>
              <span class="intervalo__acoes"><button type="button" class="btn-icone btn-icone--p" data-editar-int="${d.id}" aria-label="Editar intervalo de ${AP.DIAS[dia].toLowerCase()}, ${AP.hh(d.inicio)} às ${AP.hh(d.fim)}">${AP.icone('lapis')}</button>
              <button type="button" class="btn-icone btn-icone--p" data-remover-int="${d.id}" aria-label="Remover intervalo de ${AP.DIAS[dia].toLowerCase()}, ${AP.hh(d.inicio)} às ${AP.hh(d.fim)}">${AP.icone('lixeira')}</button></span></div>
            ${blocos.join('')}
          </div>`;
        }).join('');
        return `<div class="semana__dia"><p class="dia__titulo"><strong>${AP.DIAS[dia]}</strong>${ints.length ? AP.plural(ints.reduce((s, d) => s + d.fim - d.inicio, 0), 'bloco', 'blocos') : 'sem horários'}</p>${corpo}</div>`;
      }).join('');

      return `<header class="cabecalho"><div><h1>Minha disponibilidade</h1>
        <p>Informe, para cada dia da semana, o intervalo em que você pode dar aula. O sistema divide cada intervalo em blocos de 60 minutos, que os alunos podem reservar.</p></div></header>
      <div class="disp">
        <form class="painel disp__form" id="form-int" novalidate>
          <h2>Adicionar intervalo</h2>
          <div class="campo"><label for="in-dia">Dia da semana</label><select id="in-dia">${AP.opcoes(AP.ORDEM_DIAS.map((d) => [d, AP.DIAS[d]]), 1)}</select></div>
          <div class="faixa faixa--rotulos">
            <div class="campo"><label for="in-ini">Início</label><select id="in-ini">${AP.opcoesHoras(6, 22, 14)}</select></div>
            <div class="campo"><label for="in-fim">Fim</label><select id="in-fim">${AP.opcoesHoras(7, 23, 16)}</select></div>
          </div>
          <p class="previa" id="previa" aria-live="polite"></p>
          <button type="submit" class="btn btn--primario btn--bloco">${AP.icone('mais')}Adicionar intervalo</button>
        </form>
        <section class="painel disp__semana" aria-labelledby="sem-titulo">
          <div class="painel__topo"><h2 id="sem-titulo">Sua semana</h2><span class="ajuda">${AP.plural(total, 'hora livre', 'horas livres')} por semana</span></div>
          <div class="legenda-blocos" aria-hidden="true"><span><i class="lg-livre"></i>Livre</span><span><i class="lg-pendente"></i>Solicitação pendente</span><span><i class="lg-confirmada"></i>Aula confirmada</span></div>
          <div class="semana papel-quadriculado">${colunas}</div>
          <p class="ajuda mt">Clique em um bloco livre para removê-lo ou editar o intervalo. Blocos com solicitação pendente ou aula confirmada não podem ser alterados.</p>
        </section>
      </div>`;
    },
    montar(el) {
      const t = AP.logado('tutor');
      const form = $(el, '#form-int');
      if (!form) return;
      const previa = () => {
        const ini = Number($(el, '#in-ini').value); const fim = Number($(el, '#in-fim').value);
        const p = $(el, '#previa');
        if (!(fim > ini)) { p.textContent = ''; return; }
        const hs = []; for (let h = ini; h < fim; h++) hs.push(AP.hh(h));
        p.innerHTML = `Gera ${AP.plural(hs.length, 'bloco', 'blocos')} de 60 min: <strong>${hs.join(', ')}</strong>.`;
      };
      form.addEventListener('change', previa);
      previa();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const dia = Number($(el, '#in-dia').value); const ini = Number($(el, '#in-ini').value); const fim = Number($(el, '#in-fim').value);
        const msg = validarIntervalo(t.id, dia, ini, fim);
        if (msg) { AP.erro($(el, fim > ini ? '#in-ini' : '#in-fim'), msg); AP.focarErro(form); return; }
        AP.db.disponibilidades.push({ id: AP.novoId('d'), tutorId: t.id, dia, inicio: ini, fim });
        AP.salvar();
        AP.avisar(`${AP.DIAS[dia]}, ${AP.hh(ini)} às ${AP.hh(fim)}: ${AP.plural(fim - ini, 'bloco cadastrado', 'blocos cadastrados')}.`);
        AP.atualizar();
      });

      const res = reservados(t.id);
      const reservadosNo = (d) => { const hs = []; for (let h = d.inicio; h < d.fim; h++) if (res[`${d.dia}|${h}`]) hs.push(h); return hs; };

      const editarIntervalo = (d) => {
        const presos = reservadosNo(d);
        const dlg = AP.dialogo({
          titulo: `Editar intervalo de ${AP.DIAS[d.dia].toLowerCase()}`,
          corpo: `<div class="faixa faixa--rotulos">
              <div class="campo"><label for="ed-ini">Início</label><select id="ed-ini">${AP.opcoesHoras(6, 22, d.inicio)}</select></div>
              <div class="campo"><label for="ed-fim">Fim</label><select id="ed-fim">${AP.opcoesHoras(7, 23, d.fim)}</select></div></div>
            ${presos.length ? `<p class="ajuda">${AP.icone('cadeado')} ${presos.map(AP.hh).join(', ')} ${presos.length > 1 ? 'têm' : 'tem'} aula marcada e precisa${presos.length > 1 ? 'm' : ''} continuar dentro do intervalo.</p>` : ''}`,
          acoes: '<button type="button" class="btn btn--secundario" data-fechar>Cancelar</button><button type="submit" class="btn btn--primario">Salvar intervalo</button>',
        });
        const f = dlg.querySelector('form');
        f.addEventListener('submit', (ev) => {
          ev.preventDefault();
          AP.limparErros(f);
          const ini = Number(dlg.querySelector('#ed-ini').value); const fim = Number(dlg.querySelector('#ed-fim').value);
          let msg = validarIntervalo(t.id, d.dia, ini, fim, d.id);
          const fora = presos.filter((h) => h < ini || h >= fim);
          if (!msg && fora.length) msg = `${fora.map(AP.hh).join(', ')} ${fora.length > 1 ? 'têm' : 'tem'} solicitação pendente ou aula confirmada. O novo intervalo precisa incluir ${fora.length > 1 ? 'esses horários' : 'esse horário'}.`;
          if (msg) { AP.erro(dlg.querySelector('#ed-fim'), msg); return; }
          d.inicio = ini; d.fim = fim;
          AP.salvar(); dlg.close();
          AP.avisar('Intervalo atualizado.');
          AP.atualizar();
        });
      };

      el.querySelector('.semana').addEventListener('click', async (e) => {
        const rsv = e.target.closest('[data-reservado]');
        if (rsv) {
          const g = AP.agendamento(rsv.dataset.reservado);
          AP.avisar(`Este bloco tem ${g.status === 'CONFIRMADA' ? 'uma aula confirmada' : 'uma solicitação pendente'} com ${AP.usuario(g.alunoId).nome} em ${AP.fmtDiaHora(g.inicio)} e não pode ser alterado.`, 'erro');
          return;
        }
        const ed = e.target.closest('[data-editar-int]');
        if (ed) { editarIntervalo(AP.db.disponibilidades.find((x) => x.id === ed.dataset.editarInt)); return; }
        const rm = e.target.closest('[data-remover-int]');
        if (rm) {
          const d = AP.db.disponibilidades.find((x) => x.id === rm.dataset.removerInt);
          const presos = reservadosNo(d);
          if (presos.length) { AP.avisar(`Não é possível remover: ${presos.map(AP.hh).join(', ')} de ${AP.DIAS[d.dia].toLowerCase()} ${presos.length > 1 ? 'têm' : 'tem'} aula marcada. Remova só os blocos livres.`, 'erro'); return; }
          const ok = await AP.confirmar({ titulo: 'Remover intervalo?', texto: `${AP.DIAS[d.dia]}, ${AP.hh(d.inicio)} às ${AP.hh(d.fim)} (${AP.plural(d.fim - d.inicio, 'bloco', 'blocos')}) deixa de aparecer para os alunos.`, botao: 'Remover intervalo', perigo: true });
          if (!ok) return;
          AP.db.disponibilidades = AP.db.disponibilidades.filter((x) => x.id !== d.id);
          AP.salvar(); AP.avisar('Intervalo removido.'); AP.atualizar();
          return;
        }
        const lv = e.target.closest('[data-livre]');
        if (lv) {
          const [did, hs] = lv.dataset.livre.split('|');
          const d = AP.db.disponibilidades.find((x) => x.id === did);
          const h = Number(hs);
          const dlg = AP.dialogo({
            titulo: `${AP.DIAS[d.dia]}, ${AP.hh(h)} às ${AP.hh(h + 1)}`,
            corpo: `<p>${AP.selo('Livre', 'tinta')} Este bloco faz parte do intervalo ${AP.hh(d.inicio)} às ${AP.hh(d.fim)}.</p><p class="ajuda">Ao remover, ele deixa de aparecer para os alunos. Os outros blocos do intervalo continuam livres.</p>`,
            acoes: '<button type="button" class="btn btn--secundario" data-editar>Editar intervalo</button><button type="submit" class="btn btn--perigo">Remover este bloco</button>',
          });
          dlg.querySelector('[data-editar]').addEventListener('click', () => { dlg.close(); editarIntervalo(d); });
          dlg.querySelector('form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const partes = [];
            if (h > d.inicio) partes.push({ inicio: d.inicio, fim: h });
            if (h + 1 < d.fim) partes.push({ inicio: h + 1, fim: d.fim });
            AP.db.disponibilidades = AP.db.disponibilidades.filter((x) => x.id !== d.id);
            partes.forEach((p) => AP.db.disponibilidades.push({ id: AP.novoId('d'), tutorId: t.id, dia: d.dia, inicio: p.inicio, fim: p.fim }));
            AP.salvar(); dlg.close();
            AP.avisar(`Bloco das ${AP.hh(h)} removido de ${AP.DIAS[d.dia].toLowerCase()}.`);
            AP.atualizar();
          });
        }
      });
    },
  });
})();
