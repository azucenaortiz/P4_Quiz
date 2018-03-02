const {log, biglog, errorlog, colorize} = require("./out");

const model = require('./model');

/**
*Muestra la ayuda.
*/
exports.helpCmd = rl => {
	log("Commandos:'");
  	log("  h|help - Muestra esta ayuda.");
  	log("  list - Listar los quizzes existentes.");
  	log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente");
  	log("  delete <id> - Borrar el quiz indicado.");
  	log("  edit <id> - Editar el quiz indicado.");
  	log("  test <id> - Probar el quiz indicado.");
 	log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
  	log("  q|quit - Salir del programa.");
 	rl.prompt();
};


/**
*Lista todos los quizzes existentes en el modelo.
*/
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};

/**
* Muestra el quiz indicado en el parametro: la preegunta y la respuesta.
*
*@param id Clave del quiz a mostrar
*/
exports.showCmd = (rl, id) => {
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			const quiz = model.getByIndex(id);
			log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

/**
*Añade un nuevo quiz al modelo
* Pregunta interactivamente por la pregunta y por la respuesta.
*/
exports.addCmd = rl => {
	rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize('Introduzca una respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer} `);
			rl.prompt();
		});
	});
};

/**
* Borra un quiz del modelo
*
*@param id Clave del quiz a borrar del modelo
*/
exports.deleteCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

/**
* Edita un quiz del modelo
*
*@param id Clave del quiz a editar en el modelo
*/
exports.editCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
				rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer} `);
					rl.prompt();
				});
			});
		} catch (error){
			errorlog(error.message);
			rl.prompt();
		}
	}
};

/**
* Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*
*@param id Clave del quiz a probar
*/
exports.testCmd = (rl,id) => {
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);
			log(`${colorize(quiz.question, 'red')}${colorize('?', 'red')}`);
				rl.question(colorize('Introduzca la respuesta: ', 'red'), answer => {
					if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
						biglog('CORRECTO', 'green');
						rl.prompt();
					} else {
						biglog('INCORRECTO', 'red');
						rl.prompt();
					}
				});
		} catch (error){
			errorlog(error.message);
			rl.prompt();
		}
	}
    
};

/**
*Pregunta todos los quizzes existentes en el modelo en orden aleatorio
* Se gana si se contesta a todas correctamente
*/
exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = []; //Se guardan los id de todas las preguntas
	for (i = 0; i < model.count(); i++){
		toBeResolved.push(model.getByIndex(i));
	}

	const playOne = () => {
		try{ 
			if (toBeResolved.length === 0){
				log('Fin del examen. Aciertos: ');
				biglog(score, 'magenta');
				rl.prompt();
			} else {
				let id = parseInt(Math.random()*toBeResolved.length);
				const quiz = toBeResolved[id];
				rl.question(colorize(quiz.question + '? ', 'red' ), answer => {
					if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
						score++;
						log("CORRECTO - Lleva " + score + " aciertos");
						toBeResolved.splice(id, 1);
						playOne();
					} else {
						log(`INCORRECTO.`);
						log('Fin del examen. Aciertos: ');
						biglog(score, 'magenta');
						rl.prompt();
					}
				});
			}
		} catch (error){
			errorlog(error.message);
			rl.prompt();
		}
	};

	playOne();
};	


/**
* MUestra los nombres de los autores de la práctica
*/
exports.creditsCmd = rl => {
		log('Autores de la práctica.');
     	log('Marta Lorenzo', 'green');
     	log('Azucena Ortiz', 'green');
     	rl.prompt();
};

/**
* Termina el programa.
*/
exports.quitCmd = rl => {
		rl.close();
};
