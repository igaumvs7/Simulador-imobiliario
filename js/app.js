/* ============================================
   VivasSimula - App Principal (Simulador)
   ============================================ */

let currentTable = 'direta';
let currentTableView = 'obra';

// Configurações das tabelas (valores em %)
const tableConfig = {
  direta: { percAto: 10, percObra: 30, percFin: 60, correcao: 'incc' },
  investidor: { percAto: 10, percObra: 90, percFin: 0, correcao: 'zero' }
};

// Formatação
const fmt = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtD = (n, d) => n.toFixed(d).replace('.', ',');
const parseMoeda = str => {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d]/g, '')) || 0;
};
const parsePerc = str => {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d,\.]/g, '').replace(',', '.')) || 0;
};

function formatarMoeda(input) {
  let v = input.value.replace(/\D/g, '');
  v = (parseInt(v) || 0).toLocaleString('pt-BR');
  input.value = v;
}

// Calcular meses entre datas
function calcularMeses() {
  const dataCompra = document.getElementById('dataCompra').value;
  const dataEntrega = document.getElementById('dataEntrega').value;
  
  if (dataCompra && dataEntrega) {
    const d1 = new Date(dataCompra);
    const d2 = new Date(dataEntrega);
    
    let meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (meses < 1) meses = 1;
    
    document.getElementById('mesesObra').textContent = meses;
  }
  
  calc();
}

// Obter prazo da obra (dos meses calculados)
function getPrazoObra() {
  return parseInt(document.getElementById('mesesObra').textContent) || 36;
}

