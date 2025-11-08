// schedule-data-3BEV.js
// Grupo 3BEV — vespertino — excerpt from all-horarios (ELECT)
// 3BEV (ELECT)
// TALLER ELECT. 1 - SALA 5
// PROF. PEREZ JUAN CARLOS
// CIRCUITOS ELÉCTRICOS - LAB
// PROF. RAMIREZ LUCIA

export const classDuration = 50;

export const schedule = [
	// Lunes
	[
		{ time: [14,0], name: "Taller Elect. 1", teacher: "PEREZ JUAN CARLOS" },
		{ time: [14,50], name: "Circuitos Eléctricos", teacher: "RAMIREZ LUCIA" },
		{ time: [15,40], name: "Receso", teacher: "Pausa", duration: 20 },
		{ time: [16,0], name: "Matemáticas Aplicadas V", teacher: "GOMEZ MARIA" }
	],
	// Martes
	[
		{ time: [14,0], name: "Circuitos Eléctricos", teacher: "RAMIREZ LUCIA" },
		{ time: [14,50], name: "Taller Elect. 1", teacher: "PEREZ JUAN CARLOS" }
	],
	// Miércoles
	[
		{ time: [14,0], name: "Formación Profesional", teacher: "SAAVEDRA LUIS" },
		{ time: [14,50], name: "Laboratorio de Electrónica", teacher: "RAMIREZ LUCIA" }
	],
	// Jueves
	[
		{ time: [14,0], name: "Matemáticas Aplicadas V", teacher: "GOMEZ MARIA" },
		{ time: [14,50], name: "Proyecto Integrador Elect.", teacher: "PEREZ JUAN CARLOS" }
	],
	// Viernes
	[
		{ time: [14,0], name: "Laboratorio de Electrónica", teacher: "RAMIREZ LUCIA" }
	]
];
