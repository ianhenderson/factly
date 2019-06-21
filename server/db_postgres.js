const { DATABASE_URL = 'postgres://apiuser_kstool@localhost:5432/henderson_i' } = process.env
const { Client } = require('pg')
const client = new Client({ connectionString: DATABASE_URL })

client.connect()

function dbQuery(config) {
    return client.query(config)
    .then(res => {
        console.log(res.rows)
        return res.rows
    })
    .catch(err => {
        console.error(err)
        return []
    })
}

function userGetNextStudyRow(userId) {
    return dbQuery({
        text: 'SELECT * from kst.kst_user_get_next_row_to_study_v2($1)',
        values: [userId]
    })
}

function queueMarkdone(queueItemId) {
    return dbQuery({
        text: 'SELECT kst.kst_queue_markdone($1)',
        values: [queueItemId]
    })
}

function wordInsert(word, userId) {
    return dbQuery({
        text: 'SELECT kst.kst_word_insert_v2($1, $2)',
        values: [word, userId]
    })
}

function userAdd(username, password) {
    return dbQuery({
        text: 'SELECT * FROM kst.kst_user_add($1, $2)',
        values: [username, password]
    })
}

function userCheck(username, password) {
    return dbQuery({
        text: 'SELECT * FROM kst.kst_user_check($1, $2)',
        values: [username, password]
    })
}

module.exports = { userAdd, userCheck, userGetNextStudyRow, wordInsert, queueMarkdone }