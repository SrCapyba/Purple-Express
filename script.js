const ingredientesDisponiveis = {
    massas: ['chocolate', 'baunilha'],
    recheios: ['morango', 'coco'],
    coberturas: ['chocolate-glaze', 'chantilly'],
    toppings: ['granulado', 'cereja'],
    doces: ['brigadeiro', 'beijinho', 'lolita', 'surpresa-uva', 'bem-casado', 'bombom-morango', 'copinho-choco', 'macaron']
};

// Estados do Jogo
let filaPedidos = []; 
let pedidoAtivo = null; 
let boloAtual = []; 
let docesAtuais = []; 
let sobremesasAtuais = { esquerda: null, direita: null }; 
let historicoAcoes = []; 
let pontuacao = 0;
let proximoIdPedido = 1;
let jogoIniciado = false; // Bloqueia loops até o usuário interagir com a tela inicial

// Estado da Interface do Cliente (Carrinho)
let carrinhoCliente = {
    baseBolo: null,
    doces: [],
    sobremesa: null
};

window.onload = function() {
    // Não executa nada automaticamente para poupar o tempo de vida dos timers dos NPCs
};

// --- CONTROLE DE ROTAS E ENTRADA ---
function entrarInicialmente(moduloAlvo) {
    document.getElementById('tela-boas-vindas').classList.add('escondido');
    jogoIniciado = true;

    // Dispara a geração de NPCs em plano de fundo
    adicionarPedidoFila();
    
    // LOOP 1: NPCs criam pedidos dinâmicos
    setInterval(function() {
        if (filaPedidos.length < 5) { 
            adicionarPedidoFila();
        }
    }, Math.floor(Math.random() * 5000) + 14000); 

    // LOOP 2: Consumo de tempo a cada 1 segundo
    setInterval(atualizarTimers, 1000);

    // Envia o jogador para o módulo correspondente escolhido na rota inicial
    if (moduloAlvo === 'confeitaria') {
        document.getElementById('modulo-confeitaria').classList.remove('escondido');
    } else {
        document.getElementById('modulo-cliente').classList.remove('escondido');
        renderizarCarrinhoCliente();
    }
}

function alternarInterface(moduloDestino) {
    const Confeitaria = document.getElementById('modulo-confeitaria');
    const Cliente = document.getElementById('modulo-cliente');

    if (moduloDestino === 'confeitaria') {
        Cliente.add ? Cliente.classList.add('escondido') : Cliente.classList.add('escondido');
        Confeitaria.classList.remove('escondido');
    } else {
        Confeitaria.classList.add('escondido');
        Cliente.classList.remove('escondido');
        renderizarCarrinhoCliente();
    }
}

// --- INTERFACE DO CLIENTE (CARRINHO & MENU) ---
function selecionarBaseCliente(saborMassa) {
    carrinhoCliente.baseBolo = saborMassa;
    renderizarCarrinhoCliente();
}

function adicionarDoceCliente(tipoDoce) {
    if (carrinhoCliente.doces.length >= 4) {
        return alert("Você pode escolher no máximo 4 docinhos adicionais!");
    }
    carrinhoCliente.doces.push(tipoDoce);
    renderizarCarrinhoCliente();
}

function selecionarSobremesaCliente(tipo, sabor) {
    carrinhoCliente.sobremesa = { tipo: tipo, sabor: sabor };
    renderizarCarrinhoCliente();
}

function limparCarrinhoCliente() {
    carrinhoCliente = { baseBolo: null, doces: [], sobremesa: null };
    renderizarCarrinhoCliente();
}

function renderizarCarrinhoCliente() {
    const container = document.getElementById('carrinho-conteudo');
    if(!container) return;
    container.innerHTML = '';

    if (!carrinhoCliente.baseBolo && carrinhoCliente.doces.length === 0 && !carrinhoCliente.sobremesa) {
        container.innerHTML = '<p class="carrinho-vazio">Monte sua combinação ao lado para começar!</p>';
        return;
    }

    if (carrinhoCliente.baseBolo) {
        const item = document.createElement('div');
        item.className = 'item-carrinho-linha';
        item.innerHTML = `<span>🎂 Bolo Base de <strong>${carrinhoCliente.baseBolo}</strong></span>`;
        container.appendChild(item);
    }

    if (carrinhoCliente.doces.length > 0) {
        const contagem = {};
        carrinhoCliente.doces.forEach(d => contagem[d] = (contagem[d] || 0) + 1);
        
        for (const [doce, qtd] of Object.entries(contagem)) {
            const item = document.createElement('div');
            item.className = 'item-carrinho-linha';
            item.innerHTML = `<span>🍬 ${qtd}x Doce: ${doce}</span>`;
            container.appendChild(item);
        }
    }

    if (carrinhoCliente.sobremesa) {
        const item = document.createElement('div');
        item.className = 'item-carrinho-linha';
        item.innerHTML = `<span>🍦 ${carrinhoCliente.sobremesa.tipo.toUpperCase()} (${carrinhoCliente.sobremesa.sabor})</span>`;
        container.appendChild(item);
    }
}

