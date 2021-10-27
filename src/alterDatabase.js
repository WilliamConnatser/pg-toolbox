import path from 'path'
import fs from 'fs'
import { createPool } from 'slonik'

import formatAndLog from './formatAndLog'
import getBatch from './getBatch'
import handleMigrationChange from './handleMigrationChange'
import truncate from './truncate'

//Create transaction pool
const pool = createPool(process.env.PGURI)

const alterDatabase = (option) => {
    //Get an array of the file paths to all PG Toolbox files
    //This will pull in all files inside the directory defined in the PGMIGRATIONS environment variable
    const importToolboxFiles = fs
        .readdirSync(path.join(process.env.PWD, process.env.PGMIGRATIONS))
        //Then map over that array, and compile an object with the file name and all of its sql scripts
        //PG Toolbox sql script files export async functions which return an object literal with the properties being sql scripts for each command
        .map(async (fileName) => ({
            fileName,
            ...(await require(path.join(process.env.PWD, process.env.PGMIGRATIONS, fileName))()),
        }))

    //Once all scripts have been loaded we iterate through each file
    //There direction we iterate is determined by which command is being executed
    Promise.all(importToolboxFiles).then((toolboxFiles) => {
        return pool.transaction(async (transactionConnection) => {
            switch (option) {
                case '--rollback':
                case '-rollback':
                    //Iterate over toolbox files in descending alphabetical order
                    const toolboxFilesReversed = toolboxFiles.reverse()

                    for (let toolboxFile of toolboxFilesReversed) {
                        const { rollback, fileName } = toolboxFile

                        const { batchNumber, lastBatch } = await getBatch(pool, fileName)

                        //Check if this toolbox file migration script was executed before rolling back
                        if (batchNumber) {
                            formatAndLog(`[pg-toolbox] Rollback: Executing rollback script in ${fileName}`, rollback)
                            await transactionConnection.query(rollback)
                            await handleMigrationChange(pool, transactionConnection, fileName, false)
                        } else {
                            formatAndLog(`Rollback: ${fileName} has not been migrated yet.`)
                        }
                    }
                    break
                case '--truncate':
                case '-truncate':
                    //Truncate needs to be abstracted away because it is used both independently, and also as the first step of the seeding process
                    await truncate(pool, transactionConnection, toolboxFiles)
                    break
                case '--migrate':
                case '-migrate':
                    //Iterate over toolbox files in ascending alphabetical order
                    for (let toolboxFile of toolboxFiles) {
                        const { migrate, fileName } = toolboxFile
                        const migrationsExecuted = await getMigrationsExecuted(pool, fileName)

                        //Check if the toolbox file migration script was already executed before Executing them
                        if (!migrationsExecuted) {
                            formatAndLog(`Migrate: Executing migration script in ${fileName}`, migrate)
                            await transactionConnection.query(migrate)
                            await handleMigrationChange(pool, transactionConnection, fileName, true)
                        } else {
                            formatAndLog(`Migrate: Migration file ${fileName} has already been executed.`)
                        }
                    }
                    break
                case '-seed':
                case '--seed':
                    return truncate(pool, transactionConnection, toolboxFiles).then(async () => {
                        for (let toolboxFile of toolboxFiles) {
                            const { fileName, seed } = toolboxFile
                            const migrationsExecuted = await getMigrationsExecuted(pool, fileName)
                            if (migrationsExecuted) {
                                if (!seed) {
                                    formatAndLog(`Seed: Toolbox file ${fileName} does not contain a seed script.`)
                                } else {
                                    formatAndLog(`Seed: Executing seed script ${fileName}`, seed)
                                    await transactionConnection.query(seed)
                                }
                            } else {
                                formatAndLog(`Seed: ${fileName} has not been migrated yet.`)
                            }
                        }
                    })
                    break
            }
        })
    })
}

export default alterDatabase
