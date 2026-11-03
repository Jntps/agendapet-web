// VALIDA A DATA INFORMADA

export function dataEhValida(data) {

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);

  const d = new Date(ano, mes - 1, dia);

  return (
    d.getFullYear() === ano &&
    d.getMonth() === mes - 1 &&
    d.getDate() === dia
  );
}

// VALIDA O FORMATO DO HORÁRIO

export function horaEhValida(hora) {

  if (!/^\d{2}:\d{2}$/.test(hora || '')) {
    return false;
  }

  const [h, m] = hora.split(':').map(Number);

  return (
    h >= 0 &&
    h <= 23 &&
    m >= 0 &&
    m <= 59
  );
}

// RETORNA A DATA ATUAL

export function hojeLocal(data = new Date()) {

  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    data.getDate()
  ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

// HORÁRIO DE FUNCIONAMENTO: 08H ÀS 19H

export function horarioFuncionamento(hora) {

  return (
    horaEhValida(hora) &&
    hora >= '08:00' &&
    hora <= '19:00'
  );
}

// VERIFICA CONFLITOS DE AGENDAMENTO

export function existeConflito(
  lista,
  data,
  horario,
  ignorarProtocolo = null
) {

  return lista.some(item =>

    item.data === data &&

    item.horario === horario &&

    item.status !== 'Cancelado' &&

    item.protocolo !== ignorarProtocolo

  );
}

// FILTRA AGENDAMENTOS USANDO CALLBACK

export function filtrarAgendamentos(lista, criterio) {

  return lista.filter(criterio);

}

// VALIDA OS DADOS DO FORMULÁRIO

export function validarAgendamento(
  dados,
  lista = [],
  hoje = hojeLocal()
) {

  const erros = [];

  // CAMPOS OBRIGATÓRIOS

  const obrigatorios = [
    ['tutor', 'Informe o nome do tutor.'],
    ['telefone', 'Informe o telefone.'],
    ['pet', 'Informe o nome do pet.'],
    ['especie', 'Selecione a espécie.'],
    ['servicoId', 'Selecione um serviço.'],
    ['data', 'Informe a data.'],
    ['horario', 'Informe o horário.']
  ];

  // VERIFICA SE OS CAMPOS FORAM PREENCHIDOS

  for (const [campo, mensagem] of obrigatorios) {

    if (!String(dados[campo] ?? '').trim()) {

      erros.push({
        campo,
        mensagem
      });

    }
  }

  // VALIDA O TELEFONE

  if (
    dados.telefone &&
    !/^\d{10,11}$/.test(
      String(dados.telefone).replace(/\D/g, '')
    )
  ) {

    erros.push({
      campo: 'telefone',
      mensagem: 'Telefone deve ter DDD e 10 ou 11 dígitos.'
    });

  }

  // IMPEDE DATA PASSADA

  if (
    dados.data &&
    (
      !dataEhValida(dados.data) ||
      dados.data < hoje
    )
  ) {

    erros.push({
      campo: 'data',
      mensagem: 'Escolha uma data válida que não tenha passado.'
    });

  }

  // VALIDA HORÁRIO DE FUNCIONAMENTO

  if (
    dados.horario &&
    !horarioFuncionamento(dados.horario)
  ) {

    erros.push({
      campo: 'horario',
      mensagem: 'O horário deve ser entre 08:00 e 19:00.'
    });

  }

  // IMPEDE DOIS ATENDIMENTOS NO MESMO HORÁRIO

  if (
    dados.data &&
    dados.horario &&
    existeConflito(
      lista,
      dados.data,
      dados.horario
    )
  ) {

    erros.push({
      campo: 'horario',
      mensagem: 'Já existe um atendimento ativo neste dia e horário.'
    });

  }

  // VALIDA O ENDEREÇO DOMICILIAR

  if (dados.domiciliar) {

    if (
      !/^\d{8}$/.test(
        String(dados.endereco?.cep || '').replace(/\D/g, '')
      )
    ) {

      erros.push({
        campo: 'cep',
        mensagem: 'Informe um CEP com 8 dígitos.'
      });

    }

    // CAMPOS OBRIGATÓRIOS DO ENDEREÇO

    for (const campo of [
      'logradouro',
      'numero',
      'bairro',
      'cidade',
      'uf'
    ]) {

      if (!String(dados.endereco?.[campo] || '').trim()) {

        erros.push({
          campo,
          mensagem: `Preencha o campo ${campo} do endereço.`
        });

      }
    }

    // VALIDA A UF

    if (
      dados.endereco?.uf &&
      !/^[A-Za-z]{2}$/.test(dados.endereco.uf)
    ) {

      erros.push({
        campo: 'uf',
        mensagem: 'A UF deve ter duas letras.'
      });

    }
  }

  return erros;
}