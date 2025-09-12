import { Sequelize } from 'sequelize';
import { config } from '../config/environment';

// Create a connection without specifying a database to check if the database exists
const checkDB = new Sequelize('', config.DB_USER, config.DB_PASS, {
  host: config.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

export const ensureDatabaseExists = async () => {
  try {
    await checkDB.authenticate();
    console.log('MySQL connection established successfully.');
    
    // Check if database exists
    const [results] = await checkDB.query(`SHOW DATABASES LIKE '${config.DB_NAME}'`);
    
    if (results.length === 0) {
      console.log(`Database '${config.DB_NAME}' does not exist. Creating it...`);
      await checkDB.query(`CREATE DATABASE \`${config.DB_NAME}\``);
      console.log(`Database '${config.DB_NAME}' created successfully.`);
    } else {
      console.log(`Database '${config.DB_NAME}' already exists.`);
    }
    
    await checkDB.close();
  } catch (error) {
    console.error('Error checking/creating database:', error);
    throw error;
  }
};
