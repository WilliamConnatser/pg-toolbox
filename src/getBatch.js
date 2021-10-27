import { sql } from 'slonik'
import formatAndLog from './formatAndLog'

export default function getBatch(pool, fileName) {
    //Return null which represents the migration script has not been executed yet
    //OR returns the batch # in which the migration was executed
    return pool
        .maybeOne(sql`SELECT batch FROM pg_toolbox_migrations WHERE file_name = ${fileName} FETCH FIRST 1 ROWS ONLY`)
        .then(({ batch }) => {
            //Batch will be one (or greater than one) if the migration script has already been executed.
            //Otherwise, it will be undefined so we return null
            return batch ? batch : null
        })
        .catch((err) => {
            //If no migrations have been executed at all, then you will get an error: relation "pg_toolbox_migrations" does not exist
            //Here we ignore that error, and return null which represents the migration script has not been executed yet.
            if (err.code === '42P01') return null
            else {
                formatAndLog('An unknown error occurred while getting migrations which have already been executed')
                throw err
            }
        })
}
