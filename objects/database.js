const mysql = require('mysql2');

class Database {

	connection;

	async connect(retryAttempt = 0) {
		try {
			this.connection = mysql.createConnection({
				host: process.env['DATABASE_HOST'],
				port: process.env['DATABASE_PORT'],
				user: process.env['DATABASE_USER'],
				password: process.env['DATABASE_PASSWORD'],
				database: process.env['DATABASE']
			});

			await new Promise((resolve, reject) => {
				this.connection.connect((err) => {
					if (err) {
						if (err.code === 'ECONNREFUSED' && retryAttempt < 3) {
							// Connection refused, retry after 5 seconds
							console.log(`Connection refused, retrying in 5 seconds (attempt ${retryAttempt + 1}/3)...`);
							setTimeout(() => {
								this.connect(retryAttempt + 1).then(resolve).catch(reject);
							}, 5000);
						} else {
							// Other error or maximum retries reached
							reject(err);
						}
					} else {
						resolve();
					}
				});
			});
		} catch (err) {
			throw err;
		}
	}

	query(sql) {
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
			}).finally(() => {
				this.connection.end()
			});
		} catch(error) {
			throw new Error("Unexpected Error in database query: ", sql, "\n\n", error);
		}
	}

	get(table, id, idField = "id") {
		return this.query(`SELECT * FROM ${table} WHERE ${idField}='${id}'`)
			.then(rows => rows[0]);
	}

	/**
	 * 
	 * @param {string} table 
	 * @param {Object} valueObject 
	 * @param {string} idField 
	 * @returns {number} the ID of the inserted row
	 */
	async set(table, valueObject, idField = 'id') {

		const fields = Object.keys(valueObject);
		const hasId = fields.includes(idField);

		let sql = `INSERT INTO \`${table}\` (`;

		if (hasId) {
			sql += `\`${idField}\`, `;
		}

		const nonIdFields = fields.filter((field) => field !== idField);

		sql += nonIdFields.join(', ');
		sql += ') VALUES (';

		if (hasId) {
			sql += `${this.escape(valueObject[idField])}, `;
		}

		nonIdFields.forEach((field) => {
			sql += `${this.escape(valueObject[field])}, `;
		});

		sql = sql.slice(0, -2); // Remove trailing comma
		sql += ')';

		sql += ` ON DUPLICATE KEY UPDATE `;
		fields.forEach((field) => {
			if (field !== idField) {
				sql += `\`${field}\` = ${this.escape(valueObject[field])}, `;
			}
		});

		sql = sql.slice(0, -2); // Remove trailing comma
		/**
		 * @type {import('mysql2').ResultSetHeader}
		 */
		const result = await this.query(sql);
		return result.insertId;
	}


	delete(table, id) {
		return this.query(`DELETE FROM ${table} WHERE id=${id}`);
	}

	createdWithin(table, interval, creatorId) {
		const query = `SELECT * FROM ${table} WHERE created >= NOW() - INTERVAL ${interval} MINUTE AND creator = ${this.escape(creatorId)}`;

		return this.query(query);
	}

	/**
	 * 
	 * @param {string} table The database Table to search
	 * @param {string} where Any filter to be applied to the query
	 * @param {number} limit A whole number to limit the number of records returned
	 * @param {"ASC" | "DESC"} order 
	 * @param {number} page 
	 * @returns 
	 */
	list(table, where = '', limit = 0, order = 'ASC', page) {

		return this.query(`SELECT * FROM ${table} ${where ? 'WHERE ' + where : ''} ORDER BY id ${order} ${limit > 0 ? 'LIMIT ' + limit + " OFFSET " + (limit * page) : ''}`);
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
		} else if (value instanceof Date) {
			return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`; // Format the date as 'YYYY-MM-DD HH:MM:SS'
		} else if (typeof value === 'boolean') {
			return value ? 1 : 0;
		} else if (value === null || value === undefined) {
			return 'NULL';
		} else {
			throw new Error(`Unsupported type ${typeof value}`);
		}
	}
}

module.exports = Database;
