require('dotenv').config({ path: '.env' });
const pool = require('./src/db.js');

async function seedTransactions() {
    console.log('🚀 Iniciando geração de transações entre os usuários...');
    const baseUrl = 'http://localhost:3000/api';

    try {
        // 1. Setup da Horta e Produtos (via Banco) para o Produtor
        console.log('📍 Configurando Horta e Estoques para Produtor...');
        const [rowsProd] = await pool.execute('SELECT id_produtor FROM produtor WHERE email_produtor = ?', ['produtor_teste@gmail.com']);
        if (rowsProd.length === 0) throw new Error('Produtor não encontrado!');
        const idProdutor = rowsProd[0].id_produtor;

        // Endereço
        const [resEnd] = await pool.execute(
            'INSERT INTO endereco_hortas (nm_rua, nr_cep, nm_bairro, nm_estado, nm_cidade) VALUES (?, ?, ?, ?, ?)',
            ['Fazenda Teste, S/N', '80000000', 'Rural', 'SP', 'São Paulo']
        );
        const idEndereco = resEnd.insertId;

        // Horta
        const cnpj = Math.floor(Math.random() * 100000000000000).toString().padStart(14, '0');
        const [resHorta] = await pool.execute(
            'INSERT INTO hortas (endereco_hortas_id_endereco_hortas, produtor_id_produtor, nr_cnpj, nome, descricao, visibilidade) VALUES (?, ?, ?, ?, ?, ?)',
            [idEndereco, idProdutor, cnpj, 'Horta Teste Completo', 'Horta do produtor de testes', 1]
        );
        const idHorta = resHorta.insertId;
        await pool.execute('UPDATE produtor SET hortas_id_hortas = ? WHERE id_produtor = ?', [idHorta, idProdutor]);

        // Produtos e Estoque
        const itens = [
            { nome: 'Batata Inglesa', und: 'kg', qtd: 100, preco: 4.50 },
            { nome: 'Cebola Branca', und: 'kg', qtd: 80, preco: 3.20 },
            { nome: 'Coentro', und: 'maço', qtd: 30, preco: 2.00 },
            { nome: 'Morango Orgânico', und: 'caixa', qtd: 20, preco: 10.00 }
        ];

        const estoquesGerados = [];
        for (const item of itens) {
            let idProduto;
            try {
                const [resProd] = await pool.execute('INSERT INTO produtos (nm_produto, unidade_medida_padrao) VALUES (?, ?)', [item.nome, item.und]);
                idProduto = resProd.insertId;
            } catch (e) {
                const [rows] = await pool.execute('SELECT id_produto FROM produtos WHERE nm_produto = ?', [item.nome]);
                idProduto = rows[0].id_produto;
            }

            const [resEst] = await pool.execute(
                'INSERT INTO estoques (hortas_id_hortas, produto_id_produto, ds_quantidade, dt_validade) VALUES (?, ?, ?, ?)',
                [idHorta, idProduto, item.qtd, '2026-12-31']
            );
            estoquesGerados.push({ id_estoque: resEst.insertId, preco: item.preco });
        }
        console.log(`✅ Horta (ID: ${idHorta}) e Estoques criados!`);

        // 2. Cliente realiza compras (via API)
        console.log('🛒 Realizando compras como Cliente...');
        const resLoginC = await fetch(`${baseUrl}/pedidos/cliente/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cliente_teste@gmail.com', senha: 'senhaforte123' })
        });
        const dataLoginC = await resLoginC.json();
        const tokenCliente = dataLoginC.token;

        const pedidosGerados = [];
        for (let i = 1; i <= 5; i++) {
            // Pegar 2 itens aleatórios
            const item1 = estoquesGerados[Math.floor(Math.random() * estoquesGerados.length)];
            const item2 = estoquesGerados[Math.floor(Math.random() * estoquesGerados.length)];
            
            const resPedido = await fetch(`${baseUrl}/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCliente}` },
                body: JSON.stringify({
                    horta_id: idHorta,
                    endereco_entrega: `Rua do Cliente, ${100 + i}`,
                    observacao: `Pedido de Teste #${i}`,
                    itens: [
                        { estoque_id: item1.id_estoque, quantidade: 2, preco_unitario: item1.preco },
                        { estoque_id: item2.id_estoque, quantidade: 1, preco_unitario: item2.preco }
                    ]
                })
            });
            const dataPedido = await resPedido.json();
            if (dataPedido.status === 'sucesso') {
                pedidosGerados.push(dataPedido.id_pedido);
                console.log(`✅ Pedido #${dataPedido.id_pedido} criado no valor de R$ ${dataPedido.valor_total}`);
            }
        }

        // 3. Entregador atualiza os pedidos
        console.log('🚴 Entregador atualizando entregas...');
        const resLoginE = await fetch(`${baseUrl}/entregador/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'entregador_teste@gmail.com', senha: 'senhaforte123' })
        });
        const dataLoginE = await resLoginE.json();
        const tokenEntregador = dataLoginE.token;

        for (let i = 0; i < pedidosGerados.length; i++) {
            const idPedido = pedidosGerados[i];
            // Aceitar todos
            await fetch(`${baseUrl}/entregador/aceitar/${idPedido}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${tokenEntregador}` }
            });
            
            // Alterar status
            if (i < 2) {
                // Primeiros 2 entregues
                await fetch(`${baseUrl}/entregador/status/${idPedido}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenEntregador}` },
                    body: JSON.stringify({ status: 'a_caminho' })
                });
                await fetch(`${baseUrl}/entregador/status/${idPedido}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenEntregador}` },
                    body: JSON.stringify({ status: 'entregue' })
                });
                console.log(`📦 Pedido #${idPedido} -> ENTREGUE`);
            } else if (i === 2) {
                // 3º Cancelado
                await fetch(`${baseUrl}/entregador/status/${idPedido}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenEntregador}` },
                    body: JSON.stringify({ status: 'cancelado' })
                });
                console.log(`🚫 Pedido #${idPedido} -> CANCELADO`);
            } else if (i === 3) {
                // 4º A Caminho
                await fetch(`${baseUrl}/entregador/status/${idPedido}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenEntregador}` },
                    body: JSON.stringify({ status: 'a_caminho' })
                });
                console.log(`🚚 Pedido #${idPedido} -> A CAMINHO`);
            } else {
                console.log(`⏳ Pedido #${idPedido} -> ACEITO (Preparando)`);
            }
        }

        console.log('🎉 Todas as transações foram geradas com sucesso!');

    } catch (err) {
        console.error('❌ Falha na geração de transações:', err);
    } finally {
        process.exit(0);
    }
}

seedTransactions();
