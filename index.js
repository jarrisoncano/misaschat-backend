require('dotenv').config()
require('./mongoDB/connect')
const express = require('express')
const app = express()
const cors = require('cors')
const ChatModel = require('./mongoDB/chat.model')
const UserModel = require('./mongoDB/user.model')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set('PORT', process.env.PORT || 5000)

const server = app.listen(app.get('PORT'), () => {
  console.log('Server init on PORT', app.get('PORT'))
})

app.get('/',(req, res) =>{
  res.send('are you lost?')
})

app.use(function(req, res, next) {
  res.status(404)
  res.send('404: File Not Found')
})

const io = require('socket.io')(server,{
  cors:{
    origin: process.env.SOCKET_CLIENT_URL,
    methods:["POST, GET"]
  }
})

io.on('connection', (socket)=>{
  const chatsListen = ChatModel.watch()
  
  const uploadchats = async () =>{
    const chats = await ChatModel.find({})

    chats.forEach((chat) => {
      socket.on(chat._id, async (data) => {
        socket.broadcast.emit(chat._id, data)
        await ChatModel.findByIdAndUpdate(chat._id, {$push:{messages: data.message}})
      })
    })
  }

  const uploadUsers = async () =>{
    const users = await UserModel.find({})

    users.forEach((user) => {
      socket.on(user._id, () => {
        socket.broadcast.emit(user._id)
      })
    })
  }

  chatsListen.on('change', (changes) => {
    if(changes.operationType === 'insert'){
      uploadchats()
    }
  })
  
  uploadUsers()
  uploadchats()
})
