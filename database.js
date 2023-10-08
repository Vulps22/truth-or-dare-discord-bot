const mysql = require('mysql');

class Database {

	connection;

	constructor() {
		this.connection = mysql.createConnection({
			host: process.env['DATABASE_HOST'],
			user: process.env['DATABASE_USER'],
			password: process.env['DATABASE_PASSWORD'],
			database: process.env['DATABASE']
		});
		this.connection.connect(function (err) {
			if (err) throw err;
		});
	}

	query(sql) {
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
		return this.query(`SELECT * FROM ${table} WHERE id=${id}`)
			.then(rows => rows[0]);
	}

	async set(table, valueObject) {

		// Extract values
		const values = Object.values(valueObject);

		// Check if ID is defined
		const hasId = Object.hasOwnProperty.call(valueObject, 'id');

		let sql = `INSERT INTO \`${table}\``;

		if (hasId) {
			// Add id field if present
			sql += '(id, ';
		} else {
			// Let id auto increment
			sql += '(';
		}

		// Add other fields 
		const fields = Object.keys(valueObject)
			.filter(f => f !== 'id')
			.join(', ');

		sql += fields;
		sql += ') VALUES (';

		if (hasId) {
			// Add passed in id 
			sql += valueObject.id + ', ';
		}

		// Add other values
		const valuePlaceholders = fields.split(', ').map(() => '?').join(', ');

		sql += valuePlaceholders;
		sql += ')';

		// Upsert query
		sql += ` ON DUPLICATE KEY UPDATE ${fields.replace(/, /g, ' = ?, ')} = ?`;

		// Execute query
		return this.query(sql, values);
	}



	delete(table, id) {
		return this.query(`DELETE FROM ${table} WHERE id=${id}`);
	}

	list(table) {

		return this.query(`SELECT * FROM ${table}`);
	}
}

module.exports = Database;