const app           = require('express')();
const express       = require('express');
const http          = require('http').Server(app);
const io            = require('socket.io')(http);
const bodyParser    = require('body-parser');
const MongoClient   = require('mongodb').MongoClient;
const URLTOCON      = require('./config').URLTOCON;
const PORT          = 3000;
var db;

MongoClient.connect(URLTOCON, (err, database) => {
  if (err) return console.log(err);
  db = database;

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log(`Un usuario se ha conectado`);
  socket.on('chat message', function(msg){
 
    io.emit('chat message', msg);

    db.collection('mensajes').find({entrada:msg.message}).toArray((err, result) => {
      if (err) return console.log(err)

      var salida;
      console.log(typeof result[0]);
      if(typeof result[0] !== 'undefined' )
        salida = result[0].salida;
      else
        salida = 'No se como contestar.';

      var botmsg = {
        message: salida,
        username: 'BOS.IO',
        time: new Date()
      }
      
      io.emit('chat message', botmsg);

    })

  });

  socket.on('disconnect', function(){
    console.log('Usuario desconectado');
  });

  socket.on('add user', (username)=>{
    console.log(`${username} se ha conectado!`)
  })
});

/* Events */

app.get("/getmen", function(req, res ){
    db.collection('mensajes').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.json(result);
    })
});


// TEMPORALES

app.get('/seed/:tipo/:entrada/:salida', (req,res) =>{

  if(req.params.salida == undefined)
    req.params.salida = 'VENIA VACIO';
  var mensaje = {
      entrada:req.params.entrada.toString(),
      salida:req.params.salida.toString()
    }


  if(req.params.tipo.toString() == "C"){
  db.collection('mensajes').save(mensaje,(err,result)=>{
    if(err) return console.log(err);
    console.log(`save '${mensaje.entrada}' to database`);
    res.redirect('/getmen');
  });

  }else if(req.params.tipo.toString() == "D"){
  
    db.collection('mensajes')
    .remove({entrada: mensaje.entrada}, (err, result) => {
        if (err) return res.send(err)
        console.log('Deleted', req.params.entrada);
        res.redirect('/getmen');
    })
  }

});
