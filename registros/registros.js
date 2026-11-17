const PLANOS = { 1: "Mensal", 2: "Trimestral", 3: "Anual" };
const fmtData = iso => iso ? iso.split("-").reverse().join("/") : "-";
const fmtMoeda = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCpf = c => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
const esc = t => String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function ler() {
  try { return JSON.parse(localStorage.getItem("xgym_db")) || { alunos: [], matriculas: [], pagamentos: [] }; }
  catch (e) { return { alunos: [], matriculas: [], pagamentos: [] }; }
}

function render() {
  const db = ler();
  const tbody = document.getElementById("linhas");
  tbody.innerHTML = db.matriculas.map(m => {
    const a = db.alunos.find(x => x.id_aluno === m.id_aluno) || {};
    const p = db.pagamentos.find(x => x.id_matricula === m.id_matricula) || {};
    return `<tr>
      <td>${m.id_matricula}</td><td>${esc(a.nome || "-")}</td><td>${fmtCpf(a.cpf || "")}</td>
      <td>${esc(a.telefone || "-")}</td><td>${PLANOS[m.id_plano] || "-"}</td>
      <td>${fmtMoeda(m.valor_contratado)}</td><td>${fmtData(m.data_inicio)}</td>
      <td>${fmtData(p.data_vencimento)}</td><td>${m.status}</td>
      <td><button type="button" class="btn-excluir" data-aluno="${m.id_aluno}">Apagar</button></td></tr>`;
  }).join("");
  document.getElementById("vazio").hidden = db.matriculas.length > 0;
}

function apagarAluno(idAluno) {
  const db = ler();
  const idsMat = db.matriculas.filter(m => m.id_aluno === idAluno).map(m => m.id_matricula);
  db.alunos = db.alunos.filter(a => a.id_aluno !== idAluno);
  db.matriculas = db.matriculas.filter(m => m.id_aluno !== idAluno);
  db.pagamentos = db.pagamentos.filter(p => !idsMat.includes(p.id_matricula));
  localStorage.setItem("xgym_db", JSON.stringify(db));
}

if (new URLSearchParams(location.search).get("ok")) {
  document.getElementById("sucesso").hidden = false;
}

document.getElementById("linhas").addEventListener("click", e => {
  const btn = e.target.closest(".btn-excluir");
  if (!btn) return;
  if (confirm("Apagar esta inscrição?")) {
    apagarAluno(Number(btn.dataset.aluno));
    render();
  }
});

document.getElementById("limpar").addEventListener("click", () => {
  if (confirm("Apagar todos os registros?")) { localStorage.removeItem("xgym_db"); render(); }
});

render();