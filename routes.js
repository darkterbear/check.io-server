module.exports = app => {
	app.get('/ping', (_, res) => {
		res.json('pong')
	})
}