function finalizarPedidoCliente() {
    if (!carrinhoCliente.baseBolo) {
        return alert("Por favor, selecione pelo menos a base do bolo para fazer um pedido!");
    }

    const saborMassa = carrinhoCliente.baseBolo;
    const saborCobertura = saborMassa === 'chocolate' ? 'chocolate-glaze' : 'chantilly';
    const saborRecheio = saborMassa === 'chocolate' ? 'morango' : 'coco';
    const toppingSabor = saborMassa === 'chocolate' ? 'granulado' : 'cereja';

    const camadasMontadas = [
        { tipo: 'massa', ingrediente: saborMassa },
        { tipo: 'recheio', ingrediente: saborRecheio },
        { tipo: 'massa', ingrediente: saborMassa },
        { tipo: 'cobertura', ingrediente: saborCobertura },
        { tipo: 'topping', ingrediente: toppingSabor }
    ];

    const tempoMaximo = 100; 
    const novoPedidoCustom = {
        id: proximoIdPedido++,
        camadas: camadasMontadas,
        doces: [...carrinhoCliente.doces],
        sobremesa: carrinhoCliente.sobremesa ? { ...carrinhoCliente.sobremesa } : null,
        tempoRestante: tempoMaximo,
        tempoTotal: tempoMaximo
    };

    filaPedidos.push(novoPedidoCustom);
    
    if (!pedidoAtivo) {
        selecionarPedidoAtivo(novoPedidoCustom.id);
    }

    alert(`🚀 Seu pedido #${novoPedidoCustom.id} foi enviado com sucesso para a cozinha!`);
    limparCarrinhoCliente();
    alternarInterface('confeitaria'); 
}

// --- MECÂNICAS COZINHA (NPCs E PREPARO) ---
function criarReceitaAleatoria() {
    const camadas = [];
    const qtdMassas = Math.floor(Math.random() * 2) + 2; 
    
    const massaSorteada = ingredientesDisponiveis.massas[Math.floor(Math.random() * ingredientesDisponiveis.massas.length)];
    const recheioSorteado = ingredientesDisponiveis.recheios[Math.floor(Math.random() * ingredientesDisponiveis.recheios.length)];
    const coberturaSorteada = ingredientesDisponiveis.coberturas[Math.floor(Math.random() * ingredientesDisponiveis.coberturas.length)];
    const toppingSorteado = ingredientesDisponiveis.toppings[Math.floor(Math.random() * ingredientesDisponiveis.toppings.length)];

    for (let i = 0; i < qtdMassas; i++) {
        camadas.push({ tipo: 'massa', ingrediente: massaSorteada });
        if (i < qtdMassas - 1) {
            camadas.push({ tipo: 'recheio', ingrediente: recheioSorteado });
        }
    }
    camadas.push({ tipo: 'cobertura', ingrediente: coberturaSorteada });
    if (Math.random() > 0.4) {
        camadas.push({ tipo: 'topping', ingrediente: toppingSorteado });
    }

    const docesExigidos = [];
    if (Math.random() > 0.4) {
        const qtdDoces = Math.floor(Math.random() * 4) + 1; 
        for (let d = 0; d < qtdDoces; d++) {
            const doceSorteado = ingredientesDisponiveis.doces[Math.floor(Math.random() * ingredientesDisponiveis.doces.length)];
            docesExigidos.push(doceSorteado);
        }
    }

    let sobremesaExigida = null;
    if (Math.random() > 0.5) {
        const tiposSobremesa = ['milkshake', 'sorvete', 'casquinha'];
        const saboresSobremesa = ['baunilha', 'morango', 'chocolate'];
        sobremesaExigida = {
            tipo: tiposSobremesa[Math.floor(Math.random() * tiposSobremesa.length)],
            sabor: saboresSobremesa[Math.floor(Math.random() * saboresSobremesa.length)]
        };
    }

    return { camadas: camadas, doces: docesExigidos, sobremesa: sobremesaExigida };
}

