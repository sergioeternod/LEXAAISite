export const expedientes = [
  {
    id: "exp-001",
    clave_oficial: "LXII-001",
    titulo: "Reforma Integral a la Ley de Seguridad Social para los Servidores Públicos del Estado de México y Municipios (ISSEMyM)",
    descripcion: "Propuesta para reestructurar el sistema de pensiones y el financiamiento del ISSEMyM para garantizar su viabilidad financiera.",
    estado_actual: "En Discusión",
    tema_principal: "Seguridad Social",
    fecha_inicio: "2025-09-05",
    score_relevancia: 0.99,
    impacto_score: 95,
    sectores_afectados: ["Servidores Públicos", "Finanzas Estatales", "Salud"],
    resumen_ia: {
      ejecutivo: "La iniciativa busca resolver la crisis financiera del ISSEMyM mediante un ajuste gradual a las cuotas y aportaciones, así como una auditoría profunda a los adeudos de municipios e instituciones estatales.",
      evidencia: [
        { chunk_id: "chk-1", texto: "Se propone un incremento escalonado del 2% en las aportaciones patronales durante los próximos 3 años." },
        { chunk_id: "chk-2", texto: "Se establecen mecanismos de retención directa de participaciones a los municipios que presenten adeudos históricos con el Instituto." }
      ]
    },
    actores: [
      { nombre: "Dip. Francisco Vázquez Rodríguez", rol: "Promovente", partido: "Morena" },
      { nombre: "Comisión de Trabajo, Previsión y Seguridad Social", rol: "Dictaminadora", partido: "N/A" },
      { nombre: "Sindicato de Maestros (SMSEM)", rol: "Grupo de Interés", partido: "N/A" },
      { nombre: "SUTEYM", rol: "Grupo de Interés", partido: "N/A" },
      { nombre: "Dip. Elías Rescala Jiménez", rol: "Oposición", partido: "PRI" }
    ],
    video_youtube: {
      id: "YYowyRSggAw",
      titulo: "Sesión Deliberante - Reforma ISSEMyM",
      vistas: "15,420"
    },
    eventos: [
      { fecha: "2025-09-05", tipo: "Presentación", descripcion: "Presentación en el Pleno de la LXII Legislatura del Estado de México." },
      { fecha: "2025-09-20", tipo: "Parlamento Abierto", descripcion: "Foros con sindicatos de maestros y burócratas del Estado." }
    ],
    documentos: [
      { id: "doc-1", tipo: "Iniciativa", fecha: "2025-09-05", url: "#" }
    ]
  },
  {
    id: "exp-002",
    clave_oficial: "LXII-045",
    titulo: "Ley de Movilidad y Seguridad Vial del Estado de México",
    descripcion: "Armonización con la Ley General, priorizando el transporte público masivo y la movilidad no motorizada en la Zona Metropolitana del Valle de México y Toluca.",
    estado_actual: "En Comisiones",
    tema_principal: "Movilidad",
    fecha_inicio: "2025-10-12",
    score_relevancia: 0.92,
    impacto_score: 88,
    sectores_afectados: ["Transporte Público", "Infraestructura", "Seguridad"],
    resumen_ia: {
      ejecutivo: "Propone la creación del Sistema Integrado de Transporte del Estado de México (SITEM), regulando concesiones y estableciendo un subsidio cruzado para mejorar las unidades en municipios conurbados.",
      evidencia: [
        { chunk_id: "chk-3", texto: "Obligatoriedad de transición a unidades de bajas emisiones para concesionarios de transporte público en un plazo de 5 años." },
        { chunk_id: "chk-4", texto: "Creación del Fondo Estatal de Movilidad para financiar infraestructura ciclista y peatonal." }
      ]
    },
    actores: [
      { nombre: "Dip. Maurilio Hernández González", rol: "Promovente", partido: "Morena" },
      { nombre: "Comisión de Comunicaciones y Transportes", rol: "Dictaminadora", partido: "N/A" },
      { nombre: "Cámara Nacional del Autotransporte de Pasaje y Turismo (CANAPAT)", rol: "Grupo de Interés", partido: "N/A" },
      { nombre: "Colectivos Ciclistas del Edomex", rol: "Sociedad Civil", partido: "N/A" }
    ],
    video_youtube: {
      id: "ogwLBavDeMI",
      titulo: "Foro: Ley de Movilidad y Seguridad Vial",
      vistas: "8,930"
    },
    eventos: [
      { fecha: "2025-10-12", tipo: "Presentación", descripcion: "Presentación en el Congreso Local." },
      { fecha: "2025-11-05", tipo: "Mesa Técnica", descripcion: "Reunión con líderes transportistas del Valle de México." }
    ],
    documentos: [
      { id: "doc-2", tipo: "Iniciativa", fecha: "2025-10-12", url: "#" }
    ]
  },
  {
    id: "exp-003",
    clave_oficial: "LXII-089",
    titulo: "Ley de Gestión Integral del Agua del Estado de México",
    descripcion: "Nueva normativa para enfrentar la crisis hídrica, regulando la extracción, distribución y tratamiento de aguas en municipios con estrés hídrico.",
    estado_actual: "Aprobado en lo General",
    tema_principal: "Medio Ambiente",
    fecha_inicio: "2025-08-10",
    score_relevancia: 0.95,
    impacto_score: 92,
    sectores_afectados: ["Municipios", "Industria", "Desarrollo Urbano"],
    resumen_ia: {
      ejecutivo: "La reforma busca priorizar el consumo doméstico sobre el industrial y comercial en zonas como Naucalpan, Tlalnepantla y Ecatepec. Obliga a los nuevos desarrollos inmobiliarios a contar con sistemas de captación de agua pluvial.",
      evidencia: [
        { chunk_id: "chk-5", texto: "Se prohíbe la autorización de nuevos fraccionamientos habitacionales que no demuestren factibilidad hídrica autónoma." },
        { chunk_id: "chk-6", texto: "Los organismos operadores de agua municipales deberán invertir al menos 20% de su presupuesto en reparación de fugas." }
      ]
    },
    actores: [
      { nombre: "Ejecutivo Estatal", rol: "Promovente", partido: "N/A" },
      { nombre: "Comisión de Recursos Hidráulicos", rol: "Dictaminadora", partido: "N/A" },
      { nombre: "Dip. Francisco Vázquez Rodríguez", rol: "Apoyo Legislativo", partido: "Morena" },
      { nombre: "Cámara Nacional de la Industria de Desarrollo y Promoción de Vivienda (CANADEVI)", rol: "Grupo de Interés", partido: "N/A" },
      { nombre: "Organismos Operadores de Agua (ODAPAS)", rol: "Implementadores", partido: "N/A" }
    ],
    video_youtube: {
      id: "kJXzEtQpTqU",
      titulo: "Comisiones Unidas - Gestión del Agua",
      vistas: "22,100"
    },
    eventos: [
      { fecha: "2025-08-10", tipo: "Recepción", descripcion: "Recibida en la Legislatura del Estado." },
      { fecha: "2025-11-20", tipo: "Dictamen", descripcion: "Aprobación del dictamen en comisiones unidas." }
    ],
    documentos: [
      { id: "doc-4", tipo: "Iniciativa de la Gobernadora", fecha: "2025-08-10", url: "#" }
    ]
  },
  {
    id: "exp-004",
    clave_oficial: "LXII-112",
    titulo: "Paquete Fiscal del Estado de México 2026",
    descripcion: "Ley de Ingresos y Presupuesto de Egresos para el ejercicio fiscal 2026, con enfoque en programas sociales e infraestructura.",
    estado_actual: "Pendiente",
    tema_principal: "Hacienda",
    fecha_inicio: "2025-11-21",
    score_relevancia: 0.98,
    impacto_score: 90,
    sectores_afectados: ["Gobierno Estatal", "Municipios", "Obra Pública"],
    resumen_ia: {
      ejecutivo: "Se propone un incremento del 8% en el presupuesto para programas de bienestar estatal y un plan de austeridad en el Poder Legislativo y Judicial. No se contemplan nuevos impuestos estatales.",
      evidencia: [
        { chunk_id: "chk-7", texto: "Asignación histórica para el programa 'Mujeres con Bienestar' y ampliación de la cobertura." }
      ]
    },
    actores: [
      { nombre: "Secretaría de Finanzas del Edomex", rol: "Promovente", partido: "N/A" },
      { nombre: "Comisión de Planeación y Gasto Público", rol: "Dictaminadora", partido: "N/A" }
    ],
    video_youtube: {
      id: "-c3F29juPJM",
      titulo: "Entrega del Paquete Fiscal 2026",
      vistas: "45,200"
    },
    eventos: [
      { fecha: "2025-11-21", tipo: "Paquete Económico", descripcion: "Entrega del Paquete Fiscal 2026 por parte del Secretario de Finanzas." }
    ],
    documentos: [
      { id: "doc-5", tipo: "Proyecto de Presupuesto", fecha: "2025-11-21", url: "#" }
    ]
  }
];

