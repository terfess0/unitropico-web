
export const conditions = [
    { id: '01', title: 'Denominación del programa', icon: 'FileText' },
    { id: '02', title: 'Justificación del programa', icon: 'Target' },
    { id: '03', title: 'Aspectos curriculares', icon: 'BookOpen' },
    { id: '04', title: 'Organización de actividades académicas', icon: 'Briefcase' },
    { id: '05', title: 'Investigación, innovación y/o creación artística y cultural', icon: 'Search' },
    { id: '06', title: 'Relación con el sector externo', icon: 'Handshake' },
    { id: '07', title: 'Profesores', icon: 'GraduationCap' },
    { id: '08', title: 'Medios educativos', icon: 'Monitor' },
    { id: '09', title: 'Infraestructura física y tecnológica', icon: 'Building' },
];

export const extraSections = [
    { id: '10', title: 'Contexto Institucional', icon: 'AccountBalance' }
];

export const conditionDetails: {
    [key: string]: {
        title: string;
        description: string;
        sections: { id: string; title: string }[];
    }
} = {
    '01': {
        title: 'Denominación',
        description: 'Detalles sobre la denominación del programa.',
        sections: [
            { id: 'definicion', title: '1.1 Definición y Concepto' },
            { id: 'titulo', title: '1.2 Título que Otorga' },
            { id: 'duracion', title: '1.3 Duración y Modalidad' },
            { id: 'normativa', title: '1.4 Normativa Aplicable' }
        ]
    },
    '02': {
        title: 'Justificación',
        description: 'Justificación y pertinencia del programa.',
        sections: [
            { id: 'necesidad', title: '2.1 Necesidad del Programa' },
            { id: 'pertinencia', title: '2.2 Pertinencia Regional' },
            { id: 'oportunidades', title: '2.3 Oportunidades Laborales' }
        ]
    },
    '03': {
        title: 'Aspectos Curriculares',
        description: 'Estructura y contenidos curriculares.',
        sections: [
            { id: 'plan', title: '3.1 Plan de Estudios' },
            { id: 'competencias', title: '3.2 Competencias' },
            { id: 'flexibilidad', title: '3.3 Flexibilidad Curricular' }
        ]
    },
    '04': { title: 'Organización', description: 'Organización de las actividades académicas.', sections: [] },
    '05': { title: 'Investigación', description: 'Componente de investigación y creación artística.', sections: [] },
    '06': { title: 'Sector Externo', description: 'Vinculación y proyectos con el sector externo.', sections: [] },
    '07': { title: 'Profesores', description: 'Cualificación, dedicación y perfil de los profesores.', sections: [] },
    '08': { title: 'Medios Educativos', description: 'Disponibilidad de medios educativos e infraestructura.', sections: [] },
    '09': { title: 'Infraestructura', description: 'Infraestructura física y tecnológica.', sections: [] },
    '10': {
        title: 'Contexto Institucional',
        description: 'Contexto institucional del programa.',
        sections: []
    },
};
