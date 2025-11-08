// schedule-data-5AE.js
// Grupo 5AE — matutino — excerpt from all-horarios (ELECT)
// 5AE (ELECT)
// ELECTRÓNICA DIGITAL - AULA 12
// PROF. TORRES EDUARDO
// SISTEMAS DE CONTROL - AULA 14
// PROF. MORALES ANA

export const classDuration = 50;

export const schedule = [
	// Lunes
	[
		{ time: [8,0], name: "Electrónica Digital", teacher: "TORRES EDUARDO" },
		{ time: [8,50], name: "Sistemas de Control", teacher: "MORALES ANA" },
		{ time: [9,40], name: "Receso", teacher: "Pausa", duration: 20 },
		{ time: [10,0], name: "Matemáticas V", teacher: "SANTOS CARLOS" }
	],
	// Martes
	[
		{ time: [8,0], name: "Sistemas de Control", teacher: "MORALES ANA" },
		{ time: [8,50], name: "Laboratorio Digital", teacher: "TORRES EDUARDO" }
	],
	// Miércoles
	[
		{ time: [8,0], name: "Electrónica Digital", teacher: "TORRES EDUARDO" },
		{ time: [8,50], name: "Formación Ética", teacher: "LOPEZ MARÍA" }
	],
	// Jueves
	[
		{ time: [8,0], name: "Proyecto Integrador", teacher: "VARAS JUAN" },
		{ time: [8,50], name: "Matemáticas V", teacher: "SANTOS CARLOS" }
	],
	// Viernes
	[
		{ time: [8,0], name: "Laboratorio Digital", teacher: "TORRES EDUARDO" }
	]
];