export const alertas = [
  { id: "alt-1", tipo: "Cambio de Estado", expediente: "LXII-001", mensaje: "La Reforma al ISSEMyM avanza a votación en el Pleno tras acuerdo en la Jucopo.", fecha: "2025-12-01T09:00:00Z", leida: false, severidad: "alta" },
  { id: "alt-2", tipo: "Nuevo Documento", expediente: "LXII-045", mensaje: "Se publicó el dictamen técnico de la Ley de Movilidad del Edomex.", fecha: "2025-11-28T14:30:00Z", leida: true, severidad: "media" },
  { id: "alt-3", tipo: "Riesgo Regulatorio", expediente: "LXII-089", mensaje: "El impacto de la Ley de Aguas subió a 92/100 por reservas de la oposición panista.", fecha: "2025-11-25T11:00:00Z", leida: true, severidad: "alta" },
  { id: "alt-4", tipo: "Evento Programado", expediente: "LXII-112", mensaje: "Comparecencia del Secretario de Finanzas por el Paquete Fiscal 2026.", fecha: "2025-12-05T10:00:00Z", leida: false, severidad: "media" },
  { id: "alt-5", tipo: "Jucopo", expediente: "N/A", mensaje: "Francisco Vázquez convoca a reunión extraordinaria de la Junta de Coordinación Política.", fecha: "2025-12-02T08:00:00Z", leida: false, severidad: "alta" }
];

