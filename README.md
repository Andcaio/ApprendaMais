# Apprenda+ — protótipo navegável das telas

Protótipo em HTML, CSS e JavaScript puro, feito a partir da documentação **Apprenda+ v0.1** (RF01 a RF11, casos de uso UC01.1 a UC11.2 e regras RN01 a RN06).

## Como abrir

Dê dois cliques em `index.html`. Não precisa instalar nada nem rodar servidor.

- A **barra azul no topo** existe só no protótipo. Ela permite trocar de ator (Visitante, Aluno, Tutor, Administrador, Responsável legal), mostra os casos de uso da tela aberta e tem o link **Mapa de telas**.
- O botão **Minimizar**, no canto direito da barra, transforma a barra num botão pequeno (“Protótipo · ator”). Clique nele para abrir a barra de novo, ou arraste para o canto da tela que preferir. A escolha fica salva no navegador.
- A **data é simulada**: quinta-feira, 19/11/2026, 10:00. As regras de prazo (cancelar até 24 h antes, chat aberto até 24 h depois da aula) usam essa data.
- O que você fizer (cadastros, solicitações, mensagens) fica salvo no navegador. Use **Restaurar dados** na barra para voltar ao início.
- Para tirar print sem a barra, abra `index.html?limpo`. O Mapa de telas também tem um link “Sem barra” para cada tela.

## Telas e casos de uso

As imagens estão em `capturas/`, prontas para a seção 11 (Telas do Software) da documentação.

| Requisito | Caso de uso | Tela | Captura |
|---|---|---|---|
| RF01 | UC01.1 Solicitar dados do responsável | Cadastro de aluno (seção Responsável legal aparece para menores de 18) | `04-UC02.1-UC01.1-cadastro-aluno-menor.png` |
| RF01 | UC01.1 | Aguardando autorização + e-mail recebido pelo responsável | `06-…`, `07-…` |
| RF01 | UC01.2 Registrar autorização do responsável | Página do responsável: código, confirmar/recusar, código expirado | `08-…`, `09-…`, `10-…` |
| RF02 | UC02.1 Cadastrar perfil de aluno | Cadastro de aluno com validações (CPF, e-mail duplicado, senha) | `04-…`, `05-…` |
| RF02 | UC02.2 Cadastrar perfil de tutor | Cadastro de tutor com níveis, apresentação e documentos | `11-…`, `12-…` |
| RF02 | UC02.3 Editar perfil | Meu perfil (aluno e tutor), com resumo de atividades | `24-…`, `32-…` |
| RF03 | UC03.1 Moderar usuários | Pesquisa de usuários e cadastro com suspender/reativar/bloquear | `36-…`, `37-…`, `38-…` |
| RF04 | UC04.1 Aprovar/Rejeitar tutor | Lista de análise, critérios RN01, rejeição com justificativa e reenvio pelo tutor | `33-…`, `34-…`, `35-…`, `13-…` |
| RF05 | UC05.1 / UC05.2 Catálogo de matérias | Minhas disciplinas: cadastrar oferta, editar preço, remover | `28-…`, `29-…` |
| RF06 | UC06.1 Pesquisar e filtrar tutores | Busca com filtros e ordenação, sem resultado | `14-…`, `15-…` |
| RF06 | UC06.2 Visualizar detalhes do tutor | Perfil público do tutor, perfil indisponível | `16-…`, `18-…` |
| RF07 | UC07.1 / UC07.2 Disponibilidade | Minha disponibilidade: intervalos divididos em blocos de 60 min | `30-…` |
| RF08 | UC08.1 Solicitar agendamento | Escolha de matéria e bloco, confirmação | `16-…`, `17-…` |
| RF08 | UC08.2 Reservar horário e impedir dupla seleção | Erro de reserva simultânea | `43-…` |
| RF08 | UC08.3 Aceitar/Recusar agendamento | Solicitações e painel do tutor | `25-…`, `26-…` |
| RF09 | UC09.1 Visualizar agenda | Minha agenda: próximas e histórico (aluno e tutor) | `19-…`, `20-…`, `27-…` |
| RF09 | UC09.2 Cancelar aula | Cancelamento com motivo; bloqueado a menos de 24 h | `21-…`, `19-…` |
| RF10 | UC10.1 Informar link | Formulário de link na agenda do tutor | `27-…` |
| RF10 | UC10.2 Disponibilizar link ao aluno | Link disponível / Link pendente na agenda do aluno | `19-…` |
| RF11 | UC11.1 Trocar mensagens | Chat com limite de 2.000 caracteres | `22-…`, `31-…` |
| RF11 | UC11.2 Visualizar histórico | Chat encerrado (somente leitura) | `23-…` |
| RNF03 | Interface responsiva | Versões de celular | `39-…` a `42-…` |

## Cenários prontos para demonstrar

- **Reserva simultânea (UC08.2):** como aluno, no perfil do Rafael, escolha seg 23/11 às 17:00 e envie.
- **Cancelamento bloqueado (UC09.2):** a aula de Redação de hoje às 19:00 está a menos de 24 h.
- **Link pendente (UC10.1):** como tutor, informe o link da aula de hoje às 19:00 com a Sofia.
- **Autorização do responsável (UC01.2):** código `K7Q2M9` (válido) e `R2D5LA` (expirado).
- **Tutor rejeitado (UC04.1):** na tela Entrar, use o atalho “Lívia”.
- **Login de conta suspensa:** na tela Entrar, use o atalho “Larissa”.

## Estrutura

```
prototipo/
  index.html
  css/estilo.css             identidade visual (caderno quadriculado, tinta azul, marca-texto)
  js/dados.js                dados de exemplo e enumerações do diagrama de classes
  js/nucleo.js               armazenamento, rotas, componentes
  js/telas-publico.js        início, entrar, cadastros, autorização do responsável
  js/telas-aluno.js          busca, perfil do tutor, solicitação
  js/telas-tutor.js          painel, solicitações, disciplinas, disponibilidade
  js/telas-compartilhadas.js agenda, conversas, meu perfil
  js/telas-admin.js          análise de tutores, usuários
  js/app.js                  mapa de telas e inicialização
  capturas/                  imagens de cada tela (1440 px; celular em 390 px)
```

Os nomes, CPFs e e-mails dos dados de exemplo são fictícios.
