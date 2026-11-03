# 🐾 AgendaPet Web

## 1. Sobre o projeto

O AgendaPet Web é um sistema de gerenciamento de
agendamentos desenvolvido para o pet shop fictício
Patinhas & Cia.

O objetivo é facilitar a organização dos atendimentos,
evitar conflitos de horários e permitir que a atendente
acompanhe os serviços realizados durante o dia.

O sistema permite cadastrar agendamentos, consultar
endereços pelo CEP, verificar feriados, atualizar
o status dos atendimentos e calcular o faturamento.

## 2. Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- NPM
- JSON
- Git e GitHub
- LocalStorage
- APIs ViaCEP e BrasilAPI

## 3. Funcionalidades

O sistema possui as seguintes funcionalidades:

- Catálogo com sete serviços.
- Cadastro de novos agendamentos.
- Validação dos dados do formulário.
- Consulta automática de endereço pelo CEP.
- Alerta de feriados.
- Verificação de conflitos de horários.
- Listagem dos agendamentos do dia.
- Busca por nome do tutor ou do pet.
- Filtros por status.
- Conclusão e cancelamento de atendimentos.
- Cálculo do faturamento diário.
- Armazenamento dos dados no navegador.
- Exportação dos agendamentos em JSON.
- Relógio e lembretes de atendimento.
- Layout adaptado para celular, tablet e computador.

## 4. Como executar o projeto

É necessário ter o Node.js e o NPM instalados.

Após baixar ou clonar o repositório, abra a pasta
do projeto no VS Code.

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Abra no navegador:

http://localhost:4173

Para executar o fechamento financeiro:

```bash
npm run fechamento
```

Para validar os dados:

```bash
npm run validar
```

Para testar o arquivo com erros:

```bash
npm run validar -- data/agenda-invalida.json
```

Para executar os testes automatizados opcionais:

```bash
npm test
```

## 5. Regras de negócio

### Horário de funcionamento

O pet shop funciona das 08h às 19h.

O sistema impede a criação de agendamentos
fora desse intervalo.

### Conflito de horários

Não é permitido cadastrar dois agendamentos ativos
para a mesma data e o mesmo horário.

Agendamentos cancelados liberam o horário.

### Valores dos serviços

Cada serviço possui um preço definido
no arquivo servicos.json.

Para atendimentos domiciliares, é acrescentada
uma taxa fixa de R$ 20,00.

### Faturamento

O faturamento do dia considera somente
os atendimentos com status Concluído.

Atendimentos cancelados ou ainda agendados
não entram no faturamento.

### Feriados

O sistema consulta os feriados pela BrasilAPI.

As informações ficam armazenadas por 30 dias
para evitar consultas repetidas.

Quando a data escolhida é feriado, o sistema
solicita confirmação antes de salvar.

Caso a API esteja indisponível, o sistema
informa o problema e permite continuar.

### Endereço

O sistema utiliza a API ViaCEP para preencher
automaticamente o endereço.

Caso a consulta falhe, os campos podem
ser preenchidos manualmente.

## 6. Organização do projeto

A aplicação foi dividida em arquivos com
responsabilidades específicas.

O HTML organiza a estrutura da página.

O CSS define a identidade visual e a responsividade.

O arquivo app.js controla o funcionamento principal.

O arquivo ui.js manipula os elementos da página.

O arquivo api.js realiza as consultas externas.

O arquivo storage.js gerencia o LocalStorage.

A pasta dominio contém as classes, validações
e cálculos utilizados pelo sistema.

A pasta scripts contém os comandos executados
pelo Node.js.

## 7. Conceitos de JavaScript utilizados

Foram utilizados:

- Variáveis const e let.
- Funções e arrow functions.
- Condições e estruturas de repetição.
- Arrays e objetos.
- Métodos filter, map, reduce, find, some e sort.
- Classes e construtores.
- Herança com extends e super.
- Utilização de this.
- Callbacks.
- Closures.
- Promises.
- Async/await.
- Manipulação do DOM.
- Eventos de mouse e teclado.

