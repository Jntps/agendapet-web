const fs = require('node:fs');
const path = require('node:path');

// ARQUIVO QUE SERÁ VALIDADO

const caminho = path.resolve(
  process.argv[2] || 'data/agenda-exemplo.json'
);

// CAMPOS OBRIGATÓRIOS

const obrigatorios = [
  'protocolo',
  'tutor',
  'telefone',
  'pet',
  'especie',
  'servicoId',
  'data',
  'horario',
  'status'
];

const statusValidos = [
  'Agendado',
  'Concluído',
  'Cancelado'
];

const erros = [];

// VERIFICAR DATA

function dataValida(data) {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false;
  }

  const [ano, mes, dia] = data
    .split('-')
    .map(Number);

  const objeto = new Date(
    ano,
    mes - 1,
    dia
  );

  return (
    objeto.getFullYear() === ano &&
    objeto.getMonth() + 1 === mes &&
    objeto.getDate() === dia
  );
}

// VERIFICAR HORÁRIO

function horaValida(hora) {
  if (
    typeof hora !== 'string' ||
    !/^\d{2}:\d{2}$/.test(hora)
  ) {
    return false;
  }

  const [horas, minutos] = hora
    .split(':')
    .map(Number);

  return (
    horas >= 0 &&
    horas <= 23 &&
    minutos >= 0 &&
    minutos <= 59
  );
}

// VALIDAÇÃO DA AGENDA

try {
  const agenda = JSON.parse(
    fs.readFileSync(caminho, 'utf8')
  );

  if (!Array.isArray(agenda)) {
    throw new Error(
      'A raiz do arquivo precisa ser uma lista.'
    );
  }

  const ocupados = new Set();

  const protocolos = new Set();

  agenda.forEach((item, indice) => {
    const linha = indice + 1;

    // VALIDA OBJETO

    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item)
    ) {
      erros.push(
        `Item ${linha}: é necessário um objeto.`
      );

      return;
    }

    // VALIDA CAMPOS OBRIGATÓRIOS

    for (const campo of obrigatorios) {
      if (
        typeof item[campo] !== 'string' ||
        !item[campo].trim()
      ) {
        erros.push(
          `Item ${linha}: campo obrigatório ausente/inválido — ${campo}.`
        );
      }
    }

    // VALIDA TELEFONE

    if (
      !/^\d{10,11}$/.test(
        String(item.telefone || '')
          .replace(/\D/g, '')
      )
    ) {
      erros.push(
        `Item ${linha}: telefone inválido (DDD + 10/11 dígitos).`
      );
    }

    // VALIDA DATA

    if (!dataValida(item.data)) {
      erros.push(
        `Item ${linha}: data inválida.`
      );
    }

    // VALIDA HORÁRIO

    if (!horaValida(item.horario)) {
      erros.push(
        `Item ${linha}: horário inválido.`
      );
    }

    // VALIDA HORÁRIO DE FUNCIONAMENTO

    if (
      horaValida(item.horario) &&
      (
        item.horario < '08:00' ||
        item.horario > '19:00'
      )
    ) {
      erros.push(
        `Item ${linha}: fora do funcionamento (08:00–19:00).`
      );
    }

    // VALIDA STATUS

    if (!statusValidos.includes(item.status)) {
      erros.push(
        `Item ${linha}: status inválido.`
      );
    }

    // VALIDA PREÇO

    if (
      !Number.isFinite(item.preco) ||
      item.preco < 0
    ) {
      erros.push(
        `Item ${linha}: preço inválido.`
      );
    }

    // VERIFICA PROTOCOLO DUPLICADO

    if (protocolos.has(item.protocolo)) {
      erros.push(
        `Item ${linha}: protocolo duplicado ${item.protocolo}.`
      );
    }

    protocolos.add(item.protocolo);

    // VERIFICA CONFLITO DE HORÁRIO

    if (
      item.status !== 'Cancelado' &&
      dataValida(item.data) &&
      horaValida(item.horario)
    ) {
      const chave =
        `${item.data}T${item.horario}`;

      if (ocupados.has(chave)) {
        erros.push(
          `Item ${linha}: conflito de horário em ${chave}.`
        );
      }

      ocupados.add(chave);
    }

    // VERIFICA ENDEREÇO DOMICILIAR

    if (
      item.domiciliar &&
      !item.endereco?.numero
    ) {
      erros.push(
        `Item ${linha}: endereço domiciliar sem número.`
      );
    }
  });

  // RESULTADO FINAL

  if (erros.length) {
    console.error(
      `\n❌ Arquivo inválido: ${erros.length} erro(s).\n${
        erros.map(item => `- ${item}`).join('\n')
      }`
    );

    process.exitCode = 1;

  } else {
    console.log(
      `✅ Agenda válida: ${agenda.length} agendamento(s), nenhum conflito.\nArquivo: ${caminho}`
    );
  }

} catch (erro) {
  console.error(
    `❌ Não foi possível validar: ${erro.message}`
  );

  process.exitCode = 1;
}