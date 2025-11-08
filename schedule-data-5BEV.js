// schedule-data-5BEV.js
// Grupo 5BEV — vespertino — excerpt from all-horarios (ELECT)
// 5BEV (ELECT)
// ELECTRÓNICA ANALÓGICA - AULA 10
// PROF. RAMIREZ LUCIA
// TALLER DE PROYECTOS - LAB central
// PROF. PEREZ JUAN CARLOS

export const classDuration = 50;

export const schedule = [
	// Lunes
	[
		{ time: [14,0], name: "Electrónica Analógica", teacher: "RAMIREZ LUCIA" },
		{ time: [14,50], name: "Taller de Proyectos", teacher: "PEREZ JUAN CARLOS" },
		{ time: [15,40], name: "Receso", teacher: "Pausa", duration: 20 }
	],
	// Martes
	[
		{ time: [14,0], name: "Laboratorio Analógico", teacher: "RAMIREZ LUCIA" },
		{ time: [14,50], name: "Formación Ciudadana", teacher: "LOPEZ MARÍA" }
	],
	// Miércoles
	[
		{ time: [14,0], name: "Taller de Proyectos", teacher: "PEREZ JUAN CARLOS" },
		{ time: [14,50], name: "Matemáticas Aplicadas V", teacher: "SANTOS CARLOS" }
	],
	// Jueves
	[
		{ time: [14,0], name: "Electrónica Analógica", teacher: "RAMIREZ LUCIA" }
	],
	// Viernes
	[
		{ time: [14,0], name: "Proyecto Integrador Elect.", teacher: "VARAS JUAN" }
	]
];
