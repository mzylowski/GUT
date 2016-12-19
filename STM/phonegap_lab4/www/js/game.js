kamyk.monsterShooter={};
kamyk.monsterShooter.MonsterShooter = kamyk.Game.$extend({
    __init__: function (canvasID, width, height) {
        self = this;
        self.$super(canvasID, width, height);
        self.context.fillStyle = "white";
        self.context.font = "bold 16px Times";

        self.fps = 0;

        self.collisionDetector = new kamyk.CollisionDetector();
        self.inputManager = new kamyk.InputManager(self);
        self.offScreenCanvas = new kamyk.OffScreenCanvas(self);

        // monsters settings
        self.maxMonsters = 25;
        self.monsterSpawnInterval = 3000;
        self.monsterPositions = [
            [self.width/2, self.height, 0],
            [self.width/2, 0, 2],
            [0, self.height/2, 3],
            [self.width, self.height/2, 1]
        ];

        self.timeAfterLastSpawn = 0;
        self.monsters = [];
		self.shootingAngle = 0;
        self.fireballs = [];
        self.hero = new kamyk.Player(width / 2, height / 2, 100);
        self.background = new kamyk.Sprite(0, 0);
    },
    onLoaderReady: function(imageLoader) {
        self.$super(imageLoader);
        self.offScreenCanvas.addRenderable(self.background);
        self.offScreenCanvas.renderYourself();
    },
    initResources: function() {
        self.backgroundImgIndex = self.imageLoader.addURL("img/background.jpg", self.background);
        self.monsterImage = self.imageLoader.addURL("img/hero.png", undefined);
        self.fireballImage = self.imageLoader.addURL("img/fireball.png", undefined);
        self.imageLoader.addURL("img/player.png", self.hero);
        self.imageLoader.startLoading();
    },
    render: function() {
        self.offScreenCanvas.renderToMainCanvas();
        self.context.fillText("FPS: " + self.fps, 10, 50);
        if (self.hero.HP > 0) {
            self.context.fillText("HP: " + self.hero.HP, 10, 20);
            self.hero.render(self.context);
            for (var i = 0; i < self.monsters.length; i++) {
                self.monsters[i].render(self.context);
            }
            for (var i = 0; i < self.fireballs.length; i++) {
                self.fireballs[i].render(self.context);
            }
        } else {
            self.context.fillText("GAME OVER!", self.width / 2 - 50, self.height / 2);
        }
    },
    update: function (dt) {
        self.hero.update(dt);
        self.spawnMonsterIfNeeded(dt);
        self.fps = 1000 / dt;
        for (var i = 0; i < self.monsters.length; i++) {
            if (self.collisionDetector.collide(self.hero, self.monsters[i])) {
                self.monsters[i].stopMoving();
                self.monsters[i].attack(self.hero);
            } else {
                self.monsters[i].stopAttacking();
                self.monsters[i].moveTo(self.hero.x, self.hero.y);
            }
            self.monsters[i].update(dt);
        }
        for (var i = 0; i < self.fireballs.length; i++) {
            self.fireballs[i].update(dt);
            if (self.fireballs[i].x < 0 ||
                self.fireballs[i].x > self.width ||
                self.fireballs[i].y < 0 ||
                self.fireballs[i].y > self.height) {
                self.fireballs.splice(i, 1);
                i--;
            }
            for (var j = 0; j < self.monsters.length; j++) {
                if (self.collisionDetector.collide(self.fireballs[i], self.monsters[j])) {
                    self.monsters.splice(j, 1);
                    self.fireballs.splice(i, 1);
                    i--;
                }
            }
        }
    },
    spawnMonsterIfNeeded: function(dt) {
        self.timeAfterLastSpawn += dt;
        if (self.timeAfterLastSpawn > self.monsterSpawnInterval && self.monsters.length < self.maxMonsters) {
            self.timeAfterLastSpawn = 0;
            var monsterPosIndex = Math.floor(Math.random() * self.monsterPositions.length);
            self.monsters.push(new kamyk.Actor(self.monsterPositions[monsterPosIndex][0],
                self.monsterPositions[monsterPosIndex][1],
                self.imageLoader.getImage(self.monsterImage), self.monsterPositions[monsterPosIndex][2]));
        }
    },
    moveHeroAround: function() {
        if (self.hero.x == 0 && self.hero.y == 0)
            self.hero.moveTo(this.width - self.hero.sizeX, 0);
        else if (self.hero.x == this.width - self.hero.sizeX && self.hero.y == 0)
            self.hero.moveTo(this.width - self.hero.sizeX, this.height - self.hero.sizeY);
        else if (self.hero.x == this.width - self.hero.sizeX && self.hero.y == this.height - self.hero.sizeY)
            self.hero.moveTo(0, this.height - self.hero.sizeY);
        else if (self.hero.x == 0 && self.hero.y == this.height - self.hero.sizeY)
            self.hero.moveTo(0, 0);
    },
	newHeading: function (heading) {
		self.shootingAngle = heading;
	},
	shootFireball: function () {
		//var angle = Math.random() * Math.PI * 2;
		self.fireballs.push(new kamyk.Fireball(self.hero.midX, self.hero.midY,
                self.imageLoader.getImage(self.fireballImage), self.shootingAngle));
	}
});

kamyk.InputManager = Class.$extend({
    __init__: function (game) {
        game.kanwa.addEventListener("touchstart", function (evt) {
			game.shootFireball();
        }, true);
		
		var options = {frequency:1000};
		var onError = function(compassError){
			alert('Kompas error: '+ compassError.code);
		};
		if(navigator.compass!== undefined){
			var watchID = navigator.compass.watchHeading(function(heading){              
				game.newHeading(heading.trueHeading)
			;}, onError, options)
		;}
		else {
			console.error("Nie ma obiektu navigator.compass!");
		}
    }
});

var gra = undefined;
kamyk.monsterShooter.onDeviceReady = function () {
    gra = new kamyk.monsterShooter.MonsterShooter("kanwa", window.innerWidth, window.innerHeight);
    gra.start();
};
kamyk.monsterShooter.letsGo=function(){
	document.addEventListener('deviceready', kamyk.monsterShooter.onDeviceReady, false);
};