A palavra const foi utilizada quando a referência
da variável não precisava ser alterada.

Let foi utilizada em variáveis que precisam mudar.

Var foi evitada porque possui escopo de função
e pode tornar o código menos previsível.

## 8. Arquitetura cliente-servidor

O navegador funciona como cliente da aplicação.

O servidor local iniciado pelo Node.js
disponibiliza os arquivos HTML, CSS,
JavaScript e JSON.

O sistema também utiliza serviços externos
para consultar CEP e feriados.

A comunicação é realizada por requisições
HTTP utilizando fetch.

## 9. Gerenciador de pacotes

O NPM foi utilizado para gerenciar as dependências.

A instalação local adiciona a dependência
ao próprio projeto.

Exemplo:

```bash
npm install --save-dev mime-types
```

A instalação global permite disponibilizar
uma ferramenta em diferentes projetos.

Exemplo:

```bash
npm install -g http-server
```

Outros comandos importantes:

```bash
npm ls
npm ls -g --depth=0
npx --help
```

Neste projeto foi utilizada uma dependência
de desenvolvimento local, mime-types,
para auxiliar o servidor HTTP.

## 10. CommonJS e ESM

O projeto utiliza módulos JavaScript
para organizar e compartilhar as funcionalidades.

| Característica | ESM | CommonJS |
|---|---|---|
| Importação | import | require |
| Exportação | export | module.exports |
| Extensão | .js ou .mjs | .cjs |
| Navegador | Suporte nativo | Não possui suporte nativo |
| Configuração | type: module | Sistema tradicional do Node |

O padrão ESM foi escolhido porque permite
reutilizar os módulos no navegador e no Node.js.

O arquivo validar-agenda.cjs utiliza CommonJS
para demonstrar a diferença entre os padrões.

## 11. CSS e responsividade

O layout foi desenvolvido utilizando Flexbox,
variáveis CSS e media queries.

A interface foi planejada para funcionar
em celulares, tablets e computadores.

Foram utilizadas regras para larguras
de 760px e 1120px.

Também foram adicionados estilos de foco
para facilitar a navegação pelo teclado.

### Especificidade

Um exemplo de especificidade aparece
na validação dos campos do formulário.

A regra .campo input define o estilo normal.

Quando existe um erro, a classe .invalido
aplica uma borda vermelha.

A classe de estado permite destacar o erro
sem utilizar !important.

## 12. Depuração

O projeto possui o arquivo .vscode/launch.json,
utilizado para configurar o depurador do VS Code.

A depuração permite acompanhar a execução
dos scripts e verificar os valores das variáveis.

O relatório está disponível em:

docs/bug-report.md

## 13. Planejamento da sprint

O projeto foi organizado em 12 histórias
de usuário, identificadas de US01 a US12.

A meta foi desenvolver um painel funcional
para o gerenciamento dos agendamentos.

O planejamento está disponível em:

planejamento/sprint-planning.md

### Kanban

Link do quadro:
(https://trello.com/invite/b/6aea3e644779f437c1ec0bc5/ATTIedc3d5c0a9432b39d3942be78ad2cf593179CECE/agenda-pet-web)

### Repositório

Link do GitHub:
https://github.com/Jntps/agendapet-web.git

## 14. Retrospectiva

### O que manter

A organização do código em arquivos separados
facilitou o desenvolvimento e a compreensão
das funcionalidades.

## 15. Ferramentas recomendadas

- Visual Studio Code
- Git
- GitHub
- Node.js
- NPM
- Prettier
- ESLint
- Live Server

## 16. Considerações finais

O AgendaPet Web foi desenvolvido com o objetivo
de aplicar os conhecimentos estudados no módulo,
integrando HTML, CSS, JavaScript, APIs,
armazenamento local e Node.js.

O projeto demonstra uma solução para organizar
os atendimentos de um pet shop e facilitar
o acompanhamento dos serviços realizados.