// schedule-data-contV.js
// Plantilla para la carrera Contabilidad (vespertino)

export const classDuration = 50;

export const schedule = [
    [
        { time: [14, 0], name: "Contabilidad básica", teacher: "MARTINEZ SANCHEZ LUCIA" },
        { time: [14, 50], name: "Matemáticas financieras", teacher: "GOMEZ PEREZ CARLOS" },
        { time: [15, 40], name: "Receso", teacher: "Pausa", duration: 20 },
        { time: [16, 0], name: "Contabilidad intermedia", teacher: "LOPEZ RIVERA JUAN" }
    ],
    [
        { time: [14, 0], name: "Matemáticas financieras", teacher: "GOMEZ PEREZ CARLOS" },
        { time: [14, 50], name: "Auditoría básica", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" },
        { time: [15, 40], name: "Receso", teacher: "Pausa", duration: 20 },
        { time: [16, 0], name: "Auditoría básica", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" }
    ],
    [
        { time: [14, 0], name: "Auditoría básica", teacher: "SANZ SALAZAR FERNANDO HUMBERTO" },
        { time: [14, 50], name: "Tesorería y finanzas", teacher: "CASTRO MENDIVIL ARIADNA" },
        { time: [15, 40], name: "Receso", teacher: "Pausa", duration: 20 }
    ],
    [
        { time: [14, 0], name: "Contabilidad intermedia", teacher: "LOPEZ RIVERA JUAN" },
        { time: [14, 50], name: "Tesorería y finanzas", teacher: "CASTRO MENDIVIL ARIADNA" },
        { time: [15, 40], name: "Receso", teacher: "Pausa", duration: 20 }
    ],
    [
        { time: [14, 0], name: "Proyecto de Contabilidad", teacher: "MARTINEZ SANCHEZ LUCIA" },
        { time: [14, 50], name: "Ética profesional", teacher: "OROS GUERRERO YESSICA" }
    ]
];
