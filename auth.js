'use strict'
const bcrypt = require('bcryptjs')
const saltRounds = 12

exports.hash = password => {
	return new Promise((res, rej) => {
		bcrypt.hash(password, saltRounds, (err, hash) => {
			if (err) rej('cannot hash the password')
			else res(hash)
		})
	})
}

exports.check = (inputPassword, storedPassword, callback) => {
	return new Promise((resolve, rej) => {
		bcrypt.compare(inputPassword, storedPassword, (err, res) => {
			if (err) rej('error comparing')
			else resolve(res)
		})
	})
}
