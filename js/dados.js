/* Apprenda+ — protótipo navegável
 * Dados de exemplo e enumerações (espelham o Diagrama de Classes da documentação).
 */
(function () {
  const AP = (window.AP = window.AP || {});

  /* Data simulada: todas as regras de prazo (24 h para cancelar, 24 h de chat)
     são calculadas a partir deste instante. */
  AP.AGORA = new Date(2026, 10, 19, 10, 0, 0); // quinta-feira, 19/11/2026, 10:00

  AP.NIVEIS = {
    FUND_I: { nome: 'Fundamental I', detalhe: '1º ao 5º ano', exige: 'Graduação em Pedagogia' },
    FUND_II: { nome: 'Fundamental II', detalhe: '6º ao 9º ano', exige: 'Licenciatura ou formação técnica compatível com a disciplina' },
    MEDIO: { nome: 'Ensino Médio', detalhe: '1ª à 3ª série', exige: 'Licenciatura ou formação técnica compatível com a disciplina' },
    SUPERIOR: { nome: 'Ensino Superior', detalhe: 'graduação', exige: 'Graduação ou licenciatura na área correspondente' },
  };
  AP.ORDEM_NIVEIS = ['FUND_I', 'FUND_II', 'MEDIO', 'SUPERIOR'];

  AP.MODALIDADES = { PRESENCIAL: 'Presencial', ONLINE: 'Online' };

  AP.DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  AP.DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  AP.ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // semana começando na segunda
  AP.MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  AP.DISCIPLINAS = [
    'Alfabetização', 'Português', 'Matemática', 'Ciências', 'Física', 'Química', 'Biologia',
    'História', 'Geografia', 'Inglês', 'Redação', 'Cálculo I', 'Física I', 'Algoritmos', 'Programação',
  ];

  AP.TIPOS_FORMACAO = {
    PEDAGOGIA: 'Graduação em Pedagogia',
    LICENCIATURA: 'Licenciatura',
    BACHARELADO: 'Bacharelado',
    TECNICO: 'Formação técnica',
  };

  AP.STATUS_AGENDAMENTO = { PENDENTE: 'Pendente', CONFIRMADA: 'Confirmada', RECUSADA: 'Recusada', CANCELADA: 'Cancelada', EXPIRADA: 'Expirada' };
  AP.STATUS_CONTA = { ATIVO: 'Ativo', PENDENTE: 'Pendente', SUSPENSO: 'Suspenso', BLOQUEADO: 'Bloqueado' };
  AP.STATUS_APROVACAO = { PENDENTE: 'Pendente', APROVADO: 'Aprovado', REJEITADO: 'Rejeitado' };
  AP.STATUS_AUTORIZACAO = { PENDENTE: 'Pendente', CONFIRMADA: 'Confirmada', RECUSADA: 'Recusada', EXPIRADA: 'Expirada' };
  AP.ACOES_MODERACAO = {
    SUSPENSAO: { nome: 'Suspensão', verbo: 'Suspender', resultado: 'SUSPENSO', descricao: 'O usuário perde o acesso até ser reativado.' },
    SUSPENSAO_PREVENTIVA: { nome: 'Suspensão preventiva', verbo: 'Suspender preventivamente', resultado: 'SUSPENSO', descricao: 'Para indícios de violação grave. O acesso é cortado na hora, enquanto a equipe apura.' },
    BLOQUEIO: { nome: 'Bloqueio', verbo: 'Bloquear', resultado: 'BLOQUEADO', descricao: 'Encerra o acesso por descumprimento das regras da plataforma.' },
    REATIVACAO: { nome: 'Reativação', verbo: 'Reativar', resultado: 'ATIVO', descricao: 'Devolve o acesso à conta.' },
  };

  /* Bloco que simula a reserva simultânea (UC08.2): ao confirmar este horário,
     outra solicitação "chega antes" e a do aluno é rejeitada. */
  AP.BLOCO_DISPUTADO = 't1|2026-11-23T17:00';

  /* Gera um CPF válido a partir de 9 dígitos (calcula os verificadores). */
  AP.gerarCPF = function (base9) {
    const d = String(base9).split('').map(Number);
    const dv = (arr) => {
      let soma = 0;
      for (let i = 0; i < arr.length; i++) soma += arr[i] * (arr.length + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    d.push(dv(d));
    d.push(dv(d));
    return d.join('');
  };

  AP.criarDadosIniciais = function () {
    const cpf = AP.gerarCPF;

    const usuarios = [
      /* ---------- Alunos ---------- */
      { id: 'a1', tipo: 'aluno', nome: 'Pedro Henrique Alves', cpf: cpf('714602385'), email: 'pedro.alves@email.com', telefone: '(63) 99214-5530', status: 'ATIVO', dataCadastro: '2026-08-18', dataNascimento: '2010-03-14', nivelEscolar: 'MEDIO', responsavelId: 'r1' },
      { id: 'a2', tipo: 'aluno', nome: 'Ana Luísa Moreira', cpf: cpf('380194652'), email: 'analuisa.moreira@email.com', telefone: '(63) 98105-2247', status: 'ATIVO', dataCadastro: '2026-09-02', dataNascimento: '2005-07-02', nivelEscolar: 'SUPERIOR' },
      { id: 'a3', tipo: 'aluno', nome: 'Gabriel Sousa Lima', cpf: cpf('205873914'), email: 'gabriel.slima@email.com', telefone: '(63) 99440-1182', status: 'PENDENTE', dataCadastro: '2026-11-04', dataNascimento: '2014-05-09', nivelEscolar: 'FUND_II', responsavelId: 'r2' },
      { id: 'a4', tipo: 'aluno', nome: 'Larissa Teixeira', cpf: cpf('613298047'), email: 'larissa.tx@email.com', telefone: '(63) 98871-0034', status: 'SUSPENSO', dataCadastro: '2026-08-30', dataNascimento: '2003-11-21', nivelEscolar: 'SUPERIOR' },
      { id: 'a5', tipo: 'aluno', nome: 'Mateus Oliveira Brito', cpf: cpf('458120736'), email: 'mateus.brito@email.com', telefone: '(63) 99102-7781', status: 'ATIVO', dataCadastro: '2026-09-14', dataNascimento: '2012-01-30', nivelEscolar: 'FUND_II', responsavelId: 'r3' },
      { id: 'a6', tipo: 'aluno', nome: 'Sofia Rezende', cpf: cpf('927304518'), email: 'sofia.rezende@email.com', telefone: '(63) 98455-6610', status: 'ATIVO', dataCadastro: '2026-10-05', dataNascimento: '2008-06-11', nivelEscolar: 'MEDIO' },

      /* ---------- Tutores aprovados ---------- */
      {
        id: 't1', tipo: 'tutor', nome: 'Rafael Nogueira', cpf: cpf('318507264'), email: 'rafael.nogueira@email.com', telefone: '(63) 99317-4402', status: 'ATIVO', dataCadastro: '2026-08-12', dataNascimento: '1993-04-07', cidade: 'Palmas – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em Matemática', instituicao: 'Universidade Federal do Tocantins', ano: 2017 },
        niveis: ['FUND_II', 'MEDIO', 'SUPERIOR'], statusAprovacao: 'APROVADO', dataAnalise: '2026-08-14',
        apresentacao: 'Dou aula de Matemática há oito anos, em escola e em reforço particular. Começo pelo que o aluno já sabe e monto o caminho até o conteúdo da prova, usando exercícios do próprio material da escola. Para quem está na faculdade, acompanho Cálculo I com listas comentadas.',
      },
      {
        id: 't2', tipo: 'tutor', nome: 'Helena Brandão', cpf: cpf('602185937'), email: 'helena.brandao@email.com', telefone: '(63) 99820-1145', status: 'ATIVO', dataCadastro: '2026-08-20', dataNascimento: '1988-09-23', cidade: 'Palmas – TO',
        formacao: { tipo: 'PEDAGOGIA', curso: 'Pedagogia', instituicao: 'Universidade Estadual do Tocantins', ano: 2012 },
        niveis: ['FUND_I'], statusAprovacao: 'APROVADO', dataAnalise: '2026-08-22',
        apresentacao: 'Sou pedagoga e trabalho com alfabetização e anos iniciais. As aulas respeitam o tempo de atenção da criança: leitura, jogos de matemática e atividades que a família pode continuar em casa.',
      },
      {
        id: 't3', tipo: 'tutor', nome: 'Marina Couto', cpf: cpf('147258036'), email: 'marina.couto@email.com', telefone: '(63) 98133-9087', status: 'ATIVO', dataCadastro: '2026-08-25', dataNascimento: '1991-02-15', cidade: 'Palmas – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em Letras – Português e Inglês', instituicao: 'Universidade Federal do Tocantins', ano: 2015 },
        niveis: ['FUND_II', 'MEDIO'], statusAprovacao: 'APROVADO', dataAnalise: '2026-08-27',
        apresentacao: 'Professora de Língua Portuguesa e Inglês. No Ensino Médio, o foco é redação para o ENEM: estrutura do texto, repertório e correção comentada a cada aula.',
      },
      {
        id: 't4', tipo: 'tutor', nome: 'Otávio Prado', cpf: cpf('835067412'), email: 'otavio.prado@email.com', telefone: '(63) 99271-6634', status: 'ATIVO', dataCadastro: '2026-09-01', dataNascimento: '1990-12-03', cidade: 'Palmas – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em Física', instituicao: 'Instituto Federal do Tocantins', ano: 2014 },
        niveis: ['MEDIO', 'SUPERIOR'], statusAprovacao: 'APROVADO', dataAnalise: '2026-09-03',
        apresentacao: 'Licenciado em Física. Explico a teoria com situações do dia a dia e resolvo os exercícios passo a passo. Também atendo Física I para cursos de engenharia.',
      },
      {
        id: 't5', tipo: 'tutor', nome: 'Beatriz Lemos', cpf: cpf('290418573'), email: 'beatriz.lemos@email.com', telefone: '(63) 98402-3318', status: 'ATIVO', dataCadastro: '2026-09-10', dataNascimento: '1995-05-28', cidade: 'Palmas – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em Química', instituicao: 'Universidade Federal do Tocantins', ano: 2019 },
        niveis: ['FUND_II', 'MEDIO'], statusAprovacao: 'APROVADO', dataAnalise: '2026-09-12',
        apresentacao: 'Química para o Ensino Médio e Ciências para o Fundamental II. Uso mapas mentais e muitos exercícios de vestibular.',
      },
      {
        id: 't6', tipo: 'tutor', nome: 'Tiago Ferraz', cpf: cpf('561930284'), email: 'tiago.ferraz@email.com', telefone: '(63) 99654-2201', status: 'ATIVO', dataCadastro: '2026-09-18', dataNascimento: '1994-08-19', cidade: 'Palmas – TO',
        formacao: { tipo: 'BACHARELADO', curso: 'Bacharelado em Ciência da Computação', instituicao: 'Universidade Federal do Tocantins', ano: 2018 },
        niveis: ['SUPERIOR'], statusAprovacao: 'APROVADO', dataAnalise: '2026-09-19',
        apresentacao: 'Bacharel em Ciência da Computação e desenvolvedor. Ajudo em Algoritmos e Programação com exercícios práticos em Python, C e Java.',
      },
      {
        id: 't11', tipo: 'tutor', nome: 'Fábio Queiroz', cpf: cpf('774102935'), email: 'fabio.queiroz@email.com', telefone: '(63) 98720-4419', status: 'BLOQUEADO', dataCadastro: '2026-08-28', dataNascimento: '1987-03-30', cidade: 'Palmas – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em Biologia', instituicao: 'Universidade Federal do Tocantins', ano: 2011 },
        niveis: ['MEDIO'], statusAprovacao: 'APROVADO', dataAnalise: '2026-08-30',
        apresentacao: 'Biologia para o Ensino Médio e vestibulares.',
      },

      /* ---------- Tutores em análise / rejeitados ---------- */
      {
        id: 't7', tipo: 'tutor', nome: 'Juliana Arruda', cpf: cpf('318274069'), email: 'juliana.arruda@email.com', telefone: '(63) 99188-5072', status: 'ATIVO', dataCadastro: '2026-11-17', dataNascimento: '1998-10-11', cidade: 'Palmas – TO',
        formacao: { tipo: 'PEDAGOGIA', curso: 'Pedagogia', instituicao: 'Universidade Estadual do Tocantins', ano: 2024 },
        niveis: ['FUND_I'], statusAprovacao: 'PENDENTE',
        apresentacao: 'Recém-formada em Pedagogia, com estágio em turmas de 2º e 3º ano. Quero ajudar crianças em leitura, escrita e matemática básica.',
      },
      {
        id: 't8', tipo: 'tutor', nome: 'Caetano Ribeiro', cpf: cpf('902846157'), email: 'caetano.ribeiro@email.com', telefone: '(63) 98266-3390', status: 'ATIVO', dataCadastro: '2026-11-18', dataNascimento: '1996-01-25', cidade: 'Palmas – TO',
        formacao: { tipo: 'TECNICO', curso: 'Técnico em Eletrotécnica', instituicao: 'Instituto Federal do Tocantins', ano: 2016 },
        niveis: ['MEDIO'], statusAprovacao: 'PENDENTE',
        apresentacao: 'Técnico em eletrotécnica, quero dar aulas de Física com foco em eletricidade e circuitos para o Ensino Médio.',
      },
      {
        id: 't10', tipo: 'tutor', nome: 'Diego Martins', cpf: cpf('473019268'), email: 'diego.martins@email.com', telefone: '(63) 99033-7714', status: 'ATIVO', dataCadastro: '2026-11-15', dataNascimento: '1992-07-08', cidade: 'Porto Nacional – TO',
        formacao: { tipo: 'LICENCIATURA', curso: 'Licenciatura em História', instituicao: 'Universidade Federal do Tocantins', ano: 2016 },
        niveis: ['FUND_II', 'MEDIO'], statusAprovacao: 'PENDENTE',
        apresentacao: 'Professor de História da rede estadual. Aulas com linhas do tempo e questões do ENEM comentadas.',
      },
      {
        id: 't9', tipo: 'tutor', nome: 'Lívia Sampaio', cpf: cpf('650381924'), email: 'livia.sampaio@email.com', telefone: '(63) 98377-1256', status: 'ATIVO', dataCadastro: '2026-11-08', dataNascimento: '1997-04-02', cidade: 'Palmas – TO',
        formacao: { tipo: 'BACHARELADO', curso: 'Bacharelado em Administração', instituicao: 'Faculdade Católica do Tocantins', ano: 2020 },
        niveis: ['MEDIO'], statusAprovacao: 'REJEITADO', dataAnalise: '2026-11-10',
        justificativaRejeicao: 'Para lecionar Matemática no Ensino Médio é preciso comprovar licenciatura ou formação técnica compatível com a disciplina. O diploma enviado é de Bacharelado em Administração. Envie o comprovante de licenciatura em Matemática ou de formação técnica compatível.',
        apresentacao: 'Gosto de Matemática financeira e quero ajudar alunos do Ensino Médio com porcentagem, juros e funções.',
      },

      /* ---------- Administrador ---------- */
      { id: 'ad1', tipo: 'admin', nome: 'Bruna Castilho', cpf: cpf('128465093'), email: 'admin@apprenda.mais', telefone: '(63) 3212-0000', status: 'ATIVO', dataCadastro: '2026-08-01' },
    ];

    const responsaveis = [
      { id: 'r1', nomeCompleto: 'Cláudia Regina Alves', cpf: cpf('509317826'), email: 'claudia.alves@email.com' },
      { id: 'r2', nomeCompleto: 'Renata Sousa Lima', cpf: cpf('836204175'), email: 'renata.slima@email.com' },
      { id: 'r3', nomeCompleto: 'Joana Oliveira Brito', cpf: cpf('391726480'), email: 'joana.brito@email.com' },
    ];

    const autorizacoes = [
      { id: 'au1', alunoId: 'a1', responsavelId: 'r1', codigo: 'P3H8QA', dataEnvio: '2026-08-18T09:12', dataExpiracao: '2026-08-25T09:12', dataResposta: '2026-08-18T20:41', status: 'CONFIRMADA' },
      { id: 'au2', alunoId: 'a3', responsavelId: 'r2', codigo: 'R2D5LA', dataEnvio: '2026-11-04T16:30', dataExpiracao: '2026-11-11T16:30', dataResposta: null, status: 'EXPIRADA' },
      { id: 'au3', alunoId: 'a3', responsavelId: 'r2', codigo: 'K7Q2M9', dataEnvio: '2026-11-18T08:05', dataExpiracao: '2026-11-25T08:05', dataResposta: null, status: 'PENDENTE' },
      { id: 'au4', alunoId: 'a5', responsavelId: 'r3', codigo: 'M5T1BR', dataEnvio: '2026-09-14T11:00', dataExpiracao: '2026-09-21T11:00', dataResposta: '2026-09-14T19:22', status: 'CONFIRMADA' },
    ];

    const ofertas = [
      { id: 'o1', tutorId: 't1', disciplina: 'Matemática', nivel: 'FUND_II', modalidade: 'PRESENCIAL', preco: 55 },
      { id: 'o2', tutorId: 't1', disciplina: 'Matemática', nivel: 'FUND_II', modalidade: 'ONLINE', preco: 50 },
      { id: 'o3', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'PRESENCIAL', preco: 70 },
      { id: 'o4', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 65 },
      { id: 'o5', tutorId: 't1', disciplina: 'Cálculo I', nivel: 'SUPERIOR', modalidade: 'ONLINE', preco: 90 },
      { id: 'o6', tutorId: 't2', disciplina: 'Alfabetização', nivel: 'FUND_I', modalidade: 'PRESENCIAL', preco: 45 },
      { id: 'o7', tutorId: 't2', disciplina: 'Matemática', nivel: 'FUND_I', modalidade: 'PRESENCIAL', preco: 45 },
      { id: 'o8', tutorId: 't2', disciplina: 'Português', nivel: 'FUND_I', modalidade: 'ONLINE', preco: 40 },
      { id: 'o9', tutorId: 't3', disciplina: 'Redação', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 60 },
      { id: 'o10', tutorId: 't3', disciplina: 'Português', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 55 },
      { id: 'o11', tutorId: 't3', disciplina: 'Português', nivel: 'FUND_II', modalidade: 'PRESENCIAL', preco: 50 },
      { id: 'o12', tutorId: 't3', disciplina: 'Inglês', nivel: 'FUND_II', modalidade: 'ONLINE', preco: 50 },
      { id: 'o13', tutorId: 't4', disciplina: 'Física', nivel: 'MEDIO', modalidade: 'PRESENCIAL', preco: 70 },
      { id: 'o14', tutorId: 't4', disciplina: 'Física', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 65 },
      { id: 'o15', tutorId: 't4', disciplina: 'Física I', nivel: 'SUPERIOR', modalidade: 'ONLINE', preco: 95 },
      { id: 'o16', tutorId: 't5', disciplina: 'Química', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 60 },
      { id: 'o17', tutorId: 't5', disciplina: 'Ciências', nivel: 'FUND_II', modalidade: 'ONLINE', preco: 50 },
      { id: 'o18', tutorId: 't6', disciplina: 'Algoritmos', nivel: 'SUPERIOR', modalidade: 'ONLINE', preco: 85 },
      { id: 'o19', tutorId: 't6', disciplina: 'Programação', nivel: 'SUPERIOR', modalidade: 'ONLINE', preco: 85 },
      { id: 'o20', tutorId: 't11', disciplina: 'Biologia', nivel: 'MEDIO', modalidade: 'ONLINE', preco: 55 },
    ];

    // dia: 0 = domingo … 6 = sábado; inicio/fim em horas cheias
    const disponibilidades = [
      { id: 'd1', tutorId: 't1', dia: 1, inicio: 14, fim: 18 },
      { id: 'd2', tutorId: 't1', dia: 3, inicio: 14, fim: 18 },
      { id: 'd3', tutorId: 't1', dia: 4, inicio: 18, fim: 21 },
      { id: 'd4', tutorId: 't1', dia: 6, inicio: 8, fim: 12 },
      { id: 'd5', tutorId: 't2', dia: 2, inicio: 8, fim: 12 },
      { id: 'd6', tutorId: 't2', dia: 4, inicio: 8, fim: 12 },
      { id: 'd7', tutorId: 't2', dia: 5, inicio: 14, fim: 17 },
      { id: 'd8', tutorId: 't3', dia: 1, inicio: 19, fim: 22 },
      { id: 'd9', tutorId: 't3', dia: 4, inicio: 19, fim: 21 },
      { id: 'd10', tutorId: 't3', dia: 0, inicio: 15, fim: 18 },
      { id: 'd11', tutorId: 't4', dia: 2, inicio: 18, fim: 21 },
      { id: 'd12', tutorId: 't4', dia: 5, inicio: 8, fim: 11 },
      { id: 'd13', tutorId: 't4', dia: 6, inicio: 14, fim: 17 },
      { id: 'd14', tutorId: 't5', dia: 3, inicio: 8, fim: 12 },
      { id: 'd15', tutorId: 't5', dia: 5, inicio: 18, fim: 21 },
      { id: 'd16', tutorId: 't6', dia: 1, inicio: 20, fim: 22 },
      { id: 'd17', tutorId: 't6', dia: 2, inicio: 20, fim: 22 },
      { id: 'd18', tutorId: 't6', dia: 3, inicio: 20, fim: 22 },
      { id: 'd19', tutorId: 't11', dia: 2, inicio: 9, fim: 12 },
    ];

    const ag = (o) => Object.assign({ link: null, motivoCancelamento: null, canceladoPor: null, confirmadoEm: null, dataResposta: null }, o);
    const agendamentos = [
      ag({ id: 'g1', alunoId: 'a1', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 65, inicio: '2026-11-23T15:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-17T19:02', confirmadoEm: '2026-11-17T21:15', link: { url: 'https://meet.google.com/xqe-hmbn-rtu', plataforma: 'Google Meet', data: '2026-11-18T09:08' } }),
      ag({ id: 'g2', alunoId: 'a1', tutorId: 't4', disciplina: 'Física', nivel: 'MEDIO', modalidade: 'PRESENCIAL', valor: 70, inicio: '2026-11-24T19:00', status: 'PENDENTE', dataSolicitacao: '2026-11-18T22:10' }),
      ag({ id: 'g3', alunoId: 'a1', tutorId: 't3', disciplina: 'Redação', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 60, inicio: '2026-11-19T19:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-15T10:30', confirmadoEm: '2026-11-15T13:02' }),
      ag({ id: 'g4', alunoId: 'a1', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 60, inicio: '2026-11-16T16:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-12T18:00', confirmadoEm: '2026-11-12T20:30', link: { url: 'https://meet.google.com/kpa-wzrc-dfo', plataforma: 'Google Meet', data: '2026-11-13T08:00' } }),
      ag({ id: 'g5', alunoId: 'a1', tutorId: 't5', disciplina: 'Química', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 60, inicio: '2026-11-25T09:00', status: 'CANCELADA', dataSolicitacao: '2026-11-10T17:45', confirmadoEm: '2026-11-10T19:00', motivoCancelamento: 'A escola remarcou a prova para o mesmo horário.', canceladoPor: 'aluno', dataCancelamento: '2026-11-14T08:20' }),
      ag({ id: 'g6', alunoId: 'a1', tutorId: 't4', disciplina: 'Física', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 65, inicio: '2026-11-20T09:00', status: 'RECUSADA', dataSolicitacao: '2026-11-16T12:00', dataResposta: '2026-11-16T18:40' }),
      ag({ id: 'g7', alunoId: 'a2', tutorId: 't1', disciplina: 'Cálculo I', nivel: 'SUPERIOR', modalidade: 'ONLINE', valor: 90, inicio: '2026-11-25T15:00', status: 'PENDENTE', dataSolicitacao: '2026-11-18T14:20' }),
      ag({ id: 'g8', alunoId: 'a5', tutorId: 't1', disciplina: 'Matemática', nivel: 'FUND_II', modalidade: 'PRESENCIAL', valor: 55, inicio: '2026-11-21T09:00', status: 'PENDENTE', dataSolicitacao: '2026-11-19T07:48' }),
      ag({ id: 'g9', alunoId: 'a6', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'ONLINE', valor: 65, inicio: '2026-11-19T19:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-16T09:30', confirmadoEm: '2026-11-16T11:05' }),
      ag({ id: 'g10', alunoId: 'a2', tutorId: 't1', disciplina: 'Cálculo I', nivel: 'SUPERIOR', modalidade: 'ONLINE', valor: 90, inicio: '2026-11-26T18:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-17T10:00', confirmadoEm: '2026-11-17T12:40' }),
      ag({ id: 'g11', alunoId: 'a6', tutorId: 't1', disciplina: 'Matemática', nivel: 'MEDIO', modalidade: 'PRESENCIAL', valor: 70, inicio: '2026-11-28T10:00', status: 'CONFIRMADA', dataSolicitacao: '2026-11-18T16:15', confirmadoEm: '2026-11-18T18:00' }),
      ag({ id: 'g12', alunoId: 'a5', tutorId: 't1', disciplina: 'Matemática', nivel: 'FUND_II', modalidade: 'PRESENCIAL', valor: 55, inicio: '2026-11-14T08:00', status: 'CANCELADA', dataSolicitacao: '2026-11-08T10:00', confirmadoEm: '2026-11-08T12:00', motivoCancelamento: 'Imprevisto de saúde. Combinei uma nova data com o Mateus pelo chat.', canceladoPor: 'tutor', dataCancelamento: '2026-11-12T07:30' }),
    ];

    const mensagens = [
      { id: 'm1', agendamentoId: 'g4', remetenteId: 'a1', texto: 'Oi, professor! Minha prova de funções é na quarta. Posso levar a lista que a escola passou?', dataHora: '2026-11-15T18:20' },
      { id: 'm2', agendamentoId: 'g4', remetenteId: 't1', texto: 'Pode sim, Pedro. Manda as questões em que você travou e a gente começa por elas.', dataHora: '2026-11-15T18:41' },
      { id: 'm3', agendamentoId: 'g4', remetenteId: 'a1', texto: 'São as de função do 2º grau, principalmente achar o vértice.', dataHora: '2026-11-15T18:45' },
      { id: 'm4', agendamentoId: 'g4', remetenteId: 't1', texto: 'Boa aula hoje! Refaça os exercícios 4 e 7 e me conte se ficou alguma dúvida.', dataHora: '2026-11-16T17:05' },
      { id: 'm5', agendamentoId: 'g4', remetenteId: 'a1', texto: 'Fiz! Só o 7 que ainda não bateu, mas vi onde errei. Valeu!', dataHora: '2026-11-16T20:12' },
      { id: 'm6', agendamentoId: 'g1', remetenteId: 't1', texto: 'Oi, Pedro! Na segunda vamos de trigonometria? Já deixei o link da reunião na agenda.', dataHora: '2026-11-18T09:10' },
      { id: 'm7', agendamentoId: 'g1', remetenteId: 'a1', texto: 'Isso! Tenho dificuldade no ciclo trigonométrico e nas relações entre seno e cosseno.', dataHora: '2026-11-18T12:32' },
      { id: 'm8', agendamentoId: 'g9', remetenteId: 'a6', texto: 'Boa tarde! Vou precisar de ajuda com logaritmos para o simulado de sábado.', dataHora: '2026-11-17T15:03' },
      { id: 'm9', agendamentoId: 'g10', remetenteId: 't1', texto: 'Oi, Ana Luísa! Confirmei nossa aula de quinta, 26/11, às 18:00. O que você está vendo em Cálculo I agora?', dataHora: '2026-11-17T12:46' },
      { id: 'm10', agendamentoId: 'g10', remetenteId: 'a2', texto: 'Oi, Rafael! Estamos em derivadas. A P2 é no dia 28/11 e eu ainda me enrolo na regra da cadeia e na derivada implícita.', dataHora: '2026-11-17T13:10' },
      { id: 'm11', agendamentoId: 'g10', remetenteId: 't1', texto: 'Dá tempo de sobra. Me diga quais questões da lista mais travaram, que eu preparo os exemplos em cima delas.', dataHora: '2026-11-17T13:22' },
      { id: 'm12', agendamentoId: 'g10', remetenteId: 'a2', texto: 'São da 12 à 18 da lista 4. A pior é a 15: derivar sen(x² · eˣ). Sempre esqueço uma parte.', dataHora: '2026-11-17T19:48' },
      { id: 'm13', agendamentoId: 'g10', remetenteId: 't1', texto: 'Essa é clássica: regra da cadeia por fora e regra do produto por dentro. Antes da aula, revise a regra do produto, que a gente parte dela.', dataHora: '2026-11-18T08:05' },
      { id: 'm14', agendamentoId: 'g10', remetenteId: 'a2', texto: 'Combinado! Se sobrar tempo, posso tirar uma dúvida de limite no final?', dataHora: '2026-11-18T08:31' },
      { id: 'm15', agendamentoId: 'g10', remetenteId: 't1', texto: 'Pode sim, separo os últimos 10 minutos para isso. Até quinta!', dataHora: '2026-11-18T09:02' },
    ];

    const documentos = [
      { id: 'doc1', tutorId: 't1', nomeArquivo: 'diploma_licenciatura_matematica.pdf', tipo: 'Diploma', tamanhoKb: 940, dataEnvio: '2026-08-12' },
      { id: 'doc2', tutorId: 't2', nomeArquivo: 'diploma_pedagogia.pdf', tipo: 'Diploma', tamanhoKb: 1210, dataEnvio: '2026-08-20' },
      { id: 'doc3', tutorId: 't3', nomeArquivo: 'diploma_letras.pdf', tipo: 'Diploma', tamanhoKb: 880, dataEnvio: '2026-08-25' },
      { id: 'doc4', tutorId: 't4', nomeArquivo: 'diploma_fisica_ifto.pdf', tipo: 'Diploma', tamanhoKb: 760, dataEnvio: '2026-09-01' },
      { id: 'doc5', tutorId: 't5', nomeArquivo: 'diploma_quimica.pdf', tipo: 'Diploma', tamanhoKb: 1020, dataEnvio: '2026-09-10' },
      { id: 'doc6', tutorId: 't6', nomeArquivo: 'diploma_ciencia_computacao.pdf', tipo: 'Diploma', tamanhoKb: 690, dataEnvio: '2026-09-18' },
      { id: 'doc7', tutorId: 't7', nomeArquivo: 'diploma_pedagogia_unitins.pdf', tipo: 'Diploma', tamanhoKb: 812, dataEnvio: '2026-11-17' },
      { id: 'doc8', tutorId: 't7', nomeArquivo: 'historico_escolar.pdf', tipo: 'Histórico', tamanhoKb: 455, dataEnvio: '2026-11-17' },
      { id: 'doc9', tutorId: 't8', nomeArquivo: 'certificado_tecnico_eletrotecnica.pdf', tipo: 'Certificado', tamanhoKb: 530, dataEnvio: '2026-11-18' },
      { id: 'doc10', tutorId: 't9', nomeArquivo: 'diploma_administracao.pdf', tipo: 'Diploma', tamanhoKb: 970, dataEnvio: '2026-11-08' },
      { id: 'doc11', tutorId: 't10', nomeArquivo: 'diploma_licenciatura_historia.pdf', tipo: 'Diploma', tamanhoKb: 1105, dataEnvio: '2026-11-15' },
      { id: 'doc12', tutorId: 't10', nomeArquivo: 'declaracao_conclusao.jpg', tipo: 'Declaração', tamanhoKb: 2300, dataEnvio: '2026-11-15' },
      { id: 'doc13', tutorId: 't11', nomeArquivo: 'diploma_biologia.pdf', tipo: 'Diploma', tamanhoKb: 905, dataEnvio: '2026-08-28' },
    ];

    const moderacoes = [
      { id: 'mod1', usuarioId: 't11', adminId: 'ad1', tipo: 'SUSPENSAO', justificativa: 'Uso do chat para divulgar serviços pagos fora da plataforma.', data: '2026-10-02T14:10' },
      { id: 'mod2', usuarioId: 't11', adminId: 'ad1', tipo: 'REATIVACAO', justificativa: 'O tutor se comprometeu a seguir as regras de uso do chat.', data: '2026-10-09T09:30' },
      { id: 'mod3', usuarioId: 't11', adminId: 'ad1', tipo: 'BLOQUEIO', justificativa: 'Reincidência na divulgação de serviços externos pelo chat, após suspensão anterior.', data: '2026-10-20T16:45' },
      { id: 'mod4', usuarioId: 'a4', adminId: 'ad1', tipo: 'SUSPENSAO_PREVENTIVA', justificativa: 'Um tutor relatou mensagens ofensivas no chat da aula de 14/11. Conta suspensa até a análise das conversas.', data: '2026-11-15T10:42' },
    ];

    const historicoAnalise = [
      { id: 'h1', tutorId: 't9', tipo: 'REJEITADO', data: '2026-11-10T15:20', adminId: 'ad1', texto: 'Para lecionar Matemática no Ensino Médio é preciso comprovar licenciatura ou formação técnica compatível com a disciplina. O diploma enviado é de Bacharelado em Administração. Envie o comprovante de licenciatura em Matemática ou de formação técnica compatível.' },
    ];

    return {
      versao: 2,
      seq: 100,
      sessao: { aluno: 'a1', tutor: 't1', admin: 'ad1' },
      disputaResolvida: false,
      usuarios, responsaveis, autorizacoes, ofertas, disponibilidades,
      agendamentos, mensagens, documentos, moderacoes, historicoAnalise,
    };
  };
})();
