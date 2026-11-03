const PREFIXO = 'agendapet:';

const CHAVES = {
  agenda: `${PREFIXO}agenda`,
  filtro: `${PREFIXO}filtro`,
  tema: `${PREFIXO}tema`,
  dia: `${PREFIXO}dia`
};

// Lê informações salvas no navegador

export function lerJSON(chave, padrao = null) {
  try {
    const texto = localStorage.getItem(chave);

    return texto === null
      ? padrao
      : JSON.parse(texto);

  } catch (erro) {
    console.warn(
      'Dados locais ignorados: formato inválido.',
      erro
    );

    return padrao;
  }
}

// Salva informações no navegador

export function salvarJSON(chave, valor) {
  try {
    localStorage.setItem(
      chave,
      JSON.stringify(valor)
    );

    return true;

  } catch (erro) {
    console.warn(
      'Não foi possível guardar os dados neste navegador.',
      erro
    );

    return false;
  }
}

// Recupera as preferências do usuário

export function lerPreferencia(nome, padrao) {
  const valor = lerJSON(CHAVES[nome], padrao);

  return typeof valor === 'string'
    ? valor
    : padrao;
}

// Salva as preferências

export function salvarPreferencia(nome, valor) {
  if (CHAVES[nome]) {
    salvarJSON(CHAVES[nome], valor);
  }
}

// Recupera a lista de agendamentos

export function carregarAgenda() {
  const valor = lerJSON(CHAVES.agenda, null);

  return Array.isArray(valor)
    ? valor
    : null;
}

// Salva a lista de agendamentos

export function salvarAgenda(agenda) {
  return salvarJSON(CHAVES.agenda, agenda);
}

// Cria a chave utilizada no cache dos feriados

export function chaveCacheFeriados(ano) {
  return `${PREFIXO}feriados:${ano}`;
}

// Remove apenas os dados do AgendaPet

export function limparDadosAplicacao() {
  try {
    const chaves = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (chave?.startsWith(PREFIXO)) {
        chaves.push(chave);
      }
    }

    for (const chave of chaves) {
      localStorage.removeItem(chave);
    }

    return true;

  } catch (erro) {
    console.warn(
      'Não foi possível apagar os dados locais.',
      erro
    );

    return false;
  }
}