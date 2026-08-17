const DOCUMENT_CATALOG = [
  ['PRE-01','Solicitud de creación del Instituto Emprende','Presentación y promotores',1,1],
  ['PRE-02','Justificativo de cumplimiento de requisitos de los promotores','Presentación y promotores',1,1],
  ['PRE-03','Propuesta de nombre de la institución','Presentación y promotores',1,1],
  ['PRE-04','Declaración juramentada de licitud de fondos','Presentación y promotores',1,1],
  ['PRE-05','Nómina y perfiles del equipo académico inicial','Presentación y promotores',1,1],
  ['PER-01','Estudio integral de pertinencia','Pertinencia y mercado',1,1],
  ['PER-02','Articulación con la planificación nacional y local','Pertinencia y mercado',1,1],
  ['PER-03','Estudio comparativo de oferta académica','Pertinencia y mercado',1,1],
  ['PER-04','Metodología del estudio de mercado ocupacional','Pertinencia y mercado',1,1],
  ['PER-05','Estudio de demanda laboral','Pertinencia y mercado',1,1],
  ['PER-06','Estudio de demanda estudiantil','Pertinencia y mercado',1,1],
  ['PER-07','Estudio de oferta laboral','Pertinencia y mercado',1,1],
  ['PER-08','Análisis de brechas del mercado laboral','Pertinencia y mercado',1,1],
  ['PER-09','Encuesta a potenciales estudiantes','Pertinencia y mercado',1,1],
  ['PER-10','Encuesta a empleadores','Pertinencia y mercado',1,1],
  ['PER-11','Guía de entrevistas y grupos focales','Pertinencia y mercado',0,1],
  ['PER-12','Informe de tabulación y resultados','Pertinencia y mercado',1,1],
  ['ORG-01','Proyecto de Estatuto Institucional','Organización, planificación y calidad',1,1],
  ['ORG-02','Estructura orgánico-funcional','Organización, planificación y calidad',1,1],
  ['ORG-03','Manual de funciones y perfiles','Organización, planificación y calidad',1,1],
  ['ORG-04','Plan Estratégico de Desarrollo Institucional - PEDI','Organización, planificación y calidad',1,1],
  ['ORG-05','Modelo Educativo Institucional','Organización, planificación y calidad',1,1],
  ['ORG-06','Documento de gestión del personal docente','Organización, planificación y calidad',1,1],
  ['ORG-07','Plan de capacitación y perfeccionamiento docente','Organización, planificación y calidad',1,1],
  ['ORG-08','Plan de investigación e innovación','Organización, planificación y calidad',1,1],
  ['ORG-09','Plan de vinculación con la sociedad','Organización, planificación y calidad',1,1],
  ['ORG-10','Plan de acompañamiento estudiantil','Organización, planificación y calidad',1,1],
  ['ORG-11','Sistema de seguimiento a graduados','Organización, planificación y calidad',1,1],
  ['CAR-01','Proyecto técnico-académico de Carrera 1','Oferta académica',1,1],
  ['CAR-02','Proyecto técnico-académico de Carrera 2','Oferta académica',1,1],
  ['CAR-03','Proyecto técnico-académico de Carrera 3','Oferta académica',1,1],
  ['FIN-01','Estudio financiero proyectado a cinco años','Financiero y personal',1,1],
  ['FIN-02','Perfiles del equipo administrativo, financiero y de servicios','Financiero y personal',1,1],
  ['FIN-03','Matriz de bienes y valores comprometidos','Financiero y personal',1,1],
  ['INF-01','Propuesta de infraestructura tecnológica, laboratorios y talleres','Infraestructura',1,1],
  ['INF-02','Inventario de infraestructura y equipamiento','Infraestructura',1,1],
  ['INF-03','Plan de adquisición de equipos e infraestructura','Infraestructura',1,1],
  ['INF-04','Plan de mantenimiento, seguridad y accesibilidad','Infraestructura',1,1],
  ['INF-05','Modelo de carta de intención de arrendamiento o comodato','Infraestructura',0,1]
].map(([code,name,group,required,generatable]) => ({ code, name, group, required, generatable }));

