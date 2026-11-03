import {
  buscarServicos,
  buscarCep,
  buscarFeriados
} from './api.js';

import {
  carregarAgenda,
  salvarAgenda,
  lerPreferencia,
  salvarPreferencia,
  limparDadosAplicacao
} from './storage.js';

import {
  Agendamento,
  AgendamentoDomiciliar,
  criarGeradorProtocolo,
  maiorNumeroProtocolo,
  TAXA_DOMICILIO
} from './dominio/agendamento.js';

import {
  hojeLocal,
  dataEhValida,
  validarAgendamento,
  filtrarAgendamentos
} from './dominio/regras.js';

import {
  calcularFechamento
} from './dominio/fechamento.js';

import {
  mostrarToast,
  renderizarServicos,
  estadoServicos,
  renderizarAgenda,
  renderizarFechamento,
  atualizarRelogio,
  precoBRL
} from './ui.js';

// ELEMENTOS E VARIÁVEIS

const $ = seletor => document.querySelector(seletor);

const formulario = $('.formulario');

const hoje = hojeLocal();

let agenda = carregarAgenda() || [];
let servicos = [];

let numeroProtocolo = criarGeradorProtocolo(
  maiorNumeroProtocolo(agenda)
);

let dataAgenda = lerPreferencia('dia', hoje);
let filtro = lerPreferencia('filtro', 'Todos');
let tema = lerPreferencia('tema', 'claro');

let selecionado = null;
let feriadoAtual = null;

let promessaFeriado = Promise.resolve();

let pedidoFeriado = 0;
let pedidoCep = 0;

let timerRelogio = null;
let pausado = false;
let confirmarLimpeza = false;

// FORMATAR DATA

