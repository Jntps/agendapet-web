import { readFile } from 'node:fs/promises';

import { resolve } from 'node:path';

import {
  calcularFechamento
} from '../js/dominio/fechamento.js';

// CAMINHO DO ARQUIVO DE AGENDAMENTOS

const caminho = process.argv[2]
  ? resolve(process.argv[2])
  : new URL(
      '../data/agenda-exemplo.json',
      import.meta.url
    );

// FORMATAR VALORES EM REAIS

const moeda = valor =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);

// GERAR FECHAMENTO

try {
  const agenda = JSON.parse(
    await readFile(caminho, 'utf8')
  );

  if (!Array.isArray(agenda)) {
    throw new Error(
      'O JSON deve conter uma lista de agendamentos.'
    );
  }

  const data = process.argv[3] || agenda[0]?.data;

  if (!data) {
    throw new Error(
      'Não existe uma data para o fechamento.'
    );
  }

  const dados = calcularFechamento(
    agenda,
    data
  );

  console.log(
    '\n🐾 PATINHAS & CIA — FECHAMENTO DO DIA'
  );

  console.log('='.repeat(48));

  console.log(`Data: ${data}`);

  console.log(
    `Total de atendimentos: ${dados.total}`
  );

  console.log(
    `Concluídos: ${dados.concluidos}`
  );

  console.log(
    `Cancelados: ${dados.cancelados}`
  );

  console.log(
    `Faturamento realizado: ${moeda(dados.faturamento)}`
  );

  console.log('\nQuantidade por serviço:');

  for (
    const [nome, quantidade]
    of Object.entries(dados.porServico)
  ) {
    console.log(
      `  • ${nome}: ${quantidade}`
    );
  }

  console.log(
    `\nPróximo atendimento: ${
      dados.proximo
        ? `${dados.proximo.horario} — ${dados.proximo.pet}`
        : 'Nenhum agendado para depois de agora'
    }`
  );

  console.log('='.repeat(48));

} catch (erro) {
  console.error(
    'Erro ao fechar o dia:',
    erro.message
  );

  process.exitCode = 1;
}