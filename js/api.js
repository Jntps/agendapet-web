import {
  chaveCacheFeriados,
  lerJSON,
  salvarJSON
} from './storage.js';

// Prazo de armazenamento dos feriados: 30 dias

const PRAZO_CACHE_MS = 30 * 24 * 60 * 60 * 1000;

// BUSCAR SERVIÇOS

export async function buscarServicos() {
  const resposta = await fetch(
    './data/servicos.json',
    { cache: 'no-store' }
  );

  if (!resposta.ok) {
    throw new Error(
      'Não foi possível carregar o catálogo.'
    );
  }

  const servicos = await resposta.json();

  if (
    !Array.isArray(servicos) ||
    servicos.length < 6
  ) {
    throw new Error(
      'O catálogo está incompleto.'
    );
  }

  return servicos;
}

// CONSULTAR ENDEREÇO PELO CEP

export async function buscarCep(cep) {
  const digitos = String(cep).replace(/\D/g, '');

  // Validação do formato

  if (!/^\d{8}$/.test(digitos)) {
    const erro = new Error(
      'CEP inválido: digite exatamente 8 números.'
    );

    erro.tipo = 'formato';

    throw erro;
  }

  let resposta;

  // Consulta da API ViaCEP

  try {
    resposta = await fetch(
      `https://viacep.com.br/ws/${digitos}/json/`
    );

    if (!resposta.ok) {
      throw new Error(
        'Resposta da API indisponível.'
      );
    }

  } catch {
    const erro = new Error(
      'Sem conexão com o ViaCEP. Preencha o endereço manualmente.'
    );

    erro.tipo = 'rede';

    throw erro;
  }

  let dados;

  try {
    dados = await resposta.json();

  } catch {
    dados = null;
  }

  // Verifica se o CEP foi encontrado

  if (!dados || dados.erro) {
    const erro = new Error(
      'CEP não encontrado. Confira o número ou preencha manualmente.'
    );

    erro.tipo = 'nao-encontrado';

    throw erro;
  }

  // Retorna o endereço organizado

  return {
    cep: digitos,
    logradouro: dados.logradouro || '',
    bairro: dados.bairro || '',
    cidade: dados.localidade || '',
    uf: dados.uf || ''
  };
}

// CONSULTAR FERIADOS NACIONAIS

export async function buscarFeriados(ano) {
  const chave = chaveCacheFeriados(ano);

  const cache = lerJSON(chave);

  // Verifica se já temos os feriados armazenados

  if (
    cache &&
    Array.isArray(cache.feriados) &&
    Number.isFinite(cache.consultadoEm) &&
    Date.now() - cache.consultadoEm < PRAZO_CACHE_MS
  ) {
    return cache.feriados;
  }

  // Consulta a API BrasilAPI

  const resposta = await fetch(
    `https://brasilapi.com.br/api/feriados/v1/${ano}`
  );

  if (!resposta.ok) {
    throw new Error(
      'Serviço de feriados indisponível.'
    );
  }

  const feriados = await resposta.json();

  if (!Array.isArray(feriados)) {
    throw new Error(
      'Resposta de feriados inválida.'
    );
  }

  // Guarda os feriados para próximas consultas

  salvarJSON(chave, {
    consultadoEm: Date.now(),
    feriados
  });

  return feriados;
}