module.exports = app => {
	const controllers = require('./controllers')
	const middleware = require('./middleware')

	app.get('/ping', (_, res) => {
		res.json('pong')
	})
}
