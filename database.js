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

		const fields = Object.keys(valueObject);
		const hasId = fields.includes('id');

		let sql = `INSERT INTO \`${table}\` (`;

		if (hasId) {
			sql += '`id`, ';
		}

		const nonIdFields = fields.filter((field) => field !== 'id');

		sql += nonIdFields.join(', ');
		sql += ') VALUES (';

		if (hasId) {
			sql += `'${valueObject.id}', `;
		}

		nonIdFields.forEach((field) => {
			sql += `'${valueObject[field]}', `;
		});

		sql = sql.slice(0, -2); // Remove trailing comma
		sql += ')';

		sql += ` ON DUPLICATE KEY UPDATE `;
		fields.forEach((field) => {
			if (field !== 'id') {
				sql += `\`${field}\` = '${valueObject[field]}', `;
			}
		});

		sql = sql.slice(0, -2); // Remove trailing comma 	  
		return this.query(sql);
	}


	delete(table, id) {
		return this.query(`DELETE FROM ${table} WHERE id=${id}`);
	}

	list(table) {

		return this.query(`SELECT * FROM ${table}`);
	}
}

module.exports = Database;