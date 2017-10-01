import core from './core'
import loader from './loader'

export default class Migrate {

  /**
   * Constructor method.
   *
   * @param {String} url mongodb connection url
   * @param {String} migrationsDirPath directory path of migrationsDirPath
   */
  constructor(url, migrationsDirPath) {
    this.url = url
    this.migrationsDirPath = migrationsDirPath
    this.migrations = loader.loadMigrations(migrationsDirPath)
  }

  migrate() {
    return core.migrate(this.url, this.migrations, this.migrationsDirPath)
  }

  rollback() {
    return core.rollback(this.url, this.migrations, this.migrationsDirPath)
  }

  refresh() {
    return core.refresh(this.url, this.migrations, this.migrationsDirPath)
  }

  status() {
    return core.status(this.url, this.migrations)
  }

}