export const kpis = {
  totalExpedientes: 345,
  alertasActivas: 12,
  riesgoPromedio: 68,
  sectoresTop: [
    { name: "Seguridad Social", value: 85 },
    { name: "Movilidad", value: 70 },
    { name: "Agua/Medio Ambiente", value: 65 },
    { name: "Hacienda", value: 50 },
    { name: "Seguridad Pública", value: 45 },
    { name: "Salud", value: 30 }
  ],
  actividadMensual: [
    { mes: "Sep", iniciativas: 40, dictamenes: 15 },
    { mes: "Oct", iniciativas: 55, dictamenes: 20 },
    { mes: "Nov", iniciativas: 65, dictamenes: 35 },
    { mes: "Dic", iniciativas: 25, dictamenes: 40 }
  ]
};

export const votaciones = [
  {
    id: "vot-001",
    expediente: "LXII-001",
    titulo: "Reforma a la Ley del ISSEMyM",
    estado: "En Debate",
    fecha: "2025-12-10",
    votos_favor: 0,
    votos_contra: 0,
    abstenciones: 0,
    total_votos: 75,
    resumen_ia_votacion: "Debate crítico en el Congreso Local. La bancada de Morena, liderada por Francisco Vázquez, busca consensos con el PT y PVEM para aprobar el rescate financiero. La oposición (PRI, PAN) exige auditorías externas antes de aprobar incrementos a las cuotas.",
    video_url: "https://www.youtube.com/embed/YYowyRSggAw",
    desglose_partidos: [
      { partido: "Morena", favor: 0, contra: 0, abstencion: 0, color: "#B3282D" },
      { partido: "PVEM", favor: 0, contra: 0, abstencion: 0, color: "#50B747" },
      { partido: "PT", favor: 0, contra: 0, abstencion: 0, color: "#D9131C" },
      { partido: "PRI", favor: 0, contra: 0, abstencion: 0, color: "#00953B" },
      { partido: "PAN", favor: 0, contra: 0, abstencion: 0, color: "#0057A0" },
      { partido: "MC", favor: 0, contra: 0, abstencion: 0, color: "#FF8200" },
      { partido: "PRD", favor: 0, contra: 0, abstencion: 0, color: "#FFCC00" }
    ],
    detalle_legisladores: [
      { nombre: "Francisco Vázquez", partido: "Morena", voto: "pendiente", avatar: "FV", color: "#B3282D" },
      { nombre: "Elías Rescala", partido: "PRI", voto: "pendiente", avatar: "ER", color: "#00953B" },
      { nombre: "Enrique Vargas", partido: "PAN", voto: "pendiente", avatar: "EV", color: "#0057A0" },
      { nombre: "Maurilio Hernández", partido: "Morena", voto: "pendiente", avatar: "MH", color: "#B3282D" }
    ]
  },
  {
    id: "vot-002",
    expediente: "LXII-089",
    titulo: "Ley de Gestión Integral del Agua del Edomex",
    estado: "Aprobada",
    fecha: "2025-11-25",
    votos_favor: 52,
    votos_contra: 18,
    abstenciones: 5,
    total_votos: 75,
    resumen_ia_votacion: "Aprobada en el Pleno. Se lograron consensos importantes impulsados por la bancada mayoritaria para proteger los mantos acuíferos del Estado, aunque hubo disenso del PAN respecto a las restricciones a nuevos desarrollos inmobiliarios en Huixquilucan y Naucalpan.",
    video_url: "https://www.youtube.com/embed/ogwLBavDeMI",
    desglose_partidos: [
      { partido: "Morena", favor: 35, contra: 0, abstencion: 0, color: "#B3282D" },
      { partido: "PVEM", favor: 10, contra: 0, abstencion: 0, color: "#50B747" },
      { partido: "PT", favor: 7, contra: 0, abstencion: 0, color: "#D9131C" },
      { partido: "PRI", favor: 0, contra: 8, abstencion: 5, color: "#00953B" },
      { partido: "PAN", favor: 0, contra: 10, abstencion: 0, color: "#0057A0" }
    ],
    detalle_legisladores: [
      { nombre: "Francisco Vázquez", partido: "Morena", voto: "favor", avatar: "FV", color: "#B3282D" },
      { nombre: "Maurilio Hernández", partido: "Morena", voto: "favor", avatar: "MH", color: "#B3282D" },
      { nombre: "Enrique Vargas", partido: "PAN", voto: "contra", avatar: "EV", color: "#0057A0" },
      { nombre: "Elías Rescala", partido: "PRI", voto: "abstencion", avatar: "ER", color: "#00953B" }
    ]
  }
];

