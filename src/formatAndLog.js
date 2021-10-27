export default function formatAndLog(message, query = null) {
    //Prepend a "namespace" to the console.log so the use knows it was called inside this package
    //Format the output if there is a sql statement sent into the function
    console.log(`[pg-toolbox] ${message}${query && query.sql ? `\n\t${query.sql.replace(/\n/g, '\n\t')}` : ''}`)
}

module.exports = formatAndLog
