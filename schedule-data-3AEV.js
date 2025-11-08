// schedule-data-3AEV.js
// Grupo 3AEV — vespertino — excerpt from all-horarios (ELECT)
// Pensamiento Matemático III
// OLEA GONZALEZ OMAR ISMAEL
// Humanidades II
// SANCHEZ LUCERO TATIANA
// Lengua y Comunicación III
// OLACHEA RODRIGUEZ FELICIA
// Formacion Socioemocional III
// RIOS SANCHEZ RAYMUNDO CARLOS

export const classDuration = 50;

export const schedule = [
	// Lunes (vespertino placeholder)
	[
		{ time: [14,0], name: "Pensamiento Matemático III", teacher: "OLEA GONZALEZ OMAR ISMAEL" },
		{ time: [14,50], name: "Humanidades II", teacher: "SANCHEZ LUCERO TATIANA" },
		{ time: [15,40], name: "Receso", teacher: "Pausa", duration: 20 },
		{ time: [16,0], name: "Lengua y Comunicación III", teacher: "OLACHEA RODRIGUEZ FELICIA" },
		{ time: [16,50], name: "Formación Socioemocional III", teacher: "RIOS SANCHEZ RAYMUNDO CARLOS" }
	],
	// Martes
	[
		{ time: [14,0], name: "Humanidades II", teacher: "SANCHEZ LUCERO TATIANA" },
		{ time: [14,50], name: "Lengua y Comunicación III", teacher: "OLACHEA RODRIGUEZ FELICIA" },
		{ time: [15,40], name: "Receso", teacher: "Pausa", duration: 20 }
	],
	// Miércoles
	[
		{ time: [14,0], name: "Pensamiento Matemático III", teacher: "OLEA GONZALEZ OMAR ISMAEL" },
		{ time: [14,50], name: "Inglés III", teacher: "AVILA MAYELA" }
	],
	// Jueves
	[
		{ time: [14,0], name: "Formación Socioemocional III", teacher: "RIOS SANCHEZ RAYMUNDO CARLOS" },
		{ time: [14,50], name: "Ecosistemas: Interacciones y dinámica", teacher: "VARA LOPEZ JOSE ALBERTO" }
	],
	// Viernes
	[
		{ time: [14,0], name: "Lengua y Comunicación III", teacher: "OLACHEA RODRIGUEZ FELICIA" }
	]
];
