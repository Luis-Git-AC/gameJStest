const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',  // Fondo negro sólido
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 }, // Gravedad para simular plataformas
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
let tilesSuelo = []; // Array para almacenar los tiles de suelo
let distanciaDePersecucion = 200;  // Distancia a la que el enemigo comienza a perseguir al jugador

function preload() {
  // Cargar las imágenes del jugador, suelo y enemigo
  this.load.image('jugador', 'assets/player/character_01.png');
  this.load.image('suelo', 'assets/tiles/tile_01.png');  // Asegúrate de que el tile de suelo esté en esa ruta
  this.load.image('enemigo', 'assets/enemies/enemy_01.png');  // Cargar el sprite del enemigo
}

function create() {
  // Crear el jugador en el escenario
  jugador = this.physics.add.sprite(100, 450, 'jugador');
  jugador.setBounce(0.2); // Hacer que rebote ligeramente
  jugador.setCollideWorldBounds(true); // Para que no se salga de la pantalla

  // Crear el suelo con tiles
  suelo = this.physics.add.staticGroup();
  
  // Añadir varios tiles de suelo en una fila continua (con 16px de ancho cada tile)
  const tileWidth = 16;  // Cada tile tiene un tamaño de 16x16
  const totalWidth = 800; // Ancho total de la pantalla
  
  // Colocar los tiles de suelo de manera continua, sin huecos
  for (let i = 0; i < totalWidth; i += tileWidth) {
    const tile = suelo.create(i, 568, 'suelo'); // Colocamos el suelo al final de la pantalla sin huecos
    tilesSuelo.push(tile); // Guardar cada tile para poder borrarlo más tarde
  }

  // Crear la rampa escalonada (final de la pantalla hacia la derecha)
  const rampStartX = totalWidth - 100; // Empezamos la rampa un poco antes del final
  const rampHeight = 50; // Cuánto queremos que suba la rampa
  
  // Añadir tiles en forma de rampa
  for (let i = 0; i < rampHeight; i++) {
    suelo.create(rampStartX + i * tileWidth, 568 - i * tileWidth, 'suelo');
  }

  // Eliminar los últimos 6 tiles de la parte derecha (debajo de la rampa)
  const tilesAEliminar = 6;
  for (let i = 0; i < tilesAEliminar; i++) {
    tilesSuelo[tilesSuelo.length - 1 - i].destroy();  // Borrar los últimos tiles de la derecha
  }

  // Asegurar que el jugador colisione con el suelo y la rampa
  this.physics.add.collider(jugador, suelo);

  // Crear el enemigo
  enemigo = this.physics.add.sprite(600, 450, 'enemigo');
  enemigo.setBounce(0.2);  // Similar al jugador, puede rebotar un poco
  enemigo.setCollideWorldBounds(true);  // Para que no se salga del borde

  // Añadir las teclas de control
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  // Movimiento lateral
  if (cursors.left.isDown) {
    jugador.setVelocityX(-160); // Mover a la izquierda
  } else if (cursors.right.isDown) {
    jugador.setVelocityX(160); // Mover a la derecha
  } else {
    jugador.setVelocityX(0); // Detener el movimiento
  }

  // Lógica de salto
  if (cursors.up.isDown && jugador.body.touching.down) {
    jugador.setVelocityY(-330); // Salto
  }

  // Lógica de persecución del enemigo
  const distancia = Phaser.Math.Distance.Between(jugador.x, jugador.y, enemigo.x, enemigo.y);
  if (distancia < distanciaDePersecucion) {
    // Si el enemigo está lo suficientemente cerca del jugador, lo persigue
    if (enemigo.x < jugador.x) {
      enemigo.setVelocityX(100);  // Moverse a la derecha
    } else if (enemigo.x > jugador.x) {
      enemigo.setVelocityX(-100); // Moverse a la izquierda
    }
  } else {
    // Si el enemigo está lejos, se detiene
    enemigo.setVelocityX(0);
  }
}
