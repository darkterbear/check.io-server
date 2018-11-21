let io
const { Restaurant, User, Transaction } = require('./schemas')

module.exports = {
	init: (server, sessionMiddleware) => {
		io = require('socket.io')(server)

		io.use(function(socket, next) {
			var req = socket.handshake
			var res = {}
			sessionMiddleware(req, res, async function(err) {
				if (err) {
					console.error(err)
					let error = new Error('Internal Error')
					error.data = {
						type: 'internal_error'
					}
					return next(error)
				}

				var id = req.session._id

				if (!id || !req.session.authenticated) {
					let error = new Error('Authentication error')
					error.data = {
						type: 'authentication_error'
					}
					return next(error)
				}

				// be able to reference this restaurant later on
				const restaurant = await Restaurant.findOne({ _id: id }).exec()

				if (!restaurant) return

				socket.join(id.toString())

				return next()
			})
		})
	},
	onNearby: (customer, restaurantIds) => {
		restaurantIds.forEach(rId => {
			io.to(rId.toString()).emit('userNearby', customer)
		})
	},
	onNotNearby: (customer, restaurantIds) => {
		restaurantIds.forEach(rId => {
			io.to(rId.toString()).emit('userLeft', customer)
		})
	},
	io
}
