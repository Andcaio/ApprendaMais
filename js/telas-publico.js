/* Apprenda+ — telas da área pública, cadastros e autorização do responsável legal
 * UC01.1, UC01.2, UC02.1, UC02.2 (e o retorno do UC04.1 visto pelo tutor)
 */
(function () {
  const AP = window.AP;
  const $ = (el, s) => el.querySelector(s);

  /* ---------- auxiliares de cadastro ---------- */
  AP.fmtTamanho = (kb) => (kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1).replace('.', ',')} MB`);

  AP.novaAutorizacao = function (alunoId, responsavelId) {
    const agora = AP.agora();
    const exp = new Date(agora.getTime() + 7 * 24 * 36e5);
    return { id: AP.novoId('au'), alunoId, responsavelId, codigo: AP.gerarCodigo(), dataEnvio: AP.isoLocal(agora), dataExpiracao: AP.isoLocal(exp), dataResposta: null, status: 'PENDENTE' };
  };

  AP.desenharCriterios = function (ul, valor) {
    ul.innerHTML = AP.criteriosSenha(valor).map((c) => `<li class="${c.ok ? 'ok' : ''}">${c.texto}</li>`).join('');
  };

  AP.htmlUpload = (id, rotulo = 'Documentos comprobatórios') => `
    <div class="campo upload">
      <span class="legenda" id="${id}-rotulo">${rotulo}</span>
      <label class="upload__area" for="${id}">${AP.icone('upload')}<span><strong>Escolher arquivos</strong><small>PDF, JPG ou PNG, até 10 MB cada</small></span></label>
      <input type="file" id="${id}" class="sr" multiple accept=".pdf,.jpg,.jpeg,.png" aria-labelledby="${id}-rotulo">
      <ul class="upload__lista" id="${id}-lista" aria-label="Arquivos anexados"></ul>
    </div>`;

  AP.montarUpload = function (el, id, lista) {
    const input = $(el, '#' + id);
    const ul = $(el, '#' + id + '-lista');
    const desenhar = () => {
      ul.innerHTML = lista.length
        ? lista.map((a, i) => `<li>${AP.icone('documento')}<span class="upload__nome">${AP.esc(a.nome)}</span><small>${AP.fmtTamanho(a.tamanhoKb)}${a.existente ? ', já enviado' : ''}</small><button type="button" class="btn btn--texto btn--pequeno" data-remover="${i}">Remover<span class="sr"> ${AP.esc(a.nome)}</span></button></li>`).join('')
        : '<li class="upload__vazio">Nenhum arquivo anexado.</li>';
    };
    input.addEventListener('change', () => {
      const recusados = [];
      [...input.files].forEach((f) => {
        const kb = Math.max(1, Math.round(f.size / 1024));
        if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) recusados.push(`${f.name} (formato não aceito)`);
        else if (kb > 10240) recusados.push(`${f.name} (maior que 10 MB)`);
        else lista.push({ nome: f.name, tamanhoKb: kb });
      });
      input.value = '';
      const box = input.closest('.campo');
      box.querySelectorAll('.erro-campo').forEach((e) => e.remove());
      input.removeAttribute('aria-invalid');
      if (recusados.length) AP.erro(input, `Não foi possível anexar ${recusados.join(', ')}. Envie PDF, JPG ou PNG de até 10 MB.`);
      desenhar();
    });
    ul.addEventListener('click', (e) => {
      const b = e.target.closest('[data-remover]');
      if (b) { lista.splice(Number(b.dataset.remover), 1); desenhar(); }
    });
    desenhar();
  };

  AP.abrirEmailResponsavel = function (aut) {
    const a = AP.usuario(aut.alunoId);
    const r = AP.responsavel(aut.responsavelId);
    const d = AP.dialogo({
      titulo: 'E-mail recebido pelo responsável',
      classe: 'dialogo--email',
      corpo: `<div class="email">
        <dl class="email__cab">
          <div><dt>De</dt><dd>Apprenda+ &lt;nao-responda@apprenda.mais&gt;</dd></div>
          <div><dt>Para</dt><dd>${AP.esc(r.nomeCompleto)} &lt;${AP.esc(r.email)}&gt;</dd></div>
          <div><dt>Assunto</dt><dd>${AP.esc(AP.primeiroNome(a.nome))} pediu sua autorização para usar o Apprenda+</dd></div>
        </dl>
        <div class="email__corpo">
          <p>Olá, ${AP.esc(AP.primeiroNome(r.nomeCompleto))}.</p>
          <p>${AP.esc(a.nome)} (${AP.idade(a.dataNascimento)} anos) criou uma conta no Apprenda+, uma plataforma que conecta alunos a tutores para aulas de reforço. Como é menor de 18 anos, o acesso só é liberado com a sua autorização.</p>
          <p>Responda pelo botão abaixo ou informe o código <strong class="codigo">${aut.codigo}</strong> na página de autorização. O pedido vale até ${AP.fmtDataHora(aut.dataExpiracao)}.</p>
          <p><a class="btn btn--primario" href="#/autorizacao?codigo=${aut.codigo}">Responder ao pedido</a></p>
        </div>
      </div>`,
    });
    d.querySelector('.email a').addEventListener('click', () => d.close());
  };

  /* ================= Início ================= */
  function gradeHero() {
    const dias = ['seg', 'ter', 'qua', 'qui', 'sex'];
    const estados = [
      ['l', 'p', 'l', '', 'l'],
      ['s', 'l', 'c', 'l', ''],
      ['l', '', 'l', 'p', 'l'],
      ['c', 'l', 'l', 'l', 'c'],
    ];
    const horas = [14, 15, 16, 17];
    let html = '<div class="mini-semana">';
    dias.forEach((d, i) => {
      html += `<div class="mini-semana__dia"><span class="mini-semana__nome">${d}</span>`;
      horas.forEach((h, j) => {
        const st = estados[j][i];
        if (!st) { html += '<span class="mini-semana__vazio"></span>'; return; }
        const cls = { l: '', s: ' bloco--sel', p: ' bloco--pendente', c: ' bloco--confirmada' }[st];
        html += `<span class="bloco bloco--hero${cls}">${AP.hh(h)}${st === 's' ? '<small>Matemática</small>' : ''}</span>`;
      });
      html += '</div>';
    });
    return html + '</div>';
  }

  AP.rota({
    caminho: '/', area: 'publico', titulo: 'Início', uc: [], grupo: 'Área pública', exemplo: '#/', largo: true,
    render() {
      return `
      <section class="hero">
        <div class="hero__texto">
          <h1>Reforço escolar com tutores de formação conferida, do 1º ano à faculdade.</h1>
          <p class="hero__sub">Encontre um tutor pela matéria e pelo horário que cabe na sua semana. Aulas individuais de 60 minutos, presenciais ou online.</p>
          <div class="acoes">
            <a class="btn btn--primario btn--grande" href="#/cadastro/aluno">Criar conta de aluno</a>
            <a class="btn btn--secundario btn--grande" href="#/cadastro/tutor">Quero dar aulas</a>
          </div>
          <p class="hero__entrar">Já tem conta? <a href="#/entrar">Entrar</a></p>
        </div>
        <figure class="hero__grade papel-quadriculado">
          ${gradeHero()}
          <figcaption>Na agenda do tutor, cada bloco é uma aula de 60 minutos. O amarelo é o horário que você escolheu.</figcaption>
        </figure>
      </section>

      <section class="publico-secao" aria-labelledby="como">
        <h2 id="como">Como funciona o agendamento</h2>
        <ol class="passos">
          <li><strong>Busque</strong>por matéria, nível escolar, faixa de preço, modalidade e horário.</li>
          <li><strong>Escolha um horário livre</strong>na agenda do tutor. Ele fica reservado só para você enquanto o tutor responde.</li>
          <li><strong>O tutor aceita</strong>e a aula é confirmada. O chat entre vocês é liberado.</li>
          <li><strong>Assista à aula</strong>no local combinado ou pelo link de videochamada que o tutor enviar.</li>
        </ol>
      </section>

      <section class="publico-secao publico-perfis" aria-label="Para quem é">
        <div>
          <h3>Para alunos</h3>
          <p>Do ensino fundamental à faculdade. Veja a apresentação, as matérias, os preços e os horários de cada tutor antes de pedir uma aula.</p>
          <a href="#/cadastro/aluno">Criar conta de aluno</a>
        </div>
        <div>
          <h3>Para tutores</h3>
          <p>Cadastre sua formação e envie os comprovantes. Depois da aprovação, você define matérias, preços e horários.</p>
          <a href="#/cadastro/tutor">Cadastrar-se como tutor</a>
        </div>
        <div>
          <h3>Para responsáveis</h3>
          <p>Alunos com menos de 18 anos só usam a plataforma depois que um responsável autoriza pelo e-mail.</p>
          <a href="#/autorizacao">Tenho um código de autorização</a>
        </div>
      </section>`;
    },
  });

  /* ================= Entrar ================= */
  AP.rota({
    caminho: '/entrar', area: 'publico', titulo: 'Entrar', uc: ['RNF02'], grupo: 'Área pública', exemplo: '#/entrar',
    render() {
      const atalhos = [
        ['pedro.alves@email.com', 'Pedro', 'aluno'],
        ['rafael.nogueira@email.com', 'Rafael', 'tutor aprovado'],
        ['admin@apprenda.mais', 'Bruna', 'administradora'],
        ['gabriel.slima@email.com', 'Gabriel', 'aluno aguardando autorização'],
        ['livia.sampaio@email.com', 'Lívia', 'tutora com cadastro rejeitado'],
        ['larissa.tx@email.com', 'Larissa', 'aluna suspensa'],
      ];
      return `<div class="auth">
        <section class="auth__painel painel">
          <h1>Entrar</h1>
          <p class="texto-apoio">Use o e-mail e a senha do seu cadastro.</p>
          <form id="form-entrar" novalidate class="pilha-form">
            <div class="campo"><label for="ent-email">E-mail</label><input id="ent-email" type="email" autocomplete="username"></div>
            <div class="campo"><label for="ent-senha">Senha</label><input id="ent-senha" type="password" autocomplete="current-password"></div>
            <button class="btn btn--primario btn--bloco btn--grande" type="submit">Entrar</button>
          </form>
          <p class="auth__rodape">Ainda não tem conta? <a href="#/cadastro">Cadastre-se</a></p>
        </section>
        <aside class="proto-nota auth__atalhos">
          <strong>Atalhos do protótipo</strong>
          <p>Preenchem o e-mail de um usuário de exemplo. Qualquer senha funciona.</p>
          <ul>${atalhos.map(([e, n, p]) => `<li><button type="button" class="btn btn--secundario btn--pequeno" data-email="${e}">${n}</button> <span>${p}</span></li>`).join('')}</ul>
        </aside>
      </div>`;
    },
    montar(el) {
      const form = $(el, '#form-entrar');
      el.querySelectorAll('[data-email]').forEach((b) => b.addEventListener('click', () => {
        $(el, '#ent-email').value = b.dataset.email;
        $(el, '#ent-senha').value = 'senha123';
        form.requestSubmit();
      }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const email = $(el, '#ent-email').value.trim().toLowerCase();
        const senha = $(el, '#ent-senha').value;
        if (!email) AP.erro($(el, '#ent-email'), 'Informe seu e-mail.');
        if (!senha) AP.erro($(el, '#ent-senha'), 'Informe sua senha.');
        if (form.querySelector('[aria-invalid]')) { AP.focarErro(form); return; }
        const u = AP.db.usuarios.find((x) => x.email.toLowerCase() === email);
        if (!u) { AP.notaForm(form, '<strong>E-mail ou senha incorretos.</strong> Confira os dados e tente de novo.'); return; }
        if (u.status === 'SUSPENSO' || u.status === 'BLOQUEADO') {
          const verbo = u.status === 'SUSPENSO' ? 'suspensa' : 'bloqueada';
          AP.notaForm(form, `<strong>Sua conta está ${verbo}.</strong> A equipe do Apprenda+ restringiu o acesso por descumprimento das regras da plataforma. Para pedir revisão, escreva para suporte@apprenda.mais.`);
          return;
        }
        if (u.tipo === 'aluno' && u.status === 'PENDENTE') { AP.ir('#/cadastro/aluno/pendente?id=' + u.id); return; }
        if (u.tipo === 'tutor' && u.statusAprovacao !== 'APROVADO') { AP.ir('#/tutor/analise?id=' + u.id); return; }
        AP.db.sessao[u.tipo] = u.id;
        AP.salvar();
        AP.ir({ aluno: '#/aluno/buscar', tutor: '#/tutor/inicio', admin: '#/admin/tutores' }[u.tipo]);
      });
    },
  });

  /* ================= Escolha do tipo de cadastro ================= */
  AP.rota({
    caminho: '/cadastro', area: 'publico', titulo: 'Criar conta', uc: ['UC02.1', 'UC02.2'], grupo: 'Área pública', exemplo: '#/cadastro',
    render() {
      return `<div class="estreito">
        <h1>Criar conta</h1>
        <p class="lead">Como você vai usar o Apprenda+?</p>
        <div class="escolhas">
          <a class="escolha" href="#/cadastro/aluno"><span class="escolha__titulo">Sou aluno</span><span>Quero encontrar um tutor e agendar aulas. Menores de 18 anos precisam da autorização de um responsável.</span></a>
          <a class="escolha" href="#/cadastro/tutor"><span class="escolha__titulo">Sou tutor</span><span>Quero oferecer aulas. Meu cadastro passa por uma análise da formação antes de aparecer nas buscas.</span></a>
        </div>
      </div>`;
    },
  });

  /* ================= UC02.1 + UC01.1 Cadastro de aluno ================= */
  AP.rota({
    caminho: '/cadastro/aluno', area: 'publico', titulo: 'Cadastrar perfil de aluno', uc: ['UC02.1', 'UC01.1'], grupo: 'Área pública', exemplo: '#/cadastro/aluno',
    render() {
      return `<div class="estreito">
        <a class="voltar" href="#/cadastro">${AP.icone('voltar')}Voltar</a>
        <h1>Criar conta de aluno</h1>
        <p class="lead">Se você tiver menos de 18 anos, vamos pedir os dados de um responsável. Ele autoriza seu acesso pelo e-mail.</p>
        <div class="proto-nota"><strong>Atalhos do protótipo</strong>
          <div class="acoes"><button type="button" class="btn btn--secundario btn--pequeno" data-exemplo="maior">Preencher aluno maior de idade</button>
          <button type="button" class="btn btn--secundario btn--pequeno" data-exemplo="menor">Preencher aluno menor de idade</button></div>
        </div>
        <form id="form-aluno" class="form-cadastro" novalidate>
          <fieldset class="form-secao">
            <legend><h2>Seus dados</h2></legend>
            <div class="grade-campos">
              <div class="campo largo"><label for="ca-nome">Nome completo</label><input id="ca-nome" autocomplete="name"></div>
              <div class="campo"><label for="ca-cpf">CPF</label><input id="ca-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
              <div class="campo"><label for="ca-nasc">Data de nascimento</label><input id="ca-nasc" type="date" max="2026-11-19" min="1920-01-01"></div>
              <div class="campo"><label for="ca-nivel">Nível escolar</label><select id="ca-nivel">${AP.opcoesNivel('', 'Selecione')}</select></div>
              <div class="campo"><label for="ca-tel">Telefone</label><input id="ca-tel" type="tel" inputmode="tel" placeholder="(63) 90000-0000" autocomplete="tel"></div>
              <div class="campo"><label for="ca-email">E-mail</label><input id="ca-email" type="email" autocomplete="email"></div>
            </div>
            <p class="idade-msg" id="ca-idade" aria-live="polite"></p>
          </fieldset>

          <fieldset class="form-secao form-secao--destaque" id="ca-resp" hidden>
            <legend><h2>Responsável legal</h2></legend>
            <p class="ajuda">O responsável recebe um e-mail com um link e um código para confirmar ou recusar a autorização. Até a resposta, sua conta fica pendente e sem acesso às aulas.</p>
            <div class="grade-campos">
              <div class="campo largo"><label for="cr-nome">Nome completo do responsável</label><input id="cr-nome"></div>
              <div class="campo"><label for="cr-cpf">CPF do responsável</label><input id="cr-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
              <div class="campo"><label for="cr-email">E-mail do responsável</label><input id="cr-email" type="email"></div>
            </div>
          </fieldset>

          <fieldset class="form-secao">
            <legend><h2>Senha de acesso</h2></legend>
            <div class="grade-campos">
              <div class="campo"><label for="ca-senha">Senha</label><input id="ca-senha" type="password" autocomplete="new-password" aria-describedby="ca-criterios"><ul class="criterios-senha" id="ca-criterios"></ul></div>
              <div class="campo"><label for="ca-senha2">Repita a senha</label><input id="ca-senha2" type="password" autocomplete="new-password"></div>
            </div>
          </fieldset>

          <div class="form-rodape">
            <button class="btn btn--primario btn--grande" type="submit">Criar conta</button>
            <p class="ajuda">Já tem conta? <a href="#/entrar">Entrar</a></p>
          </div>
        </form>
      </div>`;
    },
    montar(el) {
      const form = $(el, '#form-aluno');
      const v = (id) => $(el, '#' + id);
      AP.mascaraCPF(v('ca-cpf')); AP.mascaraCPF(v('cr-cpf')); AP.mascaraTelefone(v('ca-tel'));
      const crit = v('ca-criterios');
      AP.desenharCriterios(crit, '');
      v('ca-senha').addEventListener('input', () => AP.desenharCriterios(crit, v('ca-senha').value));

      const verIdade = () => {
        const idade = AP.idade(v('ca-nasc').value);
        const menor = v('ca-nasc').value && idade >= 0 && idade < 18;
        v('ca-resp').hidden = !menor;
        v('ca-idade').innerHTML = menor
          ? `${AP.icone('alerta')}<span>Você tem ${idade} anos. Como é menor de 18, preencha os dados de um responsável legal logo abaixo.</span>`
          : '';
        v('ca-idade').classList.toggle('idade-msg--ativa', !!menor);
      };
      v('ca-nasc').addEventListener('change', verIdade);
      v('ca-nasc').addEventListener('input', verIdade);

      el.querySelectorAll('[data-exemplo]').forEach((b) => b.addEventListener('click', () => {
        const rnd = () => String(Math.floor(1e8 + Math.random() * 9e8));
        const menor = b.dataset.exemplo === 'menor';
        const ex = menor
          ? { nome: 'Lucas Martins Rocha', nasc: '2011-09-03', nivel: 'FUND_II', tel: '(63) 99654-3321', email: 'lucas.mrocha@email.com' }
          : { nome: 'Camila Rocha Pereira', nasc: '2004-02-17', nivel: 'SUPERIOR', tel: '(63) 99876-1234', email: 'camila.pereira@email.com' };
        v('ca-nome').value = ex.nome; v('ca-cpf').value = AP.formatarCPF(AP.gerarCPF(rnd()));
        v('ca-nasc').value = ex.nasc; v('ca-nivel').value = ex.nivel; v('ca-tel').value = ex.tel; v('ca-email').value = ex.email;
        v('ca-senha').value = 'Aprender2026'; v('ca-senha2').value = 'Aprender2026';
        if (menor) { v('cr-nome').value = 'Patrícia Martins Rocha'; v('cr-cpf').value = AP.formatarCPF(AP.gerarCPF(rnd())); v('cr-email').value = 'patricia.rocha@email.com'; }
        verIdade(); AP.desenharCriterios(crit, v('ca-senha').value);
      }));

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const nome = v('ca-nome').value.trim();
        const cpf = AP.soDigitos(v('ca-cpf').value);
        const nasc = v('ca-nasc').value;
        const nivel = v('ca-nivel').value;
        const tel = v('ca-tel').value.trim();
        const email = v('ca-email').value.trim().toLowerCase();
        const senha = v('ca-senha').value;
        const idade = AP.idade(nasc);

        if (nome.split(/\s+/).length < 2) AP.erro(v('ca-nome'), 'Informe seu nome completo.');
        if (!cpf) AP.erro(v('ca-cpf'), 'Informe o CPF.');
        else if (!AP.validarCPF(cpf)) AP.erro(v('ca-cpf'), 'CPF inválido. Confira os números digitados.');
        else if (AP.db.usuarios.some((u) => u.cpf === cpf)) AP.erro(v('ca-cpf'), 'Este CPF já tem cadastro no Apprenda+. Se a conta é sua, entre com seu e-mail.');
        if (!nasc) AP.erro(v('ca-nasc'), 'Informe a data de nascimento.');
        else if (idade < 5 || idade > 100) AP.erro(v('ca-nasc'), 'Confira a data de nascimento.');
        if (!nivel) AP.erro(v('ca-nivel'), 'Escolha o nível escolar.');
        if (AP.soDigitos(tel).length < 10) AP.erro(v('ca-tel'), 'Informe um telefone com DDD.');
        if (!email) AP.erro(v('ca-email'), 'Informe seu e-mail.');
        else if (!AP.validarEmail(email)) AP.erro(v('ca-email'), 'Informe um e-mail válido, como nome@email.com.');
        else if (AP.db.usuarios.some((u) => u.email.toLowerCase() === email)) AP.erro(v('ca-email'), 'Este e-mail já tem cadastro no Apprenda+.');
        if (!AP.senhaValida(senha)) AP.erro(v('ca-senha'), 'A senha precisa ter 8 caracteres ou mais, com letras e números.');
        else if (senha !== v('ca-senha2').value) AP.erro(v('ca-senha2'), 'As senhas não são iguais.');

        const menor = !!nasc && idade < 18;
        let resp = null;
        if (menor) {
          resp = { nome: v('cr-nome').value.trim(), cpf: AP.soDigitos(v('cr-cpf').value), email: v('cr-email').value.trim().toLowerCase() };
          if (resp.nome.split(/\s+/).length < 2) AP.erro(v('cr-nome'), 'Informe o nome completo do responsável.');
          if (!resp.cpf) AP.erro(v('cr-cpf'), 'Informe o CPF do responsável.');
          else if (!AP.validarCPF(resp.cpf)) AP.erro(v('cr-cpf'), 'CPF inválido. Confira os números e os dígitos verificadores.');
          else if (resp.cpf === cpf) AP.erro(v('cr-cpf'), 'O CPF do responsável precisa ser diferente do seu.');
          if (!resp.email) AP.erro(v('cr-email'), 'Informe o e-mail do responsável.');
          else if (!AP.validarEmail(resp.email)) AP.erro(v('cr-email'), 'Informe um e-mail válido para o responsável.');
          else if (resp.email === email) AP.erro(v('cr-email'), 'Use o e-mail do responsável, diferente do seu.');
        }

        if (form.querySelector('[aria-invalid]')) {
          AP.notaForm(form, '<strong>Confira os campos destacados.</strong> A conta ainda não foi criada.');
          AP.focarErro(form);
          return;
        }

        const id = AP.novoId('a');
        const aluno = {
          id, tipo: 'aluno', nome, cpf, email, telefone: AP.formatarTelefone(tel), status: menor ? 'PENDENTE' : 'ATIVO',
          dataCadastro: AP.isoLocal(AP.agora()).slice(0, 10), dataNascimento: nasc, nivelEscolar: nivel,
        };
        if (menor) {
          const rid = AP.novoId('r');
          AP.db.responsaveis.push({ id: rid, nomeCompleto: resp.nome, cpf: resp.cpf, email: resp.email });
          aluno.responsavelId = rid;
          AP.db.autorizacoes.push(AP.novaAutorizacao(id, rid));
        }
        AP.db.usuarios.push(aluno);
        if (!menor) AP.db.sessao.aluno = id;
        AP.salvar();
        if (menor) AP.ir('#/cadastro/aluno/pendente?id=' + id);
        else { AP.avisar(`Conta criada. Boas-vindas, ${AP.primeiroNome(nome)}!`); AP.ir('#/aluno/buscar'); }
      });
    },
  });

  /* ================= Aluno aguardando autorização ================= */
  AP.rota({
    caminho: '/cadastro/aluno/pendente', area: 'restrito', titulo: 'Aguardando autorização do responsável', uc: ['UC02.1', 'UC01.1'], grupo: 'Área pública', exemplo: '#/cadastro/aluno/pendente?id=a3',
    render({ query }) {
      const a = AP.usuario(query.id || 'a3');
      if (!a || a.tipo !== 'aluno' || !a.responsavelId) return AP.vazio('Cadastro não encontrado', 'Confira o endereço ou faça um novo cadastro.', '<a class="btn btn--primario" href="#/cadastro/aluno">Criar conta</a>');
      const r = AP.responsavel(a.responsavelId);
      const aut = AP.autorizacoesDo(a.id)[0];
      if (aut && aut.status === 'PENDENTE' && AP.dataLocal(aut.dataExpiracao) < AP.AGORA) { aut.status = 'EXPIRADA'; AP.salvar(); }
      const st = a.status === 'ATIVO' ? 'CONFIRMADA' : aut ? aut.status : 'PENDENTE';
      const pn = AP.esc(AP.primeiroNome(r.nomeCompleto));
      const emailM = AP.esc(AP.mascararEmail(r.email));
      let titulo; let texto; let acoes = '';
      if (st === 'CONFIRMADA') {
        titulo = 'Acesso liberado';
        texto = `${pn} confirmou a autorização${aut && aut.dataResposta ? ` em ${AP.fmtDataHora(aut.dataResposta)}` : ''}. Você já pode buscar tutores e agendar aulas.`;
        acoes = '<button type="button" class="btn btn--primario btn--grande" data-comecar>Começar a buscar tutores</button>';
      } else if (st === 'RECUSADA') {
        titulo = 'Seu responsável recusou a autorização';
        texto = `${pn} recusou o pedido em ${AP.fmtDataHora(aut.dataResposta)}. Sua conta continua sem acesso às aulas. Converse com ${pn} e, se combinarem, envie um novo pedido.`;
        acoes = '<button type="button" class="btn btn--primario" data-reenviar>Enviar novo pedido</button>';
      } else if (st === 'EXPIRADA') {
        titulo = 'O pedido de autorização expirou';
        texto = `O prazo para ${pn} responder terminou em ${AP.fmtDataHora(aut.dataExpiracao)}. Envie um novo pedido para ${emailM}.`;
        acoes = '<button type="button" class="btn btn--primario" data-reenviar>Enviar novo pedido</button>';
      } else {
        titulo = 'Falta a autorização do seu responsável';
        texto = `Enviamos um pedido para ${emailM}. Assim que ${pn} confirmar, seu acesso é liberado. O pedido vale até ${AP.fmtDataHora(aut.dataExpiracao)}.`;
        acoes = '<button type="button" class="btn btn--secundario" data-reenviar>Reenviar e-mail</button>';
      }
      const passo3 = st === 'CONFIRMADA' ? 'feito' : st === 'PENDENTE' ? 'atual' : 'falhou';
      return `<div class="estreito">
        <h1>${titulo}</h1>
        <p class="lead">${texto}</p>
        <ol class="linha-tempo" aria-label="Etapas do cadastro">
          <li class="feito">Cadastro enviado<span>${AP.fmtData(a.dataCadastro)}</span></li>
          <li class="feito">Pedido enviado ao responsável<span>${AP.esc(r.nomeCompleto)}, ${emailM}${aut ? `, em ${AP.fmtDataHora(aut.dataEnvio)}` : ''}</span></li>
          <li class="${passo3}">Resposta do responsável<span>${st === 'PENDENTE' ? 'Aguardando' : AP.STATUS_AUTORIZACAO[st]}</span></li>
          <li class="${st === 'CONFIRMADA' ? 'feito' : ''}">Acesso liberado</li>
        </ol>
        <div class="acoes">${acoes}</div>
        ${st === 'PENDENTE' ? `<div class="proto-nota" style="margin-top:1.5rem"><strong>Simulação</strong><p>No sistema real, o responsável recebe o pedido no e-mail.</p><button type="button" class="btn btn--secundario btn--pequeno" data-email>${AP.icone('email')}Abrir o e-mail que ${pn} recebeu</button></div>` : ''}
      </div>`;
    },
    montar(el, { query }) {
      const a = AP.usuario(query.id || 'a3');
      if (!a) return;
      const b = (s, f) => { const x = $(el, s); if (x) x.addEventListener('click', f); };
      b('[data-comecar]', () => { AP.db.sessao.aluno = a.id; AP.salvar(); AP.ir('#/aluno/buscar'); });
      b('[data-email]', () => AP.abrirEmailResponsavel(AP.autorizacoesDo(a.id)[0]));
      b('[data-reenviar]', () => {
        AP.autorizacoesDo(a.id).filter((x) => x.status === 'PENDENTE').forEach((x) => { x.status = 'EXPIRADA'; });
        AP.db.autorizacoes.push(AP.novaAutorizacao(a.id, a.responsavelId));
        AP.salvar();
        AP.avisar(`Enviamos um novo pedido para ${AP.mascararEmail(AP.responsavel(a.responsavelId).email)}.`);
        AP.atualizar();
      });
    },
  });

  /* ================= UC01.2 Autorização do responsável ================= */
  AP.rota({
    caminho: '/autorizacao', area: 'responsavel', titulo: 'Registrar autorização do responsável', uc: ['UC01.2'], grupo: 'Responsável legal', exemplo: '#/autorizacao?codigo=K7Q2M9',
    render({ query }) {
      if (!query.codigo) {
        const pendentes = AP.db.autorizacoes.filter((x) => x.status === 'PENDENTE').map((x) => x.codigo);
        return `<div class="estreito estreito--p">
          <h1>Responder a um pedido de autorização</h1>
          <p class="lead">Digite o código de 6 caracteres que chegou no seu e-mail. Ele também está no botão “Responder ao pedido”.</p>
          <form id="form-codigo" class="painel pilha-form" novalidate>
            <div class="campo"><label for="aut-codigo">Código de autorização</label><input id="aut-codigo" class="input-codigo" maxlength="6" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false"></div>
            <button type="submit" class="btn btn--primario btn--grande">Continuar</button>
          </form>
          <div class="proto-nota" style="margin-top:1.25rem"><strong>Códigos de teste</strong>
            <p>Válido: ${pendentes.map((c) => `<code>${c}</code>`).join(', ') || 'nenhum pendente'}. Expirado: <code>R2D5LA</code>. Já respondido: <code>P3H8QA</code>.</p></div>
        </div>`;
      }
      const codigo = String(query.codigo).toUpperCase();
      const aut = AP.db.autorizacoes.find((x) => x.codigo === codigo);
      const voltar = '<a class="btn btn--secundario" href="#/autorizacao">Digitar outro código</a>';
      if (!aut) {
        return `<div class="estreito estreito--p">${AP.vazio('Código não encontrado', `Não existe pedido com o código <strong>${AP.esc(codigo)}</strong>. Confira se digitou igual ao e-mail.`, voltar)}</div>`;
      }
      if (aut.status === 'PENDENTE' && AP.dataLocal(aut.dataExpiracao) < AP.AGORA) { aut.status = 'EXPIRADA'; AP.salvar(); }
      const a = AP.usuario(aut.alunoId);
      const r = AP.responsavel(aut.responsavelId);
      if (aut.status === 'EXPIRADA') {
        return `<div class="estreito estreito--p">${AP.vazio('Este pedido não é mais válido', `O prazo para responder terminou em ${AP.fmtDataHora(aut.dataExpiracao)}. Peça para ${AP.esc(AP.primeiroNome(a.nome))} enviar um novo pedido pelo Apprenda+.`, voltar)}</div>`;
      }
      if (aut.status !== 'PENDENTE') {
        const recente = AP.ui.respondido === aut.codigo;
        const conf = aut.status === 'CONFIRMADA';
        const titulo = recente ? (conf ? 'Autorização confirmada' : 'Autorização recusada') : 'Este pedido já foi respondido';
        const texto = conf
          ? `${AP.esc(a.nome)} já pode usar o Apprenda+. Registramos a sua resposta em ${AP.fmtDataHora(aut.dataResposta)}.`
          : `Registramos a recusa em ${AP.fmtDataHora(aut.dataResposta)}. ${AP.esc(AP.primeiroNome(a.nome))} continua sem acesso à plataforma.`;
        return `<div class="estreito estreito--p resultado ${conf ? 'resultado--ok' : 'resultado--nao'}">
          <span class="resultado__icone">${AP.icone(conf ? 'check' : 'fechar')}</span>
          <h1>${titulo}</h1><p class="lead">${texto}</p><p>Você pode fechar esta página.</p></div>`;
      }
      return `<div class="estreito">
        <h1>Autorizar o uso do Apprenda+</h1>
        <p class="lead">Olá, ${AP.esc(AP.primeiroNome(r.nomeCompleto))}. Você foi indicado(a) como responsável legal de um aluno menor de idade. Confira os dados e responda.</p>
        <div class="autorizacao">
          <section class="painel">
            <h2>Aluno</h2>
            <dl class="dados">
              <div><dt>Nome</dt><dd>${AP.esc(a.nome)}</dd></div>
              <div><dt>Idade</dt><dd>${AP.idade(a.dataNascimento)} anos</dd></div>
              <div><dt>Nível escolar</dt><dd>${AP.nivelNome(a.nivelEscolar)}</dd></div>
              <div><dt>E-mail</dt><dd>${AP.esc(a.email)}</dd></div>
              <div><dt>Cadastro feito em</dt><dd>${AP.fmtData(a.dataCadastro)}</dd></div>
            </dl>
            <h2 class="mt">Responsável informado</h2>
            <dl class="dados">
              <div><dt>Nome</dt><dd>${AP.esc(r.nomeCompleto)}</dd></div>
              <div><dt>CPF</dt><dd>${AP.mascararCPF(r.cpf)}</dd></div>
              <div><dt>E-mail</dt><dd>${AP.esc(r.email)}</dd></div>
            </dl>
          </section>
          <section class="painel autorizacao__decisao">
            <h2>O que você autoriza</h2>
            <ul class="lista-marcada">
              <li>Buscar tutores e pedir aulas individuais de 60 minutos, presenciais ou online.</li>
              <li>Conversar com o tutor pelo chat da plataforma, só depois que a aula for confirmada.</li>
              <li>A plataforma não processa pagamentos.</li>
            </ul>
            <p class="ajuda">Pedido válido até ${AP.fmtDataHora(aut.dataExpiracao)}.</p>
            <div class="acoes acoes--coluna">
              <button type="button" class="btn btn--sucesso btn--grande btn--bloco" data-confirmar>Confirmar autorização</button>
              <button type="button" class="btn btn--perigo-contorno btn--bloco" data-recusar>Recusar autorização</button>
            </div>
          </section>
        </div>
      </div>`;
    },
    montar(el, { query }) {
      const form = $(el, '#form-codigo');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          AP.limparErros(form);
          const c = $(el, '#aut-codigo').value.trim().toUpperCase();
          if (c.length !== 6) { AP.erro($(el, '#aut-codigo'), 'O código tem 6 caracteres, entre letras e números.'); AP.focarErro(form); return; }
          AP.ir('#/autorizacao?codigo=' + c);
        });
        return;
      }
      const aut = AP.db.autorizacoes.find((x) => x.codigo === String(query.codigo).toUpperCase());
      const conf = $(el, '[data-confirmar]');
      if (!conf) return;
      const a = AP.usuario(aut.alunoId);
      conf.addEventListener('click', () => {
        aut.status = 'CONFIRMADA';
        aut.dataResposta = AP.isoLocal(AP.agora());
        if (a.status === 'PENDENTE') a.status = 'ATIVO';
        AP.ui.respondido = aut.codigo;
        AP.salvar();
        AP.atualizar();
      });
      $(el, '[data-recusar]').addEventListener('click', async () => {
        const ok = await AP.confirmar({ titulo: 'Recusar a autorização?', texto: `${AP.esc(a.nome)} vai continuar sem acesso às aulas da plataforma.`, botao: 'Recusar autorização', perigo: true });
        if (!ok) return;
        aut.status = 'RECUSADA';
        aut.dataResposta = AP.isoLocal(AP.agora());
        AP.ui.respondido = aut.codigo;
        AP.salvar();
        AP.atualizar();
      });
    },
  });

  /* ================= UC02.2 Cadastro de tutor ================= */
  AP.rota({
    caminho: '/cadastro/tutor', area: 'publico', titulo: 'Cadastrar perfil de tutor', uc: ['UC02.2'], grupo: 'Área pública', exemplo: '#/cadastro/tutor',
    render() {
      const niveis = AP.ORDEM_NIVEIS.map((n) => `<label class="criterio"><input type="checkbox" name="ct-nivel" value="${n}"><span><strong>${AP.NIVEIS[n].nome}</strong><small>${AP.NIVEIS[n].detalhe}. Exige ${AP.NIVEIS[n].exige.charAt(0).toLowerCase() + AP.NIVEIS[n].exige.slice(1)}.</small></span></label>`).join('');
      return `<div class="estreito">
        <a class="voltar" href="#/cadastro">${AP.icone('voltar')}Voltar</a>
        <h1>Cadastrar-se como tutor</h1>
        <p class="lead">Depois do envio, a equipe confere sua formação para cada nível de ensino escolhido. Seu perfil aparece nas buscas quando for aprovado.</p>
        <div class="proto-nota"><strong>Atalho do protótipo</strong><button type="button" class="btn btn--secundario btn--pequeno" data-exemplo>Preencher com dados de exemplo</button></div>
        <form id="form-tutor" class="form-cadastro" novalidate>
          <fieldset class="form-secao"><legend><h2>Dados pessoais</h2></legend>
            <div class="grade-campos">
              <div class="campo largo"><label for="ct-nome">Nome completo</label><input id="ct-nome" autocomplete="name"></div>
              <div class="campo"><label for="ct-cpf">CPF</label><input id="ct-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
              <div class="campo"><label for="ct-nasc">Data de nascimento</label><input id="ct-nasc" type="date" max="2026-11-19" min="1920-01-01"></div>
              <div class="campo"><label for="ct-tel">Telefone</label><input id="ct-tel" type="tel" inputmode="tel" placeholder="(63) 90000-0000"></div>
              <div class="campo"><label for="ct-cidade">Cidade</label><input id="ct-cidade" placeholder="Palmas – TO"></div>
              <div class="campo"><label for="ct-email">E-mail</label><input id="ct-email" type="email" autocomplete="email"></div>
            </div>
          </fieldset>
          <fieldset class="form-secao"><legend><h2>Formação</h2></legend>
            <div class="grade-campos">
              <div class="campo"><label for="ct-tipo">Tipo de formação</label><select id="ct-tipo"><option value="">Selecione</option>${AP.opcoes(Object.entries(AP.TIPOS_FORMACAO), '')}</select></div>
              <div class="campo"><label for="ct-curso">Curso</label><input id="ct-curso" placeholder="Ex.: Licenciatura em Matemática"></div>
              <div class="campo"><label for="ct-inst">Instituição</label><input id="ct-inst"></div>
              <div class="campo"><label for="ct-ano">Ano de conclusão</label><input id="ct-ano" inputmode="numeric" maxlength="4" placeholder="2020"></div>
            </div>
          </fieldset>
          <fieldset class="form-secao" id="ct-niveis"><legend><h2>Níveis em que você quer dar aula</h2></legend>
            <p class="ajuda">Escolha um ou mais. Os documentos enviados precisam comprovar a formação exigida em cada nível.</p>
            <div class="grade-criterios">${niveis}</div>
          </fieldset>
          <fieldset class="form-secao"><legend><h2>Apresentação</h2></legend>
            <div class="campo"><label for="ct-apres">Conte aos alunos como são suas aulas</label>
              <textarea id="ct-apres" rows="5" maxlength="1000"></textarea>
              <p class="ajuda"><span id="ct-apres-cont">0</span> de 1.000 caracteres. Mínimo de 80.</p></div>
          </fieldset>
          <fieldset class="form-secao"><legend><h2>Comprovantes de formação</h2></legend>
            <p class="ajuda">Diploma, certificado ou declaração de conclusão. Se escolheu mais de um nível, envie o que comprova cada um.</p>
            ${AP.htmlUpload('ct-docs')}
          </fieldset>
          <fieldset class="form-secao"><legend><h2>Senha de acesso</h2></legend>
            <div class="grade-campos">
              <div class="campo"><label for="ct-senha">Senha</label><input id="ct-senha" type="password" autocomplete="new-password"><ul class="criterios-senha" id="ct-criterios"></ul></div>
              <div class="campo"><label for="ct-senha2">Repita a senha</label><input id="ct-senha2" type="password" autocomplete="new-password"></div>
            </div>
          </fieldset>
          <div class="form-rodape"><button class="btn btn--primario btn--grande" type="submit">Enviar cadastro para análise</button></div>
        </form>
      </div>`;
    },
    montar(el) {
      const form = $(el, '#form-tutor');
      const v = (id) => $(el, '#' + id);
      AP.mascaraCPF(v('ct-cpf')); AP.mascaraTelefone(v('ct-tel'));
      const arquivos = [];
      AP.montarUpload(el, 'ct-docs', arquivos);
      const crit = v('ct-criterios');
      AP.desenharCriterios(crit, '');
      v('ct-senha').addEventListener('input', () => AP.desenharCriterios(crit, v('ct-senha').value));
      const cont = () => { v('ct-apres-cont').textContent = v('ct-apres').value.length; };
      v('ct-apres').addEventListener('input', cont);

      $(el, '[data-exemplo]').addEventListener('click', () => {
        v('ct-nome').value = 'Renato Vasconcelos Dias';
        v('ct-cpf').value = AP.formatarCPF(AP.gerarCPF(String(Math.floor(1e8 + Math.random() * 9e8))));
        v('ct-nasc').value = '1990-06-14'; v('ct-tel').value = '(63) 99412-8870'; v('ct-cidade').value = 'Palmas – TO';
        v('ct-email').value = 'renato.dias@email.com';
        v('ct-tipo').value = 'LICENCIATURA'; v('ct-curso').value = 'Licenciatura em Geografia'; v('ct-inst').value = 'Universidade Federal do Tocantins'; v('ct-ano').value = '2015';
        el.querySelectorAll('[name=ct-nivel]').forEach((c) => { c.checked = c.value === 'FUND_II' || c.value === 'MEDIO'; });
        v('ct-apres').value = 'Professor de Geografia há dez anos. Trabalho com mapas, notícias atuais e questões do ENEM para ligar o conteúdo ao dia a dia do aluno.';
        cont();
        if (!arquivos.length) arquivos.push({ nome: 'diploma_licenciatura_geografia.pdf', tamanhoKb: 845 });
        v('ct-docs').dispatchEvent(new Event('change'));
        v('ct-senha').value = 'Ensinar2026'; v('ct-senha2').value = 'Ensinar2026';
        AP.desenharCriterios(crit, v('ct-senha').value);
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const d = {
          nome: v('ct-nome').value.trim(), cpf: AP.soDigitos(v('ct-cpf').value), nasc: v('ct-nasc').value, tel: v('ct-tel').value.trim(),
          cidade: v('ct-cidade').value.trim(), email: v('ct-email').value.trim().toLowerCase(), tipo: v('ct-tipo').value,
          curso: v('ct-curso').value.trim(), inst: v('ct-inst').value.trim(), ano: Number(v('ct-ano').value),
          niveis: [...el.querySelectorAll('[name=ct-nivel]:checked')].map((c) => c.value), apres: v('ct-apres').value.trim(), senha: v('ct-senha').value,
        };
        if (d.nome.split(/\s+/).length < 2) AP.erro(v('ct-nome'), 'Informe seu nome completo.');
        if (!d.cpf) AP.erro(v('ct-cpf'), 'Informe o CPF.');
        else if (!AP.validarCPF(d.cpf)) AP.erro(v('ct-cpf'), 'CPF inválido. Confira os números digitados.');
        else if (AP.db.usuarios.some((u) => u.cpf === d.cpf)) AP.erro(v('ct-cpf'), 'Este CPF já tem cadastro no Apprenda+.');
        if (!d.nasc) AP.erro(v('ct-nasc'), 'Informe a data de nascimento.');
        if (AP.soDigitos(d.tel).length < 10) AP.erro(v('ct-tel'), 'Informe um telefone com DDD.');
        if (!d.cidade) AP.erro(v('ct-cidade'), 'Informe a cidade onde você dá aulas presenciais.');
        if (!d.email) AP.erro(v('ct-email'), 'Informe seu e-mail.');
        else if (!AP.validarEmail(d.email)) AP.erro(v('ct-email'), 'Informe um e-mail válido, como nome@email.com.');
        else if (AP.db.usuarios.some((u) => u.email.toLowerCase() === d.email)) AP.erro(v('ct-email'), 'Este e-mail já tem cadastro no Apprenda+.');
        if (!d.tipo) AP.erro(v('ct-tipo'), 'Escolha o tipo de formação.');
        if (!d.curso) AP.erro(v('ct-curso'), 'Informe o nome do curso.');
        if (!d.inst) AP.erro(v('ct-inst'), 'Informe a instituição.');
        if (!(d.ano >= 1950 && d.ano <= 2026)) AP.erro(v('ct-ano'), 'Informe o ano de conclusão com 4 dígitos.');
        if (!d.niveis.length) AP.erro(el.querySelector('[name=ct-nivel]'), 'Escolha pelo menos um nível de ensino.');
        if (d.apres.length < 80) AP.erro(v('ct-apres'), `Escreva pelo menos 80 caracteres. Faltam ${80 - d.apres.length}.`);
        if (!arquivos.length) AP.erro(v('ct-docs'), 'Anexe pelo menos um documento que comprove sua formação.');
        if (!AP.senhaValida(d.senha)) AP.erro(v('ct-senha'), 'A senha precisa ter 8 caracteres ou mais, com letras e números.');
        else if (d.senha !== v('ct-senha2').value) AP.erro(v('ct-senha2'), 'As senhas não são iguais.');

        if (form.querySelector('[aria-invalid]')) {
          AP.notaForm(form, '<strong>Confira os campos destacados.</strong> O cadastro ainda não foi enviado.');
          AP.focarErro(form);
          return;
        }
        const id = AP.novoId('t');
        const hoje = AP.isoLocal(AP.agora()).slice(0, 10);
        AP.db.usuarios.push({
          id, tipo: 'tutor', nome: d.nome, cpf: d.cpf, email: d.email, telefone: AP.formatarTelefone(d.tel), status: 'ATIVO', dataCadastro: hoje,
          dataNascimento: d.nasc, cidade: d.cidade, formacao: { tipo: d.tipo, curso: d.curso, instituicao: d.inst, ano: d.ano },
          niveis: d.niveis, statusAprovacao: 'PENDENTE', apresentacao: d.apres,
        });
        arquivos.forEach((f) => AP.db.documentos.push({ id: AP.novoId('doc'), tutorId: id, nomeArquivo: f.nome, tipo: 'Comprovante', tamanhoKb: f.tamanhoKb, dataEnvio: hoje }));
        AP.salvar();
        AP.avisar('Cadastro enviado para análise.');
        AP.ir('#/tutor/analise?id=' + id);
      });
    },
  });

  /* ================= Situação do cadastro do tutor (retorno do UC04.1) ================= */
  AP.rota({
    caminho: '/tutor/analise', area: 'restrito', titulo: 'Situação do cadastro de tutor', uc: ['UC02.2', 'UC04.1'], grupo: 'Tutor', exemplo: '#/tutor/analise?id=t9',
    render({ query }) {
      const t = AP.usuario(query.id || 't9');
      if (!t || t.tipo !== 'tutor') return AP.vazio('Cadastro não encontrado', 'Confira o endereço.', '<a class="btn btn--primario" href="#/entrar">Entrar</a>');
      const docs = AP.documentosDo(t.id);
      const resumo = `<section class="painel">
          <h2>O que você enviou</h2>
          <dl class="dados">
            <div><dt>Formação</dt><dd>${AP.esc(t.formacao.curso)}</dd></div>
            <div><dt>Instituição</dt><dd>${AP.esc(t.formacao.instituicao)}, ${t.formacao.ano}</dd></div>
            <div><dt>Níveis pedidos</dt><dd>${t.niveis.map(AP.nivelNome).join(', ')}</dd></div>
          </dl>
          <ul class="docs">${docs.map((d) => `<li>${AP.icone('documento')}<span>${AP.esc(d.nomeArquivo)}</span><small>enviado em ${AP.fmtData(d.dataEnvio)}</small></li>`).join('')}</ul>
        </section>`;
      if (t.statusAprovacao === 'APROVADO') {
        return `<div class="estreito resultado resultado--ok"><span class="resultado__icone">${AP.icone('check')}</span>
          <h1>Seu cadastro foi aprovado</h1>
          <p class="lead">Agora você pode cadastrar as disciplinas que ensina, os preços e os seus horários livres.</p>
          <button type="button" class="btn btn--primario btn--grande" data-painel>Ir para o painel</button></div>`;
      }
      if (t.statusAprovacao === 'PENDENTE') {
        return `<div class="estreito">
          <p>${AP.seloAprovacao('PENDENTE')}</p>
          <h1>Seu cadastro está em análise</h1>
          <p class="lead">A equipe confere seus comprovantes conforme os níveis de ensino que você escolheu. Enquanto isso, ainda não é possível cadastrar disciplinas nem horários.</p>
          <ol class="linha-tempo" aria-label="Etapas da análise">
            <li class="feito">Cadastro enviado<span>${AP.fmtData(t.dataReenvio || t.dataCadastro)}</span></li>
            <li class="atual">Análise da formação<span>Feita pela equipe do Apprenda+</span></li>
            <li>Perfil publicado nas buscas</li>
          </ol>
          ${resumo}
        </div>`;
      }
      return `<div class="estreito">
        <p>${AP.seloAprovacao('REJEITADO')}</p>
        <h1>Seu cadastro precisa de ajustes</h1>
        <div class="nota nota--erro nota--correcao">
          <strong>Motivo informado pela equipe em ${AP.fmtData(t.dataAnalise)}</strong>
          <p>${AP.esc(t.justificativaRejeicao)}</p>
        </div>
        <form id="form-reenvio" class="painel form-reenvio" novalidate>
          <h2>Corrigir e reenviar</h2>
          <p class="ajuda">Ajuste a formação e anexe o novo comprovante. O cadastro volta para a fila de análise.</p>
          <div class="grade-campos">
            <div class="campo"><label for="re-tipo">Tipo de formação</label><select id="re-tipo">${AP.opcoes(Object.entries(AP.TIPOS_FORMACAO), t.formacao.tipo)}</select></div>
            <div class="campo"><label for="re-curso">Curso</label><input id="re-curso" value="${AP.esc(t.formacao.curso)}"></div>
            <div class="campo"><label for="re-inst">Instituição</label><input id="re-inst" value="${AP.esc(t.formacao.instituicao)}"></div>
            <div class="campo"><label for="re-ano">Ano de conclusão</label><input id="re-ano" inputmode="numeric" maxlength="4" value="${t.formacao.ano}"></div>
          </div>
          ${AP.htmlUpload('re-docs', 'Comprovantes de formação')}
          <div class="form-rodape"><button type="submit" class="btn btn--primario">Reenviar para análise</button></div>
        </form>
      </div>`;
    },
    montar(el, { query }) {
      const t = AP.usuario(query.id || 't9');
      if (!t) return;
      const painel = $(el, '[data-painel]');
      if (painel) painel.addEventListener('click', () => { AP.db.sessao.tutor = t.id; AP.salvar(); AP.ir('#/tutor/inicio'); });
      const form = $(el, '#form-reenvio');
      if (!form) return;
      const lista = AP.documentosDo(t.id).map((d) => ({ nome: d.nomeArquivo, tamanhoKb: d.tamanhoKb, existente: true, id: d.id }));
      AP.montarUpload(el, 're-docs', lista);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AP.limparErros(form);
        const v = (id) => $(el, '#' + id);
        if (!v('re-curso').value.trim()) AP.erro(v('re-curso'), 'Informe o nome do curso.');
        if (!v('re-inst').value.trim()) AP.erro(v('re-inst'), 'Informe a instituição.');
        const ano = Number(v('re-ano').value);
        if (!(ano >= 1950 && ano <= 2026)) AP.erro(v('re-ano'), 'Informe o ano de conclusão com 4 dígitos.');
        if (!lista.some((a) => !a.existente)) AP.erro(v('re-docs'), 'Anexe o novo comprovante de formação antes de reenviar.');
        if (form.querySelector('[aria-invalid]')) { AP.focarErro(form); return; }
        t.formacao = { tipo: v('re-tipo').value, curso: v('re-curso').value.trim(), instituicao: v('re-inst').value.trim(), ano };
        const hoje = AP.isoLocal(AP.agora()).slice(0, 10);
        const mantidos = lista.filter((a) => a.existente).map((a) => a.id);
        AP.db.documentos = AP.db.documentos.filter((d) => d.tutorId !== t.id || mantidos.includes(d.id));
        lista.filter((a) => !a.existente).forEach((f) => AP.db.documentos.push({ id: AP.novoId('doc'), tutorId: t.id, nomeArquivo: f.nome, tipo: 'Comprovante', tamanhoKb: f.tamanhoKb, dataEnvio: hoje }));
        t.statusAprovacao = 'PENDENTE';
        t.dataReenvio = hoje;
        AP.db.historicoAnalise.push({ id: AP.novoId('h'), tutorId: t.id, tipo: 'REENVIADO', data: AP.isoLocal(AP.agora()), texto: 'O tutor corrigiu os dados e reenviou os documentos.' });
        AP.salvar();
        AP.avisar('Cadastro reenviado. A equipe fará uma nova análise.');
        AP.atualizar();
      });
    },
  });
})();
