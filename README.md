# XGYM integrado — US01, US02 e US03

Projeto em HTML, CSS e JavaScript puro (sem Angular).

## Como executar
1. Extraia a pasta `XGYM-integrado`.
2. Abra `index.html` em um navegador (ou use a extensão Live Server no VS Code).
3. Use a navegação superior para acessar US01, US02 e US03.

## Organização
- `index.html`: US01 — inscrição online.
- `aulas.html`: US02 — grade e inscrição em aulas coletivas.
- `treino.html`: US03 — prescrição e vínculo da ficha de treino ao aluno.
- `registros/`: consulta das inscrições feitas na US01.
- `css/`: estilos separados por página e estilo compartilhado.
- `js/`: scripts separados por funcionalidade.
- `img/`: logo do projeto.

## Persistência
As telas usam `localStorage` do navegador para demonstração. Os dados não são enviados para um servidor ou PostgreSQL. Para uso real com vários usuários, será necessário integrar um backend/API.

## Observação sobre US02
A grade de aulas e instrutores está cadastrada como dados de demonstração no arquivo `js/aulas.js`.
