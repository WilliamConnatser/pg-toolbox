#!/usr/bin/env node

import alterDatabase from './alterDatabase'

const option = process.argv[2]

switch (option) {
  case '-help':
  case '--help':
    console.log(`Syntax:
  pg-toolbox [options]

(Note: Preceding options with both - and -- are OK)

Options:
  --help (I guess you figured this one out!)
  --migrate (Execute migration scripts which have not already been executed)
  --rollback (Execute rollback scripts for migrations which have already been executed)
  --seed (Execute seed scripts for migrations which have already been executed)
  --truncate (Execute truncate scripts for migrations which have already been executed)
  `)
    break
  case '--migrate':
  case '-migrate':
  case '--rollback':
  case '-rollback':
  case '--seed':
  case '-seed':
  case '--truncate':
  case '-truncate':
    alterDatabase(option)
    break
  default:
    console.log(
      'Invalid option provided - Execute `pg-toolbox -help` for more information.',
    )
    break
}
