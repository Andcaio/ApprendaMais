/* Apprenda+ — mapa de telas e inicialização */
(function () {
  const AP = window.AP;

  const GRUPOS = ['Área pública', 'Responsável legal', 'Aluno', 'Tutor', 'Administrador'];

  AP.rota({
    caminho: '/mapa', area: 'mapa', titulo: 'Mapa de telas', uc: [], largo: true,
    render() {
      const secoes = GRUPOS.map((g) => {
        const rotas = AP.rotas.filter((r) => r.grupo === g && r.exemplo);
        if (!rotas.length) return '';
        const linhas = [];
        rotas.forEach((r) => {
          linhas.push([r.titulo, r.uc, r.exemplo, false]);
          (r.variacoes || []).forEach(([t, h]) => linhas.push([t, r.uc, h, true]));
        });
        return `<section class="mapa__grupo" aria-labelledby="g-${g.replace(/\W/g, '')}">
          <h2 id="g-${g.replace(/\W/g, '')}">${g}</h2>
          <div class="tabela-wrap"><table class="tabela tabela--mapa">
            <thead><tr><th scope="col">Tela</th><th scope="col">Casos de uso</th><th scope="col"><span class="sr">Links</span></th></tr></thead>
            <tbody>${linhas.map(([t, uc, h, varia]) => `<tr${varia ? ' class="mapa__variacao"' : ''}>
              <th scope="row">${varia ? '<span aria-hidden="true">↳ </span>' : ''}${AP.esc(t)}</th>
              <td>${(uc || []).map((c) => `<span class="codigo-uc">${c}</span>`).join(' ') || '—'}</td>
              <td class="tabela__acoes"><a class="btn btn--secundario btn--pequeno" href="${h}">Abrir</a><a class="btn btn--texto btn--pequeno" href="?limpo${h}" target="_blank" rel="noopener">Sem barra<span class="sr"> (abre em nova aba, para captura de tela)</span></a></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </section>`;
      }).join('');
      return `<div class="mapa">
        <header class="cabecalho"><div><h1>Mapa de telas</h1>
          <p>Todas as telas do protótipo, agrupadas por ator, com os casos de uso da documentação que cada uma atende. “Sem barra” abre a tela sem a barra do protótipo, pronta para captura.</p></div></header>
        <div class="mapa__layout">
          <div>${secoes}</div>
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
  });

  document.addEventListener('DOMContentLoaded', AP.iniciar);
})();
