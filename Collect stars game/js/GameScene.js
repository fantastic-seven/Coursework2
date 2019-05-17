    //初始化游戏
    var server = null;
    var otherPlayer =null;

    let game = new Phaser.Game(config)
    let score = 0
    let scoreText
    let gameover = false
//游戏主要函数
    function preload(){
      this.load.image("sky","./img/sky.png")
      this.load.image("star","./img/star.png")
      this.load.image("ground","./img/platform.jpg")
      this.load.image("bomb","./img/bomb.png")
      this.load.spritesheet("dude","./img/dude.png",{frameWidth:32,frameHeight:48})

    }

    function create(){

      //init online functionality
      server = new SSMMS(true);
      
      //connect our handlers
      server.onMessage = MessageReceived;
      server.onRoomsReceived = RoomsReceived;
      server.onUserDisconnected = UserDisconnected;
      server.onError = ErrorReceived;

      server.Connect(server);
      server.GetRooms();

      this.add.image(400,300,"sky")
      platforms = this.physics.add.staticGroup()
      platforms.create(400,568,"ground").setScale(2,2).refreshBody()
      platforms.create(600,400,"ground")
      platforms.create(-10,300,"ground")
      platforms.create(600,200,"ground")
      platforms.create(0,100,"ground")
      platforms.create(50,450,"ground")

  
      player = this.physics.add.sprite(100,450,'dude') 
      player.setBounce(0.2)
      player.setCollideWorldBounds(true)
      this.physics.add.collider(player,platforms)

       this.anims.create({
        key : 'left',
        frames : this.anims.generateFrameNumbers('dude',{start : 0,end : 3}),
        frameRate : 10,
        repeat : -1
      })

      this.anims.create({
        key : 'turn',
        frames : [{key : 'dude',frame : 6}],
        frameRate : 20
      })

      this.anims.create({
        key : 'right',
        frames : this.anims.generateFrameNumbers('dude',{
          start : 5,end : 8
        }),
        frameRate : 10,
        repeat : -1
      })
      cursors = this.input.keyboard.createCursorKeys()

      stars = this.physics.add.group({
        key : 'star',
        repeat : 11,
        setXY : {x: 20,y: 0,stepX:70}
      })

      stars.children.iterate(function(child){
        //设置一下碰撞效果
        child.setBounceY(Phaser.Math.FloatBetween(0.4,0.8))
      })

      this.physics.add.collider(stars,platforms)
      this.physics.add.overlap(player,stars,collectStar,null,this)
      bombs = this.physics.add.group()
      scoreText = this.add.text(16,16,"score : 0",{fontSize: '32px',fill: "#000"})
      this.physics.add.collider(bombs,platforms)
      this.physics.add.collider(player,bombs,bombbbb,null,this)
    }
    

    function update()
    {
      if(cursors.left.isDown)
      {
        player.setVelocityX(-50)

        player.anims.play("left",true)
      }
      else if(cursors.right.isDown)
      {
        player.setVelocityX(50)

        player.anims.play("right",true)
      }
      else{
        player.setVelocityX(0)

        player.anims.play('turn')
      }
      
      if(cursors.up.isDown && player.body.touching.down){
        player.setVelocityY(-400)
      }

      //update the server
      if (otherPlayer != null)
        server.SendMessage("move", {'x':player.x, 'y':player.y});
    }
     function collectStar(player,star)
    {
      //让star实体消失
      star.disableBody(true,true)
      score += 1
      scoreText.setText("score :"+ score)
      if(stars.countActive(true) === 0)
      {
        stars.children.iterate(function(child)
        {
          child.enableBody(true,child.x,0,true,true)
        })
        var x = (player.x<400)?Phaser.Math.Between(400,800):Phaser.Math.Between(0,400)

        var bomb = bombs.create(x,16,'bomb')
        bomb.setBounce(true)
        bomb.setCollideWorldBounds(true)
        bomb.setVelocity(Phaser.Math.Between(-200,200),20)
        bomb.allowGravity = false
      }
    }

    function bombbbb()
  {
    this.physics.pause()

    //涂色，我觉得绿绿的比较好看
    player.setTint(0x00ff00)
    console.log("bombed");

    player.anims.play("turn")

    gameover = true
  }

  var MessageReceived = function(type, message){
  //console.log("received message type: " + type + ", with value: " + message);

  if (type == "player joined")
  {
    //create a new player
    otherPlayer = game.config.scene.physics.add.sprite(100,450,'dude');
  }

  if (type == "move")
  {
    //move the player
    if (otherPlayer != null)
    {
      otherPlayer.x = message.x;
      otherPlayer.y = message.y;
    }
  }
}

var RoomsReceived = function(rooms)
{
  var roomName = "fantastic7";

  console.log("rooms on the server:");
  console.log(rooms);

  var roomExists = false;

  rooms.forEach(function(room){
    if (room.name == roomName) //somebody already created the room, so we join it
    {
      server.JoinRoom(roomName);
      roomExists = true;
      //after joining, we notify the host that we have indeed joined, then start the game!
      server.SendMessage("player joined");

      //create other player
      otherPlayer = game.config.scene.physics.add.sprite(100,450,'dude');
    }
  })

  if (!roomExists) //the room does not exist, we can host!
  {
    server.CreateRoom(roomName, 2); //we can only have 2 players at any given time
  }
}

var UserDisconnected = function()
{
  //the other person left, might as well end the game

}

var ErrorReceived = function(code, description)
{
  if (code == "CNC") //happens when we cannot create a room
  {
    alert("Unfortunately we could not create a room");
  }

  if (code == "CNJ") //happens when we cannot join a room
  {
    alert("Unfortunately we could not join a room");
  } 
}
