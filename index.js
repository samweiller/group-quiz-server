let express = require('express');
let app = express();
let path = require('path');
let randomNumber = require("random-number-csprng");

let server = require('http').createServer(app);
let io = require('socket.io')(server, { wsEngine: 'ws' });
let port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom
let numUsers = 0;
let userList = [];
let responseList = [];
let rollList = [];

io.on('connection', (socket) => {
  // socket.broadcast.emit('startup', {
  //   numUser: numUsers,
  //   userList: userList,
  //   rollList: rollList
  // })
  // socket.on('connect', () => {
  //   console.log('sending startup');
  //   socket.broadcast.emit('startup', {
  //     numUser: numUsers,
  //     userList: userList,
  //     rollList: rollList
  //   })
  // })


  // when client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    // store username in the socket session for this client
    socket.username = username;
    ++numUsers;
    userList.push(username)
    
    console.log(username + " logged in");
    console.log(userList);

    // addedUser = true;
    socket.broadcast.emit('login', {
      numUsers: numUsers,
      userList: userList,
      serverResponses: responseList
    });

    // socket.broadcast.emit('response result', {serverResponses: responseList})
    console.log('LOGIN EVENT');
  });

  // when client emits 'add user', this listens and executes
  socket.on('reveal', (boolValue) => {
    // addedUser = true;
    socket.broadcast.emit('reveal answers', {
      isRevealed: boolValue
    });
    console.log('reveal EVENT');
  });

  socket.on('owner reveal', (boolValue) => {
    // addedUser = true;
    socket.broadcast.emit('reveal owner', {
      isOwnerRevealed: boolValue
    });
    console.log('owner reveal EVENT');
  });

  socket.on('send question', (data) => {
    // addedUser = true;
    socket.broadcast.emit('new question', {
      qContent: data.qContent,
      owner: data.owner
    });
    console.log('new question event');
  });

  socket.on('response', (data) => {
    let dataPack = {user: data.user, response: data.response}
    let userDidRespond = false
    responseList.forEach((r, index) => {
      console.log("List Item: " + r.response);
      console.log("List Item by: " + r.user);
      if (r.user === data.user) {
        responseList[index] = dataPack
        userDidRespond = true
      }
    })

    if (userDidRespond === false) {
      responseList.push(dataPack)
    }

    socket.broadcast.emit('response result', {serverResponses: responseList})
  })

  socket.on('clear responses', () => {
    console.log('clearing responses!')
    // responseList = []

    let clearedResponses = [];
    responseList.forEach((r) => {
      clearedResponses.push({
        user: r.user,
        response: ""
      })
    })

    socket.broadcast.emit('response result', {serverResponses: clearedResponses})
  })

  const doLogout = (name) => {
    if (userList.indexOf(name) > -1) {
      --numUsers;
      userList.splice(userList.indexOf(socket.username), 1)

      // globally announce client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        userList: userList
      });
      console.log('logged out');
    }
  }

  // when user disconnects, disconnect
  socket.on('user leave', (name) => {
    doLogout(name);
  });

  socket.on('disconnect', () => {
    doLogout(socket.username)
  })
});