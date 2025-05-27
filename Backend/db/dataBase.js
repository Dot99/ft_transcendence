import sqlite3 from 'sqlite3';
import runMigrations from './migrations.js';
sqlite3.verbose();

const db = new sqlite3.Database('/db/data.db', (err) => {
  if (err) {
    console.error('Error connecting', err.message);
  } else {
    console.log('Connected to the Data Base...');
    runMigrations(db);
  }
});

export default db;