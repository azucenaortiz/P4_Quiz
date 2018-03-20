
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

/**
* Esta función devuelve una promesa que:
* -Valida que se ha introducido un valor para el parámetro
* -convierte el parámetro en un número entero
* si todo va bien, la promesa se satisface y devuelve el valor id a usuario
*
* @param id Parámetro con el índice a valirdar.
*/

const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if(typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>,`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});

};

/**
* Esta funcion convierte la llamada rl.question, que esta basada en callbacks, en una
* basada en promesas.
*
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
* Entonces la llamada a then que hay que hacer la promesa devuelta sera:
*		.then(answer => {...})
*
* Tambien colorea en rojo el texto de la pregunta, elimina espacios de principio a fin
*
* @param rl Objeto readline usado para implementar el CLI
* @param text Pregunta que hay que hacerle al usuario
*/

const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};


/**
*Muestra la ayuda.
*/
exports.helpCmd = (socket, rl) => {
	log(socket, "Commandos:'");
  	log(socket, "  h|help - Muestra esta ayuda.");
  	log(socket, "  list - Listar los quizzes existentes.");
  	log(socket, "  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket, "  add - Añadir un nuevo quiz interactivamente");
  	log(socket, "  delete <id> - Borrar el quiz indicado.");
  	log(socket, "  edit <id> - Editar el quiz indicado.");
  	log(socket, "  test <id> - Probar el quiz indicado.");
 	log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Créditos.");
  	log(socket, "  q|quit - Salir del programa.");
 	rl.prompt();
};


/**
*Lista todos los quizzes existentes en el modelo.
*/
exports.listCmd = (socket, rl) => {
	models.quiz.findAll()
	.each(quiz => {
			log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};



/**
* Muestra el quiz indicado en el parametro: la preegunta y la respuesta.
*
*@param id Clave del quiz a mostrar
*/
exports.showCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
*Añade un nuevo quiz al modelo
* Pregunta interactivamente por la pregunta y por la respuesta.
*/
exports.addCmd = (socket, rl) => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca la respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then((quiz) => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(socket, `[${colorize('Se ha añadido', 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Borra un quiz del modelo
*
* @param rl Objeto readline usado para implementar el CLI.
* @param id Clave del quiz a borrar del modelo.
*/
exports.deleteCmd = (socket, rl,id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Edita un quiz del modelo
*
* @param id Clave del quiz a editar en el modelo
*/
exports.editCmd = (socket, rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}

		process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erróneo:');
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*
*@param id Clave del quiz a probar
*/
exports.testCmd = (socket, rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		return makeQuestion(rl, `${quiz.question}? `)
		.then(answer => {
			if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
				log(socket, `Su respuesta es: `);
				log(socket, 'CORRECTA', 'green');
				rl.prompt();
			} else {
				log(socket, `Su respuesta es: `);
				log(socket, 'INCORRECTA', 'red');
				rl.prompt();
			}
		});
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erróneo.');
		error.errors.forEach(({message})=> errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});    
};

/**
*Pregunta todos los quizzes existentes en el modelo en orden aleatorio
* Se gana si se contesta a todas correctamente
*/
exports.playCmd = (socket, rl) => {
	let score = 0;
	let toBeResolved = []; //Se guardan los id de todas las preguntas
	let encuesta = [];

	models.quiz.findAll()
		.each(quiz => {
			encuesta.push(quiz);	
		})
		.then(() => {
			for (i = 0; i < encuesta.length; i++){
				toBeResolved.push(i);
			}

			const playOne = () => {
				if (toBeResolved.length === 0){
					log(socket, 'Fin');
					log(socket, 'Aciertos: ');
					biglog(socket, score, 'magenta');
					rl.prompt();
				} else {
					try{
						let id = parseInt(Math.random()*toBeResolved.length);
						const quiz = encuesta[toBeResolved[id]];
						toBeResolved.splice(id, 1);
						return makeQuestion(rl, `${quiz.question}? `)
						.then(answer => {
							if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
								score++;
								log(socket, "CORRECTA");
								log(socket, "Lleva " + score + " aciertos");
								playOne();
							} else {
								log(socket, `INCORRECTA.`);
								log(socket, 'Fin');
								log(socket, 'Aciertos: ');
								biglog(socket, score, 'magenta');
								rl.prompt();
							}
						}); 
					} catch (error){
						errorlog(socket, error.message);
						rl.prompt();
					}  
				}
			};
			playOne();
		})
		.catch(Sequelize.ValidationError, error => {
			errorlog(socket, 'El quiz es erróneo.');
			error.errors.forEach(({message})=> errorlog(socket, message));
		})
		.catch(error => {
			errorlog(socket, error.message);
		})
		.then(() => {
			rl.prompt();
		}); 
};	


/**
* MUestra los nombres de los autores de la práctica
*/
exports.creditsCmd = (socket, rl) => {
		log(socket, 'Autores de la práctica.');
     	log(socket, 'Marta Lorenzo', 'green');
     	log(socket, 'Azucena Ortiz', 'green');
     	rl.prompt();
};

/**
* Termina el programa.
*/
exports.quitCmd = (socket, rl) => {
		rl.close();
		socket.end();
};
