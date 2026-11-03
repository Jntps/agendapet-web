const moeda = valor => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(valor || 0);

const $ = seletor => document.querySelector(seletor);

let timeoutToast = null;

// CRIAR ELEMENTOS NA TELA

function elemento(tag, classes, texto) {
  const el = document.createElement(tag);

  if (classes) {
    el.className = classes;
  }

  if (texto !== undefined) {
    el.textContent = texto;
  }

  return el;
}

// MOSTRAR MENSAGENS DE CONFIRMAÇÃO

export function mostrarToast(mensagem) {
  const toast = $('.toast');

  clearTimeout(timeoutToast);

  toast.textContent = mensagem;
  toast.hidden = false;

  timeoutToast = setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

// MOSTRAR CATÁLOGO DE SERVIÇOS

export function renderizarServicos(servicos) {
  const lista = $('.lista-servicos');
  const select = $('#servico');

  lista.replaceChildren();

  select.replaceChildren(
    new Option('Selecione um serviço', '')
  );

  for (const servico of servicos) {
    const item = elemento('div', 'servico-item');

    const icone = elemento(
      'span',
      'servico-icone',
      servico.icone || '🐾'
    );

    icone.setAttribute('aria-hidden', 'true');

    const dados = elemento('div', 'servico-dados');

    dados.append(
      elemento('strong', '', servico.nome),

      elemento(
        'small',
        '',
        `${servico.duracaoMinutos} min${
          servico.aceitaDomicilio ? ' · Domicílio' : ''
        }`
      )
    );

    item.append(
      icone,
      dados,
      elemento(
        'span',
        'servico-preco',
        moeda(servico.preco)
      )
    );

    lista.append(item);

    select.add(
      new Option(
        `${servico.nome} · ${moeda(servico.preco)}`,
        servico.id
      )
    );
  }

  select.disabled = false;

  $('.estado-servicos').hidden = true;
  $('.tentar-servicos').hidden = true;
}

// ESTADOS DE CARREGAMENTO DO CATÁLOGO

export function estadoServicos(estado, mensagem) {
  $('.estado-servicos').hidden = false;
  $('.estado-servicos').textContent = mensagem;

  $('.tentar-servicos').hidden = estado !== 'erro';

  $('#servico').disabled = true;

  if (estado === 'erro') {
    $('.lista-servicos').replaceChildren();

    $('#servico').replaceChildren(
      new Option('Serviços indisponíveis', '')
    );
  }
}

// CALCULAR TEMPO ATÉ O ATENDIMENTO

function diferencaMinutos(data, horario, agora) {
  const [ano, mes, dia] = data.split('-').map(Number);

  const [hora, minuto] = horario.split(':').map(Number);

  return Math.ceil(
    (
      new Date(
        ano,
        mes - 1,
        dia,
        hora,
        minuto
      ).getTime() - agora.getTime()
    ) / 60000
  );
}

// DEFINIR A COR DO STATUS

function statusClass(status) {
  return status === 'Concluído'
    ? 'status-concluido'
    : status === 'Cancelado'
      ? 'status-cancelado'
      : 'status-agendado';
}

// MOSTRAR AGENDAMENTOS DO DIA

export function renderizarAgenda(lista, opcoes = {}) {
  const destino = $('.lista-agenda');

  destino.replaceChildren();

  const ordenados = [...lista].sort(
    (a, b) => a.horario.localeCompare(b.horario)
  );

  $('.contador-agenda').textContent =
    `${ordenados.length} agendamento${
      ordenados.length === 1 ? '' : 's'
    }`;

  // QUANDO NÃO EXISTEM AGENDAMENTOS

  if (!ordenados.length) {
    const vazio = elemento('div', 'vazio');

    vazio.append(
      elemento('span', '', '🐶'),
      elemento('strong', '', 'Nenhum atendimento por aqui'),
      elemento(
        'p',
        '',
        'Tente outro filtro ou cadastre um novo agendamento.'
      )
    );

    destino.append(vazio);
    return;
  }

  // CRIAR CADA AGENDAMENTO

  for (const agendamento of ordenados) {
    const item = elemento('article', 'item-agenda');

    const minutos =
      agendamento.status === 'Agendado'
        ? diferencaMinutos(
            agendamento.data,
            agendamento.horario,
            opcoes.agora || new Date()
          )
        : null;

    // DESTAQUE PARA ATRASOS

    if (minutos !== null && minutos < 0) {
      item.classList.add('atrasado');

    } else if (minutos !== null && minutos <= 15) {
      item.classList.add('em-breve');
    }

    if (agendamento.protocolo === opcoes.selecionado) {
      item.classList.add('selecionado');
    }

    item.tabIndex = 0;

    item.setAttribute(
      'aria-label',
      `${agendamento.protocolo}, ${agendamento.pet}, ${agendamento.horario}, ${agendamento.status}. Enter para selecionar.`
    );

    // SELEÇÃO COM MOUSE

    item.addEventListener('click', () => {
      opcoes.onSelect?.(agendamento.protocolo);
    });

    // SELEÇÃO COM TECLADO

    item.addEventListener('keydown', evento => {
      if (
        evento.target === item &&
        (evento.key === 'Enter' || evento.key === ' ')
      ) {
        evento.preventDefault();

        opcoes.onSelect?.(agendamento.protocolo);
      }
    });

    const horario = elemento(
      'span',
      'horario-badge',
      agendamento.horario
    );

    const detalhes = elemento('div', 'detalhes-item');

    const titulo = elemento('div', 'linha-titulo');

    titulo.append(
      elemento('strong', '', agendamento.pet),

      elemento(
        'span',
        `status ${statusClass(agendamento.status)}`,
        agendamento.status
      )
    );

    detalhes.append(
      titulo,

      elemento(
        'p',
        'detalhe-servico',
        `${agendamento.servicoNome || agendamento.servicoId}${
          agendamento.domiciliar ? ' · A domicílio' : ''
        }`
      ),

      elemento(
        'p',
        '',
        `Tutor(a): ${agendamento.tutor} · ${agendamento.protocolo}`
      )
    );

    // ENDEREÇO DOMICILIAR

    if (agendamento.domiciliar && agendamento.endereco) {
      const end = agendamento.endereco;

      detalhes.append(
        elemento(
          'p',
          '',
          `${end.logradouro || ''}, ${end.numero || ''} · ${end.cidade || ''}/${end.uf || ''}`
        )
      );
    }

    // LEMBRETE DE HORÁRIO

    if (minutos !== null && minutos < 0) {
      detalhes.append(
        elemento('p', '', '⚠ Atendimento atrasado')
      );

    } else if (minutos !== null && minutos <= 15) {
      detalhes.append(
        elemento('p', '', '⏰ Atendimento em breve')
      );
    }

    const acoes = elemento('div', 'acao-item');

    acoes.append(
      elemento('strong', '', moeda(agendamento.preco))
    );

    // BOTÕES PARA CONCLUIR E CANCELAR

    if (agendamento.status === 'Agendado') {
      const concluir = elemento(
        'button',
        'concluir',
        '✓ Concluir'
      );

      const cancelar = elemento(
        'button',
        'cancelar',
        '✕ Cancelar'
      );

      concluir.type = 'button';
      cancelar.type = 'button';

      concluir.setAttribute(
        'aria-label',
        `Concluir ${agendamento.protocolo} de ${agendamento.pet}`
      );

      cancelar.setAttribute(
        'aria-label',
        `Cancelar ${agendamento.protocolo} de ${agendamento.pet}`
      );

      concluir.addEventListener('click', evento => {
        evento.stopPropagation();

        opcoes.onStatus?.(
          agendamento.protocolo,
          'Concluído'
        );
      });

      cancelar.addEventListener('click', evento => {
        evento.stopPropagation();

        opcoes.onStatus?.(
          agendamento.protocolo,
          'Cancelado'
        );
      });

      acoes.append(concluir, cancelar);
    }

    item.append(horario, detalhes, acoes);

    destino.append(item);
  }
}

// ATUALIZAR RESUMO FINANCEIRO

export function renderizarFechamento(fechamento) {
  $('.kpi-total').textContent = fechamento.total;

  $('.kpi-concluidos').textContent = fechamento.concluidos;

  $('.kpi-faturamento').textContent =
    moeda(fechamento.faturamento);

  $('.kpi-proximo').textContent =
    fechamento.proximo?.horario || '—';

  $('.fechamento-total').textContent =
    fechamento.total;

  $('.fechamento-concluidos').textContent =
    fechamento.concluidos;

  $('.fechamento-cancelados').textContent =
    fechamento.cancelados;

  $('.fechamento-valor').textContent =
    moeda(fechamento.faturamento);

  const lista = $('.resumo-servicos');

  lista.replaceChildren();

  const servicos = Object.entries(fechamento.porServico);

  if (!servicos.length) {
    lista.append(
      elemento('li', '', 'Nenhum serviço nesta data.')
    );
  }

  for (const [nome, quantidade] of servicos) {
    lista.append(
      elemento('li', '', `${nome}: ${quantidade}`)
    );
  }
}

// RELÓGIO E LEMBRETES

export function atualizarRelogio(
  agendamentos,
  dia,
  pausado = false
) {
  const agora = new Date();

  $('.relogio').textContent =
    agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

  if (pausado) {
    $('.lembrete-texto').textContent =
      'Lembretes pausados. Clique para retomar.';

    return;
  }

  const pendentes = agendamentos
    .filter(
      item =>
        item.data === dia &&
        item.status === 'Agendado'
    )
    .sort(
      (a, b) => a.horario.localeCompare(b.horario)
    );

  const futuro = pendentes.find(
    item =>
      diferencaMinutos(
        item.data,
        item.horario,
        agora
      ) >= 0
  );

  const atrasados = pendentes.filter(
    item =>
      diferencaMinutos(
        item.data,
        item.horario,
        agora
      ) < 0
  );

  let texto = 'Nenhum novo atendimento nesta data.';

  if (futuro) {
    const minutos = diferencaMinutos(
      futuro.data,
      futuro.horario,
      agora
    );

    texto =
      `${futuro.pet} às ${futuro.horario} · próximo em ${minutos} min${
        minutos <= 15 ? ' ⏰ Prepare a recepção!' : ''
      }`;
  }

  if (atrasados.length) {
    texto +=
      ` ⚠ ${atrasados.length} atendimento(s) atrasado(s).`;
  }

  $('.lembrete-texto').textContent = texto;
}

// FORMATAR VALORES EM REAIS

export function precoBRL(valor) {
  return moeda(valor);
}