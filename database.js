const mysql = require('mysql');

class Database {

	connection;

	constructor() {
		console.log("================DATABASE=============")
		this.connection = mysql.createConnection({
			host: process.env['DATABASE_HOST'],
			user: process.env['DATABASE_USER'],
			password: process.env['DATABASE_PASSWORD'],
			database: process.env['DATABASE']
		});
		this.connection.connect(function (err) {
			if (err) throw err;
			console.log("Connected!");
		});
	}

	query(sql) {
		console.log(sql);
		return new Promise((resolve, reject) => {
			this.connection.query(sql, (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			});
		});
	}

	get(table, id) {
		console.log("get " + table)
		return this.query(`SELECT * FROM ${table} WHERE id=${id}`)
			.then(rows => rows[0]);
	}

	async set(table, valueArray) {
		console.log("set " + table);

		// Extract field names and values from the valueArray object
		const fieldNames = Object.keys(valueArray);
		const fieldValues = fieldNames.map(fieldName => valueArray[fieldName]);

		// Create an array of field assignments like "field1 = 'value1'", "field2 = 'value2'", ...
		const fieldAssignments = fieldNames.map(fieldName => `${fieldName} = '${valueArray[fieldName]}'`);

		// Construct the SQL query by joining the field assignments
		const sql = `
    INSERT INTO \`${table}\`
    SET ${fieldAssignments.join(', ')}
    ON DUPLICATE KEY UPDATE ${fieldAssignments.join(', ')}
`;


		// Execute the query
		return this.query(sql);
	}



	delete(table, id) {
		console.log("del " + table)

		return this.query(`DELETE FROM ${table} WHERE id=${id}`);
	}

	list(table) {
		console.log("list " + table)

		return this.query(`SELECT * FROM ${table}`);
	}
}

module.exports = Database;