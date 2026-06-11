require('dotenv').config();
const pool = require('./src/db');
(async () => {
    try {
        const [rows] = await pool.execute(`
             SELECT
                h.id_hortas,
                h.nome,
                h.descricao,
                COUNT(DISTINCT e.id_estoques) AS qtd_itens_estoque,
                SUM(e.ds_quantidade) AS quantidade_total_estoque,
                pr.nome_produtor,
                pr.email_produtor,
                eh.nm_rua,
                eh.nm_cidade,
                eh.nm_estado
             FROM hortas h
             LEFT JOIN estoques e ON e.hortas_id_hortas = h.id_hortas
             LEFT JOIN produtor pr ON pr.id_produtor = h.produtor_id_produtor
             LEFT JOIN endereco_hortas eh ON eh.id_endereco_hortas = h.endereco_hortas_id_endereco_hortas
             WHERE h.visibilidade = 1
             GROUP BY h.id_hortas, h.nome, h.descricao, pr.nome_produtor, pr.email_produtor, eh.nm_rua, eh.nm_cidade, eh.nm_estado
             ORDER BY quantidade_total_estoque DESC
        `);
        console.log("SUCCESS", rows);
    } catch (e) {
        console.error("ERROR", e);
    }
    process.exit();
})();