function adicionarPedidoFila() {
    const tempoMaximo = Math.floor(Math.random() * 20) + 80; 
    const receitaSorteada = criarReceitaAleatoria();
    
    const novoPedido = {
        id: proximoIdPedido++,
        camadas: receitaSorteada.camadas,
        doces: receitaSorteada.doces,
        sobremesa: receitaSorteada.sobremesa,
        tempoRestante: tempoMaximo,
        tempoTotal: tempoMaximo
    };
    filaPedidos.push(novoPedido);
    if (!pedidoAtivo) {
        selecionarPedidoAtivo(novoPedido.id);
    }
    renderizarFila();
}

function renderizarFila() {
    const container = document.getElementById('fila-pedidos');
    if(!container) return;
    container.innerHTML = '';
    filaPedidos.forEach(pedido => {
        if (pedidoAtivo && pedido.id === pedidoAtivo.id) return;
        const porcentagemTempo = (pedido.tempoRestante / pedido.tempoTotal) * 100;
        let corBarra = '#4caf50';
        if (porcentagemTempo < 50) corBarra = '#ff9800';
        if (porcentagemTempo < 25) corBarra = '#f44336';

        const card = document.createElement('div');
        card.className = 'card-pedido-fila';
        card.setAttribute('onclick', `selecionarPedidoAtivo(${pedido.id})`);
        card.innerHTML = `
            <strong>Pedido #${pedido.id}</strong> (${pedido.tempoRestante}s)
            <div class="barra-tempo-container">
                <div class="barra-tempo" style="width: ${porcentagemTempo}%; background-color: ${corBarra}"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function selecionarPedidoAtivo(id) {
    const pedidoEncontrado = filaPedidos.find(p => p.id === id);
    if (pedidoEncontrado) {
        pedidoAtivo = pedidoEncontrado;
        limparBolo(); 
        exibirPedidoAtivoNaTela();
        renderizarFila();
    }
}

function exibirPedidoAtivoNaTela() {
    const container = document.getElementById('bilhete-pedido');
    if(!container) return;
    if (!pedidoAtivo) {
        container.innerHTML = '<div>Nenhum pedido ativo. Selecione um na fila abaixo!</div>';
        return;
    }
    
    let htmlConteudo = `<div class="bilhete-scroller"><strong>Pedido #${pedidoAtivo.id}</strong>`;
    htmlConteudo += `<div class="secao-bilhete">📋 CAMADAS DO BOLO:</div><ul>`;
    pedidoAtivo.camadas.forEach(camada => {
        htmlConteudo += `<li>${camada.tipo.toUpperCase()}: ${camada.ingrediente}</li>`;
    });
    htmlConteudo += '</ul>';

    htmlConteudo += `<div class="secao-bilhete">🍬 ADICIONAIS:</div>`;
    if (pedidoAtivo.doces && pedidoAtivo.doces.length > 0) {
        htmlConteudo += `<ul>`;
        const contagemDoces = {};
        pedidoAtivo.doces.forEach(d => contagemDoces[d] = (contagemDoces[d] || 0) + 1);
        for (const [doce, qtd] of Object.entries(contagemDoces)) {
            htmlConteudo += `<li>${qtd}x Doce: ${doce}</li>`;
        }
        htmlConteudo += `</ul>`;
    } else {
        htmlConteudo += `<p class="item-nenhum">Nenhum docinho opcional</p>`;
    }

    htmlConteudo += `<div class="secao-bilhete">🍦 SOBRE_MESA:</div>`;
    if (pedidoAtivo.sobremesa) {
        htmlConteudo += `<ul><li>${pedidoAtivo.sobremesa.tipo.toUpperCase()} sabor ${pedidoAtivo.sobremesa.sabor}</li></ul>`;
    } else {
        htmlConteudo += `<p class="item-nenhum">Nenhuma sobremesa gelada</p>`;
    }
    htmlConteudo += `</div>`; 
    
    const esgotando = pedidoAtivo.tempoRestante <= 20 ? 'urgente' : '';
    htmlConteudo += `<div class="timer-ativo ${esgotando}">⏱️ Tempo: ${pedidoAtivo.tempoRestante}s</div>`;
    container.innerHTML = htmlConteudo;
}

function atualizarTimers() {
    if (!jogoIniciado) return; 
    
    filaPedidos.forEach((pedido, index) => {
        pedido.tempoRestante--;
        if (pedido.tempoRestante <= 0) {
            if (pedidoAtivo && pedidoAtivo.id === pedido.id) {
                pedidoAtivo = null;
                limparBolo();
            }
            filaPedidos.splice(index, 1);
            pontuacao = Math.max(0, pontuacao - 5);
            const pts = document.getElementById('points-player');
            if(pts) pts.innerText = pontuacao;
            if (!pedidoAtivo && filaPedidos.length > 0) {
                selecionarPedidoAtivo(filaPedidos[0].id);
            }
        }
    });
    renderizarFila();
    if (pedidoAtivo) exibirPedidoAtivoNaTela();
}

function adicionarCamada(tipo, ingrediente) {
    if (!pedidoAtivo) return alert("Escolha um pedido ativo antes!");

    const ultimoItem = boloAtual[boloAtual.length - 1];
    const totalMassas = boloAtual.filter(c => c.tipo === 'massa').length;
    const totalRecheios = boloAtual.filter(c => c.tipo === 'recheio').length;

    if (tipo === 'massa' && totalMassas >= 3) return alert("Erro: Máximo de 3 massas!");
    if (tipo === 'recheio' && totalRecheios >= 2) return alert("Erro: Máximo de 2 recheios!");
    if (tipo === 'recheio' && (!ultimoItem || ultimoItem.tipo !== 'massa')) return alert("Erro: Recheio sobre massa!");
    if (ultimoItem && ultimoItem.tipo === 'cobertura' && tipo !== 'topping') return alert("Erro: Já possui cobertura!");
    if (tipo === 'cobertura' && (!ultimoItem || (ultimoItem.tipo !== 'massa' && ultimoItem.tipo !== 'recheio'))) return alert("Erro: Cobertura precisa de base!");
    if (tipo === 'topping' && (!ultimoItem || ultimoItem.tipo !== 'cobertura')) return alert("Erro: Topping sobre cobertura!");

    boloAtual.push({ tipo: tipo, ingrediente: ingrediente });
    historicoAcoes.push('bolo'); 
    renderizarBolo();
}

function adicionarDocinho(tipoDoce) {
    if (!pedidoAtivo) return alert("Escolha um pedido ativo antes!");
    if (docesAtuais.length >= 12) return alert("Erro: As pilhas de adicionais estão cheias!");

    docesAtuais.push(tipoDoce);
    historicoAcoes.push('doce'); 
    renderizarDoces();
}

function prepararSobremesa() {
    if (!pedidoAtivo) return alert("Escolha um pedido ativo antes!");

    const tipo = document.getElementById('select-tipo-sobremesa').value;
    const sabor = document.getElementById('select-sabor-sobremesa').value;
    const item = { tipo: tipo, sabor: sabor };

    if (!sobremesasAtuais.esquerda) {
        sobremesasAtuais.esquerda = item;
        historicoAcoes.push('sobremesa-esquerda');
    } else if (!sobremesasAtuais.direita) {
        sobremesasAtuais.direita = item;
        historicoAcoes.push('sobremesa-direita');
    } else {
        return alert("Erro: Ambos os balcões de sobremesas estão ocupados!");
    }
    renderizarSobremesas();
}

function renderizarDoces() {
    const poolEsq = document.getElementById('pilha-doces-esquerda');
    const poolDir = document.getElementById('pilha-doces-direita');
    if(!poolEsq || !poolDir) return;
    poolEsq.innerHTML = ''; poolDir.innerHTML = '';

    docesAtuais.forEach((doce, index) => {
        const divDoce = document.createElement('div');
        divDoce.classList.add('doce-item', `doce-${doce}`);
        let txt = doce.substring(0, 4);
        if (doce === 'brigadeiro') txt = "Brig";
        if (doce === 'beijinho') txt = "Beij";
        divDoce.innerText = txt;
        
        if (index < 6) poolEsq.appendChild(divDoce);
        else poolDir.appendChild(divDoce);
    });
}

function renderizarSobremesas() {
    const slotEsq = document.getElementById('slot-sobremesa-esquerda');
    const slotDir = document.getElementById('slot-sobremesa-direita');
    if(!slotEsq || !slotDir) return;
    slotEsq.innerHTML = ''; slotDir.innerHTML = '';

    if (sobremesasAtuais.esquerda) {
        const item = sobremesasAtuais.esquerda;
        slotEsq.innerHTML = `<div class="sobremesa-item sabor-${item.sabor}"><strong>${item.tipo}</strong><br>${item.sabor}</div>`;
    }
    if (sobremesasAtuais.direita) {
        const item = sobremesasAtuais.direita;
        slotDir.innerHTML = `<div class="sobremesa-item sabor-${item.sabor}"><strong>${item.tipo}</strong><br>${item.sabor}</div>`;
    }
}

function desfazerUltimaAcao() {
    if (historicoAcoes.length === 0) return;
    const ultimaAcao = historicoAcoes.pop();

    if (ultimaAcao === 'bolo') { boloAtual.pop(); renderizarBolo(); }
    else if (ultimaAcao === 'doce') { docesAtuais.pop(); renderizarDoces(); }
    else if (ultimaAcao === 'sobremesa-esquerda') { sobremesasAtuais.esquerda = null; renderizarSobremesas(); }
    else if (ultimaAcao === 'sobremesa-direita') { sobremesasAtuais.direita = null; renderizarSobremesas(); }
}

function renderizarBolo() {
    const tabuleiro = document.getElementById('tabuleiro-bolo');
    if(!tabuleiro) return;
    tabuleiro.innerHTML = '';
    boloAtual.forEach(camada => {
        const divCamada = document.createElement('div');
        divCamada.classList.add('camada', `${camada.tipo}-${camada.ingrediente}`);
        divCamada.innerText = `${camada.ingrediente}`;
        tabuleiro.appendChild(divCamada);
    });
}

function limparBolo() {
    boloAtual = []; docesAtuais = []; historicoAcoes = [];
    sobremesasAtuais = { esquerda: null, direita: null };
    renderizarBolo(); renderizarDoces(); renderizarSobremesas();
}

function verificarPedido() {
    if (!pedidoAtivo) return;

    if (boloAtual.length !== pedidoAtivo.camadas.length) {
        alert("❌ O bolo está diferente do pedido!"); return;
    }
    for (let i = 0; i < boloAtual.length; i++) {
        if (boloAtual[i].tipo !== pedidoAtivo.camadas[i].tipo || boloAtual[i].ingrediente !== pedidoAtivo.camadas[i].ingrediente) {
            alert(`❌ Erro na camada ${i + 1} do bolo!`); return;
        }
    }

    const docesRequistadosOrdenados = [...pedidoAtivo.doces].sort();
    const docesFeitosOrdenados = [...docesAtuais].sort();

    if (docesRequistadosOrdenados.length !== docesFeitosOrdenados.length) {
        alert(`❌ A quantidade de docinhos está incorreta!`); return;
    }
    for (let i = 0; i < docesRequistadosOrdenados.length; i++) {
        if (docesRequistadosOrdenados[i] !== docesFeitosOrdenados[i]) {
            alert("❌ Você colocou docinhos diferentes dos solicitados!"); return;
        }
    }

    if (pedidoAtivo.sobremesa) {
        const sobEsq = sobremesasAtuais.esquerda; const sobDir = sobremesasAtuais.direita;
        const esqConfere = sobEsq && sobEsq.tipo === pedidoAtivo.sobremesa.tipo && sobEsq.sabor === pedidoAtivo.sobremesa.sabor;
        const dirConfere = sobDir && sobDir.tipo === pedidoAtivo.sobremesa.tipo && sobDir.sabor === pedidoAtivo.sobremesa.sabor;

        if (!esqConfere && !dirConfere) {
            alert(`❌ Falta enviar a sobremesa (${pedidoAtivo.sobremesa.tipo} de ${pedidoAtivo.sobremesa.sabor}) para o balcão!`); return;
        }
    }

    alert(`🎉 Perfeito! Pedido #${pedidoAtivo.id} entregue com sucesso total!`);
    pontuacao += 20 + pedidoAtivo.tempoRestante; 
    document.getElementById('pontos-player').innerText = pontuacao;

    filaPedidos = filaPedidos.filter(p => p.id !== pedidoAtivo.id);
    pedidoAtivo = null;
    limparBolo();

    if (filaPedidos.length > 0) selecionarPedidoAtivo(filaPedidos[0].id);
    else { exibirPedidoAtivoNaTela(); renderizarFila(); }
}