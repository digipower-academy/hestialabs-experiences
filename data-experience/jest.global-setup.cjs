// Run every test in UTC, so date formatting (and golden snapshots) don't
// depend on the machine's timezone. Workers inherit this environment.
module.exports = () => {
  process.env.TZ = 'UTC'
}
