const mysql = require('mysql2');

class Database {

	connection;

	connect() {
		this.connection = mysql.createConnection({
			host: process.env['ALPHA'] ? 'localhost' : process.env['DATABASE_HOST'],
			port: process.env['DATABASE_LOCAL_PORT'],
			user: process.env['DATABASE_USER'],
			password: process.env['DATABASE_PASSWORD'],
			database: process.env['DATABASE']
		});
		this.connection.connect(function (err) {
			if (err) throw err;
		});
	}

	query(sql) {
		console.log(sql);
		console.log('=======================================');
		try {
			this.connect();
			return new Promise((resolve, reject) => {
				this.connection.query(sql, (error, results) => {
					if (error) {
						reject(error);
					} else {
						resolve(results);
					}
				});
			});
		} finally {
			this.connection.end()
		}
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
			sql += `${this.escape(valueObject.id)}, `;
		}

		nonIdFields.forEach((field) => {
			sql += `${this.escape(valueObject[field])}, `;
		});

		sql = sql.slice(0, -2); // Remove trailing comma
		sql += ')';

		sql += ` ON DUPLICATE KEY UPDATE `;
		fields.forEach((field) => {
			if (field !== 'id') {
				sql += `\`${field}\` = ${this.escape(valueObject[field])}, `;
			}
		});

		sql = sql.slice(0, -2); // Remove trailing comma 	  
		return this.query(sql);
	}


	delete(table, id) {
		return this.query(`DELETE FROM ${table} WHERE id=${id}`);
	}

	list(table, limit = 0, order = 'ASC') {

		return this.query(`SELECT * FROM ${table} ORDER BY id ${order} ${limit > 0 ? 'LIMIT ' + limit : ''}`);
	}

	like(table, field, pattern, limit = 0, order = 'ASC', excludeBanned = true) {
		if (order !== 'ASC' && order !== 'DESC') {
			throw new Error('Invalid order parameter. Must be either "ASC" or "DESC".');
		}

		return this.query(`SELECT * FROM ${table} WHERE ${field} LIKE ${this.escape(pattern)} ${excludeBanned ? 'AND isBanned = 0' : ''} ORDER BY ${field} ${order} ${limit > 0 ? 'LIMIT ' + limit : ''}`);
	}


	escape(value) {
		if (typeof value === 'string') {
			return `${mysql.escape(value)}`;
		} else if (typeof value === 'number') {
			return value;
		} else if (value === null) {
			return 'NULL';
		} else {
			throw new Error(`Unsupported type ${typeof value}`);
		}
	}
}

module.exports = Database;