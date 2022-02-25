use wasm_bindgen::prelude::*;

use std::include_str;
use std::vec::Vec;

#[derive(Debug)]
struct Letter {
	letter: String,
	garbage: Vec<String>,
	confirmed: bool
}

#[derive(Debug)]
struct IndexedLetter {
	letter: String,
	index: usize
}

impl Letter {
	fn create_struct(character: &str) -> Letter {
		Letter {
			letter: String::from(character),
			garbage: Vec::new(),
			confirmed: false
		}
	}
}

impl IndexedLetter {
	fn create_struct(character: String, index: usize) -> IndexedLetter {
		IndexedLetter {
			letter: character,
			index: index
		}
	}
}

/** Identifier:
* 2: right word right place
* 1: right word wrong place
* 0: wrong word wrong place
*/

/*
	In Final Check:

	check if green characters are the way they are
	check if garbage array not matching
	check if word contains possible characters
*/

fn parse_results(result: String, word: &mut [Letter; 5], green_characters: &mut Vec<IndexedLetter>, possible_characters: &mut Vec<IndexedLetter>, banned_characters: &mut Vec<IndexedLetter>, are_green: &mut bool, are_yellow: &mut bool) {
	let split = result.trim().split("-");

	let result_vec: Vec<&str> = split.collect();

	for i in 0..result_vec.len() {
		match result_vec[i].parse::<u8>().unwrap() {
			2 => {
				green_characters.push(IndexedLetter::create_struct(word[i].letter.clone(), i));
				word[i].confirmed = true;
				*are_green = true;
			}
			1 => {
				possible_characters.push(IndexedLetter::create_struct(word[i].letter.clone(), i));
				word[i].garbage.push(word[i].letter.clone());
				*are_yellow = true;
			}
			0 => {
				banned_characters.push(IndexedLetter::create_struct(word[i].letter.clone(), i));
			}
			_ => unreachable!()
		}
	}
}

fn is_doubled(searching_character: &String, character_vec: &mut Vec<IndexedLetter>) -> bool {
	for i in 0..character_vec.len() {
		if searching_character == &character_vec[i].letter {
			return true;
		}
	}
	return false;
}

#[wasm_bindgen]
pub struct Wordgle {
	first_round: bool,
	green_characters: Vec<IndexedLetter>,
	possible_characters: Vec<IndexedLetter>,
	banned_characters: Vec<IndexedLetter>,
	words: String,
	word_vec: Vec<String>,
	word: [Letter; 5],
	are_green: bool,
	are_yellow: bool
}

#[wasm_bindgen]
impl Wordgle {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Wordgle {
		Wordgle {
			first_round: true,
			green_characters: Vec::new(),
			possible_characters: Vec::new(),
			banned_characters: Vec::new(),
			words: String::from(include_str!("words.txt")),
			word_vec: Vec::new(),
			word: [Letter::create_struct("l"), Letter::create_struct("a"), Letter::create_struct("r"), Letter::create_struct("e"), Letter::create_struct("s")],
			are_green: false,
			are_yellow: false
		}
	}

	pub fn init_vec(&mut self) {
		let temp_vec: Vec<&str> = self.words.lines().collect();
		for i in 0..temp_vec.len() {
			self.word_vec.push(String::from(temp_vec[i]));
		}
	}