// Seleção de tabela
function selectTable(table) {
  currentTable = table;
  document.querySelectorAll('.table-tab').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-table="${table}"]`).classList.add('active');
  
  // Carregar valores da tabela
  const config = tableConfig[table];
  document.getElementById('configCorrecao').value = config.correcao;
  
  document.getElementById('tableConfigTitle').textContent = 
    table === 'direta' ? 'Configurar Tabela Direta' : 'Configurar Tabela Investidor';
  
  updateConfigFields();
  calc();
}

// Atualizar campos de configuração
function updateConfigFields() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const config = tableConfig[currentTable];
  
  document.getElementById('valorAtoConfig').value = Math.round(vi * config.percAto / 100).toLocaleString('pt-BR');
  document.getElementById('percAtoConfig').value = config.percAto + '%';
  
  document.getElementById('valorObraConfig').value = Math.round(vi * config.percObra / 100).toLocaleString('pt-BR');
  document.getElementById('percObraConfig').value = config.percObra + '%';
  
  document.getElementById('valorFinConfig').value = Math.round(vi * config.percFin / 100).toLocaleString('pt-BR');
  document.getElementById('percFinConfig').value = config.percFin + '%';
}

// Calcular a partir do valor do Ato (R$)
function calcFromAtoValor() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const valorAto = parseMoeda(document.getElementById('valorAtoConfig').value);
  
  if (vi > 0) {
    const percAto = (valorAto / vi) * 100;
    tableConfig[currentTable].percAto = percAto;
    document.getElementById('percAtoConfig').value = fmtD(percAto, 1) + '%';
    
    recalcFinanciamento();
  }
}

// Calcular a partir do % do Ato
function calcFromAtoPerc() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const percAto = parsePerc(document.getElementById('percAtoConfig').value);
  
  tableConfig[currentTable].percAto = percAto;
  document.getElementById('valorAtoConfig').value = Math.round(vi * percAto / 100).toLocaleString('pt-BR');
  
  recalcFinanciamento();
}

// Calcular a partir do valor da Obra (R$)
function calcFromObraValor() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const valorObra = parseMoeda(document.getElementById('valorObraConfig').value);
  
  if (vi > 0) {
    const percObra = (valorObra / vi) * 100;
    tableConfig[currentTable].percObra = percObra;
    document.getElementById('percObraConfig').value = fmtD(percObra, 1) + '%';
    
    recalcFinanciamento();
  }
}

// Calcular a partir do % da Obra
function calcFromObraPerc() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const percObra = parsePerc(document.getElementById('percObraConfig').value);
  
  tableConfig[currentTable].percObra = percObra;
  document.getElementById('valorObraConfig').value = Math.round(vi * percObra / 100).toLocaleString('pt-BR');
  
  recalcFinanciamento();
}

// Recalcular financiamento (sempre o resto)
function recalcFinanciamento() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const config = tableConfig[currentTable];
  
  const percFin = 100 - config.percAto - config.percObra;
  config.percFin = Math.max(0, percFin);
  
  document.getElementById('valorFinConfig').value = Math.round(vi * config.percFin / 100).toLocaleString('pt-BR');
  document.getElementById('percFinConfig').value = fmtD(config.percFin, 1) + '%';
  
  // Validação
  const warning = document.getElementById('warningBox');
  if (percFin < 0) {
    warning.style.display = 'flex';
    document.getElementById('warningText').textContent = 'Ato + Obra ultrapassam 100%. Ajuste os valores.';
  } else {
    warning.style.display = 'none';
  }
  
  calc();
}

// Aplicar configuração da tabela
function applyTableConfig() {
  tableConfig[currentTable].correcao = document.getElementById('configCorrecao').value;
  calc();
}

// Calcular a partir do valor do imóvel
function calcFromValue() {
  updateConfigFields();
  calc();
}

// Toggle table view
function showTable(view) {
  currentTableView = view;
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  buildTable();
}

// Dados para tabela
let dadosObra = [];
let dadosFin = [];

function calc() {
  const vi = parseMoeda(document.getElementById('valorImovel').value);
  const config = tableConfig[currentTable];
  
  const percAto = config.percAto / 100;
  const percObra = config.percObra / 100;
  const percFin = config.percFin / 100;
  const temINCC = config.correcao === 'incc';
  
  const prazoObra = getPrazoObra();
  const prazoFin = parseInt(document.getElementById('prazoFin').value) || 120;
  const inccAnual = parseFloat(document.getElementById('incc').value) / 100 || 0.06;
  const ipcaAnual = parseFloat(document.getElementById('ipca').value) / 100 || 0.045;
  const taxaMensal = parseFloat(document.getElementById('taxaJuros').value) / 100 || 0.01;
  
  // Valores base
  const valorAto = vi * percAto;
  const valorObraBase = vi * percObra;
  const valorFinBase = vi * percFin;
  
  // Taxas mensais
  const inccMensal = Math.pow(1 + inccAnual, 1/12) - 1;
  const ipcaMensal = Math.pow(1 + ipcaAnual, 1/12) - 1;
  
  // Parcela mensal na obra
  const parcMensalBase = prazoObra > 0 ? valorObraBase / prazoObra : 0;
  
  // Calcular obra
  dadosObra = [];
  let totalObraCorrigido = 0;
  let saldoObraRestante = valorObraBase;
  
  for (let i = 1; i <= prazoObra; i++) {
    const correcao = temINCC ? Math.pow(1 + inccMensal, i) : 1;
    const parcCorrigida = parcMensalBase * correcao;
    saldoObraRestante -= parcMensalBase;
    totalObraCorrigido += parcCorrigida;
    
    dadosObra.push({
      mes: i,
      fase: 'Obra',
      parcBase: parcMensalBase,
      correcao: correcao,
      parcFinal: parcCorrigida,
      saldo: Math.max(0, saldoObraRestante * (temINCC ? Math.pow(1 + inccMensal, i) : 1))
    });
  }
  
  // Saldo para financiar
  let saldoFinanciar = valorFinBase;
  if (temINCC && percFin > 0) {
    saldoFinanciar = valorFinBase * Math.pow(1 + inccMensal, prazoObra);
  }
  
  // Total pago na obra
  const totalObra = valorAto + totalObraCorrigido;
  
  // Calcular financiamento SAC
  dadosFin = [];
  let totalFinSem = 0;
  let primParcela = 0;
  let ultParcela = 0;
  let amortMensal = 0;
  
  if (saldoFinanciar > 0 && prazoFin > 0) {
    amortMensal = saldoFinanciar / prazoFin;
    let saldo = saldoFinanciar;
    
    for (let i = 1; i <= prazoFin; i++) {
      const juros = saldo * taxaMensal;
      const parcela = amortMensal + juros;
      
      if (i === 1) primParcela = parcela;
      if (i === prazoFin) ultParcela = parcela;
      
      totalFinSem += parcela;
      
      dadosFin.push({
        mes: prazoObra + i,
        fase: 'Financiamento',
        parcBase: parcela,
        correcao: Math.pow(1 + ipcaMensal, i - 1),
        parcFinal: parcela * Math.pow(1 + ipcaMensal, i - 1),
        saldo: Math.max(0, saldo - amortMensal)
      });
      
      saldo -= amortMensal;
    }
  }
  
  // Atualizar cliente
  const nomeCliente = document.getElementById('nomeCliente').value;
  document.getElementById('sumCliente').textContent = nomeCliente || '—';
  document.getElementById('printClientName').textContent = nomeCliente || 'Cliente';
  document.getElementById('printDate').textContent = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });
  document.getElementById('printTable').textContent = 
    currentTable === 'direta' ? 'Tabela Direta' : 'Tabela Investidor';
  
  // Atualizar resumo
  document.getElementById('sumValor').textContent = fmt(vi);
  document.getElementById('sumAto').textContent = fmt(valorAto);
  document.getElementById('sumAtoPerc').textContent = fmtD(config.percAto, 1) + '%';
  document.getElementById('sumObra').textContent = fmt(totalObraCorrigido);
  document.getElementById('sumObraPerc').textContent = fmtD(config.percObra, 1) + '% ' + (temINCC ? '+ INCC' : '');
  document.getElementById('sumFin').textContent = fmt(saldoFinanciar);
  document.getElementById('sumFinPerc').textContent = fmtD(config.percFin, 1) + '%' + (temINCC && config.percFin > 0 ? ' + INCC' : '');
  
  // Atualizar fluxo obra
  document.getElementById('flowAto').textContent = fmt(valorAto);
  document.getElementById('flowAtoPerc').textContent = fmtD(config.percAto, 1) + '%';
  document.getElementById('flowObra').textContent = fmt(valorObraBase);
  document.getElementById('flowObraPerc').textContent = fmtD(config.percObra, 1) + '%';
  document.getElementById('flowMensal').textContent = fmt(parcMensalBase);
  document.getElementById('flowMensalDesc').textContent = prazoObra + ' parcelas';
  
  if (temINCC && valorObraBase > 0) {
    document.getElementById('flowObraTitle').textContent = 'Parcelas Mensais';
    document.getElementById('flowObraDesc').textContent = 'Corrigido pelo INCC';
    document.getElementById('flowCorrecaoRow').style.display = 'flex';
    document.getElementById('flowCorrecaoDesc').textContent = 'INCC acumulado';
    document.getElementById('flowObraCorrigido').textContent = fmt(totalObraCorrigido);
    const correcaoPerc = valorObraBase > 0 ? ((totalObraCorrigido / valorObraBase) - 1) * 100 : 0;
    document.getElementById('flowCorrecaoPerc').textContent = '+' + fmtD(correcaoPerc, 1) + '%';
  } else {
    document.getElementById('flowObraTitle').textContent = 'Parcelas Mensais';
    document.getElementById('flowObraDesc').textContent = 'Sem correção';
    document.getElementById('flowCorrecaoRow').style.display = 'none';
  }
  
  // Atualizar financiamento
  if (saldoFinanciar > 0) {
    document.getElementById('finCard').style.display = 'block';
    document.getElementById('finSaldo').textContent = fmt(saldoFinanciar);
    document.getElementById('finSaldoDesc').textContent = temINCC ? 'Corrigido pelo INCC' : 'Valor base';
    document.getElementById('finSaldoPerc').textContent = fmtD(config.percFin, 1) + '%' + (temINCC ? ' + INCC' : '');
    document.getElementById('finAmort').textContent = fmt(amortMensal);
    document.getElementById('finPrim').textContent = fmt(primParcela);
    document.getElementById('finUlt').textContent = fmt(ultParcela);
  } else {
    document.getElementById('finCard').style.display = 'none';
  }
  
  // Totais
  const custoTotal = totalObra + totalFinSem;
  const jurosPagos = totalFinSem - saldoFinanciar;
  
  document.getElementById('totalObra').textContent = fmt(totalObra);
  document.getElementById('totalFin').textContent = fmt(totalFinSem);
  document.getElementById('totalGeral').textContent = fmt(custoTotal);
  document.getElementById('totalJuros').textContent = fmt(Math.max(0, jurosPagos));
  
  // Atualizar tabela
  buildTable();
}

function buildTable() {
  const tbody = document.getElementById('flowTableBody');
  tbody.innerHTML = '';
  
  let dados = [];
  if (currentTableView === 'obra') {
    dados = dadosObra;
  } else if (currentTableView === 'financiamento') {
    dados = dadosFin;
  } else {
    dados = [...dadosObra, ...dadosFin];
  }
  
  let totalParcBase = 0;
  let totalParcFinal = 0;
  
  dados.forEach(d => {
    totalParcBase += d.parcBase;
    totalParcFinal += d.parcFinal;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.mes}</td>
      <td>${d.fase}</td>
      <td>${fmt(d.parcBase)}</td>
      <td>${fmtD((d.correcao - 1) * 100, 2)}%</td>
      <td>${fmt(d.parcFinal)}</td>
      <td>${fmt(d.saldo)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Linha total
  if (dados.length > 0) {
    const trTotal = document.createElement('tr');
    trTotal.className = 'total-row';
    trTotal.innerHTML = `
      <td colspan="2"><strong>TOTAL</strong></td>
      <td><strong>${fmt(totalParcBase)}</strong></td>
      <td>—</td>
      <td><strong>${fmt(totalParcFinal)}</strong></td>
      <td>—</td>
    `;
    tbody.appendChild(trTotal);
  }
}

function limparTudo() {
  document.getElementById('nomeCliente').value = '';
  document.getElementById('valorImovel').value = '800.000';
  document.getElementById('dataCompra').value = '';
  document.getElementById('dataEntrega').value = '';
  document.getElementById('mesesObra').textContent = '36';
  document.getElementById('prazoFin').value = 120;
  document.getElementById('incc').value = 6;
  document.getElementById('ipca').value = 4.5;
  document.getElementById('taxaJuros').value = 1;
  
  // Reset table configs
  tableConfig.direta = { percAto: 10, percObra: 30, percFin: 60, correcao: 'incc' };
  tableConfig.investidor = { percAto: 10, percObra: 90, percFin: 0, correcao: 'zero' };
  
  selectTable('direta');
}

function imprimirRelatorio() {
  const originalView = currentTableView;
  currentTableView = 'completo';
  buildTable();
  window.print();
  currentTableView = originalView;
  buildTable();
}

// ============ INICIALIZAÇÃO ============

(function initApp() {
  // Verificar autenticação — parar se não logado (redirect em andamento)
  if (typeof Auth !== 'undefined') {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return; // Para a execução, evita erros de DOM
    }

    // Preencher nome do usuário logado
    const session = Auth.getSession();
    if (session) {
      const userNameEl = document.getElementById('loggedUserName');
      if (userNameEl) userNameEl.textContent = session.name;
    }
  }

  // Definir data de compra como hoje
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataCompra').value = hoje;

  // Definir data de entrega como 36 meses depois
  const entrega = new Date();
  entrega.setMonth(entrega.getMonth() + 36);
  document.getElementById('dataEntrega').value = entrega.toISOString().split('T')[0];

  calcularMeses();
  updateConfigFields();
  calc();
})();
