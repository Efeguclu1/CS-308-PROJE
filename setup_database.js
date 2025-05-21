/**
 * Database Setup Script
 * 
 * This script helps set up the database using the consolidated SQL file.
 * It will prompt for database credentials and execute the SQL commands.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function setupDatabase() {
  console.log('\n=== CS-308 E-Commerce Database Setup ===\n');
  
  try {
    // Check if database_setup.sql exists
    if (!fs.existsSync('./database_setup.sql')) {
      console.error('Error: database_setup.sql file not found!');
      console.log('Make sure you are running this script from the project root directory.');
      process.exit(1);
    }
    
    console.log('This script will set up the database for the CS-308 E-Commerce application.');
    console.log('Please provide your MySQL credentials:\n');
    
    const host = await prompt('Host [localhost]: ') || 'localhost';
    const user = await prompt('Username [root]: ') || 'root';
    const password = await prompt('Password: ');
    const dbName = 'online_store';
    
    console.log('\nTesting database connection...');
    
    // Try to connect to MySQL server
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        user,
        password,
      });
      console.log('✅ Successfully connected to MySQL server!');
    } catch (error) {
      console.error('❌ Failed to connect to MySQL server:', error.message);
      process.exit(1);
    }
    
    // Check if database exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );
    
    if (rows.length > 0) {
      console.log(`\nWarning: Database '${dbName}' already exists.`);
      const answer = await prompt('Do you want to drop and recreate it? (yes/no): ');
      
      if (answer.toLowerCase() === 'yes') {
        console.log(`Dropping database '${dbName}'...`);
        await connection.query(`DROP DATABASE ${dbName}`);
        console.log(`Database '${dbName}' dropped successfully.`);
      } else {
        console.log('\nSetup cancelled. Existing database will not be modified.');
        process.exit(0);
      }
    }
    
    console.log('\nExecuting database setup script...');
    
    // Build the MySQL command
    const mysqlCmd = `mysql -h ${host} -u ${user} ${password ? `-p${password}` : ''} < database_setup.sql`;
    
    // Execute the MySQL command
    exec(mysqlCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`\n❌ Error executing SQL script: ${error.message}`);
        console.log('\nTry running the SQL script manually:');
        console.log(`mysql -h ${host} -u ${user} -p < database_setup.sql`);
        process.exit(1);
      }
      
      if (stderr) {
        console.error(`\nWarning: ${stderr}`);
      }
      
      console.log('\n✅ Database setup completed successfully!');
      console.log(`\nDatabase '${dbName}' has been created with all required tables and sample data.`);
      console.log('\nYou can now start the application.');
      
      rl.close();
    });
  } catch (error) {
    console.error('\n❌ An error occurred:', error.message);
    process.exit(1);
  }
}

// Run the script
setupDatabase(); 