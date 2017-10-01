import { MongoClient } from 'mongodb'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import * as _ from 'lodash'

/**
 * Get migration as a module.
 *
 * @private
 * @param {String} migration migration name
 * @param {String} migrationsDirPath directory path of migrationsDirPath
 * @return {Object} migration module
 */
const getMigrationModule = (migration, migrationsDirPath) =>
  require(path.join(migrationsDirPath, `${migration}.js`))

/**
 * Change status of a migration record.
 *
 * @private
 * @param {String} migration migration name
 * @param {Boolean} status the status change to
 * @return {Promise} execute succeed or not
 */
const changeStatus = async (migration, status) => {
  const db = await MongoClient.connect(url)
  const migrationsCollection = await db.collection('migrations')
  await migrationsCollection.findOneAndUpdate({migration}, {$set: {done: status}})
  return db.close()
}

/**
 * Get migrations records.
 *
 * @private
 * @param {String} url mongodb connection url
 * @param {Object[]} migrations migrations array created by loader
 * @return {Object[]} migrations records
 */
const getRecord = async (url, migrations) => {
  const db = await MongoClient.connect(url)
  const migrationsCollection = await db.collection('migrations')
  const record = await migrationsCollection.find({}).toArray()
  if (migrations.length < record.length)
    return Promise.reject('You should not delete migration file')

  const isEqual = migrations.every((i, j) => j in record &&
    record[j].migration === i.migration)

  if (isEqual) return Promise.resolve(record)

  const toInsert = []
  for (let i = 0; i < migrations.length; i += 1) {
    if (i in record) {
      if (record[i].migration !== migrations[i].migration) {
        return Promise.reject('Migration which have done not matched')
      }
    }
    toInsert.push(migrations[i])
  }

  await migrationsCollection.insertMany(toInsert)
  await db.close()
  return Promise.resolve(record.concat(toInsert))
}

/**
 * Execute up method of migration in turn.
 *
 * @public
 * @param {String} url mongodb connection url
 * @param {Object[]} migrations migrations array created by loader
 * @param {String} migrationsDirPath directory path of migrationsDirPath
 */
const migrate = async (url, migrations, migrationsDirPath) => {
  const record = await getRecord(url, migrations)
  for (i of record) {
    if (!i.done) {
      console.log(chalk.yellow('migrating: ') + i.migration)
      await getMigrationModule(i.migration, migrationsDirPath).up()
      await changeStatus(i.migration, true)
      console.log(chalk.green('migrated: ') + i.migration)
    }
  }
  return Promise.resolve()
}

/**
 * Execute down method of migration in turn.
 *
 * @public
 * @param {String} url mongodb connection url
 * @param {Object[]} migrations migrations array created by loader
 * @param {String} migrationsDirPath directory path of migrationsDirPath
 */
const rollback = async (url, migrations, migrationsDirPath) => {
  const record = await getRecord(url, migrations)

  for (i of record.reverse()) {
    if (i.done) {
      console.log(chalk.yellow('rolling back: ') + i.migration)
      await getMigrationModule(i.migration, migrationsDirPath).down()
      await changeStatus(i.migration, false)
      console.log(chalk.green('rolled back: ') + i.migration)
    }
  }
}

/**
 * Rollback and migrate.
 *
 * @public
 * @param {String} url mongodb connection url
 * @param {Object[]} migrations migrations array created by loader
 * @param {String} migrationsDirPath directory path of migrationsDirPath
 */
const refresh = async (url, migrations, migrationsDirPath) => {
  await rollback(url, migrations, migrationsDirPath)
  return migrate(url, migrations, migrationsDirPath)
}

/**
 * List migration status.
 *
 * @public
 * @param {String} url mongodb connection url
 * @param {Object[]} migrations migrations array created by loader
 */
const status = async (url, migrations) => {
  const record = await getRecord(url, migrations)
  record.map(i => {
    console.log((i.status ? chalk.green('✔') : chalk.red('✘')) +
      ' ' + i.migration)
  })
}

export {
  migrate,
  rollback,
  refresh,
  status,
}
