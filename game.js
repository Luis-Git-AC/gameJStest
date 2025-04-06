const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },  // Desactivamos la gravedad global
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let jugador, cursors, suelo, enemigo;
let tilesSuelo = [];  // Array para almacenar los tiles de suelo
let distanciaDePersecucion = 200;  // Distancia a la que el enemigo comienza a perseguir al jugador
let vidasJugador = 3;  // El jugador comienza con 3 vidas
let vidasEnemigo = 1;  // El enemigo tiene 1 vida
let textoVidas;  // Variable para mostrar las vidas del jugador
let textoMonedas; // Texto que muestra la cantidad de monedas
let monedas; // Grupo de monedas
let monedasRecogidas = 0;  // Contador de monedas
let tiempoUltimoAtaqueEnemigo = 0;  // Para controlar el tiempo entre los ataques del enemigo
let tiempoUltimoAtaqueJugador = 0;  // Para controlar el tiempo entre los ataques del jugador

function preload() {
  // Cargar las imágenes del jugador, suelo, enemigo y moneda
  this.load.image('jugador', 'assets/player/character_01.png');
  this.load.image('suelo', 'assets/tiles/tile_01.png');
  this.load.image('enemigo', 'assets/enemies/enemy_01.png');
  this.load.image('moneda', 'assets/items/coin.png');
}

function create() {
  // Crear el jugador
  jugador = this.physics.add.sprite(100, 450, 'jugador');
  jugador.setBounce(0.2);
  jugador.setCollideWorldBounds(true);
  jugador.setGravityY(500);

  // Crear el suelo
  suelo = this.physics.add.staticGroup();
  const tileWidth = 16;
  const totalWidth = 800;
  for (let i = 0; i < totalWidth; i += tileWidth) {
    const tile = suelo.create(i, 568, 'suelo');
    tilesSuelo.push(tile);
  }

  // Crear la rampa escalonada
  const rampStartX = totalWidth - 100;
  const rampHeight = 50;
  for (let i = 0; i < rampHeight; i++) {
    suelo.create(rampStartX + i * tileWidth, 568 - i * tileWidth, 'suelo');
  }

  // Eliminar los últimos 6 tiles de la parte derecha
  const tilesAEliminar = 6;
  for (let i = 0; i < tilesAEliminar; i++) {
    tilesSuelo[tilesSuelo.length - 1 - i].destroy();
  }

  // Asegurar que el jugador colisione con el suelo
  this.physics.add.collider(jugador, suelo);

  // Crear el enemigo
  enemigo = this.physics.add.sprite(600, 450, 'enemigo');
  enemigo.setBounce(0.2);
  enemigo.setCollideWorldBounds(true);
  enemigo.setGravityY(500);
  this.physics.add.collider(enemigo, suelo);

  // Crear las monedas (sin gravedad)
  monedas = this.physics.add.staticGroup();  // Usamos staticGroup para monedas
  // Colocamos las monedas en lugares fijos
  monedas.create(200, 450, 'moneda');
  monedas.create(400, 450, 'moneda');
  monedas.create(600, 450, 'moneda');
  
  
  // Asegurar que las monedas no se muevan
  monedas.children.iterate(function (moneda) {
    moneda.setImmovable(true);  // Asegura que las monedas no se muevan
  });

  // Permitir que las monedas sean recogidas
  this.physics.add.collider(jugador, monedas, recogerMoneda, null, this);

  // Añadir las teclas de control
  cursors = this.input.keyboard.createCursorKeys();

  // Mostrar las vidas y las monedas del jugador
  textoVidas = this.add.text(16, 16, 'Vidas: 3', {
    fontSize: '32px',
    fill: '#fff'
  });

  textoMonedas = this.add.text(16, 50, 'Monedas: 0', {
    fontSize: '32px',
    fill: '#fff'
  });
}

function update(time) {
  // Movimiento lateral del jugador
  if (cursors.left.isDown) {
    jugador.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    jugador.setVelocityX(160);
  } else {
    jugador.setVelocityX(0);
  }

  // Lógica de salto del jugador
  if (cursors.up.isDown && jugador.body.touching.down) {
    jugador.setVelocityY(-330);
  }

  // Lógica de persecución del enemigo
  const distancia = Phaser.Math.Distance.Between(jugador.x, jugador.y, enemigo.x, enemigo.y);
  if (distancia < distanciaDePersecucion) {
    if (enemigo.x < jugador.x) {
      enemigo.setVelocityX(100);
    } else if (enemigo.x > jugador.x) {
      enemigo.setVelocityX(-100);
    }
  } else {
    enemigo.setVelocityX(0);
  }

  // Comprobación de colisión entre jugador y enemigo
  if (Phaser.Geom.Intersects.RectangleToRectangle(jugador.getBounds(), enemigo.getBounds())) {
    if (jugador.body.velocity.y > 0) {
      if (vidasEnemigo > 0) {
        vidasEnemigo -= 1;
        enemigo.setTint(0xff0000);
        this.time.delayedCall(300, () => {
          enemigo.clearTint();
        });
      }
    } else {
      if (vidasJugador > 0 && time > tiempoUltimoAtaqueEnemigo + 3000 && vidasEnemigo > 0) {
        vidasJugador -= 1;
        textoVidas.setText('Vidas: ' + vidasJugador);
        jugador.setTint(0xff0000);
        this.time.delayedCall(300, () => {
          jugador.clearTint();
        });
        tiempoUltimoAtaqueEnemigo = time;
      }
    }
  }

  // Si las vidas del jugador llegan a 0
  if (vidasJugador <= 0) {
    textoVidas.setText('GAME OVER');
    jugador.setVelocityX(0);
    enemigo.setVelocityX(0);
  }

  // Si el enemigo se queda sin vidas
  if (vidasEnemigo <= 0) {
    enemigo.setAlpha(0);
    enemigo.setImmovable(false);
    enemigo.body.enable = false;
  }
}

function recogerMoneda(jugador, moneda) {
  moneda.disableBody(true, true);
  monedasRecogidas++;
  textoMonedas.setText('Monedas: ' + monedasRecogidas);
}
