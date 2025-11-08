// schedule-data-rh.js
// Plantilla para la carrera Recursos Humanos (matutino)

export const classDuration = 50;

export const schedule = [
    // Lunes
    [
        { time: [7, 0], name: "Fundamentos de RH", teacher: "GARCIA MARTINEZ ANA" },
        { time: [7, 50], name: "Comunicación organizacional", teacher: "PEREZ LOPEZ MARIA" },
        { time: [8, 40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
        { time: [9, 0], name: "Legislación laboral", teacher: "LOPEZ RIVERA JUAN" },
        { time: [9, 50], name: "Gestión del talento", teacher: "CASTRO MENDIVIL ARIADNA" },
        { time: [10, 40], name: "Receso", teacher: "Pausa de 10 Minutos", duration: 10 }
    ],
    // Martes
    [
        { time: [7, 0], name: "Psicología del trabajo", teacher: "MONJARAS FONTES BERTHA ADRIANA" },
        { time: [7, 50], name: "Comunicación organizacional", teacher: "PEREZ LOPEZ MARIA" },
        { time: [8, 40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
        { time: [9, 0], name: "Reclutamiento y selección", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" },
        { time: [9, 50], name: "Reclutamiento y selección", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" },
        { time: [10, 40], name: "Receso", teacher: "Pausa de 10 Minutos", duration: 10 }
    ],
    // Miércoles
    [
        { time: [7, 0], name: "Reclutamiento y selección", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" },
        { time: [7, 50], name: "Gestión del talento", teacher: "CASTRO MENDIVIL ARIADNA" },
        { time: [8, 40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
        { time: [9, 0], name: "Psicología del trabajo", teacher: "MONJARAS FONTES BERTHA ADRIANA" },
        { time: [9, 50], name: "Ética profesional", teacher: "OROS GUERRERO YESSICA" },
        { time: [10, 40], name: "Receso", teacher: "Pausa de 10 Minutos", duration: 10 }
    ],
    // Jueves
    [
        { time: [7, 0], name: "Legislación laboral", teacher: "LOPEZ RIVERA JUAN" },
        { time: [7, 50], name: "Gestión del talento", teacher: "CASTRO MENDIVIL ARIADNA" },
        { time: [8, 40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
        { time: [9, 0], name: "Compensaciones y beneficios", teacher: "GONZALEZ FIGUEROA CARLOS MANUEL" },
        { time: [9, 50], name: "Compensaciones y beneficios", teacher: "SANDOVAL ONTIVEROS HUGO" },
        { time: [10, 40], name: "Receso", teacher: "Pausa de 10 Minutos", duration: 10 }
    ],
    // Viernes
    [
        { time: [7, 0], name: "Libre", teacher: "" },
        { time: [7, 50], name: "Comunicación organizacional", teacher: "PEREZ LOPEZ MARIA" },
        { time: [8, 40], name: "Receso", teacher: "Pausa de 20 Minutos", duration: 20 },
        { time: [9, 0], name: "Ética profesional", teacher: "OROS GUERRERO YESSICA" },
        { time: [9, 50], name: "Proyecto de RH", teacher: "GONZALEZ FIGUEROA CARLOS MANUEL" },
        { time: [10, 40], name: "Receso", teacher: "Pausa de 10 Minutos", duration: 10 }
    ]
];
