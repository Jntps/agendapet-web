import test from 'node:test';

import assert from 'node:assert/strict';

import {
  Agendamento,
  AgendamentoDomiciliar,
  criarGeradorProtocolo
} from '../js/dominio/agendamento.js';

import {
  dataEhValida,
  existeConflito,
  validarAgendamento,
  filtrarAgendamentos
} from '../js/dominio/regras.js';

import {
  calcularFechamento
} from '../js/dominio/fechamento.js';

// DADOS UTILIZADOS NOS TESTES

const comum = {
  protocolo: 'AP-0001',
  tutor: 'Tutor Teste',
  telefone: '47999999999',
  pet: 'Mel',
  especie: 'Cachorro',
  servicoId: 'banho',
  servicoNome: 'Banho',
  data: '2026-12-25',
  horario: '10:00',
  precoBase: 65,
  status: 'Agendado'
};

// TESTE 1 - PROTOCOLOS

test('protocolos sequenciais mantêm contador encapsulado', () => {
  const proximo = criarGeradorProtocolo();

  assert.deepEqual(
    [proximo(), proximo(), proximo()],
    ['AP-0001', 'AP-0002', 'AP-0003']
  );
});

// TESTE 2 - HERANÇA E TAXA DOMICILIAR

test('classe domiciliar usa herança e adiciona taxa de 20 reais', () => {
  const comumObj = new Agendamento(comum);

  const domicilio = new AgendamentoDomiciliar({
    ...comum,
    endereco: {
      logradouro: 'Rua A',
      numero: '10',
      cidade: 'Gaspar',
      uf: 'SC'
    }
  });

  assert.equal(
    comumObj.calcularValor(),
    65
  );

  assert.equal(
    domicilio.calcularValor(),
    85
  );

  assert.match(
    domicilio.resumo(),
    /Domicílio: Rua A, 10/
  );

  assert.equal(
    new AgendamentoDomiciliar(
      domicilio.toJSON()
    ).calcularValor(),
    85
  );
});

// TESTE 3 - DATA E CONFLITOS

test('data e conflito são validados', () => {
  assert.equal(
    dataEhValida('2026-02-30'),
    false
  );

  assert.equal(
    dataEhValida('2026-12-25'),
    true
  );

  assert.equal(
    existeConflito(
      [comum],
      '2026-12-25',
      '10:00'
    ),
    true
  );

  assert.equal(
    existeConflito(
      [{ ...comum, status: 'Cancelado' }],
      '2026-12-25',
      '10:00'
    ),
    false
  );

  const erros = validarAgendamento(
    comum,
    [comum],
    '2026-11-01'
  );

  assert.ok(
    erros.some(
      erro => erro.mensagem.includes('Já existe')
    )
  );
});

// TESTE 4 - FECHAMENTO FINANCEIRO

test('callback filtra e fechamento soma apenas concluídos', () => {
  const lista = [
    {
      ...comum,
      status: 'Concluído',
      preco: 65
    },
    {
      ...comum,
      protocolo: 'AP-0002',
      horario: '11:00',
      status: 'Cancelado',
      preco: 100
    },
    {
      ...comum,
      protocolo: 'AP-0003',
      horario: '12:00',
      status: 'Agendado',
      preco: 200
    }
  ];

  assert.equal(
    filtrarAgendamentos(
      lista,
      item => item.status === 'Cancelado'
    ).length,
    1
  );

  const relatorio = calcularFechamento(
    lista,
    '2026-12-25',
    new Date(2026, 11, 25, 9, 0)
  );

  assert.deepEqual(
    [
      relatorio.total,
      relatorio.concluidos,
      relatorio.cancelados,
      relatorio.faturamento
    ],
    [3, 1, 1, 65]
  );

  assert.equal(
    relatorio.proximo.protocolo,
    'AP-0003'
  );
});