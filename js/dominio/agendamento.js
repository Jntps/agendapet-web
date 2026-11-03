// TAXA PARA ATENDIMENTO DOMICILIAR

export const TAXA_DOMICILIO = 20;

export const STATUS_VALIDOS = [
  'Agendado',
  'Concluído',
  'Cancelado'
];

// CLASSE PRINCIPAL DE AGENDAMENTO

export class Agendamento {

  constructor(dados) {
    this.protocolo = dados.protocolo;
    this.tutor = dados.tutor;
    this.telefone = dados.telefone;
    this.pet = dados.pet;
    this.especie = dados.especie;
    this.servicoId = dados.servicoId;
    this.servicoNome = dados.servicoNome;
    this.data = dados.data;
    this.horario = dados.horario;

    this.observacoes = dados.observacoes || '';
    this.status = dados.status || 'Agendado';

    this.precoBase = Number(
      dados.precoBase ?? dados.preco ?? 0
    );

    this.domiciliar = false;
  }

  // CALCULA O VALOR DO SERVIÇO

  calcularValor() {
    return Math.round(this.precoBase * 100) / 100;
  }

  // RESUMO DO AGENDAMENTO

  resumo() {
    return `${this.protocolo} · ${this.pet} (${this.tutor}) · ${this.data} às ${this.horario}`;
  }

  // CONVERTE O AGENDAMENTO PARA JSON

  toJSON() {
    return {
      protocolo: this.protocolo,
      tutor: this.tutor,
      telefone: this.telefone,
      pet: this.pet,
      especie: this.especie,
      servicoId: this.servicoId,
      servicoNome: this.servicoNome,
      data: this.data,
      horario: this.horario,
      observacoes: this.observacoes,
      status: this.status,
      preco: this.calcularValor(),
      domiciliar: this.domiciliar
    };
  }
}

// CLASSE PARA ATENDIMENTO DOMICILIAR

export class AgendamentoDomiciliar extends Agendamento {

  constructor(dados) {
    super(dados);

    this.domiciliar = true;
    this.endereco = { ...(dados.endereco || {}) };

    // Evita cobrar a taxa duas vezes ao recuperar um JSON

    if (
      dados.precoBase === undefined &&
      dados.preco !== undefined
    ) {
      this.precoBase = Math.max(
        0,
        Number(dados.preco) - TAXA_DOMICILIO
      );
    }
  }

  // SOBRESCREVE O CÁLCULO DO VALOR

  calcularValor() {
    return super.calcularValor() + TAXA_DOMICILIO;
  }

  // RESUMO COM O ENDEREÇO

  resumo() {
    const {
      logradouro = '',
      numero = '',
      cidade = '',
      uf = ''
    } = this.endereco;

    return `${super.resumo()} · Domicílio: ${logradouro}, ${numero} - ${cidade}/${uf}`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      domiciliar: true,
      endereco: { ...this.endereco }
    };
  }
}

// GERADOR DE PROTOCOLOS SEQUENCIAIS

export function criarGeradorProtocolo(inicial = 0) {
  let contador = inicial;

  return () => {
    return `AP-${String(++contador).padStart(4, '0')}`;
  };
}

// ENCONTRA O MAIOR NÚMERO DE PROTOCOLO

export function maiorNumeroProtocolo(lista) {
  return lista.reduce((maior, item) => {

    const numero = Number(
      String(item.protocolo || '')
        .match(/^AP-(\d+)$/)?.[1] || 0
    );

    return Math.max(maior, numero);

  }, 0);
}

// CRIA O TIPO CORRETO DE AGENDAMENTO

export function criarAgendamento(dados) {
  return dados.domiciliar
    ? new AgendamentoDomiciliar(dados)
    : new Agendamento(dados);
}