function formatarDataPorExtenso(data) {
  const [ano, mes, dia] = data.split('-').map(Number);

  return new Date(
    ano,
    mes - 1,
    dia
  ).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ALTERAR TEMA

function aplicarTema() {
  tema = tema === 'escuro' ? 'escuro' : 'claro';

  document.documentElement.dataset.theme = tema;

  $('.botao-tema').setAttribute(
    'aria-pressed',
    String(tema === 'escuro')
  );

  $('.botao-tema').textContent =
    tema === 'escuro' ? '☀ Tema' : '☾ Tema';
}

// ATUALIZAR TELA PRINCIPAL

function atualizarTela() {
  $('.data-por-extenso').textContent =
    formatarDataPorExtenso(dataAgenda);

  const busca = $('.busca-input')
    .value
    .trim()
    .toLocaleLowerCase('pt-BR');

  const filtrados = filtrarAgendamentos(
    agenda,
    item => {
      if (
        item.data !== dataAgenda ||
        (filtro !== 'Todos' && item.status !== filtro)
      ) {
        return false;
      }

      return !busca ||
        `${item.tutor} ${item.pet}`
          .toLocaleLowerCase('pt-BR')
          .includes(busca);
    }
  );

  renderizarAgenda(filtrados, {
    selecionado,
    agora: new Date(),

    onSelect: protocolo => {
      selecionado =
        protocolo === selecionado ? null : protocolo;

      atualizarTela();
    },

    onStatus: mudarStatus
  });

  renderizarFechamento(
    calcularFechamento(agenda, dataAgenda)
  );

  atualizarRelogio(
    agenda,
    dataAgenda,
    pausado
  );
}

// CONCLUIR OU CANCELAR ATENDIMENTO

function mudarStatus(protocolo, status) {
  const item = agenda.find(
    ag => ag.protocolo === protocolo
  );

  if (!item || item.status !== 'Agendado') {
    return;
  }

  item.status = status;

  if (!salvarAgenda(agenda)) {
    mostrarToast(
      'Alteração realizada, mas não foi possível salvar neste navegador.'
    );
  } else {
    mostrarToast(
      `${item.pet}: atendimento ${status.toLocaleLowerCase('pt-BR')}.`
    );
  }

  atualizarTela();
}

// CARREGAR CATÁLOGO DE SERVIÇOS

async function carregarCatalogo() {
  estadoServicos(
    'carregando',
    'Carregando serviços...'
  );

  try {
    servicos = await buscarServicos();

    renderizarServicos(servicos);

    atualizarOpcoesDomicilio();
    atualizarPreco();

  } catch (erro) {
    console.warn(
      'Falha tratada ao buscar serviços:',
      erro.message
    );

    estadoServicos(
      'erro',
      'Não foi possível carregar o catálogo. Verifique sua conexão.'
    );
  }
}

// IDENTIFICAR SERVIÇO SELECIONADO

function servicoSelecionado() {
  return servicos.find(
    item => item.id === $('#servico').value
  );
}

// ATENDIMENTO DOMICILIAR

function atualizarOpcoesDomicilio() {
  const podeDomicilio = Boolean(
    servicoSelecionado()?.aceitaDomicilio
  );

  $('#domiciliar').disabled = !podeDomicilio;

  if (!podeDomicilio) {
    $('#domiciliar').checked = false;
  }

  $('.endereco-campos').hidden = !(
    $('#domiciliar').checked && podeDomicilio
  );

  atualizarPreco();
}

// ATUALIZAR VALOR DO SERVIÇO

function atualizarPreco() {
  const servico = servicoSelecionado();

  const total =
    Number(servico?.preco || 0) +
    (
      $('#domiciliar').checked &&
      servico?.aceitaDomicilio
        ? TAXA_DOMICILIO
        : 0
    );

  $('.preco-estimado').textContent =
    precoBRL(total);
}

// MOSTRAR AVISO DE FERIADO

function mostrarFeriado(
  texto,
  exigeConfirmacao = false
) {
  $('.feriado-painel').hidden = false;

  $('.feriado-mensagem').textContent = texto;

  $('.feriado-confirma').hidden =
    !exigeConfirmacao;

  if (!exigeConfirmacao) {
    $('[name="confirmarFeriado"]').checked = false;
  }
}

// CONSULTAR FERIADOS

function verificarFeriado() {
  const data = $('#data').value;

  const id = ++pedidoFeriado;

  feriadoAtual = null;

  $('[name="confirmarFeriado"]').checked = false;

  $('.feriado-painel').hidden = true;

  if (!dataEhValida(data)) {
    promessaFeriado = Promise.resolve();
    return promessaFeriado;
  }

  mostrarFeriado('Consultando feriados...');

  promessaFeriado = (async () => {
    try {
      const feriados = await buscarFeriados(
        Number(data.slice(0, 4))
      );

      if (
        id !== pedidoFeriado ||
        $('#data').value !== data
      ) {
        return;
      }

      feriadoAtual = feriados.find(
        item => item.date === data
      ) || null;

      if (feriadoAtual) {
        mostrarFeriado(
          `⚠ ${feriadoAtual.name}: confirme com o tutor antes de agendar.`,
          true
        );
      } else {
        $('.feriado-painel').hidden = true;
      }

    } catch (erro) {
      if (
        id !== pedidoFeriado ||
        $('#data').value !== data
      ) {
        return;
      }

      console.warn(
        'Falha tratada na consulta de feriados:',
        erro.message
      );

      mostrarFeriado(
        'Não foi possível verificar feriados. Você pode continuar mesmo assim.'
      );
    }
  })();

  return promessaFeriado;
}

// CONSULTAR CEP AUTOMATICAMENTE

async function preencherEnderecoPorCep() {
  const cep = $('#cep').value.replace(/\D/g, '');

  const atual = ++pedidoCep;

  const feedback = $('.cep-feedback');

  if (!cep) {
    feedback.textContent = '';
    return;
  }

  if (cep.length !== 8) {
    feedback.textContent =
      'CEP inválido: digite 8 números.';
    return;
  }

  feedback.textContent = 'Consultando endereço...';

  try {
    const endereco = await buscarCep(cep);

    if (
      atual !== pedidoCep ||
      $('#cep').value.replace(/\D/g, '') !== cep
    ) {
      return;
    }

    for (const campo of [
      'logradouro',
      'bairro',
      'cidade',
      'uf'
    ]) {
      document.getElementById(campo).value =
        endereco[campo];
    }

    feedback.textContent =
      '✓ Endereço encontrado. Informe o número e confira os dados.';

  } catch (erro) {
    if (atual !== pedidoCep) {
      return;
    }

    feedback.textContent = erro.message;
  }
}

// LER DADOS DO FORMULÁRIO

function lerDadosFormulario() {
  const valores = new FormData(formulario);

  const servico = servicoSelecionado();

  const domiciliar =
    $('#domiciliar').checked &&
    Boolean(servico?.aceitaDomicilio);

  return {
    tutor: String(
      valores.get('tutor') || ''
    ).trim(),

    telefone: String(
      valores.get('telefone') || ''
    ).replace(/\D/g, ''),

    pet: String(
      valores.get('pet') || ''
    ).trim(),

    especie: String(
      valores.get('especie') || ''
    ),

    servicoId: String(
      valores.get('servico') || ''
    ),

    servicoNome: servico?.nome || '',

    precoBase: servico?.preco || 0,

    data: String(
      valores.get('data') || ''
    ),

    horario: String(
      valores.get('horario') || ''
    ),

    observacoes: String(
      valores.get('observacoes') || ''
    ).trim(),

    domiciliar,

    endereco: domiciliar ? {
      cep: String(
        valores.get('cep') || ''
      ).replace(/\D/g, ''),

      logradouro: String(
        valores.get('logradouro') || ''
      ).trim(),

      numero: String(
        valores.get('numero') || ''
      ).trim(),

      complemento: String(
        valores.get('complemento') || ''
      ).trim(),

      bairro: String(
        valores.get('bairro') || ''
      ).trim(),

      cidade: String(
        valores.get('cidade') || ''
      ).trim(),

      uf: String(
        valores.get('uf') || ''
      ).trim().toUpperCase()

    } : undefined
  };
}

// LIMPAR MENSAGENS DE ERRO

function limparErros() {
  $('.erro-formulario').textContent = '';

  formulario
    .querySelectorAll('.invalido')
    .forEach(campo => {
      campo.classList.remove('invalido');
      campo.removeAttribute('aria-invalid');
    });
}

// MOSTRAR ERRO NO FORMULÁRIO

function exibirErro(campo, mensagem) {
  const feedback = $('.erro-formulario');

  feedback.textContent = mensagem;

  const input = document.getElementById(
    campo === 'servicoId' ? 'servico' : campo
  );

  if (input) {
    input.classList.add('invalido');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  } else {
    feedback.focus();
  }
}

// SALVAR NOVO AGENDAMENTO

async function salvarNovoAgendamento(evento) {
  evento.preventDefault();

  limparErros();

  const dados = lerDadosFormulario();

  const erros = validarAgendamento(
    dados,
    agenda
  );

  if (erros.length) {
    exibirErro(
      erros[0].campo,
      erros[0].mensagem
    );
    return;
  }

  if (!servicoSelecionado()) {
    exibirErro(
      'servicoId',
      'Selecione um serviço válido do catálogo.'
    );
    return;
  }

  if (
    dados.domiciliar &&
    !servicoSelecionado().aceitaDomicilio
  ) {
    exibirErro(
      'servicoId',
      'Este serviço não permite atendimento a domicílio.'
    );
    return;
  }

  // AGUARDA A CONSULTA DE FERIADOS

  await promessaFeriado;

  if ($('#data').value !== dados.data) {
    exibirErro(
      'data',
      'A data mudou durante a verificação. Confira e tente novamente.'
    );
    return;
  }

  if (
    feriadoAtual &&
    !$('[name="confirmarFeriado"]').checked
  ) {
    exibirErro(
      '',
      'É feriado: marque “Agendar mesmo assim” para continuar.'
    );

    $('[name="confirmarFeriado"]').focus();
    return;
  }

  // CONFERE NOVAMENTE POSSÍVEIS CONFLITOS

  const novosErros = validarAgendamento(
    dados,
    agenda
  );

  if (novosErros.length) {
    exibirErro(
      novosErros[0].campo,
      novosErros[0].mensagem
    );
    return;
  }

  // CRIA O AGENDAMENTO

  const protocolo = numeroProtocolo();

  const classe = dados.domiciliar
    ? AgendamentoDomiciliar
    : Agendamento;

  const novo = new classe({
    ...dados,
    protocolo,
    status: 'Agendado'
  });

  agenda.push(novo.toJSON());

  const persistiu = salvarAgenda(agenda);

  // ATUALIZA A DATA DA AGENDA

  dataAgenda = dados.data;

  $('.dia-agenda').value = dataAgenda;

  salvarPreferencia('dia', dataAgenda);

  // LIMPA OS FILTROS

  filtro = 'Todos';

  $('.filtro-status').value = filtro;
  $('.busca-input').value = '';

  salvarPreferencia('filtro', filtro);

  // LIMPA O FORMULÁRIO

  formulario.reset();

  $('#data').value = hojeLocal();

  $('.endereco-campos').hidden = true;

  atualizarOpcoesDomicilio();
  verificarFeriado();
  atualizarTela();

  mostrarToast(
    `✓ ${novo.pet} agendado(a)! Protocolo ${protocolo}.${
      persistiu ? '' : ' Não foi possível salvar no navegador.'
    }`
  );

  $('#agenda').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// EXPORTAR AGENDA EM JSON

function exportarAgenda() {
  const dados = JSON.stringify(
    agenda,
    null,
    2
  );

  $('.dados-exportados').value = dados;

  $('.exportacao').hidden = false;

  $('#fechamento').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  mostrarToast(
    'JSON gerado. Você pode copiar ou baixar.'
  );
}

// BAIXAR ARQUIVO JSON

function baixarAgenda() {
  const conteudo = $('.dados-exportados').value;

  const url = URL.createObjectURL(
    new Blob(
      [conteudo],
      { type: 'application/json;charset=utf-8' }
    )
  );

  const link = document.createElement('a');

  link.href = url;

  link.download =
    `agenda-pet-${hojeLocal()}.json`;

  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// PAUSAR E RETOMAR LEMBRETES

function alternarLembretes() {
  pausado = !pausado;

  const botao = $('.pausa-lembretes');

  botao.textContent = pausado
    ? 'Retomar lembretes'
    : 'Pausar lembretes';

  botao.setAttribute(
    'aria-pressed',
    String(pausado)
  );

  if (timerRelogio) {
    clearInterval(timerRelogio);
  }

  timerRelogio = null;

  if (!pausado) {
    timerRelogio = setInterval(
      () => atualizarTela(),
      30000
    );
  }

  atualizarRelogio(
    agenda,
    dataAgenda,
    pausado
  );
}

// LIMPAR DADOS DO SISTEMA

function limparMeusDados() {
  const botao = $('.btn-limpar');

  if (!confirmarLimpeza) {
    confirmarLimpeza = true;

    botao.textContent =
      'Confirmar limpeza (clique novamente)';

    mostrarToast(
      'Atenção: o segundo clique remove todos os dados do AgendaPet.'
    );

    setTimeout(() => {
      confirmarLimpeza = false;
      botao.textContent = 'Limpar meus dados';
    }, 8000);

    return;
  }

  if (!limparDadosAplicacao()) {
    mostrarToast(
      'Não foi possível apagar os dados locais.'
    );
    return;
  }

  agenda = [];

  numeroProtocolo = criarGeradorProtocolo();

  filtro = 'Todos';
  tema = 'claro';
  dataAgenda = hojeLocal();

  $('.dia-agenda').value = dataAgenda;
  $('.filtro-status').value = filtro;
  $('.busca-input').value = '';

  $('.exportacao').hidden = true;

  confirmarLimpeza = false;

  botao.textContent = 'Limpar meus dados';

  aplicarTema();
  atualizarTela();

  mostrarToast(
    'Dados do AgendaPet removidos com sucesso.'
  );
}

// ATALHOS DE TECLADO

function atalhosTeclado(evento) {
  const alvo = evento.target;

  if (
    alvo.closest(
      'input, textarea, select, [contenteditable="true"]'
    )
  ) {
    if (
      evento.key === 'Escape' &&
      alvo === $('.busca-input')
    ) {
      alvo.value = '';
      atualizarTela();
    }

    return;
  }

  if (
    evento.altKey ||
    evento.ctrlKey ||
    evento.metaKey
  ) {
    return;
  }

  if (evento.key.toLowerCase() === 'n') {
    evento.preventDefault();

    $('#novo').scrollIntoView({
      behavior: 'smooth'
    });

    $('#tutor').focus();

  } else if (evento.key === '/') {
    evento.preventDefault();

    $('.busca-input').focus();

  } else if (evento.key === 'Escape') {
    $('.busca-input').value = '';

    atualizarTela();
  }
}

// CARREGAR EXEMPLOS NO PRIMEIRO ACESSO

async function carregarDadosExemploSePrimeiroAcesso() {
  if (carregarAgenda() !== null) {
    return;
  }

  try {
    const resposta = await fetch(
      './data/agenda-exemplo.json'
    );

    if (!resposta.ok) {
      return;
    }

    const exemplos = await resposta.json();

    if (
      Array.isArray(exemplos) &&
      !agenda.length
    ) {
      agenda = exemplos.map(
        item => ({
          ...item,
          data: hojeLocal()
        })
      );

      numeroProtocolo = criarGeradorProtocolo(
        maiorNumeroProtocolo(agenda)
      );

      salvarAgenda(agenda);

      atualizarTela();
    }

  } catch (erro) {
    console.warn(
      'Exemplo não carregado; a agenda pode ser preenchida normalmente.',
      erro.message
    );
  }
}

// REGISTRAR EVENTOS DOS BOTÕES E CAMPOS

function registrarEventos() {
  $('.tentar-servicos').addEventListener(
    'click',
    carregarCatalogo
  );

  $('#servico').addEventListener(
    'change',
    atualizarOpcoesDomicilio
  );

  $('#domiciliar').addEventListener(
    'change',
    atualizarOpcoesDomicilio
  );

  $('#cep').addEventListener(
    'input',
    preencherEnderecoPorCep
  );

  $('#data').addEventListener(
    'change',
    verificarFeriado
  );

  formulario.addEventListener(
    'submit',
    salvarNovoAgendamento
  );

  formulario.addEventListener(
    'input',
    evento => {
      if (
        evento.target.classList.contains('invalido')
      ) {
        limparErros();
      }
    }
  );

  $('.busca-input').addEventListener(
    'input',
    atualizarTela
  );

  $('.filtro-status').addEventListener(
    'change',
    evento => {
      filtro = evento.target.value;

      salvarPreferencia('filtro', filtro);

      atualizarTela();
    }
  );

  $('.dia-agenda').addEventListener(
    'change',
    evento => {
      if (!dataEhValida(evento.target.value)) {
        return;
      }

      dataAgenda = evento.target.value;

      salvarPreferencia('dia', dataAgenda);

      atualizarTela();
    }
  );

  $('.botao-tema').addEventListener(
    'click',
    () => {
      tema = tema === 'claro'
        ? 'escuro'
        : 'claro';

      aplicarTema();

      salvarPreferencia('tema', tema);
    }
  );

  $('.btn-exportar').addEventListener(
    'click',
    exportarAgenda
  );

  $('.btn-copiar').addEventListener(
    'click',
    async () => {
      try {
        await navigator.clipboard.writeText(
          $('.dados-exportados').value
        );

        mostrarToast(
          'JSON copiado para a área de transferência!'
        );

      } catch {
        $('.dados-exportados').select();

        mostrarToast(
          'Selecione o texto e copie com Ctrl+C.'
        );
      }
    }
  );

  $('.btn-download').addEventListener(
    'click',
    baixarAgenda
  );

  $('.pausa-lembretes').addEventListener(
    'click',
    alternarLembretes
  );

  $('.btn-limpar').addEventListener(
    'click',
    limparMeusDados
  );

  document.addEventListener(
    'keydown',
    atalhosTeclado
  );

  window.addEventListener(
    'pagehide',
    () => {
      if (timerRelogio) {
        clearInterval(timerRelogio);
      }
    }
  );
}

// INICIAR O SISTEMA

function iniciar() {
  if (!dataEhValida(dataAgenda)) {
    dataAgenda = hoje;
  }

  if (
    ![
      'Todos',
      'Agendado',
      'Concluído',
      'Cancelado'
    ].includes(filtro)
  ) {
    filtro = 'Todos';
  }

  $('.dia-agenda').value = dataAgenda;
  $('.filtro-status').value = filtro;

  $('#data').min = hoje;
  $('#data').value = hoje;

  aplicarTema();

  registrarEventos();

  atualizarTela();

  carregarDadosExemploSePrimeiroAcesso();

  carregarCatalogo();

  verificarFeriado();

  timerRelogio = setInterval(
    atualizarTela,
    30000
  );
}

iniciar();