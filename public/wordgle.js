import init, { Wordgle } from "./pkg/wordgle_web.js";
await init();

(function(){
	var playing = false;
	var loading = false;
	const playButton = document.getElementById("play");
	const possibleChars = "abcdefghijklmnopqrstuvwxyz";
	
	var gameCache;
	var canUseKeyboard = false;

	function validateKey(key){
		for (var i = 0; i < possibleChars.length; i++){
			if (key.toLowerCase() == possibleChars[i]) return true;
		}
		return false;
	}

	document.addEventListener("keydown", e => {
		if (canUseKeyboard && gameCache){
			const segment = document.getElementsByClassName("wordle-container")[1].children[1].children[gameCache.round - 1].children;
			if (e.key == "Backspace"){
				gameCache.players.p.guessThink = gameCache.players.p.guessThink.slice(0, -1);
				segment[gameCache.players.p.guessThink.length].children[0].textContent = "";
			} else if (e.key == "Enter"){
				if (gameCache.guess(gameCache.players.p.guessThink, "p")) {
					//render player
					gameCache.render(gameCache.players.p.guesses[gameCache.players.p.guesses.length - 1], 1, false);
					gameCache.players.p.guessThink = "";

					//render engine
					if (gameCache.players.b.guesses.length == 0){
						gameCache.guess(gameCache.wordgle.calculate("init", true), "b");
					} else {
						const botGame = gameCache.players.b.guesses[gameCache.players.b.guesses.length - 1];
						const input = [];
						for (var i = 0; i < botGame.length; i++){
							input.push(botGame[i].state.toString());
						}

						const result = input.join("-");
						gameCache.guess(gameCache.wordgle.calculate(result, true), "b");
					}
					gameCache.render(gameCache.players.b.guesses[gameCache.players.b.guesses.length - 1], 0, true);

					gameCache.round++;

					const botGame = gameCache.players.b.guesses[gameCache.players.b.guesses.length - 1];
					const botInput = [];
					for (var i = 0; i < botGame.length; i++){
						botInput.push(botGame[i].state.toString());
					}

					const playerGame = gameCache.players.p.guesses[gameCache.players.p.guesses.length - 1];
					const playerInput = [];
					for (var i = 0; i < playerGame.length; i++){
						playerInput.push(playerGame[i].state.toString());
					}

					if (playerInput.join("-") == "2-2-2-2-2" || botInput.join("-") == "2-2-2-2-2"){
						canUseKeyboard = false;
						gameCache.reveal(document.getElementById(gameCache.players.b.id));
					} else if (gameCache.round > 6 && (playerInput.join("-") != "2-2-2-2-2" && botInput.join("-") != "2-2-2-2-2")){
						//everyone lost
						canUseKeyboard = false
						gameCache.display(`Answer: ${gameCache.word.toUpperCase()}`);
						gameCache.reveal(document.getElementById(gameCache.players.b.id));
					}
				} else {
					for (var i = 0; i < segment.length; i++){
						segment[i].classList.add("warn");

						$(document).one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", segment[i], () => {
							for (var o = 0; o < segment.length; o++){
								segment[o].classList.remove("warn");
							}
						});
					}
				}
			} else {
				if (gameCache.players.p.guessThink.length < 5 && validateKey(e.key)) {
					gameCache.players.p.guessThink += e.key;
					segment[gameCache.players.p.guessThink.length - 1].children[0].textContent = e.key.toUpperCase();
				}
			}
		}
	});

	playButton.addEventListener("click", () => {
		if (!loading){
			if (!playing){
				playing = true;
				loading = true;
				var interval = setInterval(() => {
					if (playButton.children.length == 0){
						playButton.textContent = "RETURN";
						canUseKeyboard = true;
						playButton.blur();
						playGame("bp");
						clearInterval(interval);
					}
				});
			} else {
				playing = false;
				loading = true;
				gameCache.removeBoard(gameCache.players.b.id);
				gameCache.removeBoard(gameCache.players.p.id);
				gameCache = undefined;
				var interval = setInterval(() => {
					if (playButton.children.length == 0){
						playButton.textContent = "PLAY";
						playButton.blur();
						playGame("b");
						clearInterval(interval);
					}
				});
			}
		}
	});

	class Game {
		constructor() {
			this.wordgle = (function(){
				const engine = new Wordgle();
				engine.init_vec();
				return engine;
			})();
			this.word = (function(){
				const wordArr = words.split("\n");
				return wordArr[Math.floor(Math.random() * wordArr.length)];
			})();
			this.players = {};
			this.over = false;
			this.round = 1;
		}

		play(type) {
			this.players = {};
			switch (type) {
				case "b":
					this.players.b = {
						id: Math.floor(Math.random() * 1000).toString(),
						guesses: []
					};
					break;
				case "bp":
					this.players.b = {
						id: Math.floor(Math.random() * 1000).toString(),
						guesses: []
					}
					this.players.p = {
						id: Math.floor(Math.random() * 1000).toString(),
						guessThink: "",
						guesses: []		
					}
					break;
			}
		}

		validate(userGuess) {
			const wordArr = words.split("\n");
			for (var i = 0; i < wordArr.length; i++){
				if (wordArr[i] == userGuess){
					return true;
				}
			}
			return false;
		}

		reveal(board) {
			const column = board.children[1].children;
			for (var i = 0; i < column.length; i++){
				const letterWrapper = column[i].children;
				for (var o = 0; o < letterWrapper.length; o++){
					const letter = letterWrapper[o].children[0];
					if (this.players.b.guesses[i]){
						letter.textContent = this.players.b.guesses[i][o].letter.toUpperCase();
					}
				}
			}
		}

		display(text) {
			const displayBox = document.getElementById("notif-wrapper");
			const notif = document.getElementById("notif");

			const style = window.getComputedStyle(displayBox);
			notif.textContent = text;

			function fadeIn(){
				const opacity = style.getPropertyValue("opacity");
				if (Number(opacity) < 1){
					displayBox.style.opacity = (Number(opacity) + 0.04).toString();
					requestAnimationFrame(fadeIn);
				} else {
					setTimeout(() => {
						requestAnimationFrame(fadeOut);
					}, 800);
				}
			}
			function fadeOut(){
				const opacity = style.getPropertyValue("opacity");
				if (Number(opacity) > 0){
					displayBox.style.opacity = (Number(opacity) - 0.04).toString();
					requestAnimationFrame(fadeOut);
				}
			}

			requestAnimationFrame(fadeIn);
		}

		render(result, plr, hidden) {
			const segment = document.getElementsByClassName("wordle-container")[plr].children[1].children[this.round - 1].children;
			for (var i = 0; i < result.length; i++){
				//letter
				const letter = segment[i].children[0];
				if (!hidden){
					letter.textContent = result[i].letter.toUpperCase();
				} else {
					letter.textContent = "?";
				}

				//background color
				const background = segment[i];;
				if (result[i].state == 2){
					background.classList.add("green");
				} else if (result[i].state == 1){
					background.classList.add("yellow");
				} else {
					background.classList.add("grey");
				}
			}
		}

		setBoard(player, id) {
			const main = document.getElementById("main-content");

			const container = document.createElement("div");
			container.setAttribute("id", id);
			container.setAttribute("class", "wordle-container");

			const wordleName = document.createElement("div");
			wordleName.setAttribute("class", "wordle-name");
			const subheader = document.createElement("h1");
			subheader.setAttribute("class", "subheader");
			subheader.textContent = player;
			wordleName.appendChild(subheader);

			const wordleWrapper = document.createElement("div");
			for (var i = 0; i < 6; i++) {
				const column = document.createElement("div");
				column.setAttribute("class", "column");
				for (var w = 0; w < 5; w++) {
					const letterWrapper = document.createElement("div");
					letterWrapper.setAttribute("class", "letter-wrapper");
					const letter = document.createElement("h1");
					letter.setAttribute("class", "letter");

					letterWrapper.appendChild(letter);
					column.appendChild(letterWrapper);
				}
				wordleWrapper.appendChild(column);
			}

			container.appendChild(wordleName);
			container.appendChild(wordleWrapper);
			main.appendChild(container);

			//fade in board
			const style = window.getComputedStyle(container);
			function fadeIn(){
				const opacity = style.getPropertyValue("opacity");
				if (Number(opacity) < 1){
					container.style.opacity = (Number(opacity) + 0.04).toString();
					requestAnimationFrame(fadeIn);
				}
			}
			requestAnimationFrame(fadeIn);
		}

		removeBoard(id) {
			const board = document.getElementById(id);
			if (board){
				const style = window.getComputedStyle(board);
				function fadeOut(){
					const opacity = style.getPropertyValue("opacity");
					if (Number(opacity) > 0){
						board.style.opacity = (Number(opacity) - 0.04).toString();
						requestAnimationFrame(fadeOut);
					} else {
						board.remove();
					}
				}
				requestAnimationFrame(fadeOut);
			}
		}

		guess(userGuess, player) {
			const guessMEM = [];
			const appearances = {};
			class Character {
				constructor(letter, state) {
					this.letter = letter;
					this.state = state;
				}
			}

			for (var i = 0; i < this.word.length; i++){
				if (appearances[this.word[i]]){
					appearances[this.word[i]]++;
				} else {
					if (this.players[player].guesses.length == 0){
						appearances[this.word[i]] = 1;
					} else if (this.players[player].guesses[this.players[player].guesses.length - 1][i].state !== 2){
						appearances[this.word[i]] = 1;
					}
				}
			}

			if (this.validate(userGuess)){
				if (userGuess.length <= 5){
					for (var i = 0; i < userGuess.length; i++){
						if (userGuess[i] == this.word[i]){
							guessMEM.push(new Character(userGuess[i], 2));
						} else if (this.word.includes(userGuess[i]) && appearances[userGuess[i]] > 0){
							guessMEM.push(new Character(userGuess[i], 1));
							appearances[userGuess[i]]--;
						} else {
							guessMEM.push(new Character(userGuess[i], 0));
						}
					}
					this.players[player].guesses.push(guessMEM);
					return true;
				}
			} else {
				return false;
			}
		}
	}

	function checkWindow(){
		if (!playing){
			if (!document.hidden){
				playGame("b");
			} else {
				requestAnimationFrame(checkWindow);
			}
		}
	}

	function playGame(type){
		const game = new Game();
		game.play(type);

		if (type == "b"){
			game.setBoard("WORDGLE ENGINE", game.players.b.id);
			game.guess(game.wordgle.calculate("init", true), "b");
			loading = false;
			function next(){
				setTimeout(() => {
					const botGame = game.players.b.guesses[game.players.b.guesses.length - 1];
					const input = [];
					for (var i = 0; i < botGame.length; i++){
						input.push(botGame[i].state.toString());
					}

					game.render(botGame, 0, false);
					game.round++;

					const result = input.join("-");
					if (result !== "2-2-2-2-2"){
						if (game.round > 6) {
							game.over = true;
							game.display(`Answer: ${game.word.toUpperCase()}`);
							setTimeout(() => {
								loading = true;
								game.removeBoard(game.players.b.id);
								checkWindow();
							}, 700);
						} else {
							game.guess(game.wordgle.calculate(result, true), "b");
						}	
					} else {
						game.over = true;
						setTimeout(() => {
							loading = true;
							game.removeBoard(game.players.b.id);
							checkWindow();
						}, 700);
					}

					if (!game.over){
						if (!playing){
							next();
						}  else {
							loading = true;
							game.removeBoard(game.players.b.id);
						}
					}
				}, 700);
			}
			next();
		} else if (type == "bp"){
			gameCache = game;

			game.setBoard("WORDGLE ENGINE", game.players.b.id);
			game.setBoard("YOU", game.players.p.id);
			loading = false;
		}
	}

	playGame("b");
})();