// schedule-data-3AE.js
// Grupo 3AE — extract from all-horarios (ELECT)
// Raw excerpt from all-horarios around the 3AE marker:
// Humanidades II
// VAZQUEZ ORTEGA NEREYDA
// Ingles III
// DE JESUS ORDOÑEZ DIONE
// 3RO M2 SUB.1 RH
// RIOS SANCHEZ RAYMUNDO CARLOS
// TALLER DE ADMON
// Ecosistemas: Interacciones, energíia y dinámica
// FEDERICO CASTRO MARIA ELENA
// Pensamiento Matemático III
// SOTO SERRANO KARINA

export const classDuration = 50;

export const schedule = [
	// Lunes (placeholder — based on Electrónica template; refine using the raw excerpt above)
	[
		{ time: [7,0], name: "Humanidades II", teacher: "VAZQUEZ ORTEGA NEREYDA" },
		{ time: [7,50], name: "Inglés III", teacher: "DE JESUS ORDOÑEZ DIONE" },
		{ time: [8,40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
		{ time: [9,0], name: "Pensamiento Matemático III", teacher: "SOTO SERRANO KARINA" },
		{ time: [9,50], name: "Ecosistemas: Interacciones y dinámica", teacher: "FEDERICO CASTRO MARIA ELENA" }
	],
	// Martes
	[
		{ time: [7,0], name: "Taller de Admon", teacher: "RIOS SANCHEZ RAYMUNDO CARLOS" },
		{ time: [7,50], name: "Humanidades II", teacher: "VAZQUEZ ORTEGA NEREYDA" },
		{ time: [8,40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
		{ time: [9,0], name: "Inglés III", teacher: "DE JESUS ORDOÑEZ DIONE" }
	],
	// Miércoles (placeholder)
	[
		{ time: [7,0], name: "Pensamiento Matemático III", teacher: "SOTO SERRANO KARINA" },
		{ time: [7,50], name: "Ecosistemas: Interacciones y dinámica", teacher: "FEDERICO CASTRO MARIA ELENA" },
		{ time: [8,40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 }
	],
	// Jueves
	[
		{ time: [7,0], name: "Humanidades II", teacher: "VAZQUEZ ORTEGA NEREYDA" },
		{ time: [7,50], name: "Taller de Admon", teacher: "RIOS SANCHEZ RAYMUNDO CARLOS" },
		{ time: [8,40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 }
	],
	// Viernes
	[
		{ time: [7,0], name: "Inglés III", teacher: "DE JESUS ORDOÑEZ DIONE" },
		{ time: [7,50], name: "Humanidades II", teacher: "VAZQUEZ ORTEGA NEREYDA" }
	]
];
