require('dotenv').config();

module.exports = {
  development: { 
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql"  
  },
  test: {
    username: "root",
    password: "Rohan@143",
    database: "diy_app",
    host: "127.0.0.1", // Keep localhost for local testing
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST, // Corrected this line
    port: process.env.DB_PORT || 3306,
    dialect: "mysql"
  }
};
