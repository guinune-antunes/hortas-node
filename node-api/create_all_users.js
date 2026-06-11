require('dotenv').config({ path: '.env' });

async function criarUsuarios() {
    console.log('🌱 Iniciando criação de usuários de teste...');

    const baseUrl = 'http://localhost:3000/api';

    // 1. Cliente
    try {
        const resCliente = await fetch(`${baseUrl}/pedidos/cliente/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: 'Cliente de Teste Final',
                email: 'cliente_teste@gmail.com',
                senha: 'senhaforte123',
                telefone: '11999999999',
                endereco_entrega: 'Rua das Hortaliças, 456'
            })
        });
        const dataCliente = await resCliente.json();
        if (dataCliente.status === 'sucesso' || resCliente.status === 409) {
            console.log('✅ Cliente:', dataCliente.mensagem || 'E-mail já cadastrado.');
        } else {
            console.error('❌ Erro Cliente:', dataCliente.mensagem);
        }
    } catch (err) {
        console.error('❌ Falha ao criar Cliente:', err.message);
    }

    // 2. Entregador
    try {
        const resEntregador = await fetch(`${baseUrl}/entregador/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: 'Entregador Rápido',
                email: 'entregador_teste@gmail.com',
                senha: 'senhaforte123',
                telefone: '11888888888',
                nr_cpf: '12345678901'
            })
        });
        const dataEntregador = await resEntregador.json();
        if (dataEntregador.status === 'sucesso' || resEntregador.status === 409) {
            console.log('✅ Entregador:', dataEntregador.mensagem || 'E-mail ou CPF já cadastrado.');
        } else {
            console.error('❌ Erro Entregador:', dataEntregador.mensagem);
        }
    } catch (err) {
        console.error('❌ Falha ao criar Entregador:', err.message);
    }

    // 3. Produtor / Dashboard
    try {
        const resProdutor = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome_produtor: 'Produtor Master',
                email_produtor: 'produtor_teste@gmail.com',
                senha: 'senhaforte123',
                telefone_produtor: '11777777777'
            })
        });
        const dataProdutor = await resProdutor.json();
        if (dataProdutor.status === 'sucesso' || resProdutor.status === 409) {
            console.log('✅ Produtor (Dashboard):', dataProdutor.mensagem || 'E-mail já cadastrado.');
        } else {
            console.error('❌ Erro Produtor:', dataProdutor.mensagem);
        }
    } catch (err) {
        console.error('❌ Falha ao criar Produtor:', err.message);
    }

    console.log('🎉 Finalizado!');
    process.exit(0);
}

criarUsuarios();
