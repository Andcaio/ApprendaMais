/* Apprenda+ — telas do administrador
 * UC04.1 Aprovar/Rejeitar tutor, UC03.1 Moderar usuários
 */
(function () {
  const AP = window.AP;
  const $ = (el, s) => el.querySelector(s);

  /* ================= UC04.1 Lista de tutores para análise ================= */
  AP.rota({
    caminho: '/admin/tutores', area: 'admin', titulo: 'Análise de tutores', uc: ['UC04.1'], grupo: 'Administrador', exemplo: '#/admin/tutores',
    variacoes: [['Tutores rejeitados', '#/admin/tutores?status=REJEITADO']],
    render({ query }) {
      const st = ['PENDENTE', 'REJEITADO', 'APROVADO'].includes(query.status) ? query.status : 'PENDENTE';
      const tutores = AP.db.usuarios.filter((u) => u.tipo === 'tutor');
      const n = (s) => tutores.filter((t) => t.statusAprovacao === s).length;
      const lista = tutores.filter((t) => t.statusAprovacao === st).sort((a, b) => (a.dataReenvio || a.dataCadastro).localeCompare(b.dataReenvio || b.dataCadastro));
      const abas = [['PENDENTE', 'Pendentes'], ['REJEITADO', 'Rejeitados'], ['APROVADO', 'Aprovados']];
      const vazio = st === 'PENDENTE' ? AP.vazio('Nenhum cadastro aguardando análise', 'Novos cadastros de tutores aparecem aqui.') : AP.vazio('Nada por aqui', 'Nenhum tutor com este status.');
      return `<header class="cabecalho"><div><h1>Análise de tutores</h1>
          <p>Confira os comprovantes de formação de cada tutor conforme os critérios de habilitação por nível de ensino e aprove ou rejeite o cadastro.</p></div></header>
        <nav class="abas" aria-label="Filtrar por status">${abas.map(([k, t]) => `<a href="#/admin/tutores?status=${k}"${k === st ? ' aria-current="page"' : ''}>${t} <span class="abas__n">${n(k)}</span></a>`).join('')}</nav>
        ${lista.length ? `<div class="painel painel--tabela"><div class="tabela-wrap"><table class="tabela">
          <caption class="sr">Tutores com status ${AP.STATUS_APROVACAO[st].toLowerCase()}</caption>
          <thead><tr><th scope="col">Tutor</th><th scope="col">Formação declarada</th><th scope="col">Níveis pedidos</th><th scope="col">Enviado em</th><th scope="col" class="num">Documentos</th><th scope="col">Status</th><th scope="col"><span class="sr">Ação</span></th></tr></thead>
          <tbody>${lista.map((t) => `<tr>
            <td><span class="celula-usuario">${AP.avatar(t)}<span><strong>${AP.esc(t.nome)}</strong><small>${AP.esc(t.email)}</small></span></span></td>
            <td>${AP.esc(t.formacao.curso)}<small class="bloco-texto">${AP.TIPOS_FORMACAO[t.formacao.tipo]}</small></td>
            <td>${t.niveis.map(AP.nivelNome).join(', ')}</td>
            <td>${AP.fmtData(t.dataReenvio || t.dataCadastro)}${t.dataReenvio ? '<small class="bloco-texto">reenviado</small>' : ''}</td>
            <td class="num">${AP.documentosDo(t.id).length}</td>
            <td>${AP.seloAprovacao(t.statusAprovacao)}</td>
            <td><a class="btn btn--${st === 'PENDENTE' ? 'primario' : 'secundario'} btn--pequeno" href="#/admin/tutores/${t.id}">${st === 'PENDENTE' ? 'Analisar' : 'Ver'}<span class="sr"> ${AP.esc(t.nome)}</span></a></td>
          </tr>`).join('')}</tbody></table></div></div>` : vazio}`;
    },
  });

  /* ================= UC04.1 Análise de um tutor ================= */
  AP.rota({
    caminho: '/admin/tutores/:id', area: 'admin', menu: '/admin/tutores', titulo: 'Aprovar ou rejeitar tutor', uc: ['UC04.1'], grupo: 'Administrador', exemplo: '#/admin/tutores/t7',
    render({ params }) {
      const t = AP.usuario(params.id);
      const voltar = `<a class="voltar" href="#/admin/tutores">${AP.icone('voltar')}Voltar para a lista</a>`;
      if (!t || t.tipo !== 'tutor') return voltar + AP.vazio('Tutor não encontrado', 'Confira o endereço.');
      const docs = AP.documentosDo(t.id);
      const hist = AP.db.historicoAnalise.filter((h) => h.tutorId === t.id).sort((a, b) => b.data.localeCompare(a.data));
      let decisao;
      if (t.statusAprovacao === 'PENDENTE') {
        decisao = `<h2>Critérios de habilitação</h2>
          <p class="ajuda">Marque cada critério que os documentos comprovam. Só é possível aprovar com todos marcados.</p>
          <fieldset class="grade-criterios"><legend class="sr">Critérios por nível pedido</legend>
            ${t.niveis.map((n) => `<label class="criterio"><input type="checkbox" data-criterio value="${n}"><span><strong>${AP.NIVEIS[n].nome}</strong><small>${AP.NIVEIS[n].detalhe}. Exige ${AP.NIVEIS[n].exige.charAt(0).toLowerCase() + AP.NIVEIS[n].exige.slice(1)}.</small></span></label>`).join('')}
          </fieldset>
          <div id="decisao-msg"></div>
          <div class="acoes acoes--coluna">
            <button type="button" class="btn btn--sucesso btn--bloco" data-aprovar>Aprovar tutor</button>
            <button type="button" class="btn btn--perigo-contorno btn--bloco" data-rejeitar>Rejeitar documentação</button>
          </div>`;
      } else if (t.statusAprovacao === 'APROVADO') {
        decisao = `<h2>Decisão</h2><p>${AP.seloAprovacao('APROVADO')}</p><p>Aprovado em ${AP.fmtData(t.dataAnalise)}. O tutor já pode cadastrar disciplinas e horários.</p>`;
      } else {
        decisao = `<h2>Decisão</h2><p>${AP.seloAprovacao('REJEITADO')}</p><p class="ajuda">Rejeitado em ${AP.fmtData(t.dataAnalise)}. A justificativa abaixo está visível para o tutor, que pode corrigir os dados e reenviar.</p><blockquote class="citacao">${AP.esc(t.justificativaRejeicao)}</blockquote>`;
      }
      return `${voltar}
        <header class="cabecalho"><div class="cabecalho__pessoa">${AP.avatar(t, 'g')}<div><h1>${AP.esc(t.nome)}</h1>
          <p>Cadastro ${t.dataReenvio ? 'reenviado' : 'enviado'} em ${AP.fmtData(t.dataReenvio || t.dataCadastro)} ${AP.seloAprovacao(t.statusAprovacao)}</p></div></div></header>
        <div class="analise">
          <div class="analise__dados">
            <section class="painel"><h2>Formação declarada</h2>
              <dl class="dados">
                <div><dt>Tipo</dt><dd>${AP.TIPOS_FORMACAO[t.formacao.tipo]}</dd></div>
                <div><dt>Curso</dt><dd>${AP.esc(t.formacao.curso)}</dd></div>
                <div><dt>Instituição</dt><dd>${AP.esc(t.formacao.instituicao)}</dd></div>
                <div><dt>Conclusão</dt><dd>${t.formacao.ano}</dd></div>
                <div><dt>Níveis pedidos</dt><dd>${t.niveis.map(AP.nivelNome).join(', ')}</dd></div>
              </dl>
            </section>
            <section class="painel"><h2>Documentos enviados</h2>
              <ul class="docs">${docs.map((d) => `<li>${AP.icone('documento')}<span><strong>${AP.esc(d.nomeArquivo)}</strong><small>${AP.esc(d.tipo)}, ${AP.fmtTamanho(d.tamanhoKb)}, enviado em ${AP.fmtData(d.dataEnvio)}</small></span><button type="button" class="btn btn--secundario btn--pequeno" data-ver-doc="${d.id}">Visualizar<span class="sr"> ${AP.esc(d.nomeArquivo)}</span></button></li>`).join('')}</ul>
            </section>
            <section class="painel"><h2>Dados pessoais</h2>
              <dl class="dados">
                <div><dt>CPF</dt><dd>${AP.formatarCPF(t.cpf)}</dd></div>
                <div><dt>E-mail</dt><dd>${AP.esc(t.email)}</dd></div>
                <div><dt>Telefone</dt><dd>${AP.esc(t.telefone)}</dd></div>
                <div><dt>Cidade</dt><dd>${AP.esc(t.cidade)}</dd></div>
                <div><dt>Nascimento</dt><dd>${AP.fmtData(t.dataNascimento)}</dd></div>
              </dl>
              <h3 class="mt">Apresentação</h3><p class="texto-longo">${AP.esc(t.apresentacao)}</p>
            </section>
            ${hist.length ? `<section class="painel"><h2>Histórico da análise</h2><ol class="historico">${hist.map((h) => `<li><p>${h.tipo === 'REENVIADO' ? AP.selo('Reenviado pelo tutor', 'tinta') : h.tipo === 'APROVADO' ? AP.seloAprovacao('APROVADO') : AP.seloAprovacao('REJEITADO')} <small>${AP.fmtDataHora(h.data)}</small></p><p>${AP.esc(h.texto)}</p></li>`).join('')}</ol></section>` : ''}
          </div>
          <aside class="painel analise__decisao" aria-label="Decisão">${decisao}</aside>
        </div>`;
    },
    montar(el, { params }) {
      const t = AP.usuario(params.id);
      if (!t) return;
      el.addEventListener('click', (e) => {
        const v = e.target.closest('[data-ver-doc]');
        if (!v) return;
        const d = AP.db.documentos.find((x) => x.id === v.dataset.verDoc);
        AP.dialogo({
          titulo: d.nomeArquivo, classe: 'dialogo--largo',
          corpo: `<div class="doc-previa" role="img" aria-label="Pré-visualização simulada do documento">
              <p class="doc-previa__inst">${AP.esc(t.formacao.instituicao)}</p>
              <p class="doc-previa__titulo">${AP.esc(d.tipo)}</p>
              <p>Certificamos que <strong>${AP.esc(t.nome)}</strong> concluiu o curso de <strong>${AP.esc(t.formacao.curso)}</strong> em ${t.formacao.ano}.</p>
              <span class="doc-previa__linha"></span><span class="doc-previa__linha"></span><span class="doc-previa__linha doc-previa__linha--curta"></span>
            </div><p class="proto-nota">No protótipo, a pré-visualização é simulada.</p>`,
          acoes: '<button type="button" class="btn btn--secundario" data-fechar>Fechar</button>',
        });
      });
      const apr = $(el, '[data-aprovar]');
      if (!apr) return;
      apr.addEventListener('click', async () => {
        const msg = $(el, '#decisao-msg');
        const crit = [...el.querySelectorAll('[data-criterio]')];
        if (crit.some((c) => !c.checked)) {
          msg.innerHTML = '<div class="nota nota--erro" role="alert"><strong>Marque todos os critérios antes de aprovar.</strong><p>Se algum não foi comprovado, rejeite a documentação com uma justificativa.</p></div>';
          crit.find((c) => !c.checked).focus();
          return;
        }
        const ok = await AP.confirmar({ titulo: 'Aprovar tutor?', texto: `${AP.esc(t.nome)} poderá cadastrar disciplinas, preços e horários, e passará a aparecer nas buscas.`, botao: 'Aprovar tutor' });
        if (!ok) return;
        t.statusAprovacao = 'APROVADO';
        t.dataAnalise = AP.isoLocal(AP.agora()).slice(0, 10);
        t.justificativaRejeicao = null;
        AP.db.historicoAnalise.push({ id: AP.novoId('h'), tutorId: t.id, tipo: 'APROVADO', data: AP.isoLocal(AP.agora()), adminId: AP.db.sessao.admin, texto: `Critérios conferidos: ${t.niveis.map(AP.nivelNome).join(', ')}.` });
        AP.salvar();
        AP.avisar(`${t.nome} foi aprovado(a).`);
        AP.ir('#/admin/tutores');
      });
      $(el, '[data-rejeitar]').addEventListener('click', () => {
        const d = AP.dialogo({
          titulo: 'Rejeitar documentação',
          corpo: `<div class="campo"><label for="rj-just">Justificativa</label><textarea id="rj-just" rows="5" maxlength="1000"></textarea>
            <p class="ajuda">Fica visível para ${AP.esc(AP.primeiroNome(t.nome))}. Explique o que faltou e o que precisa ser enviado. O tutor poderá corrigir e reenviar.</p></div>`,
          acoes: '<button type="button" class="btn btn--secundario" data-fechar>Cancelar</button><button type="submit" class="btn btn--perigo">Rejeitar documentação</button>',
        });
        const f = d.querySelector('form');
        f.addEventListener('submit', (ev) => {
          ev.preventDefault();
          AP.limparErros(f);
          const just = d.querySelector('#rj-just').value.trim();
          if (just.length < 20) { AP.erro(d.querySelector('#rj-just'), 'Escreva uma justificativa de pelo menos 20 caracteres.'); d.querySelector('#rj-just').focus(); return; }
          t.statusAprovacao = 'REJEITADO';
          t.justificativaRejeicao = just;
          t.dataAnalise = AP.isoLocal(AP.agora()).slice(0, 10);
          AP.db.historicoAnalise.push({ id: AP.novoId('h'), tutorId: t.id, tipo: 'REJEITADO', data: AP.isoLocal(AP.agora()), adminId: AP.db.sessao.admin, texto: just });
          AP.salvar();
          d.close();
          AP.avisar(`Documentação de ${t.nome} rejeitada. A justificativa foi enviada ao tutor.`);
          AP.ir('#/admin/tutores');
        });
      });
    },
  });

  /* ================= UC03.1 Usuários ================= */
  const filtrosUsuarios = () => ({ termo: '', tipo: '', status: '' });
  function buscarUsuarios(f) {
    const termo = f.termo.trim().toLowerCase();
    const dig = AP.soDigitos(termo);
    return AP.db.usuarios.filter((u) => u.tipo !== 'admin' &&
      (!f.tipo || u.tipo === f.tipo) && (!f.status || u.status === f.status) &&
      (!termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo) || (dig.length >= 3 && u.cpf.includes(dig))))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }
  function tabelaUsuarios(f) {
    const lista = buscarUsuarios(f);
    if (!lista.length) return AP.vazio('Nenhum usuário encontrado', 'Confira o nome, e-mail ou CPF digitado, ou limpe os filtros.', '<button type="button" class="btn btn--secundario" data-limpar>Limpar filtros</button>');
    return `<p class="texto-apoio" role="status">${AP.plural(lista.length, 'usuário encontrado', 'usuários encontrados')}</p>
      <div class="painel painel--tabela"><div class="tabela-wrap"><table class="tabela">
      <caption class="sr">Resultado da pesquisa de usuários</caption>
      <thead><tr><th scope="col">Usuário</th><th scope="col">Tipo</th><th scope="col">CPF</th><th scope="col">Cadastro</th><th scope="col">Status da conta</th><th scope="col"><span class="sr">Ação</span></th></tr></thead>
      <tbody>${lista.map((u) => `<tr>
        <td><span class="celula-usuario">${AP.avatar(u)}<span><strong>${AP.esc(u.nome)}</strong><small>${AP.esc(u.email)}</small></span></span></td>
        <td>${u.tipo === 'aluno' ? `Aluno${AP.idade(u.dataNascimento) < 18 ? '<small class="bloco-texto">menor de idade</small>' : ''}` : `Tutor<small class="bloco-texto">${AP.STATUS_APROVACAO[u.statusAprovacao].toLowerCase()}</small>`}</td>
        <td>${AP.mascararCPF(u.cpf)}</td>
        <td>${AP.fmtData(u.dataCadastro)}</td>
        <td>${AP.seloConta(u.status)}</td>
        <td><a class="btn btn--secundario btn--pequeno" href="#/admin/usuarios/${u.id}">Ver cadastro<span class="sr"> de ${AP.esc(u.nome)}</span></a></td>
      </tr>`).join('')}</tbody></table></div></div>`;
  }

  AP.rota({
    caminho: '/admin/usuarios', area: 'admin', titulo: 'Pesquisar usuários', uc: ['UC03.1'], grupo: 'Administrador', exemplo: '#/admin/usuarios',
    render() {
      const f = AP.ui.usuarios || (AP.ui.usuarios = filtrosUsuarios());
      return `<header class="cabecalho"><div><h1>Usuários</h1><p>Pesquise alunos e tutores para consultar o cadastro e aplicar suspensão, reativação ou bloqueio.</p></div></header>
        <form class="painel filtros-linha" id="form-usuarios" role="search" novalidate>
          <div class="campo campo--cresce"><label for="u-termo">Nome, e-mail ou CPF</label><input id="u-termo" type="search" value="${AP.esc(f.termo)}" placeholder="Ex.: Larissa ou 613.298"></div>
          <div class="campo"><label for="u-tipo">Tipo</label><select id="u-tipo">${AP.opcoes([['', 'Todos'], ['aluno', 'Alunos'], ['tutor', 'Tutores']], f.tipo)}</select></div>
          <div class="campo"><label for="u-status">Status da conta</label><select id="u-status"><option value="">Todos</option>${AP.opcoes(Object.entries(AP.STATUS_CONTA), f.status)}</select></div>
          <button type="submit" class="btn btn--primario">${AP.icone('busca')}Pesquisar</button>
        </form>
        <section id="res-usuarios" class="mt" aria-live="polite">${tabelaUsuarios(f)}</section>`;
    },
    montar(el) {
      const form = $(el, '#form-usuarios');
      const ler = () => { AP.ui.usuarios = { termo: $(el, '#u-termo').value, tipo: $(el, '#u-tipo').value, status: $(el, '#u-status').value }; $(el, '#res-usuarios').innerHTML = tabelaUsuarios(AP.ui.usuarios); };
      form.addEventListener('submit', (e) => { e.preventDefault(); ler(); });
      form.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') ler(); });
      el.addEventListener('click', (e) => { if (e.target.closest('[data-limpar]')) { AP.ui.usuarios = filtrosUsuarios(); AP.atualizar(); } });
    },
  });

  AP.rota({
    caminho: '/admin/usuarios/:id', area: 'admin', menu: '/admin/usuarios', titulo: 'Moderar usuário', uc: ['UC03.1'], grupo: 'Administrador', exemplo: '#/admin/usuarios/a4',
    variacoes: [['Aluno menor com responsável legal', '#/admin/usuarios/a1'], ['Tutor bloqueado', '#/admin/usuarios/t11']],
    render({ params }) {
      const u = AP.usuario(params.id);
      const voltar = `<a class="voltar" href="#/admin/usuarios">${AP.icone('voltar')}Voltar para usuários</a>`;
      if (!u || u.tipo === 'admin') return voltar + AP.vazio('Usuário não encontrado', 'Confira o endereço ou faça uma nova pesquisa.');
      const idade = AP.idade(u.dataNascimento);
      const r = u.responsavelId ? AP.responsavel(u.responsavelId) : null;
      const aut = r ? AP.autorizacoesDo(u.id)[0] : null;
      const mods = AP.db.moderacoes.filter((m) => m.usuarioId === u.id).sort((a, b) => b.data.localeCompare(a.data));
      const acoesPorStatus = { ATIVO: ['SUSPENSAO', 'SUSPENSAO_PREVENTIVA', 'BLOQUEIO'], PENDENTE: ['SUSPENSAO_PREVENTIVA', 'BLOQUEIO'], SUSPENSO: ['REATIVACAO', 'BLOQUEIO'], BLOQUEADO: ['REATIVACAO'] }[u.status];
      const ags = AP.agendamentosDe(u.tipo, u.id);
      return `${voltar}
        <header class="cabecalho"><div class="cabecalho__pessoa">${AP.avatar(u, 'g')}<div><h1>${AP.esc(u.nome)}</h1>
          <p>${u.tipo === 'aluno' ? 'Aluno' : 'Tutor'}, cadastrado em ${AP.fmtData(u.dataCadastro)} ${AP.seloConta(u.status)}</p></div></div></header>
        <div class="analise">
          <div class="analise__dados">
            <section class="painel"><h2>Dados cadastrais</h2>
              <dl class="dados">
                <div><dt>CPF</dt><dd>${AP.formatarCPF(u.cpf)}</dd></div>
                <div><dt>E-mail</dt><dd>${AP.esc(u.email)}</dd></div>
                <div><dt>Telefone</dt><dd>${AP.esc(u.telefone)}</dd></div>
                <div><dt>Nascimento</dt><dd>${AP.fmtData(u.dataNascimento)} <small>(${idade} anos)</small></dd></div>
                ${u.tipo === 'aluno' ? `<div><dt>Nível escolar</dt><dd>${AP.nivelNome(u.nivelEscolar)}</dd></div>` : `<div><dt>Cidade</dt><dd>${AP.esc(u.cidade)}</dd></div>`}
                <div><dt>Aulas na plataforma</dt><dd>${ags.length}</dd></div>
              </dl>
            </section>
            ${r ? `<section class="painel painel--marcado"><h2>Responsável legal</h2>
              <p class="ajuda">Aluno menor de idade. O acesso depende da autorização deste responsável.</p>
              <dl class="dados">
                <div><dt>Nome</dt><dd>${AP.esc(r.nomeCompleto)}</dd></div>
                <div><dt>CPF</dt><dd>${AP.formatarCPF(r.cpf)}</dd></div>
                <div><dt>E-mail</dt><dd>${AP.esc(r.email)}</dd></div>
                <div><dt>Autorização</dt><dd>${aut ? `${AP.seloAutorizacao(aut.status)} <small>${aut.dataResposta ? 'em ' + AP.fmtData(aut.dataResposta) : 'enviada em ' + AP.fmtData(aut.dataEnvio)}</small>` : '—'}</dd></div>
              </dl></section>` : ''}
            ${u.tipo === 'tutor' ? `<section class="painel"><h2>Situação como tutor</h2>
              <dl class="dados">
                <div><dt>Aprovação</dt><dd>${AP.seloAprovacao(u.statusAprovacao)}</dd></div>
                <div><dt>Formação</dt><dd>${AP.esc(u.formacao.curso)}</dd></div>
                <div><dt>Ofertas de matéria</dt><dd>${AP.ofertasDo(u.id).length}</dd></div>
              </dl><a href="#/admin/tutores/${u.id}">Ver análise da formação</a></section>` : ''}
            <section class="painel"><h2>Histórico de moderação</h2>
              ${mods.length ? `<ol class="historico">${mods.map((m) => `<li><p><strong>${AP.ACOES_MODERACAO[m.tipo].nome}</strong> <small>${AP.fmtDataHora(m.data)}, por ${AP.esc(AP.usuario(m.adminId).nome)}</small></p><p>${AP.esc(m.justificativa)}</p></li>`).join('')}</ol>` : '<p class="texto-apoio">Nenhuma ação registrada para esta conta.</p>'}
            </section>
          </div>
          <aside class="painel analise__decisao" aria-labelledby="mod-titulo">
            <h2 id="mod-titulo">Moderar conta</h2>
            <p>Status atual: ${AP.seloConta(u.status)}</p>
            <form id="form-moderar" novalidate class="pilha-form">
              <fieldset class="campo"><legend class="legenda">Ação</legend>
                <div class="grade-criterios">${acoesPorStatus.map((k) => `<label class="criterio criterio--radio"><input type="radio" name="acao" value="${k}"><span><strong>${AP.ACOES_MODERACAO[k].verbo}</strong><small>${AP.ACOES_MODERACAO[k].descricao}</small></span></label>`).join('')}</div>
              </fieldset>
              <div class="campo"><label for="mod-just">Justificativa</label><textarea id="mod-just" rows="4" maxlength="1000"></textarea><p class="ajuda">Fica registrada no histórico do usuário.</p></div>
              <button type="submit" class="btn btn--primario btn--bloco">Aplicar ação</button>
            </form>
          </aside>
        </div>`;
    },
    montar(el, { params }) {
      const u = AP.usuario(params.id);
      const form = $(el, '#form-moderar');
      if (!form) return;
      const btn = form.querySelector('[type=submit]');
      form.addEventListener('change', () => {
        const a = form.querySelector('[name=acao]:checked');
        if (a) { btn.textContent = AP.ACOES_MODERACAO[a.value].verbo + ' conta'; btn.className = `btn btn--bloco ${a.value === 'REATIVACAO' ? 'btn--sucesso' : 'btn--perigo'}`; }
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const a = form.querySelector('[name=acao]:checked');
        const just = $(el, '#mod-just').value.trim();
        if (!a) AP.erro(form.querySelector('[name=acao]'), 'Escolha a ação.');
        if (just.length < 10) AP.erro($(el, '#mod-just'), 'Informe a justificativa da ação (pelo menos 10 caracteres).');
        if (form.querySelector('[aria-invalid]')) { AP.focarErro(form); return; }
        const acao = AP.ACOES_MODERACAO[a.value];
        const efeito = a.value === 'REATIVACAO' ? 'volta a ter acesso à plataforma' : a.value === 'BLOQUEIO' ? 'perde o acesso à plataforma' : 'perde o acesso até ser reativado(a)';
        const ok = await AP.confirmar({ titulo: `${acao.verbo} a conta?`, texto: `${AP.esc(u.nome)} ${efeito}. A justificativa fica registrada no histórico.`, botao: `${acao.verbo} conta`, perigo: a.value !== 'REATIVACAO' });
        if (!ok) return;
        let novo = acao.resultado;
        if (a.value === 'REATIVACAO' && u.tipo === 'aluno' && u.responsavelId && !AP.autorizacoesDo(u.id).some((x) => x.status === 'CONFIRMADA')) novo = 'PENDENTE';
        u.status = novo;
        AP.db.moderacoes.push({ id: AP.novoId('mod'), usuarioId: u.id, adminId: AP.db.sessao.admin, tipo: a.value, justificativa: just, data: AP.isoLocal(AP.agora()) });
        AP.salvar();
        AP.avisar(`${acao.nome} aplicada. Conta de ${u.nome}: ${AP.STATUS_CONTA[novo].toLowerCase()}.`);
        AP.atualizar();
      });
    },
  });
})();
