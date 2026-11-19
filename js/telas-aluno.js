/* Apprenda+ — telas do aluno
 * UC06.1 Pesquisar e filtrar tutores, UC06.2 Visualizar detalhes do tutor,
 * UC08.1 Solicitar agendamento e UC08.2 Reservar horário e impedir dupla seleção
 */
(function () {
  const AP = window.AP;
  const $ = (el, s) => el.querySelector(s);

  const TURNOS = { manha: ['Manhã', 6, 12], tarde: ['Tarde', 12, 18], noite: ['Noite', 18, 24] };
  const filtrosVazios = () => ({ disciplina: '', nivel: '', modalidade: '', precoMin: '', precoMax: '', dia: '', turno: '', ordem: 'relevancia' });

  /* ---------- busca ---------- */
  function buscar(f) {
    const min = f.precoMin === '' ? -Infinity : AP.lerValor(f.precoMin);
    const max = f.precoMax === '' ? Infinity : AP.lerValor(f.precoMax);
    const tutores = AP.db.usuarios.filter(AP.tutorPesquisavel);
    const res = [];
    tutores.forEach((t) => {
      const ofertas = AP.ofertasDo(t.id).filter((o) =>
        (!f.disciplina || o.disciplina === f.disciplina) &&
        (!f.nivel || o.nivel === f.nivel) &&
        (!f.modalidade || o.modalidade === f.modalidade) &&
        o.preco >= min && o.preco <= max);
      if (!ofertas.length) return;
      let livres = AP.blocosLivres(t.id);
      if (f.dia !== '') livres = livres.filter((b) => AP.dataLocal(b).getDay() === Number(f.dia));
      if (f.turno) { const [, de, ate] = TURNOS[f.turno]; livres = livres.filter((b) => { const h = AP.dataLocal(b).getHours(); return h >= de && h < ate; }); }
      if ((f.dia !== '' || f.turno) && !livres.length) return;
      const precoMin = Math.min(...ofertas.map((o) => o.preco));
      res.push({ t, ofertas, livres, precoMin, relevancia: ofertas.length * 3 + Math.min(livres.length, 12) });
    });
    const ord = {
      relevancia: (a, b) => b.relevancia - a.relevancia || a.t.nome.localeCompare(b.t.nome),
      preco: (a, b) => a.precoMin - b.precoMin || b.relevancia - a.relevancia,
      disponibilidade: (a, b) => (a.livres[0] || '9999').localeCompare(b.livres[0] || '9999'),
    }[f.ordem] || (() => 0);
    return res.sort(ord);
  }

  function materiasResumo(ofertas) {
    const mapa = new Map();
    ofertas.forEach((o) => { if (!mapa.has(o.disciplina)) mapa.set(o.disciplina, new Set()); mapa.get(o.disciplina).add(o.nivel); });
    return [...mapa].map(([d, ns]) => `<li><strong>${AP.esc(d)}</strong> ${[...ns].sort((a, b) => AP.ORDEM_NIVEIS.indexOf(a) - AP.ORDEM_NIVEIS.indexOf(b)).map(AP.nivelNome).join(', ')}</li>`).join('');
  }

  function resultadosHTML(f) {
    const res = buscar(f);
    const topo = `<div class="resultados__topo">
        <h2 id="res-titulo">${res.length ? AP.plural(res.length, 'tutor encontrado', 'tutores encontrados') : 'Nenhum tutor encontrado'}</h2>
        <div class="campo campo--linha"><label for="f-ordem">Ordenar por</label>
          <select id="f-ordem" name="ordem">${AP.opcoes([['relevancia', 'Relevância'], ['preco', 'Menor preço'], ['disponibilidade', 'Horário livre mais próximo']], f.ordem)}</select></div>
      </div>`;
    if (!res.length) {
      return topo + AP.vazio('Nenhum tutor atende a esses filtros', 'Tente ampliar a faixa de preço, trocar o dia ou o turno, ou buscar em outra modalidade.', '<button type="button" class="btn btn--secundario" data-limpar>Limpar filtros</button>');
    }
    return topo + `<ul class="lista-tutores">${res.map(({ t, ofertas, livres, precoMin }) => {
      const mods = [...new Set(ofertas.map((o) => o.modalidade))].map((m) => AP.MODALIDADES[m]).join(' e ');
      return `<li class="tutor-linha">
        ${AP.avatar(t, 'g')}
        <div class="tutor-linha__info">
          <h3><a href="#/aluno/tutor/${t.id}">${AP.esc(t.nome)}</a></h3>
          <p class="tutor-linha__formacao">${AP.esc(t.formacao.curso)}, ${AP.esc(t.formacao.instituicao)}</p>
          <ul class="tutor-linha__materias">${materiasResumo(ofertas)}</ul>
          <p class="tutor-linha__meta">${AP.icone(mods.includes('Presencial') ? 'local' : 'video')}${mods}${mods.includes('Presencial') ? `, ${AP.esc(t.cidade)}` : ''}</p>
        </div>
        <div class="tutor-linha__horarios">
          <p class="rotulo-pequeno">${livres.length ? 'Próximos horários livres' : 'Sem horários livres nos próximos 7 dias'}</p>
          <div class="mini-blocos">${livres.slice(0, 4).map((b) => `<span class="bloco bloco--mini">${AP.rotuloDia(b)}<strong>${AP.fmtHora(b)}</strong></span>`).join('')}</div>
        </div>
        <div class="tutor-linha__preco">
          <p class="preco"><span>a partir de</span> <strong>${AP.moeda(precoMin)}</strong> <span>por aula de 60 min</span></p>
          <a class="btn btn--secundario" href="#/aluno/tutor/${t.id}">Ver perfil<span class="sr"> de ${AP.esc(t.nome)}</span></a>
        </div>
      </li>`;
    }).join('')}</ul>`;
  }

  /* ================= UC06.1 Buscar tutores ================= */
  AP.rota({
    caminho: '/aluno/buscar', area: 'aluno', titulo: 'Pesquisar e filtrar tutores', uc: ['UC06.1'], grupo: 'Aluno', exemplo: '#/aluno/buscar',
    render() {
      const f = AP.ui.busca || (AP.ui.busca = filtrosVazios());
      const disciplinas = [...new Set(AP.db.ofertas.filter((o) => AP.tutorPesquisavel(AP.usuario(o.tutorId))).map((o) => o.disciplina))].sort((a, b) => a.localeCompare(b));
      return `<header class="cabecalho"><div>
          <h1>Buscar tutores</h1>
          <p>Filtre por matéria, nível, preço, modalidade e horário. Todos os tutores listados tiveram a formação conferida pela equipe.</p>
        </div></header>
      <div class="busca">
        <form class="busca__filtros painel" id="form-busca" novalidate aria-label="Filtros da busca">
          <h2 class="sr">Filtros</h2>
          <div class="campo"><label for="f-disc">Matéria</label><select id="f-disc" name="disciplina"><option value="">Todas</option>${AP.opcoes(disciplinas.map((d) => [d, d]), f.disciplina)}</select></div>
          <div class="campo"><label for="f-nivel">Nível escolar</label><select id="f-nivel" name="nivel">${AP.opcoesNivel(f.nivel, 'Todos')}</select></div>
          <fieldset class="campo"><legend class="legenda">Modalidade</legend>
            <div class="opcoes opcoes--compactas">
              ${[['', 'Qualquer'], ['PRESENCIAL', 'Presencial'], ['ONLINE', 'Online']].map(([v, t]) => `<label class="opcao"><input type="radio" name="modalidade" value="${v}"${f.modalidade === v ? ' checked' : ''}>${t}</label>`).join('')}
            </div></fieldset>
          <fieldset class="campo"><legend class="legenda">Preço por aula (R$)</legend>
            <div class="faixa">
              <label class="sr" for="f-min">Preço mínimo</label><input id="f-min" name="precoMin" inputmode="decimal" placeholder="mín." value="${AP.esc(f.precoMin)}">
              <span aria-hidden="true">até</span>
              <label class="sr" for="f-max">Preço máximo</label><input id="f-max" name="precoMax" inputmode="decimal" placeholder="máx." value="${AP.esc(f.precoMax)}">
            </div></fieldset>
          <fieldset class="campo"><legend class="legenda">Horário</legend>
            <div class="faixa">
              <label class="sr" for="f-dia">Dia da semana</label><select id="f-dia" name="dia"><option value="">Qualquer dia</option>${AP.opcoes(AP.ORDEM_DIAS.map((d) => [d, AP.DIAS[d]]), f.dia)}</select>
              <label class="sr" for="f-turno">Turno</label><select id="f-turno" name="turno"><option value="">Qualquer turno</option>${AP.opcoes(Object.entries(TURNOS).map(([k, [n, de, ate]]) => [k, `${n} (${de}h–${ate}h)`]), f.turno)}</select>
            </div></fieldset>
          <div class="busca__botoes"><button class="btn btn--primario" type="submit">${AP.icone('busca')}Buscar</button><button class="btn btn--texto" type="button" data-limpar>Limpar filtros</button></div>
        </form>
        <section class="busca__resultados" id="resultados" aria-live="polite" aria-labelledby="res-titulo">${resultadosHTML(f)}</section>
      </div>`;
    },
    montar(el) {
      const form = $(el, '#form-busca');
      const box = $(el, '#resultados');
      const aplicar = () => {
        const fd = new FormData(form);
        const f = AP.ui.busca;
        ['disciplina', 'nivel', 'modalidade', 'precoMin', 'precoMax', 'dia', 'turno'].forEach((k) => { f[k] = (fd.get(k) || '').toString().trim(); });
        AP.limparErros(form);
        const mn = f.precoMin === '' ? null : AP.lerValor(f.precoMin);
        const mx = f.precoMax === '' ? null : AP.lerValor(f.precoMax);
        if (mn !== null && (Number.isNaN(mn) || mn < 0)) { AP.erro($(el, '#f-min'), 'Use só números, como 50.'); return; }
        if (mx !== null && (Number.isNaN(mx) || mx < 0)) { AP.erro($(el, '#f-max'), 'Use só números, como 90.'); return; }
        if (mn !== null && mx !== null && mn > mx) { AP.erro($(el, '#f-max'), 'O preço máximo precisa ser maior que o mínimo.'); return; }
        box.innerHTML = resultadosHTML(f);
      };
      form.addEventListener('submit', (e) => { e.preventDefault(); aplicar(); });
      form.addEventListener('change', (e) => { if (e.target.matches('select, [type=radio]')) aplicar(); });
      el.addEventListener('change', (e) => { if (e.target.id === 'f-ordem') { AP.ui.busca.ordem = e.target.value; box.innerHTML = resultadosHTML(AP.ui.busca); $(el, '#f-ordem').focus(); } });
      el.addEventListener('click', (e) => { if (e.target.closest('[data-limpar]')) { AP.ui.busca = filtrosVazios(); AP.atualizar(); } });
    },
  });

  /* ================= UC06.2 + UC08.1 + UC08.2 Perfil do tutor e solicitação ================= */
  function gradeReserva(t, sel) {
    const livres = AP.blocosLivres(t.id);
    const base = new Date(AP.AGORA); base.setHours(0, 0, 0, 0);
    let html = '<div class="dias papel-quadriculado" role="group" aria-label="Horários livres nos próximos 7 dias">';
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const blocos = livres.filter((b) => AP.mesmoDia(AP.dataLocal(b), d));
      html += `<div class="dia${i === 0 ? ' dia--hoje' : ''}">
        <p class="dia__titulo"><strong>${i === 0 ? 'Hoje' : AP.DIAS_CURTOS[d.getDay()]}</strong>${AP.pad(d.getDate())}/${AP.pad(d.getMonth() + 1)}</p>
        ${blocos.length ? blocos.map((b) => `<button type="button" class="bloco" data-bloco="${b}" aria-pressed="${b === sel}" aria-label="${AP.fmtExtenso(b)}, ${AP.fmtIntervalo(b)}">${AP.fmtHora(b)}</button>`).join('') : '<p class="dia__vazio">Sem horários</p>'}
      </div>`;
    }
    return html + '</div>';
  }

  AP.rota({
    caminho: '/aluno/tutor/:id', area: 'aluno', menu: '/aluno/buscar', titulo: 'Visualizar detalhes do tutor e solicitar aula', uc: ['UC06.2', 'UC08.1', 'UC08.2'], grupo: 'Aluno', exemplo: '#/aluno/tutor/t1',
    render({ params }) {
      const t = AP.usuario(params.id);
      const voltar = `<a class="voltar" href="#/aluno/buscar">${AP.icone('voltar')}Voltar para a busca</a>`;
      if (!AP.tutorPesquisavel(t)) {
        return voltar + AP.vazio('Este perfil não está mais disponível', 'O tutor saiu da plataforma ou o cadastro foi suspenso. Volte para a busca e escolha outro tutor.', '<a class="btn btn--primario" href="#/aluno/buscar">Buscar outro tutor</a>');
      }
      if (!AP.ui.reserva || AP.ui.reserva.tutorId !== t.id) AP.ui.reserva = { tutorId: t.id, ofertaId: '', bloco: '' };
      const r = AP.ui.reserva;
      const ofertas = AP.ofertasDo(t.id).sort((a, b) => a.disciplina.localeCompare(b.disciplina) || AP.ORDEM_NIVEIS.indexOf(a.nivel) - AP.ORDEM_NIVEIS.indexOf(b.nivel) || a.modalidade.localeCompare(b.modalidade));
      const docs = AP.documentosDo(t.id);
      return `${voltar}
      <div class="perfil-tutor">
        <div class="perfil-tutor__principal">
          <header class="perfil-tutor__topo">
            ${AP.avatar(t, 'xg')}
            <div>
              <h1>${AP.esc(t.nome)}</h1>
              <p class="perfil-tutor__formacao">${AP.esc(t.formacao.curso)}, ${AP.esc(t.formacao.instituicao)} (${t.formacao.ano})</p>
              <p class="perfil-tutor__selos">${AP.selo('Formação conferida pela equipe', 'verde')} <span>${AP.icone('local')}${AP.esc(t.cidade)}</span></p>
            </div>
          </header>

          <section aria-labelledby="sec-apres">
            <h2 id="sec-apres">Apresentação</h2>
            <p class="texto-longo">${AP.esc(t.apresentacao)}</p>
          </section>

          <section aria-labelledby="sec-ofertas">
            <h2 id="sec-ofertas">Matérias e valores</h2>
            <p class="texto-apoio">Escolha o que você quer estudar. O valor é por aula individual de 60 minutos.</p>
            <fieldset class="ofertas"><legend class="sr">Matéria, nível e modalidade</legend>
              ${ofertas.map((o) => `<label class="oferta"><input type="radio" name="oferta" value="${o.id}"${r.ofertaId === o.id ? ' checked' : ''}>
                <span class="oferta__disc">${AP.esc(o.disciplina)}</span>
                <span class="oferta__nivel">${AP.nivelNome(o.nivel)}</span>
                <span class="oferta__mod">${AP.icone(o.modalidade === 'ONLINE' ? 'video' : 'local')}${AP.MODALIDADES[o.modalidade]}</span>
                <span class="oferta__preco">${AP.moeda(o.preco)}</span></label>`).join('')}
            </fieldset>
          </section>

          <section aria-labelledby="sec-horarios">
            <h2 id="sec-horarios">Horários disponíveis</h2>
            <p class="texto-apoio">Próximos 7 dias. Cada bloco é uma aula de 60 minutos. Horários já reservados por outros alunos não aparecem.</p>
            <div id="grade">${gradeReserva(t, r.bloco)}</div>
            <p class="proto-nota proto-nota--linha">Para testar a reserva simultânea (UC08.2), escolha segunda, 23/11, às 17:00 com o Rafael.</p>
          </section>

          <section aria-labelledby="sec-docs">
            <h2 id="sec-docs">Formação conferida</h2>
            <ul class="docs docs--publicos">${docs.map((d) => `<li>${AP.icone('escudo')}<span>${AP.esc(d.tipo)}: ${AP.esc(t.formacao.curso)}</span><small>conferido em ${AP.fmtData(t.dataAnalise || d.dataEnvio)}</small></li>`).join('')}</ul>
          </section>
        </div>

        <aside class="resumo-reserva painel" aria-labelledby="resumo-titulo">
          <h2 id="resumo-titulo">Sua solicitação</h2>
          <div id="resumo"></div>
          <button type="button" class="btn btn--primario btn--bloco btn--grande" id="btn-revisar">Revisar solicitação</button>
          <p class="ajuda">A aula só é confirmada quando o tutor aceitar. Até lá, o horário fica reservado para você.</p>
        </aside>
      </div>`;
    },
    montar(el, { params }) {
      const t = AP.usuario(params.id);
      if (!AP.tutorPesquisavel(t)) return;
      const r = AP.ui.reserva;
      const resumo = $(el, '#resumo');
      const btn = $(el, '#btn-revisar');

      const desenharResumo = () => {
        const o = AP.db.ofertas.find((x) => x.id === r.ofertaId);
        resumo.innerHTML = `<dl class="resumo-lista">
          <div><dt>Matéria</dt><dd>${o ? `${AP.esc(o.disciplina)}<small>${AP.nivelNome(o.nivel)}, ${AP.MODALIDADES[o.modalidade].toLowerCase()}</small>` : '<span class="falta">Escolha em “Matérias e valores”</span>'}</dd></div>
          <div><dt>Horário</dt><dd>${r.bloco ? `${AP.fmtDia(r.bloco)}<small>${AP.fmtIntervalo(r.bloco)}</small>` : '<span class="falta">Escolha um bloco livre</span>'}</dd></div>
          <div><dt>Valor da aula</dt><dd>${o ? AP.moeda(o.preco) : '—'}</dd></div>
        </dl>`;
        btn.setAttribute('aria-disabled', String(!(o && r.bloco)));
      };
      desenharResumo();

      el.querySelectorAll('[name=oferta]').forEach((i) => i.addEventListener('change', () => { r.ofertaId = i.value; desenharResumo(); }));
      $(el, '#grade').addEventListener('click', (e) => {
        const b = e.target.closest('[data-bloco]');
        if (!b) return;
        r.bloco = r.bloco === b.dataset.bloco ? '' : b.dataset.bloco;
        el.querySelectorAll('[data-bloco]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.bloco === r.bloco)));
        desenharResumo();
      });

      btn.addEventListener('click', () => {
        const o = AP.db.ofertas.find((x) => x.id === r.ofertaId);
        if (!o || !r.bloco) {
          AP.avisar(!o ? 'Escolha a matéria, o nível e a modalidade antes de continuar.' : 'Escolha um horário livre antes de continuar.', 'erro');
          return;
        }
        const aluno = AP.logado('aluno');
        const d = AP.dialogo({
          titulo: 'Confirme sua solicitação',
          corpo: `<dl class="resumo-lista resumo-lista--dialogo">
              <div><dt>Tutor</dt><dd>${AP.esc(t.nome)}</dd></div>
              <div><dt>Matéria</dt><dd>${AP.esc(o.disciplina)}<small>${AP.nivelNome(o.nivel)}</small></dd></div>
              <div><dt>Modalidade</dt><dd>${AP.MODALIDADES[o.modalidade]}${o.modalidade === 'ONLINE' ? '<small>O tutor envia o link da videochamada depois de aceitar.</small>' : '<small>O local é combinado pelo chat.</small>'}</dd></div>
              <div><dt>Data e horário</dt><dd>${AP.fmtExtenso(r.bloco)}<small>${AP.fmtIntervalo(r.bloco)}</small></dd></div>
              <div><dt>Valor</dt><dd>${AP.moeda(o.preco)}<small>Fica registrado nesta solicitação, mesmo se o tutor mudar o preço depois.</small></dd></div>
            </dl>
            <p class="ajuda">Ao enviar, o horário fica reservado para você e some da agenda dos outros alunos. A aula é confirmada quando ${AP.esc(AP.primeiroNome(t.nome))} aceitar.</p>
            <div id="dlg-erro"></div>`,
          acoes: '<button type="button" class="btn btn--secundario" data-fechar>Voltar</button><button type="submit" class="btn btn--primario">Enviar solicitação</button>',
        });
        d.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          const chave = `${t.id}|${r.bloco}`;
          // UC08.2: verificação atômica — o bloco continua livre?
          let tomado = AP.blocoOcupado(t.id, r.bloco);
          if (!tomado && chave === AP.BLOCO_DISPUTADO && !AP.db.disputaResolvida) {
            AP.db.agendamentos.push({ id: AP.novoId('g'), alunoId: 'a2', tutorId: t.id, disciplina: 'Cálculo I', nivel: 'SUPERIOR', modalidade: 'ONLINE', valor: 90, inicio: r.bloco, status: 'PENDENTE', dataSolicitacao: AP.isoLocal(AP.agora()), link: null, motivoCancelamento: null, canceladoPor: null, confirmadoEm: null, dataResposta: null });
            AP.db.disputaResolvida = true;
            AP.salvar();
            tomado = true;
          }
          if (tomado) {
            d.querySelector('#dlg-erro').innerHTML = `<div class="nota nota--erro" role="alert"><strong>Esse horário acabou de ser reservado por outra solicitação.</strong><p>Nenhuma solicitação foi criada. Escolha outro horário na agenda do tutor.</p></div>`;
            d.querySelector('.dialogo__rodape').innerHTML = '<button type="button" class="btn btn--primario" data-outro>Escolher outro horário</button>';
            d.querySelector('[data-outro]').addEventListener('click', () => d.close());
            d.querySelector('[data-outro]').focus();
            d.addEventListener('close', () => { r.bloco = ''; AP.atualizar(); });
            return;
          }
          const novo = {
            id: AP.novoId('g'), alunoId: aluno.id, tutorId: t.id, disciplina: o.disciplina, nivel: o.nivel, modalidade: o.modalidade, valor: o.preco,
            inicio: r.bloco, status: 'PENDENTE', dataSolicitacao: AP.isoLocal(AP.agora()), link: null, motivoCancelamento: null, canceladoPor: null, confirmadoEm: null, dataResposta: null,
          };
          AP.db.agendamentos.push(novo);
          AP.salvar();
          AP.ui.reserva = null;
          AP.ui.destaque = novo.id;
          d.close();
          AP.avisar(`Solicitação enviada para ${t.nome}. O horário está reservado enquanto o tutor responde.`);
          AP.ir('#/aluno/agenda');
        });
      });
    },
  });
})();
