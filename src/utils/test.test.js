import utils from './test'
import { createPool, sql } from 'slonik'
import { expect } from 'chai'

describe('Test that we are able to create and destroy the Docker Postgres containers which are used for testing purposes.', () =>
    it('Test that utils.create() and utils.destroy() both function as expected', () => {
        /*
      createThenDestroy is a recursive function which will execute twice successfully if utils.create() and utils.destroy() are functioning as expected.

      We execute simple arithmetic SQL statement and if the correct answer is returned, then we can be sure the  Docker PG container was spun up, we can connect, and we can execute SQL statements successfully.

      If createThenDestroy() is successful a second time, then that means destroy() is working as intended.

      Otherwise, utils.create() will error out on the second execution with the following error: "The container name "/postgres_toolbox_test" is already in use by container..."
    */
        const createThenDestroy = (secondPass = false) => {
            return utils
                .create()
                .then(() => {
                    const pool = createPool('postgres://postgres:password@127.0.0.1:5432/postgres')

                    return pool.connect((connection) => {
                        return connection.query(sql`SELECT 1+1 as result`).then(({ rows }) => {
                            const result = rows[0].result
                            expect(result).to.equal(2)
                        })
                    })
                })
                .catch((err) => {
                    console.error(err)
                    expect(err).to.not.exist()
                })
                .finally((result) => {
                    return utils.destroy()
                })
                .then(() => (secondPass ? null : createThenDestroy(true)))
        }
        return createThenDestroy()
    }))
