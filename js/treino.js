const EX = {
  "Peito": ["Supino reto", "Supino inclinado", "Crucifixo", "Flexão de braço"],
  "Costas": ["Puxada frontal", "Remada curvada", "Remada baixa", "Barra fixa"],
  "Pernas": ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Panturrilha em pé"],
  "Ombros": ["Desenvolvimento", "Elevação lateral", "Elevação frontal"],
  "Braços": ["Rosca direta", "Rosca martelo", "Tríceps pulley", "Tríceps testa"],
  "Abdômen": ["Abdominal supra", "Abdominal infra", "Prancha"],
  "Cardio": ["Esteira", "Bicicleta ergométrica", "Elíptico"]
};
const DIAS = ["A", "B", "C"];
const CH = "xgym_fichas";
const $ = id => document.getElementById(id);
const so = s => String(s).replace(/\D/g, "");
let fichas = [], itens = [], editando = null, grupo = "";
try { fichas = JSON.parse(localStorage.getItem(CH)) || []; } catch (e) { fichas = []; }

function gravar() { try { localStorage.setItem(CH, JSON.stringify(fichas)); } catch (e) { aviso("Não foi possível salvar neste navegador."); } }
function aviso(t) { const a = $("aviso"); a.textContent = t; a.classList.add("on"); clearTimeout(aviso.t); aviso.t = setTimeout(() => a.classList.remove("on"), 2400); }
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function btn(txt, fn, cls) { const b = el("button", cls || "sec mini", txt); b.type = "button"; b.onclick = fn; return b; }
function cpfValido(c) {
  c = so(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) { let s = 0; for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +c[t]) return false; }
  return true;
}
const mascara = v => so(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

/* ---------- biblioteca ---------- */
function desenharChips() {
  const box = $("chips"); box.textContent = "";
  ["", ...Object.keys(EX)].forEach(g => {
    const c = el("button", "chip", g || "Todos"); c.type = "button";
    c.setAttribute("aria-pressed", String(g === grupo));
    c.onclick = () => { grupo = g; desenharChips(); desenharBiblio(); };
    box.appendChild(c);
  });
}
function desenharBiblio() {
  const box = $("biblio"); box.textContent = "";
  const q = $("busca").value.trim().toLowerCase();
  let n = 0;
  Object.entries(EX).forEach(([g, lista]) => {
    if (grupo && grupo !== g) return;
    lista.filter(x => x.toLowerCase().includes(q)).forEach(nome => {
      n++;
      const l = el("div", "ex"), t = el("div");
      t.append(el("div", null, nome), el("small", null, g));
      l.append(t, btn("Adicionar", () => adicionar(nome, g)));
      box.appendChild(l);
    });
  });
  if (!n) box.appendChild(el("p", "vazio", "Nenhum exercício encontrado."));
}

/* ---------- ficha em montagem ---------- */
function adicionar(nome, g) {
  itens.push({ ex: nome, grupo: g, series: 3, reps: 12, carga: 0, dia: "A" });
  desenharItens(); aviso(nome + " adicionado à ficha.");
}
function campo(rotulo, tipo, valor, set, extra) {
  const w = el("div"), l = el("label", null, rotulo), i = el(tipo === "select" ? "select" : "input");
  if (tipo === "select") { DIAS.forEach(d => { const o = el("option", null, "Treino " + d); o.value = d; i.appendChild(o); }); }
  else { i.type = "number"; i.min = extra.min; i.max = extra.max; i.step = extra.step || 1; }
  i.value = valor; i.addEventListener("input", () => set(i.value));
  l.appendChild(i); w.appendChild(l); return w;
}
function desenharItens() {
  const box = $("itens"); box.textContent = "";
  if (!itens.length) { box.appendChild(el("p", "vazio", "Nenhum exercício ainda. Use o botão Adicionar na lista ao lado.")); }
  itens.forEach((it, idx) => {
    const c = el("div", "item"), topo = el("div", "item-topo"), t = el("div");
    t.append(el("strong", null, it.ex), el("div", "meta", it.grupo));
    const ac = el("div", "acoes");
    ac.append(
      btn("↑", () => mover(idx, -1)), btn("↓", () => mover(idx, 1)),
      btn("Remover", () => { itens.splice(idx, 1); desenharItens(); }, "perigo mini")
    );
    ac.firstChild.setAttribute("aria-label", "Subir exercício"); ac.children[1].setAttribute("aria-label", "Descer exercício");
    topo.append(t, ac);
    const cp = el("div", "campos");
    cp.append(
      campo("Dia", "select", it.dia, v => it.dia = v),
      campo("Séries", "num", it.series, v => it.series = v, { min: 1, max: 10 }),
      campo("Repetições", "num", it.reps, v => it.reps = v, { min: 1, max: 50 }),
      campo("Carga (kg)", "num", it.carga, v => it.carga = v, { min: 0, max: 500, step: 0.5 })
    );
    cp.querySelector("select").value = it.dia;
    c.append(topo, cp); box.appendChild(c);
  });
  $("resumo").textContent = itens.length ? itens.length + (itens.length === 1 ? " exercício" : " exercícios") + " na ficha" : "";
}
function mover(i, d) {
  const j = i + d; if (j < 0 || j >= itens.length) return;
  [itens[i], itens[j]] = [itens[j], itens[i]]; desenharItens();
}
function limpar() {
  editando = null; itens = []; $("aluno").value = ""; $("cpf").value = ""; $("objetivo").selectedIndex = 0;
  $("erro").textContent = ""; $("salvar").textContent = "Salvar ficha"; desenharItens();
}

/* ---------- salvar ---------- */
function salvar() {
  const nome = $("aluno").value.trim(), cpf = so($("cpf").value);
  let erro = "";
  if (nome.length < 3) erro = "Informe o nome do aluno (mínimo de 3 letras).";
  else if (!cpfValido(cpf)) erro = "Informe um CPF válido para o aluno.";
  else if (!itens.length) erro = "Adicione pelo menos um exercício à ficha.";
  else {
    const ruim = itens.find(i => !(+i.series >= 1 && +i.series <= 10) || !(+i.reps >= 1 && +i.reps <= 50) || !(+i.carga >= 0 && +i.carga <= 500));
    if (ruim) erro = "Confira séries (1 a 10), repetições (1 a 50) e carga (0 a 500 kg) de " + ruim.ex + ".";
  }
  $("erro").textContent = erro; if (erro) return;

  const existente = fichas.find(f => f.cpf === cpf && f.id !== editando);
  if (existente && !confirm("Já existe uma ficha para este CPF. Deseja substituir?")) return;
  if (existente) fichas = fichas.filter(f => f !== existente);

  const dados = {
    nome, cpf, objetivo: $("objetivo").value, atualizada: new Date().toISOString(),
    itens: itens.map(i => ({ ex: i.ex, grupo: i.grupo, dia: i.dia, series: +i.series, reps: +i.reps, carga: +i.carga }))
  };
  if (editando) { Object.assign(fichas.find(f => f.id === editando), dados); }
  else fichas.push({ id: Date.now(), ...dados });
  gravar(); limpar(); desenharSalvas(); aviso("Ficha de " + nome + " salva.");
}

/* ---------- fichas salvas ---------- */
function desenharSalvas() {
  const box = $("salvas"); box.textContent = "";
  if (!fichas.length) { box.appendChild(el("p", "vazio", "Nenhuma ficha salva ainda.")); return; }
  fichas.slice().sort((a, b) => a.nome.localeCompare(b.nome)).forEach(f => {
    const c = el("article", "salva"), topo = el("div", "salva-topo"), t = el("div");
    t.append(el("h3", null, f.nome),
      el("div", "meta", "CPF " + mascara(f.cpf) + " · Objetivo: " + f.objetivo + " · Atualizada em " + new Date(f.atualizada).toLocaleDateString("pt-BR")));
    const ac = el("div", "acoes");
    ac.append(btn("Editar", () => editar(f.id)), btn("Excluir", () => excluir(f.id), "perigo mini"));
    topo.append(t, ac); c.appendChild(topo);
    DIAS.forEach(d => {
      const lista = f.itens.filter(i => i.dia === d); if (!lista.length) return;
      c.appendChild(el("h4", null, "Treino " + d));
      const ul = el("ul");
      lista.forEach(i => ul.appendChild(el("li", null, i.ex + " – " + i.series + "x" + i.reps + (i.carga ? " – " + i.carga + " kg" : ""))));
      c.appendChild(ul);
    });
    box.appendChild(c);
  });
}
function editar(id) {
  const f = fichas.find(x => x.id === id); editando = id;
  $("aluno").value = f.nome; $("cpf").value = mascara(f.cpf); $("objetivo").value = f.objetivo;
  itens = f.itens.map(i => ({ ...i })); $("salvar").textContent = "Salvar alterações";
  desenharItens(); $("erro").textContent = ""; $("aluno").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function excluir(id) {
  const f = fichas.find(x => x.id === id);
  if (!confirm("Excluir a ficha de " + f.nome + "?")) return;
  fichas = fichas.filter(x => x.id !== id); gravar();
  if (editando === id) limpar();
  desenharSalvas(); aviso("Ficha excluída.");
}

$("busca").addEventListener("input", desenharBiblio);
$("cpf").addEventListener("input", e => { e.target.value = mascara(e.target.value); });
$("salvar").onclick = salvar;
$("limpar").onclick = limpar;
desenharChips(); desenharBiblio(); desenharItens(); desenharSalvas();
