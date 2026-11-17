const NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// [dia(1=seg..6=sáb), hora, modalidade, instrutor, capacidade, vagas já ocupadas]
const AULAS = [
  [1, "06:30", "Spinning", "Carla", 15, 13], [1, "18:30", "Funcional", "Rafael", 20, 9], [1, "19:30", "Yoga", "Marina", 12, 12],
  [2, "07:00", "Funcional", "Rafael", 20, 6], [2, "18:00", "Spinning", "Carla", 15, 4], [2, "19:30", "Pilates", "Marina", 10, 7],
  [3, "06:30", "Yoga", "Marina", 12, 3], [3, "18:30", "Spinning", "Carla", 15, 10], [3, "19:30", "Funcional", "Rafael", 20, 11],
  [4, "07:00", "Pilates", "Marina", 10, 2], [4, "18:30", "Funcional", "Rafael", 20, 14], [4, "19:30", "Spinning", "Carla", 15, 8],
  [5, "06:30", "Spinning", "Carla", 15, 5], [5, "18:00", "Yoga", "Marina", 12, 6],
  [6, "09:00", "Funcional", "Rafael", 20, 10], [6, "10:15", "Yoga", "Marina", 12, 4]
].map((a, i) => ({ id: i, dia: a[0], hora: a[1], nome: a[2], instrutor: a[3], cap: a[4], base: a[5] }));

const $ = id => document.getElementById(id);
const CH = "xgym_inscricoes";
let inscr = {};           // { aulaId: [cpf, ...] }
let diaSel = 1;
try { inscr = JSON.parse(localStorage.getItem(CH)) || {}; } catch (e) { inscr = {}; }
const salvar = () => { try { localStorage.setItem(CH, JSON.stringify(inscr)); } catch (e) { aviso("Não foi possível salvar neste navegador."); } };

function aviso(t) { const a = $("aviso"); a.textContent = t; a.classList.add("on"); clearTimeout(aviso.t); aviso.t = setTimeout(() => a.classList.remove("on"), 2600); }
const so = s => String(s).replace(/\D/g, "");
function cpfValido(c) {
  c = so(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let s = 0; for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +c[t]) return false;
  }
  return true;
}
function mascara(v) {
  v = so(v).slice(0, 11);
  return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
const ocupadas = a => a.base + (inscr[a.id] || []).length;
const cpfAtual = () => so($("cpf").value);
const estouIn = a => cpfValido(cpfAtual()) && (inscr[a.id] || []).includes(cpfAtual());

function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

function desenharDias() {
  const box = $("dias"); box.textContent = "";
  for (let d = 1; d <= 6; d++) {
    const b = el("button", "dia sec"); b.type = "button"; b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(d === diaSel));
    b.append(NOMES[d].slice(0, 3));
    const n = AULAS.filter(a => a.dia === d).length;
    b.append(el("small", null, n + " aulas"));
    b.onclick = () => { diaSel = d; desenhar(); };
    box.appendChild(b);
  }
}
function desenharLista() {
  const lista = $("lista"); lista.textContent = "";
  const f = $("filtro").value;
  const itens = AULAS.filter(a => a.dia === diaSel && (!f || a.nome === f));
  if (!itens.length) { lista.appendChild(el("p", "vazio", "Nenhuma aula de " + (f || "qualquer modalidade") + " neste dia. Escolha outro dia ou modalidade.")); return; }
  itens.forEach(a => {
    const oc = ocupadas(a), livres = a.cap - oc, inscrito = estouIn(a);
    const card = el("article", "aula");
    card.appendChild(el("div", "hora", a.hora));
    const info = el("div");
    info.appendChild(el("div", "nome", a.nome));
    info.appendChild(el("div", "meta", "Instrutor(a) " + a.instrutor + " · 50 min"));
    const barra = el("div", "barra"), i = el("i", livres <= 0 ? "cheia" : ""); i.style.width = Math.min(100, oc / a.cap * 100) + "%"; barra.appendChild(i);
    info.appendChild(barra);
    info.appendChild(el("div", "vagas", livres <= 0 ? "Turma cheia" : livres + (livres === 1 ? " vaga restante" : " vagas restantes")));
    card.appendChild(info);
    const b = el("button");
    b.type = "button";
    if (inscrito) { b.className = "cancela"; b.textContent = "Cancelar inscrição"; b.onclick = () => cancelar(a); }
    else if (livres <= 0) { b.textContent = "Turma cheia"; b.disabled = true; }
    else { b.textContent = "Inscrever-se"; b.onclick = () => inscrever(a); }
    card.appendChild(b);
    lista.appendChild(card);
  });
}
function desenharMinhas() {
  const box = $("minhas"); box.textContent = "";
  if (!cpfValido(cpfAtual())) { box.appendChild(el("p", "vazio", "Informe seu CPF para ver as aulas em que você está inscrito.")); return; }
  const minhas = AULAS.filter(a => (inscr[a.id] || []).includes(cpfAtual())).sort((x, y) => x.dia - y.dia || x.hora.localeCompare(y.hora));
  if (!minhas.length) { box.appendChild(el("p", "vazio", "Você ainda não se inscreveu em nenhuma aula.")); return; }
  minhas.forEach(a => {
    const l = el("div", "minha");
    l.appendChild(el("span", null, NOMES[a.dia].slice(0, 3) + " " + a.hora));
    l.appendChild(el("strong", null, a.nome));
    box.appendChild(l);
  });
}
function desenhar() { desenharDias(); desenharLista(); desenharMinhas(); }

function exigeCpf() {
  const ok = cpfValido(cpfAtual());
  $("erro").textContent = ok ? "" : "Informe um CPF válido para se inscrever.";
  if (!ok) $("cpf").focus();
  return ok;
}
function inscrever(a) {
  if (!exigeCpf()) return;
  const cpf = cpfAtual();
  const conflito = AULAS.find(x => x.id !== a.id && x.dia === a.dia && x.hora === a.hora && (inscr[x.id] || []).includes(cpf));
  if (conflito) { aviso("Você já tem " + conflito.nome + " nesse mesmo horário."); return; }
  if (ocupadas(a) >= a.cap) { aviso("Essa turma acabou de ficar cheia."); desenhar(); return; }
  (inscr[a.id] = inscr[a.id] || []).push(cpf);
  salvar(); desenhar(); aviso("Inscrição confirmada: " + a.nome + ", " + NOMES[a.dia].toLowerCase() + " às " + a.hora + ".");
}
function cancelar(a) {
  const cpf = cpfAtual();
  inscr[a.id] = (inscr[a.id] || []).filter(c => c !== cpf);
  salvar(); desenhar(); aviso("Inscrição cancelada.");
}

$("cpf").addEventListener("input", e => {
  e.target.value = mascara(e.target.value);
  $("erro").textContent = "";
  try { localStorage.setItem("xgym_cpf", e.target.value); } catch (_) { }
  desenharLista(); desenharMinhas();
});
$("filtro").addEventListener("change", desenharLista);
[...new Set(AULAS.map(a => a.nome))].sort().forEach(n => { const o = el("option", null, n); o.value = n; $("filtro").appendChild(o); });
try { $("cpf").value = localStorage.getItem("xgym_cpf") || ""; } catch (_) { }
const hoje = new Date().getDay(); diaSel = hoje >= 1 && hoje <= 6 ? hoje : 1;
desenhar();
