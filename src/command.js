import Migrate from './api'
import path from 'path'
import fs from 'fs'

const migrationsDirPath = path.join(process.cwd(), 'src/migrations')
const url = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')).toString())['mongodb']
const api = new Migrate(url, migrationsDirPath)

const methods = ['migrate', 'rollback', 'status', 'refresh']

const cmd = process.argv[2]
if (methods.indexOf(cmd) !== -1)
  api[cmd]()
    .then(info => {
      if (info) console.log(info)
      process.exit(0)
    })
    .catch(err => {
      if (err) console.log(err)
      process.exit(1)
    })
else process.exit(2)
