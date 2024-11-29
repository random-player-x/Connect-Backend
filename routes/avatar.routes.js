const express = require('express')
const router = express.Router()
const avatarController = require('../controllers/avatar.controller')
const authmiddleware = require('../controllers/middlewares')

router.post('/signup', avatarController.AvatarSignup)
router.post('/login', avatarController.AvatarLogin)
router.post('/registration',authmiddleware, avatarController.AvatarRegistration)

module.exports = router