	pub fn calculate(&mut self, results: &str, to_continue: bool) -> String {
		//handle cases

		let mut do_rep = true;

		if !self.first_round {
			if to_continue {
				parse_results(String::from(results).clone(), &mut self.word, &mut self.green_characters, &mut self.possible_characters, &mut self.banned_characters, &mut self.are_green, &mut self.are_yellow);
			}

			let mut green_char = true;
			let mut contains_yellow = false;
			let mut no_garbage = true;
			let mut no_banned_chars = true;

			let mut i = 0;

			//loop through dictionary
			while i < self.word_vec.len() {

				//loop through characters of current word in dictionary
				//check for green
				if self.are_green == true {
					for my_index in 0..self.word.len() {
						if self.word[my_index].confirmed == true {
							if self.word[my_index].letter != String::from(self.word_vec[i].chars().nth(my_index).unwrap()) {
								green_char = false;
								break;
							} else {
								green_char = true;
							}
						}
					}
				} else {
					green_char = true;
				}

				//check if yellow characters are in word
				if self.are_yellow == true {
					//check for possible characters shown by yellow chars
					for o in 0..self.possible_characters.len() {
						//WORD DOES NOT CONTAIN THESE CHARACTERS, DEFINITE FALSE
						if !self.word_vec[i].contains(&self.possible_characters[o].letter) {
							contains_yellow = false;
							break;
						} else {
							contains_yellow = true;
						}
					}
				} else {
					contains_yellow = true;
				}

				//check for garbage
				let mut exit = false;
				for my_index in 0..self.word.len() {
					//check for characters that could have previously known to NOT BE VALID due to yellow chars
					for g in 0..self.word[my_index].garbage.len() {
						if self.word[my_index].garbage[g] != String::from(self.word_vec[i].chars().nth(my_index).unwrap()) {
							no_garbage = true;
						} else {
							no_garbage = false;
							exit = true;
							break;
						}
					}
					if exit == true {
						break;
					}
				}

				//i have no life:

				//check for banned characters shown by green chars
				let mut exit = false;
				if self.are_green == true {
					//find if green character is doubled
					for o in 0..self.banned_characters.len() {
						if !is_doubled(&self.banned_characters[o].letter, &mut self.green_characters) && !is_doubled(&self.banned_characters[o].letter, &mut self.possible_characters) {
							//if it is NOT
							//calculate normally
							if self.word_vec[i].contains(&self.banned_characters[o].letter) {
								no_banned_chars = false;
								break;
							} else {
								no_banned_chars = true;
							}
						} else {
							//if it IS
							//calculate edge case
							for (ic, vec_char) in self.word_vec[i].chars().enumerate() {
								if self.banned_characters[o].letter == String::from(vec_char) && self.banned_characters[o].index == ic { //my brain died here
									for b in 0..self.banned_characters.len() {
										if self.banned_characters[b].letter == String::from(vec_char) {
											exit = true;
											no_banned_chars = false;
											break;
										} else {
											no_banned_chars = true;
										}
									}
								}
								if exit == true {
									break;
								}
							}
							if exit == true {
								break;
							}
						}
					}
				} else {
					//find if yellow character is doubled
					for o in 0..self.banned_characters.len() {
						if !is_doubled(&self.banned_characters[o].letter, &mut self.possible_characters) {
							if self.word_vec[i].contains(&self.banned_characters[o].letter) {
								no_banned_chars = false;
								break;
							} else {
								no_banned_chars = true;
							}
						} else {
							for (ic, vec_char) in self.word_vec[i].chars().enumerate() {
								if self.banned_characters[o].letter == String::from(vec_char) && self.banned_characters[o].index == ic {
									for b in 0..self.banned_characters.len() {
										if self.banned_characters[b].letter == String::from(vec_char) {
											exit = true;
											no_banned_chars = false;
											break;
										} else {
											no_banned_chars = true;
										}
									}
								}
								if exit == true {
									break;
								}
							}
							if exit == true {
								break;
							}
						}
					}
				}

				//for debug purposes
				//println!("{}", green_char);
				//println!("{}", contains_yellow);
				//println!("{}", no_garbage);
				//println!("{}", no_banned_chars);
						
				//final check + confirm word
				if green_char && contains_yellow && no_garbage && no_banned_chars {
					for a in 0..self.word.len() {
						self.word[a].letter = String::from(self.word_vec[i].chars().nth(a).unwrap());
					}
					self.word_vec.remove(i);
					break;
				} else {
					//reached end of current loop without finding answer. SEARCH AGAIN AUTOMATICALLY!
					if i == (self.word_vec.len() - 1) || i == (self.word_vec.len() - 2) {
						do_rep = false;
					}
					self.word_vec.remove(i);
					i += 1;
				}
			}
		} else {
			self.first_round = false;
		}

		if do_rep == true {
			let mut best_guess = String::new();

			for i in 0..self.word.len() {
				best_guess += &self.word[i].letter;
			}

			//println!("{:#?}", word);

			return best_guess;
		} else {
			return self.calculate(results.clone(), true);
		}
	}
}

/*
fn main() {
	let mut wordgle = Wordgle::new();
	wordgle.init_vec();
	println!("{}", wordgle.calculate("init", true));
	println!("{}", wordgle.calculate("2-0-0-0-1", true));
	println!("{}", wordgle.calculate("2-0-1-1-2", true));
	println!("{}", wordgle.calculate("2-2-2-2-2", true));
}
*/