'use strict'

// dependencies
const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session)
const bodyParser = require('body-parser')
const app = express()

const routes = require('./routes')
// const auth = require('./auth')
// const sockets = require('./sockets')

const port = 3001

// string helper functions
String.prototype.isValidEmail = function() {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	return re.test(this.toLowerCase())
}

String.prototype.isOnlyWhitespace = function() {
	if (this === '') return true
	return this.replace(/\s/g, '').length === 0
}

const server = require('http').Server(app)

// mongodb
mongoose.Promise = global.Promise
mongoose.connect(
	'mongodb://localhost/hangryDB',
	{
		useMongoClient: true
	}
)
var db = mongoose.connection

db.once('open', async () => {
	console.log('Connected to MongoDB at mongodb://localhost/hangryDB')
})

// sessions
const cookieExpire = 1000 * 60 * 60 * 24 * 7 // 1 week
app.set('trust proxy', 1)

const sessionMiddleware = session({
	name: 'session_id',
	secret: 'vMDwy1KQ4M1zu5y1qfQU4B83kMyTdvgZt9smCC1BZfESDGcRRgaMAnzRT6sl4wFX',
	resave: true,
	store: new MongoStore({
		mongooseConnection: mongoose.connection
	}),
	cookie: {
		httpOnly: true,
		maxAge: cookieExpire,
		path: '/',
		secure: false
	},
	rolling: true,
	unset: 'destroy'
})

// sockets.init(server, sessionMiddleware)

app.use(sessionMiddleware)
app.use(
	bodyParser.urlencoded({
		extended: true
	})
)
app.use(bodyParser.json())

app.use((req, res, next) => {
	var allowedOrigins = ['http://localhost:3000']
	var origin = req.headers.origin

	if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader('Access-Control-Allow-Origin', origin)
	}
	res.header('Access-Control-Allow-Credentials', 'true')
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept'
	)
	next()
})

routes(app)

server.listen(port, () => {
	console.log('Hangry API is live on port ' + port)
})
