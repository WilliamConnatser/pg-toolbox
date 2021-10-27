#!/usr/bin/env node

// const alterDatabase = require("./alterDatabase");
const arg = require('arg')
const { formatArray, wrapSyntaxError } = require('./utils/cli')

const validCommands = ['create', 'migrate', 'rollback', 'up', 'down', 'seed', 'truncate', 'pending', 'executed', 'logs']

let args = arg({
    '--version': Number,
    '--help': Boolean,
    '--verbose': Boolean,

    //Path to toolbox files
    '--path': String,
    '-path': '--path',

    //Connection string
    '--uri': String,
    '-uri': '--uri',

    //Todo: Migrate up to and including a migration file - use filename and timestamps
    '--to': String,
    '-to': '--to',

    //Todo: Only run a specific migration file
    '--only': String,
    '-only': '--only',

    //Todo: For create?
    '--name': String,
    '-name': '--name',

    //Todo: run all migration files
    '--all': Boolean,
    '-all': '--all',

    //Limit to only running X migration files
    '--limit': Number,
    '-limit': '--limit',
})

//Separate commands from args and make the arg object easier to work with
const commandsReceived = args._
console.log(args, 'arge before..')
args = {
    version: args['--version'],
    help: args['--help'],
    verbose: args['--verbose'],
    path: args['--path'],
    uri: args['--uri'],
    to: args['--to'],
    only: args['--only'],
    all: args['--all'],
    limit: args['--limit'],
}

//Todo: Finish implementing batches and extra functionality (steps, to, only, all, limit, etc)
//Add a setting for only allowing up
//Set a sane defaults for all

if (commandsReceived.length > 1) {
    wrapSyntaxError(
        `Only one command can be provided at a time\n\n\tReceived the following commands: ${formatArray(
            commandsReceived,
            'and',
        )}`,
    )
} else if (commandsReceived.length < 1) {
    wrapSyntaxError(`A command must be provided.`)
} else if (!validCommands.includes(commandsReceived[0])) {
    wrapSyntaxError(
        `Invalid command provided\n\n\tThe following commands are valid: ${formatArray(validCommands, 'or')}`,
    )
}

const command = commandsReceived[0]
console.log(args)
if (args.help) {
    console.log(`Syntax:
  pg-toolbox [command] [options]



Commands:
  (Note: The default functionality explained for each command can be overridden with the options below.)

  create - Create a new script file
  migrate - Executes all migration scripts which have not already been executed
  rollback - Executes the last batches' rollback scripts
  seed - Executes all seed scripts which have not already been executed
  truncate - Executes the last batches' truncate scripts

Options:
  (Note: Preceding options with either "-" or "--" is OK)

  --help - I guess you figured this one out!
  --version - Returns the NPM package version
  --verbose - Activates additional logging

  --path - Declare the path to the script files
  --uri - 

  --to
  --only
  --name
  --step
  --all
  --limit

  `)
    process.exit()
}

process.exit()

switch (command) {
    case '--migrate':
    case '-migrate':
    case '--rollback':
    case '-rollback':
    case '--seed':
    case '-seed':
    case '--truncate':
    case '-truncate':
        //alterDatabase(option);
        break
    default:
        throw new Error('Invalid option provided - Execute `pg-toolbox -help` for more information.')
        break
}
