import fs from 'fs'
import path from 'path'

/**
 * Load migrations.
 *
 * @public
 * @param {String} migrationsDirPath directory path of migrationsDirPath
 * @return {Object[]} migrations array and all not done by default
 */
const loadMigrations = migrationsDirPath =>
  fs.readdirSync(migrationsDirPath)
    .sort((a, b) => a > b)
    .map(i => {
      const basename = path.basename(i, '.js')
      return {
        migration: basename,
        done: false,
      }
    })

export {
  loadMigrations
}