export const legisladores = [
  {
    id: "leg-001",
    nombre: "Francisco Vázquez Rodríguez",
    partido: "Morena",
    color: "#B3282D",
    estado: "Estado de México",
    tipo_eleccion: "Mayoría Relativa",
    comisiones: ["Junta de Coordinación Política (Presidente)", "Gobernación y Puntos Constitucionales"],
    asistencia: 100,
    lealtad: 100,
    avatar: "FV",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "favor" }
    ]
  },
  {
    id: "leg-002",
    nombre: "Maurilio Hernández González",
    partido: "Morena",
    color: "#B3282D",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Planeación y Gasto Público", "Comunicaciones y Transportes"],
    asistencia: 98,
    lealtad: 100,
    avatar: "MH",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "favor" }
    ]
  },
  {
    id: "leg-003",
    nombre: "Elías Rescala Jiménez",
    partido: "PRI",
    color: "#00953B",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Junta de Coordinación Política", "Procuración y Administración de Justicia"],
    asistencia: 95,
    lealtad: 98,
    avatar: "ER",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "abstencion" }
    ]
  },
  {
    id: "leg-004",
    nombre: "Enrique Vargas del Villar",
    partido: "PAN",
    color: "#0057A0",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Junta de Coordinación Política", "Desarrollo Económico"],
    asistencia: 92,
    lealtad: 96,
    avatar: "EV",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "contra" }
    ]
  },
  {
    id: "leg-005",
    nombre: "María Luisa Mendoza Mondragón",
    partido: "PVEM",
    color: "#50B747",
    estado: "Estado de México",
    tipo_eleccion: "Mayoría Relativa",
    comisiones: ["Protección Ambiental y Cambio Climático", "Salud, Asistencia y Bienestar Social"],
    asistencia: 96,
    lealtad: 95,
    avatar: "MM",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "favor" }
    ]
  },
  {
    id: "leg-006",
    nombre: "Omar Ortega Álvarez",
    partido: "PRD",
    color: "#FFCC00",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Junta de Coordinación Política", "Trabajo, Previsión y Seguridad Social"],
    asistencia: 90,
    lealtad: 92,
    avatar: "OO",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "abstencion" }
    ]
  },
  {
    id: "leg-007",
    nombre: "Óscar González Yáñez",
    partido: "PT",
    color: "#D9131C",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Junta de Coordinación Política", "Educación, Cultura, Ciencia y Tecnología"],
    asistencia: 94,
    lealtad: 98,
    avatar: "OG",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "favor" }
    ]
  },
  {
    id: "leg-008",
    nombre: "Juana Bonilla Jaime",
    partido: "MC",
    color: "#FF8200",
    estado: "Estado de México",
    tipo_eleccion: "Plurinominal",
    comisiones: ["Igualdad de Género", "Derechos Humanos"],
    asistencia: 95,
    lealtad: 90,
    avatar: "JB",
    historial_votos: [
      { votacion_id: "vot-001", sentido: "pendiente" },
      { votacion_id: "vot-002", sentido: "contra" }
    ]
  }
];

