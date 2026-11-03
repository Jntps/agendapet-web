import {
  filtrarAgendamentos
} from './regras.js';

// CALCULA O FECHAMENTO DO DIA

export function calcularFechamento(
  agenda,
  data,
  agora = new Date()
) {

  // SELECIONA OS AGENDAMENTOS DA DATA

  const doDia = filtrarAgendamentos(
    agenda,
    item => item.data === data
  );

  // ORDENA POR HORÁRIO

  const ordenados = [...doDia].sort(
    (a, b) => a.horario.localeCompare(b.horario)
  );

  // ATENDIMENTOS CONCLUÍDOS

  const concluidos = ordenados.filter(
    item => item.status === 'Concluído'
  );

  // ATENDIMENTOS CANCELADOS

  const cancelados = ordenados.filter(
    item => item.status === 'Cancelado'
  );

  // FATURAMENTO: SOMENTE CONCLUÍDOS

  const faturamento = concluidos
    .map(item => Number(item.preco) || 0)
    .reduce(
      (soma, valor) => soma + valor,
      0
    );

  // QUANTIDADE POR SERVIÇO

  const porServico = {};

  for (const item of ordenados) {

    const chave =
      item.servicoNome ||
      item.servicoId ||
      'Outro serviço';

    porServico[chave] = (
      porServico[chave] || 0
    ) + 1;

  }

  // HORÁRIO ATUAL

  const horaAgora = `${String(
    agora.getHours()
  ).padStart(2, '0')}:${String(
    agora.getMinutes()
  ).padStart(2, '0')}`;

  // IDENTIFICA O PRÓXIMO ATENDIMENTO

  const proximo = ordenados.find(item =>

    item.status === 'Agendado' &&

    (
      data > dataLocal(agora) ||

      (
        data === dataLocal(agora) &&
        item.horario >= horaAgora
      )
    )

  ) || null;

  // IDENTIFICA ATENDIMENTOS ATRASADOS

  const haAtrasados =

    data === dataLocal(agora) &&

    ordenados.some(item =>

      item.status === 'Agendado' &&

      item.horario < horaAgora

    );

  // RETORNA OS RESULTADOS

  return {

    data,

    total: doDia.length,

    concluidos: concluidos.length,

    cancelados: cancelados.length,

    faturamento:
      Math.round(faturamento * 100) / 100,

    porServico,

    proximo,

    haAtrasados

  };
}

// FORMATA A DATA LOCAL

function dataLocal(d) {

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

}