import { promisify } from 'util'
import { exec } from 'child_process'
import formatAndLog from '../formatAndLog'

const execPromisified = promisify(exec)

export const create = () => {
    return execPromisified(
        `docker run --name postgres_toolbox_test --rm -p 5432:5432 -e POSTGRES_PASSWORD=password -d postgres`,
    )
        .then(async ({ stdout }) => {
            //Delay to allow docker container to spin up
            await new Promise((resolve, reject) => setTimeout(() => resolve(true), 1500))
            formatAndLog(`Docker Container Created: ${stdout}`)
            return stdout
        })
        .catch((stderr) => {
            throw new Error(stderr)
        })
}

export const destroy = () => {
    return execPromisified(`docker container stop postgres_toolbox_test`)
        .then(({ stdout }) => {
            formatAndLog(`Docker Container Destroyed: ${stdout}`)
            return stdout
        })
        .catch((stderr) => {
            throw new Error(stderr)
        })
}