export const resumenesSemanales = [
  {
    periodo: "Semana Actual (01 Dic - 07 Dic 2025)",
    resumen: "Semana crítica en la LXII Legislatura del Estado de México con la discusión de la Reforma a la Ley del ISSEMyM. Bajo el liderazgo de Francisco Vázquez, la bancada de Morena intensifica las negociaciones en la Jucopo para alcanzar los consensos necesarios. En paralelo, avanza el análisis del Paquete Fiscal 2026 en comisiones.",
    puntos_clave: [
      "Debate de la Reforma al ISSEMyM en el Pleno.",
      "Análisis del Paquete Fiscal 2026 en comisiones de Gasto Público.",
      "Publicación de dictámenes técnicos sobre la Ley de Movilidad."
    ]
  },
  {
    periodo: "Semana Anterior (24 Nov - 30 Nov 2025)",
    resumen: "La semana pasada se aprobó en el Pleno la Ley de Gestión Integral del Agua, a pesar de las reservas presentadas por la oposición respecto a las restricciones de desarrollo inmobiliario. El Ejecutivo Estatal envió el Paquete Fiscal 2026 destacando el aumento a programas sociales.",
    puntos_clave: [
      "Aprobación en el Pleno de la Ley de Aguas del Edomex.",
      "Recepción del Paquete Fiscal 2026.",
      "Mesas de trabajo con transportistas sobre la Ley de Movilidad."
    ]
  }
];
