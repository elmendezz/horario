// schedule-data-5AEV.js
// Grupo 5AEV — vespertino — excerpt from all-horarios (ELECT)
// 5AEV (ELECT)
// TALLER ELECTRÓNICA - LAB 3
// PROF. MORALES ANA
// SISTEMAS EMBEBIDOS - AULA 20
// PROF. TORRES EDUARDO

export const classDuration = 50;

export const schedule = [
	// Lunes
	[
		{ time: [14,0], name: "Taller Electrónica", teacher: "MORALES ANA" },
		{ time: [14,50], name: "Sistemas Embebidos", teacher: "TORRES EDUARDO" },
		{ time: [15,40], name: "Receso", teacher: "Pausa", duration: 20 }
	],
	// Martes
	[
		{ time: [14,0], name: "Sistemas Embebidos", teacher: "TORRES EDUARDO" },
		{ time: [14,50], name: "Laboratorio de Sistemas", teacher: "MORALES ANA" }
	],
	// Miércoles
	[
		{ time: [14,0], name: "Electrónica Digital", teacher: "TORRES EDUARDO" },
		{ time: [14,50], name: "Matemáticas Aplicadas V", teacher: "SANTOS CARLOS" }
	],
	// Jueves
	[
		{ time: [14,0], name: "Proyecto Integrador Elect.", teacher: "VARAS JUAN" }
	],
	// Viernes
	[
		{ time: [14,0], name: "Laboratorio de Sistemas", teacher: "MORALES ANA" }
	]
];