const TEMPLATES = {
  'PER-01': [
    'Introducción',
    'Información general del instituto',
    'Contexto nacional',
    'Contexto local y delimitación geográfica',
    'Necesidades y potencialidades de desarrollo',
    'Articulación con la planificación nacional y local',
    'Oferta académica existente y diferenciación',
    'Tendencias del mercado ocupacional',
    'Demanda laboral',
    'Demanda estudiantil',
    'Oferta laboral',
    'Análisis de brechas',
    'Conclusiones',
    'Bibliografía',
    'Anexos'
  ],
  'ORG-01': [
    'Disposiciones generales',
    'Naturaleza, domicilio y fines',
    'Principios institucionales',
    'Estructura de gobierno',
    'Órgano Colegiado Superior',
    'Autoridades académicas y administrativas',
    'Régimen académico',
    'Personal académico',
    'Estudiantes',
    'Investigación e innovación',
    'Vinculación con la sociedad',
    'Régimen administrativo y financiero',
    'Disposiciones transitorias y finales'
  ],
  'ORG-04': [
    'Presentación',
    'Metodología de planificación estratégica',
    'Diagnóstico interno',
    'Diagnóstico externo',
    'Misión institucional',
    'Visión institucional',
    'Objetivos estratégicos',
    'Estrategias y líneas de acción',
    'Igualdad de oportunidades',
    'Relaciones interinstitucionales',
    'Docencia y capacitación docente',
    'Investigación e innovación',
    'Vinculación con la sociedad',
    'Indicadores y metas',
    'Seguimiento y evaluación'
  ],
  'ORG-05': [
    'Presentación',
    'Fundamentación filosófica',
    'Fundamentación psicológica',
    'Fundamentación pedagógica',
    'Principios del modelo educativo',
    'Proceso de enseñanza-aprendizaje',
    'Rol del estudiante',
    'Rol del docente',
    'Evaluación de los aprendizajes',
    'Ambientes de aprendizaje',
    'Articulación con la oferta académica',
    'Investigación, innovación y vinculación',
    'Seguimiento y mejora continua'
  ],
  'FIN-01': [
    'Resumen ejecutivo',
    'Supuestos financieros',
    'Proyección de matrícula',
    'Proyección de ingresos',
    'Proyección de egresos',
    'Costos de personal',
    'Inversión en infraestructura',
    'Inversión tecnológica',
    'Flujo de caja proyectado a cinco años',
    'Sostenibilidad financiera',
    'Conclusiones'
  ],
  'INF-01': [
    'Descripción general de la infraestructura',
    'Aulas',
    'Biblioteca',
    'Laboratorios',
    'Áreas de práctica',
    'Talleres',
    'Áreas de esparcimiento',
    'Servicios higiénicos',
    'Conectividad',
    'Puestos de trabajo para profesores',
    'Mantenimiento',
    'Accesibilidad y seguridad',
    'Coherencia con la oferta académica',
    'Coherencia con el estudio financiero'
  ]
};

const CAREER_TEMPLATE = [
  'Datos generales de la carrera',
  'Justificación y pertinencia',
  'Objeto de estudio',
  'Perfil de ingreso',
  'Perfil profesional de egreso',
  'Resultados de aprendizaje',
  'Macrocurrículo',
  'Mesocurrículo',
  'Malla curricular',
  'Metodologías de aprendizaje',
  'Evaluación',
  'Ambientes de aprendizaje',
  'Personal académico requerido',
  'Infraestructura y equipamiento requerido'
];

const DEFAULT_TEMPLATE = [
  'Objeto y alcance',
  'Antecedentes',
  'Desarrollo',
  'Responsables y recursos',
  'Seguimiento',
  'Conclusiones',
  'Anexos'
];

function getTemplate(code) {
  if (code.startsWith('CAR-')) return CAREER_TEMPLATE;
  return TEMPLATES[code] || DEFAULT_TEMPLATE;
}

module.exports = { DOCUMENT_CATALOG, getTemplate };
