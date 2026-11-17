const PLANOS = [
  { id_plano: 1, nome: "Mensal", valor_mensal: 120.0, duracao_meses: 1 },
  { id_plano: 2, nome: "Trimestral", valor_mensal: 105.0, duracao_meses: 3 },
  { id_plano: 3, nome: "Anual", valor_mensal: 90.0, duracao_meses: 12 }
];

const CHAVE = "xgym_db";
let planoSelecionado = null;

function lerBanco() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    if (dados) return dados;
  } catch (e) { }
  return { alunos: [], matriculas: [], pagamentos: [] };
}

function salvarBanco(db) {
  localStorage.setItem(CHAVE, JSON.stringify(db));
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function somarDias(dataISO, dias) {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function formatarData(iso) {
  if (!iso) return "-";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function formatarMoeda(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function proximoId(lista, campo) {
  return lista.reduce((max, x) => Math.max(max, x[campo]), 0) + 1;
}

function soDigitos(t) {
  return t.replace(/\D/g, "");
}

function cpfValido(cpf) {
  const n = soDigitos(cpf);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(n[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(n[t])) return false;
  }
  return true;
}

function validar(dados, db) {
  const erros = {};
  if (!planoSelecionado) erros.plano = "Escolha um plano.";
  if (dados.nome.trim().length < 3) erros.nome = "Informe o nome completo.";

  if (!cpfValido(dados.cpf)) {
    erros.cpf = "CPF inválido.";
  } else if (db.alunos.some(a => a.cpf === soDigitos(dados.cpf))) {
    erros.cpf = "Já existe um aluno com este CPF."; // CPF único
  }

  if (soDigitos(dados.telefone).length < 10) erros.telefone = "Informe o telefone com DDD.";

  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    erros.email = "E-mail inválido.";
  }

  if (!dados.nascimento) {
    erros.nascimento = "Informe a data de nascimento.";
  } else if (dados.nascimento >= hojeISO()) {
    erros.nascimento = "A data deve ser anterior a hoje.";
  }
  return erros;
}

function alunoTemMatriculaAtiva(db, idAluno) {
  return db.matriculas.some(m => m.id_aluno === idAluno && m.status === "ativa");
}

function inscrever(dados) {
  const db = lerBanco();
  const erros = validar(dados, db);
  if (Object.keys(erros).length) return { erros };

  const plano = PLANOS.find(p => p.id_plano === planoSelecionado);

  const aluno = {
    id_aluno: proximoId(db.alunos, "id_aluno"),
    nome: dados.nome.trim(),
    cpf: soDigitos(dados.cpf),
    telefone: dados.telefone.trim(),
    email: dados.email.trim() || null,
    data_nascimento: dados.nascimento,
    data_cadastro: hojeISO()
  };

  if (alunoTemMatriculaAtiva(db, aluno.id_aluno)) {
    return { erros: { cpf: "Aluno já possui matrícula ativa." } };
  }

  const matricula = {
    id_matricula: proximoId(db.matriculas, "id_matricula"),
    id_aluno: aluno.id_aluno,
    id_plano: plano.id_plano,
    data_inicio: hojeISO(),
    data_fim: null,
    status: "ativa",
    valor_contratado: plano.valor_mensal
  };

  const pagamento = {
    id_pagamento: proximoId(db.pagamentos, "id_pagamento"),
    id_matricula: matricula.id_matricula,
    valor: matricula.valor_contratado,
    data_vencimento: somarDias(hojeISO(), 5),
    data_pagamento: null,
    id_forma: null
  };

  db.alunos.push(aluno);
  db.matriculas.push(matricula);
  db.pagamentos.push(pagamento);
  salvarBanco(db);
  return { aluno, matricula, pagamento, plano };
}

const form = document.getElementById("form-inscricao");
const campos = ["nome", "cpf", "telefone", "email", "nascimento"];

function renderPlanos() {
  const area = document.getElementById("planos");
  area.innerHTML = "";
  PLANOS.forEach(p => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "plano";
    b.setAttribute("aria-pressed", String(p.id_plano === planoSelecionado));
    b.innerHTML = `<strong>${p.nome}</strong>
      <span class="preco">${formatarMoeda(p.valor_mensal)}/mês</span><br>
      <span class="duracao">${p.duracao_meses} ${p.duracao_meses === 1 ? "mês" : "meses"}</span>`;
    b.addEventListener("click", () => {
      planoSelecionado = p.id_plano;
      document.getElementById("erro-plano").textContent = "";
      renderPlanos();
    });
    area.appendChild(b);
  });
}

function limparErros() {
  campos.forEach(c => {
    document.getElementById("erro-" + c).textContent = "";
    document.getElementById(c).classList.remove("invalido");
  });
  document.getElementById("erro-plano").textContent = "";
}

function mostrarErros(erros) {
  Object.entries(erros).forEach(([campo, msg]) => {
    document.getElementById("erro-" + campo).textContent = msg;
    const input = document.getElementById(campo);
    if (input) input.classList.add("invalido");
  });
}

function renderResumo(r) {
  const box = document.getElementById("resultado");
  document.getElementById("resumo").innerHTML = `
    <dl>
      <dt>Aluno</dt><dd>${r.aluno.nome}</dd>
      <dt>Plano</dt><dd>${r.plano.nome}</dd>
      <dt>Matrícula</dt><dd>nº ${r.matricula.id_matricula} (${r.matricula.status})</dd>
      <dt>Valor contratado</dt><dd>${formatarMoeda(r.matricula.valor_contratado)}</dd>
      <dt>1ª mensalidade</dt><dd>vence em ${formatarData(r.pagamento.data_vencimento)}</dd>
    </dl>`;
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("submit", e => {
  e.preventDefault();
  limparErros();
  const dados = {};
  campos.forEach(c => dados[c] = document.getElementById(c).value);

  const r = inscrever(dados);
  if (r.erros) { mostrarErros(r.erros); return; }

  window.location.href = "registros/registros.html?ok=1";
});

document.getElementById("cpf").addEventListener("input", e => {
  const n = soDigitos(e.target.value).slice(0, 11);
  e.target.value = n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
});

renderPlanos();