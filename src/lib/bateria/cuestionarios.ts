/**
 * Cuestionarios Oficiales — Batería de Riesgo Psicosocial Colombia
 * Fuente: Ministerio de la Protección Social / Pontificia Universidad Javeriana (2010)
 * PDFs oficiales: Fondo de Riesgos Laborales
 * Resolución 2404 de 2019
 */

export type Opcion = 'siempre' | 'casi_siempre' | 'algunas_veces' | 'casi_nunca' | 'nunca';

export interface Pregunta {
  numero: number;
  texto: string;
  esFiltro?: boolean; // Si y No en lugar de escala Likert
  seccionFiltro?: 'clientes' | 'jefe'; // Pregunta condicional
}

export interface SeccionCuestionario {
  id: string;
  instruccion: string;
  preguntas: Pregunta[];
}

// ─── FORMA A — 123 ítems (Jefaturas, Profesionales y Técnicos) ────────────────

export const FORMA_A: SeccionCuestionario[] = [
  {
    id: 'condiciones_ambientales',
    instruccion:
      'Las siguientes preguntas están relacionadas con las condiciones ambientales del(los) sitio(s) o lugar(es) donde habitualmente realiza su trabajo.',
    preguntas: [
      { numero: 1,  texto: 'El ruido en el lugar donde trabajo es molesto' },
      { numero: 2,  texto: 'En el lugar donde trabajo hace mucho frío' },
      { numero: 3,  texto: 'En el lugar donde trabajo hace mucho calor' },
      { numero: 4,  texto: 'El aire en el lugar donde trabajo es fresco y agradable' },
      { numero: 5,  texto: 'La luz del sitio donde trabajo es agradable' },
      { numero: 6,  texto: 'El espacio donde trabajo es cómodo' },
      { numero: 7,  texto: 'En mi trabajo me preocupa estar expuesto a sustancias químicas que afecten mi salud' },
      { numero: 8,  texto: 'Mi trabajo me exige hacer mucho esfuerzo físico' },
      { numero: 9,  texto: 'Los equipos o herramientas con los que trabajo son cómodos' },
      { numero: 10, texto: 'En mi trabajo me preocupa estar expuesto a microbios, animales o plantas que afecten mi salud' },
      { numero: 11, texto: 'Me preocupa accidentarme en mi trabajo' },
      { numero: 12, texto: 'El lugar donde trabajo es limpio y ordenado' },
    ],
  },
  {
    id: 'cantidad_trabajo',
    instruccion:
      'Para responder a las siguientes preguntas piense en la cantidad de trabajo que usted tiene a cargo.',
    preguntas: [
      { numero: 13, texto: 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional' },
      { numero: 14, texto: 'Me alcanza el tiempo de trabajo para tener al día mis deberes' },
      { numero: 15, texto: 'Por la cantidad de trabajo que tengo debo trabajar sin parar' },
    ],
  },
  {
    id: 'esfuerzo_mental',
    instruccion:
      'Las siguientes preguntas están relacionadas con el esfuerzo mental que le exige su trabajo.',
    preguntas: [
      { numero: 16, texto: 'Mi trabajo me exige hacer mucho esfuerzo mental' },
      { numero: 17, texto: 'Mi trabajo me exige estar muy concentrado' },
      { numero: 18, texto: 'Mi trabajo me exige memorizar mucha información' },
      { numero: 19, texto: 'En mi trabajo tengo que hacer cálculos matemáticos' },
      { numero: 20, texto: 'Mi trabajo requiere que me fije en pequeños detalles' },
    ],
  },
  {
    id: 'responsabilidades_cargo',
    instruccion:
      'Las siguientes preguntas están relacionadas con las responsabilidades y el contenido de su trabajo.',
    preguntas: [
      { numero: 21, texto: 'En mi trabajo debo tomar decisiones difíciles muy rápido' },
      { numero: 22, texto: 'Mi trabajo me exige atender a muchos asuntos al mismo tiempo' },
      { numero: 23, texto: 'Mi trabajo me exige hacer cosas que van en contra de mis convicciones o principios' },
      { numero: 24, texto: 'En mi trabajo soy responsable de cosas muy importantes' },
      { numero: 25, texto: 'Mi trabajo me exige responsabilizarme de asuntos sobre los cuales no tengo toda la información' },
      { numero: 26, texto: 'Mi trabajo me exige cuidar la vida o la salud de otras personas' },
    ],
  },
  {
    id: 'jornada_trabajo',
    instruccion:
      'Las siguientes preguntas están relacionadas con la jornada de trabajo.',
    preguntas: [
      { numero: 27, texto: 'Cuando estoy en casa sigo pensando en el trabajo' },
      { numero: 28, texto: 'Discuto con mi familia o amigos por causa de mi trabajo' },
      { numero: 29, texto: 'Debo atender asuntos de trabajo cuando estoy en casa' },
      { numero: 30, texto: 'Por mi trabajo el tiempo que paso con mi familia y amigos es muy poco' },
      { numero: 31, texto: 'Trabajo en horario de noche' },
    ],
  },
  {
    id: 'consistencia_rol',
    instruccion:
      'Las siguientes preguntas están relacionadas con las funciones y responsabilidades en su trabajo.',
    preguntas: [
      { numero: 27, texto: 'Mi trabajo me exige cumplir tareas en muy poco tiempo' },
      { numero: 28, texto: 'Mi trabajo me exige hacer cosas distintas al mismo tiempo' },
      { numero: 29, texto: 'En mi trabajo hay situaciones en que me piden cosas distintas y no sé qué hacer primero' },
      { numero: 30, texto: 'En mi trabajo las tareas cambian sin que me avisen' },
      { numero: 52, texto: 'Me indican claramente cuál es la importancia de mi trabajo para la empresa' },
    ],
  },
  {
    id: 'demandas_cuantitativas_a',
    instruccion:
      'Para responder las siguientes preguntas piense en la cantidad de trabajo a cargo.',
    preguntas: [
      { numero: 32, texto: 'Mi trabajo me plican que debo actualizar mis conocimientos continuamente' },
      { numero: 43, texto: 'En mi trabajo exigen más de lo que puedo hacer' },
      { numero: 47, texto: 'Me pagan según lo que trabajo' },
    ],
  },
  {
    id: 'jornada_noche_descanso',
    instruccion:
      'Las siguientes preguntas están relacionadas con la jornada de trabajo.',
    preguntas: [
      { numero: 33, texto: 'En mi trabajo puedo tomar pausas para descansar' },
      { numero: 34, texto: 'Mi trabajo me exige laborar en días de descanso, festivos o fines de semana' },
    ],
  },
  {
    id: 'influencia_extralaboral',
    instruccion:
      'Las siguientes preguntas tratan sobre la influencia del trabajo en su vida fuera del trabajo.',
    preguntas: [
      { numero: 35, texto: 'Cuando estoy en casa sigo pensando en el trabajo' },
      { numero: 36, texto: 'Discuto con mi familia o amigos por causa del trabajo' },
      { numero: 37, texto: 'Debo atender asuntos de trabajo cuando estoy en casa' },
      { numero: 38, texto: 'Por mi trabajo el tiempo que paso con mi familia y amigos es muy poco' },
    ],
  },
  {
    id: 'autonomia_habilidades',
    instruccion:
      'Las siguientes preguntas están relacionadas con las decisiones y el control que le permite su trabajo.',
    preguntas: [
      { numero: 39, texto: 'En mi trabajo puedo hacer cosas nuevas' },
      { numero: 40, texto: 'Mi trabajo me permite desarrollar mis habilidades' },
      { numero: 41, texto: 'Mi trabajo me permite aplicar mis conocimientos' },
      { numero: 42, texto: 'Mi trabajo me permite aprender nuevas cosas' },
    ],
  },
  {
    id: 'control_autonomia',
    instruccion:
      'Las siguientes preguntas están relacionadas con las decisiones y el control que le permite su trabajo.',
    preguntas: [
      { numero: 44, texto: 'Puedo tomar pausas cuando las necesito' },
      { numero: 45, texto: 'Puedo decidir cuánto trabajo hago en el día' },
      { numero: 46, texto: 'Puedo decidir la velocidad a la que trabajo' },
    ],
  },
  {
    id: 'participacion_cambio',
    instruccion:
      'Las siguientes preguntas están relacionadas con cualquier tipo de cambio que ocurra en su trabajo.',
    preguntas: [
      { numero: 48, texto: 'Me explican claramente los cambios que ocurren en mi trabajo' },
      { numero: 49, texto: 'Puedo dar sugerencias sobre los cambios que ocurren en mi trabajo' },
      { numero: 50, texto: 'Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas y sugerencias' },
      { numero: 51, texto: 'Me informan con anticipación sobre los cambios que van a tener lugar en mi trabajo' },
    ],
  },
  {
    id: 'claridad_rol',
    instruccion:
      'Las siguientes preguntas están relacionadas con la información que la empresa le ha dado sobre su trabajo.',
    preguntas: [
      { numero: 53, texto: 'Me informan con claridad cuáles son mis funciones' },
      { numero: 54, texto: 'Me informan cuáles son las decisiones que puedo tomar en mi trabajo' },
      { numero: 55, texto: 'Me explican claramente los resultados que debo lograr en mi trabajo' },
      { numero: 56, texto: 'Me explican claramente los objetivos de mi trabajo' },
      { numero: 57, texto: 'Me informan claramente con quien puedo resolver los asuntos de trabajo' },
      { numero: 58, texto: 'Me informan claramente quién es mi jefe' },
      { numero: 59, texto: 'Me explican claramente las responsabilidades de mi trabajo' },
    ],
  },
  {
    id: 'capacitacion',
    instruccion:
      'Las siguientes preguntas están relacionadas con la formación y capacitación que la empresa le facilita para hacer su trabajo.',
    preguntas: [
      { numero: 60, texto: 'La empresa me permite asistir a capacitaciones relacionadas con mi trabajo' },
      { numero: 61, texto: 'Recibo capacitación útil para hacer mi trabajo' },
      { numero: 62, texto: 'Recibo capacitación que me ayuda a hacer mejor mi trabajo' },
    ],
  },
  {
    id: 'liderazgo',
    instruccion:
      'Las siguientes preguntas están relacionadas con el o los jefes con quien tenga más contacto.',
    preguntas: [
      { numero: 63, texto: 'Mi jefe me da instrucciones claras' },
      { numero: 64, texto: 'Mi jefe ayuda a organizar mejor el trabajo' },
      { numero: 65, texto: 'Mi jefe tiene en cuenta mis puntos de vista y opiniones' },
      { numero: 66, texto: 'Mi jefe me anima para hacer mejor mi trabajo' },
      { numero: 67, texto: 'Mi jefe distribuye las tareas de forma que me facilita el trabajo' },
      { numero: 68, texto: 'Mi jefe me comunica a tiempo la información relacionada con el trabajo' },
      { numero: 69, texto: 'La orientación que me da mi jefe me ayuda a hacer mejor el trabajo' },
      { numero: 70, texto: 'Mi jefe me ayuda a progresar en el trabajo' },
      { numero: 71, texto: 'Mi jefe me ayuda a sentirme bien en el trabajo' },
      { numero: 72, texto: 'Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo' },
      { numero: 73, texto: 'Siento que puedo confiar en mi jefe' },
      { numero: 74, texto: 'Mi jefe me escucha cuando tengo problemas de trabajo' },
      { numero: 75, texto: 'Mi jefe me brinda su apoyo cuando lo necesito' },
    ],
  },
  {
    id: 'relaciones_sociales',
    instruccion:
      'Las siguientes preguntas indagan sobre las relaciones con otras personas y el apoyo entre las personas de su trabajo.',
    preguntas: [
      { numero: 76, texto: 'Me agrada el ambiente de mi grupo de trabajo' },
      { numero: 77, texto: 'En mi grupo de trabajo me tratan de forma respetuosa' },
      { numero: 78, texto: 'Siento que puedo confiar en mis compañeros de trabajo' },
      { numero: 79, texto: 'Me siento a gusto con mis compañeros de trabajo' },
      { numero: 80, texto: 'En mi grupo de trabajo algunas personas me maltratan' },
      { numero: 81, texto: 'Entre compañeros solucionamos los problemas de forma respetuosa' },
      { numero: 82, texto: 'Hay integración en mi grupo de trabajo' },
      { numero: 83, texto: 'Mi grupo de trabajo es muy unido' },
      { numero: 84, texto: 'Las personas en mi trabajo me hacen sentir parte del grupo' },
      { numero: 85, texto: 'Cuando tenemos que realizar trabajo de grupo los compañeros colaboran' },
      { numero: 86, texto: 'Es fácil poner de acuerdo al grupo para hacer el trabajo' },
      { numero: 87, texto: 'Mis compañeros de trabajo me ayudan cuando tengo dificultades' },
      { numero: 88, texto: 'En mi trabajo las personas nos apoyamos unos a otros' },
      { numero: 89, texto: 'Algunos compañeros de trabajo me escuchan cuando tengo problemas' },
    ],
  },
  {
    id: 'retroalimentacion',
    instruccion:
      'Las siguientes preguntas están relacionadas con la información que usted recibe sobre su rendimiento en el trabajo.',
    preguntas: [
      { numero: 90, texto: 'Me informan sobre lo que hago bien en mi trabajo' },
      { numero: 91, texto: 'Me informan sobre lo que debo mejorar en mi trabajo' },
      { numero: 92, texto: 'La información que recibo sobre mi rendimiento en el trabajo es clara' },
      { numero: 93, texto: 'La forma como evalúan mi trabajo en la empresa me ayuda a mejorar' },
      { numero: 94, texto: 'Me informan a tiempo sobre lo que debo mejorar en el trabajo' },
    ],
  },
  {
    id: 'recompensas',
    instruccion:
      'Las siguientes preguntas están relacionadas con la satisfacción, reconocimiento y la seguridad que le ofrece su trabajo.',
    preguntas: [
      { numero: 95,  texto: 'En la empresa confían en mi trabajo' },
      { numero: 96,  texto: 'En la empresa me pagan a tiempo mi salario' },
      { numero: 97,  texto: 'El pago que recibo es el que me ofreció la empresa' },
      { numero: 98,  texto: 'El pago que recibo es el que merezco por el trabajo que realizo' },
      { numero: 99,  texto: 'En mi trabajo tengo posibilidades de progresar' },
      { numero: 100, texto: 'Las personas que hacen bien el trabajo pueden progresar en la empresa' },
      { numero: 101, texto: 'La empresa se preocupa por el bienestar de los trabajadores' },
      { numero: 102, texto: 'Mi trabajo en la empresa es estable' },
      { numero: 103, texto: 'El trabajo que hago me hace sentir bien' },
      { numero: 104, texto: 'Siento orgullo de trabajar en esta empresa' },
      { numero: 105, texto: 'Hablo bien de la empresa con otras personas' },
    ],
  },
  {
    id: 'clientes_filtro',
    instruccion:
      'Las siguientes preguntas están relacionadas con la atención a clientes y usuarios.',
    preguntas: [
      {
        numero: 0,
        texto: 'En mi trabajo debo brindar servicio a clientes o usuarios',
        esFiltro: true,
        seccionFiltro: 'clientes',
      },
      { numero: 106, texto: 'Atiendo clientes o usuarios muy enojados' },
      { numero: 107, texto: 'Atiendo clientes o usuarios muy preocupados' },
      { numero: 108, texto: 'Atiendo clientes o usuarios muy tristes' },
      { numero: 109, texto: 'Mi trabajo me exige atender personas muy enfermas' },
      { numero: 110, texto: 'Mi trabajo me exige atender personas muy necesitadas de ayuda' },
      { numero: 111, texto: 'Atiendo clientes o usuarios que me maltratan' },
      { numero: 112, texto: 'Para hacer mi trabajo debo demostrar sentimientos distintos a los míos' },
      { numero: 113, texto: 'Mi trabajo me exige atender situaciones de violencia' },
      { numero: 114, texto: 'Mi trabajo me exige atender situaciones muy tristes o dolorosas' },
    ],
  },
  {
    id: 'colaboradores_filtro',
    instruccion:
      'Las siguientes preguntas están relacionadas con las personas que usted supervisa o dirige.',
    preguntas: [
      {
        numero: 0,
        texto: 'Soy jefe de otras personas en mi trabajo',
        esFiltro: true,
        seccionFiltro: 'jefe',
      },
      { numero: 115, texto: 'Tengo colaboradores que comunican tarde los asuntos de trabajo' },
      { numero: 116, texto: 'Tengo colaboradores que tienen comportamientos irrespetuosos' },
      { numero: 117, texto: 'Tengo colaboradores que dificultan la organización del trabajo' },
      { numero: 118, texto: 'Tengo colaboradores que guardan silencio cuando les piden opiniones' },
      { numero: 119, texto: 'Tengo colaboradores que dificultan el logro de los resultados del trabajo' },
      { numero: 120, texto: 'Tengo colaboradores que expresan de forma irrespetuosa sus desacuerdos' },
      { numero: 121, texto: 'Tengo colaboradores que cooperan poco cuando se necesita' },
      { numero: 122, texto: 'Tengo colaboradores que me preocupan por su desempeño' },
      { numero: 123, texto: 'Tengo colaboradores que ignoran las sugerencias para mejorar su trabajo' },
    ],
  },
];

// ─── FORMA B — 97 ítems (Auxiliares y Operarios) ─────────────────────────────

export const FORMA_B: SeccionCuestionario[] = [
  {
    id: 'condiciones_ambientales',
    instruccion:
      'Las siguientes preguntas están relacionadas con las condiciones ambientales del(los) sitio(s) o lugar(es) donde habitualmente realiza su trabajo.',
    preguntas: [
      { numero: 1,  texto: 'El ruido en el lugar donde trabajo es molesto' },
      { numero: 2,  texto: 'En el lugar donde trabajo hace mucho frío' },
      { numero: 3,  texto: 'En el lugar donde trabajo hace mucho calor' },
      { numero: 4,  texto: 'El aire en el lugar donde trabajo es fresco y agradable' },
      { numero: 5,  texto: 'La luz del sitio donde trabajo es agradable' },
      { numero: 6,  texto: 'El espacio donde trabajo es cómodo' },
      { numero: 7,  texto: 'En mi trabajo me preocupa estar expuesto a sustancias químicas que afecten mi salud' },
      { numero: 8,  texto: 'Mi trabajo me exige hacer mucho esfuerzo físico' },
      { numero: 9,  texto: 'Los equipos o herramientas con los que trabajo son cómodos' },
      { numero: 10, texto: 'En mi trabajo me preocupa estar expuesto a microbios, animales o plantas que afecten mi salud' },
      { numero: 11, texto: 'Me preocupa accidentarme en mi trabajo' },
      { numero: 12, texto: 'El lugar donde trabajo es limpio y ordenado' },
    ],
  },
  {
    id: 'cantidad_trabajo',
    instruccion:
      'Para responder a las siguientes preguntas piense en la cantidad de trabajo que usted tiene a cargo.',
    preguntas: [
      { numero: 13, texto: 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional' },
      { numero: 14, texto: 'Me alcanza el tiempo de trabajo para tener al día mis deberes' },
      { numero: 15, texto: 'Por la cantidad de trabajo que tengo debo trabajar sin parar' },
    ],
  },
  {
    id: 'esfuerzo_mental',
    instruccion:
      'Las siguientes preguntas están relacionadas con el esfuerzo mental que le exige su trabajo.',
    preguntas: [
      { numero: 16, texto: 'Mi trabajo me exige hacer mucho esfuerzo mental' },
      { numero: 17, texto: 'Mi trabajo me exige estar muy concentrado' },
      { numero: 18, texto: 'Mi trabajo me exige memorizar mucha información' },
      { numero: 19, texto: 'En mi trabajo tengo que hacer cálculos matemáticos' },
      { numero: 20, texto: 'Mi trabajo requiere que me fije en pequeños detalles' },
    ],
  },
  {
    id: 'jornada_trabajo',
    instruccion:
      'Las siguientes preguntas están relacionadas con la jornada de trabajo.',
    preguntas: [
      { numero: 21, texto: 'Trabajo en horario de noche' },
      { numero: 22, texto: 'En mi trabajo es posible tomar pausas para descansar' },
      { numero: 23, texto: 'Mi trabajo me exige laborar en días de descanso, festivos o fines de semana' },
      { numero: 24, texto: 'En mi trabajo puedo tomar fines de semana o días de descanso al mes' },
      { numero: 33, texto: 'En mi trabajo es posible tomar pausas cuando se necesita' },
      { numero: 37, texto: 'Puedo parar un momento mi trabajo para atender algún asunto personal' },
    ],
  },
  {
    id: 'influencia_extralaboral',
    instruccion:
      'Las siguientes preguntas tratan sobre la influencia del trabajo en su vida fuera del trabajo.',
    preguntas: [
      { numero: 25, texto: 'Cuando estoy en casa sigo pensando en el trabajo' },
      { numero: 26, texto: 'Discuto con mi familia o amigos por causa de mi trabajo' },
      { numero: 27, texto: 'Debo atender asuntos de trabajo cuando estoy en casa' },
      { numero: 28, texto: 'Por mi trabajo el tiempo que paso con mi familia y amigos es muy poco' },
    ],
  },
  {
    id: 'autonomia_habilidades',
    instruccion:
      'Las siguientes preguntas están relacionadas con las decisiones y el control que le permite su trabajo.',
    preguntas: [
      { numero: 29, texto: 'En mi trabajo puedo hacer cosas nuevas' },
      { numero: 30, texto: 'Mi trabajo me permite desarrollar mis habilidades' },
      { numero: 31, texto: 'Mi trabajo me permite aplicar mis conocimientos' },
      { numero: 32, texto: 'Mi trabajo me permite aprender nuevas cosas' },
    ],
  },
  {
    id: 'control_autonomia',
    instruccion:
      'Las siguientes preguntas están relacionadas con el control sobre su trabajo.',
    preguntas: [
      { numero: 34, texto: 'Puedo decidir cuánto trabajo hago en el día' },
      { numero: 35, texto: 'Puedo decidir la velocidad a la que trabajo' },
      { numero: 36, texto: 'Puedo cambiar el orden de las actividades en mi trabajo' },
    ],
  },
  {
    id: 'participacion_cambio',
    instruccion:
      'Las siguientes preguntas están relacionadas con cualquier tipo de cambio que ocurra en su trabajo.',
    preguntas: [
      { numero: 38, texto: 'Me explican claramente los cambios que ocurren en mi trabajo' },
      { numero: 39, texto: 'Puedo dar sugerencias sobre los cambios que ocurren en mi trabajo' },
      { numero: 40, texto: 'Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas y sugerencias' },
    ],
  },
  {
    id: 'claridad_rol',
    instruccion:
      'Las siguientes preguntas están relacionadas con la información que la empresa le ha dado sobre su trabajo.',
    preguntas: [
      { numero: 41, texto: 'Me informan con claridad cuáles son mis funciones' },
      { numero: 42, texto: 'Me informan cuáles son las decisiones que puedo tomar en mi trabajo' },
      { numero: 43, texto: 'Me explican claramente los resultados que debo lograr en mi trabajo' },
      { numero: 44, texto: 'Me explican claramente los objetivos de mi trabajo' },
      { numero: 45, texto: 'Me informan claramente con quien puedo resolver los asuntos de trabajo' },
    ],
  },
  {
    id: 'capacitacion',
    instruccion:
      'Las siguientes preguntas están relacionadas con la formación y capacitación que la empresa le facilita para hacer su trabajo.',
    preguntas: [
      { numero: 46, texto: 'La empresa me permite asistir a capacitaciones relacionadas con mi trabajo' },
      { numero: 47, texto: 'Recibo capacitación útil para hacer mi trabajo' },
      { numero: 48, texto: 'Recibo capacitación que me ayuda a hacer mejor mi trabajo' },
    ],
  },
  {
    id: 'liderazgo',
    instruccion:
      'Las siguientes preguntas están relacionadas con el o los jefes con quien tenga más contacto.',
    preguntas: [
      { numero: 49, texto: 'Mi jefe ayuda a organizar mejor el trabajo' },
      { numero: 50, texto: 'Mi jefe tiene en cuenta mis puntos de vista y opiniones' },
      { numero: 51, texto: 'Mi jefe me anima para hacer mejor mi trabajo' },
      { numero: 52, texto: 'Mi jefe distribuye las tareas de forma que me facilita el trabajo' },
      { numero: 53, texto: 'Mi jefe me comunica a tiempo la información relacionada con el trabajo' },
      { numero: 54, texto: 'La orientación que me da mi jefe me ayuda a hacer mejor el trabajo' },
      { numero: 55, texto: 'Mi jefe me ayuda a progresar en el trabajo' },
      { numero: 56, texto: 'Mi jefe me ayuda a sentirme bien en el trabajo' },
      { numero: 57, texto: 'Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo' },
      { numero: 58, texto: 'Mi jefe me trata con respeto' },
      { numero: 59, texto: 'Siento que puedo confiar en mi jefe' },
      { numero: 60, texto: 'Mi jefe me escucha cuando tengo problemas de trabajo' },
      { numero: 61, texto: 'Mi jefe me brinda su apoyo cuando lo necesito' },
    ],
  },
  {
    id: 'relaciones_sociales',
    instruccion:
      'Las siguientes preguntas indagan sobre las relaciones con otras personas y el apoyo entre las personas de su trabajo.',
    preguntas: [
      { numero: 62, texto: 'Me agrada el ambiente de mi grupo de trabajo' },
      { numero: 63, texto: 'En mi grupo de trabajo me tratan de forma respetuosa' },
      { numero: 64, texto: 'Siento que puedo confiar en mis compañeros de trabajo' },
      { numero: 65, texto: 'Me siento a gusto con mis compañeros de trabajo' },
      { numero: 66, texto: 'En mi grupo de trabajo algunas personas me maltratan' },
      { numero: 67, texto: 'Entre compañeros solucionamos los problemas de forma respetuosa' },
      { numero: 68, texto: 'Mi grupo de trabajo es muy unido' },
      { numero: 69, texto: 'Cuando tenemos que realizar trabajo de grupo los compañeros colaboran' },
      { numero: 70, texto: 'Es fácil poner de acuerdo al grupo para hacer el trabajo' },
      { numero: 71, texto: 'Mis compañeros de trabajo me ayudan cuando tengo dificultades' },
      { numero: 72, texto: 'En mi trabajo las personas nos apoyamos unos a otros' },
      { numero: 73, texto: 'Algunos compañeros de trabajo me escuchan cuando tengo problemas' },
    ],
  },
  {
    id: 'retroalimentacion',
    instruccion:
      'Las siguientes preguntas están relacionadas con la información que usted recibe sobre su rendimiento en el trabajo.',
    preguntas: [
      { numero: 74, texto: 'Me informan sobre lo que hago bien en mi trabajo' },
      { numero: 75, texto: 'Me informan sobre lo que debo mejorar en mi trabajo' },
      { numero: 76, texto: 'La información que recibo sobre mi rendimiento en el trabajo es clara' },
      { numero: 77, texto: 'La forma como evalúan mi trabajo en la empresa me ayuda a mejorar' },
      { numero: 78, texto: 'Me informan a tiempo sobre lo que debo mejorar en el trabajo' },
    ],
  },
  {
    id: 'recompensas',
    instruccion:
      'Las siguientes preguntas están relacionadas con la satisfacción, reconocimiento y la seguridad que le ofrece su trabajo.',
    preguntas: [
      { numero: 79, texto: 'En la empresa me pagan a tiempo mi salario' },
      { numero: 80, texto: 'El pago que recibo es el que me ofreció la empresa' },
      { numero: 81, texto: 'El pago que recibo es el que merezco por el trabajo que realizo' },
      { numero: 82, texto: 'En mi trabajo tengo posibilidades de progresar' },
      { numero: 83, texto: 'Las personas que hacen bien el trabajo pueden progresar en la empresa' },
      { numero: 84, texto: 'La empresa se preocupa por el bienestar de los trabajadores' },
      { numero: 85, texto: 'Mi trabajo en la empresa es estable' },
      { numero: 86, texto: 'El trabajo que hago me hace sentir bien' },
      { numero: 87, texto: 'Siento orgullo de trabajar en esta empresa' },
      { numero: 88, texto: 'Hablo bien de la empresa con otras personas' },
    ],
  },
  {
    id: 'clientes_filtro',
    instruccion:
      'Las siguientes preguntas están relacionadas con la atención a clientes y usuarios.',
    preguntas: [
      {
        numero: 0,
        texto: 'En mi trabajo debo brindar servicio a clientes o usuarios',
        esFiltro: true,
        seccionFiltro: 'clientes',
      },
      { numero: 89, texto: 'Atiendo clientes o usuarios muy enojados' },
      { numero: 90, texto: 'Atiendo clientes o usuarios muy preocupados' },
      { numero: 91, texto: 'Atiendo clientes o usuarios muy tristes' },
      { numero: 92, texto: 'Mi trabajo me exige atender personas muy enfermas' },
      { numero: 93, texto: 'Mi trabajo me exige atender personas muy necesitadas de ayuda' },
      { numero: 94, texto: 'Atiendo clientes o usuarios que me maltratan' },
      { numero: 95, texto: 'Mi trabajo me exige atender situaciones de violencia' },
      { numero: 96, texto: 'Mi trabajo me exige atender situaciones muy tristes o dolorosas' },
      { numero: 97, texto: 'Puedo expresar tristeza o enojo frente a las personas que atiendo' },
    ],
  },
];

// ─── CUESTIONARIO EXTRALABORAL — 31 ítems (cualquier cargo) ──────────────────

export const EXTRALABORAL: SeccionCuestionario[] = [
  {
    id: 'tiempo_fuera',
    instruccion:
      'Las siguientes preguntas están relacionadas con el tiempo libre y las actividades que realiza fuera del trabajo.',
    preguntas: [
      { numero: 1,  texto: 'Después del trabajo tengo tiempo suficiente para descansar' },
      { numero: 2,  texto: 'En mi tiempo libre puedo hacer actividades de descanso' },
      { numero: 3,  texto: 'Tengo tiempo para actividades de recreación o entretenimiento' },
      { numero: 4,  texto: 'Tengo tiempo para compartir con mi familia o amigos fuera del trabajo' },
    ],
  },
  {
    id: 'relaciones_familiares',
    instruccion:
      'Las siguientes preguntas están relacionadas con las relaciones con su familia.',
    preguntas: [
      { numero: 5,  texto: 'Las relaciones con mis familiares son buenas' },
      { numero: 6,  texto: 'La relación con mi cónyuge o pareja es buena' },
      { numero: 7,  texto: 'En mi casa tenemos discusiones frecuentes o problemas de convivencia' },
    ],
  },
  {
    id: 'comunicacion_relaciones',
    instruccion:
      'Las siguientes preguntas están relacionadas con las relaciones con otras personas fuera del trabajo.',
    preguntas: [
      { numero: 8,  texto: 'Tengo buenas relaciones con las personas de mi comunidad o vecindad' },
      { numero: 9,  texto: 'Tengo amigos o personas cercanas con quienes puedo hablar de mis problemas' },
      { numero: 10, texto: 'Tengo apoyo social fuera del trabajo cuando lo necesito' },
      { numero: 11, texto: 'Mis amigos o familiares me apoyan cuando tengo dificultades' },
      { numero: 12, texto: 'Existen personas a las que acudo cuando tengo dificultades personales o económicas' },
    ],
  },
  {
    id: 'situacion_economica',
    instruccion:
      'Las siguientes preguntas están relacionadas con la situación económica de su familia.',
    preguntas: [
      { numero: 13, texto: 'Los gastos de mi familia son acordes con los ingresos' },
      { numero: 14, texto: 'El ingreso económico de mi hogar alcanza para cubrir necesidades básicas' },
      { numero: 15, texto: 'Los ingresos de mi hogar alcanzan para cubrir gastos extras o imprevistos' },
    ],
  },
  {
    id: 'vivienda_entorno',
    instruccion:
      'Las siguientes preguntas están relacionadas con las características de la vivienda donde usted habita.',
    preguntas: [
      { numero: 16, texto: 'La vivienda donde vivo es adecuada' },
      { numero: 17, texto: 'En mi lugar de vivienda hay acceso a vías y transporte' },
      { numero: 18, texto: 'La zona o entorno de mi vivienda es segura' },
      { numero: 19, texto: 'Tengo acceso a servicios de salud' },
      { numero: 20, texto: 'Tengo acceso a servicios de educación' },
      { numero: 21, texto: 'En la vivienda hay problemas de ruido o polución' },
      { numero: 22, texto: 'La zona donde vivo es tranquila' },
      { numero: 23, texto: 'En mi lugar de residencia es posible recrearse o descansar' },
      { numero: 24, texto: 'La zona donde vivo cuenta con parques u otros espacios verdes' },
    ],
  },
  {
    id: 'influencia_extralaboral',
    instruccion:
      'Las siguientes preguntas se refieren a temas de carácter personal o familiar que pueden afectar su trabajo.',
    preguntas: [
      { numero: 25, texto: 'Situaciones de mi vida fuera del trabajo me dificultan concentrarme en mi trabajo' },
      { numero: 26, texto: 'Los problemas con otras personas fuera del trabajo me afectan en el trabajo' },
      { numero: 27, texto: 'Las responsabilidades fuera del trabajo me quitan energía para el trabajo' },
    ],
  },
  {
    id: 'desplazamiento',
    instruccion:
      'Las siguientes preguntas están relacionadas con el desplazamiento entre su vivienda y el trabajo.',
    preguntas: [
      { numero: 28, texto: 'El tiempo que tarda en ir desde su casa al trabajo le resulta cómodo' },
      { numero: 29, texto: 'El transporte que utiliza para ir al trabajo es cómodo' },
      { numero: 30, texto: 'El transporte público entre su vivienda y trabajo es bueno' },
      { numero: 31, texto: 'El tiempo de desplazamiento al trabajo le deja tiempo para otras actividades' },
    ],
  },
];

// ─── CUESTIONARIO DE ESTRÉS — 31 ítems (Villalobos, 2010) ────────────────────

export const ESTRES: SeccionCuestionario[] = [
  {
    id: 'sintomas_fisiologicos',
    instruccion:
      'A continuación encontrará una lista de síntomas. Por favor indique con qué frecuencia ha sentido o experimentado cada uno de los síntomas durante el último mes.',
    preguntas: [
      { numero: 1,  texto: 'Dolor de cabeza' },
      { numero: 2,  texto: 'Problemas gastrointestinales, úlcera péptica, acidez, problemas digestivos o del colon' },
      { numero: 3,  texto: 'Problemas respiratorios' },
      { numero: 4,  texto: 'Dolor de espalda' },
      { numero: 5,  texto: 'Alteraciones en el sueño como somnolencia durante el día o desvelo en la noche' },
      { numero: 6,  texto: 'Palpitaciones en el pecho o problemas cardíacos' },
      { numero: 7,  texto: 'Cambios fuertes del apetito' },
      { numero: 8,  texto: 'Problemas relacionados con la función de los órganos de los sentidos: cambios de la visión, dificultades en el oído, olfato, o del tacto' },
    ],
  },
  {
    id: 'sintomas_comportamiento_social',
    instruccion: '',
    preguntas: [
      { numero: 9,  texto: 'Poca comunicación o aislamiento de las personas' },
      { numero: 10, texto: 'Dificultad en las relaciones familiares' },
      { numero: 11, texto: 'Dificultad para permanecer quieto o dificultad para iniciar actividades' },
      { numero: 12, texto: 'Dificultad en las relaciones con otras personas' },
    ],
  },
  {
    id: 'sintomas_intelectuales_laborales',
    instruccion: '',
    preguntas: [
      { numero: 13, texto: 'Sentimiento de sobrecarga de trabajo' },
      { numero: 14, texto: 'Dificultad para concentrarse, olvidos frecuentes' },
      { numero: 15, texto: 'Aumento en el número de accidentes de trabajo' },
      { numero: 16, texto: 'Sentimiento de frustración, de no haber hecho lo que se quería en la vida' },
      { numero: 17, texto: 'Cansancio, tedio o desgano' },
      { numero: 18, texto: 'Disminución del rendimiento en el trabajo o poca creatividad' },
      { numero: 19, texto: 'Deseo de no asistir al trabajo' },
      { numero: 20, texto: 'Bajo compromiso o poco interés con lo que se hace' },
      { numero: 21, texto: 'Dificultad para tomar decisiones' },
      { numero: 22, texto: 'Deseo de cambiar de empleo' },
    ],
  },
  {
    id: 'sintomas_psicoemocionales',
    instruccion: '',
    preguntas: [
      { numero: 23, texto: 'Sentimiento de soledad y miedo' },
      { numero: 24, texto: 'Sentimiento de irritabilidad, actitudes y pensamientos negativos' },
      { numero: 25, texto: 'Sentimiento de angustia, preocupación o tristeza' },
      { numero: 26, texto: 'Consumo de alcohol, pastillas para dormir u otras drogas' },
      { numero: 27, texto: 'Sentimiento de que "no vale nada", o sentimientos de culpa' },
      { numero: 28, texto: 'Exceso de confianza en sí mismo o dificultad para aceptar responsabilidades' },
      { numero: 29, texto: 'Comportamientos rígidos, obstinación o dificultades para aceptar cambios' },
      { numero: 30, texto: 'Sensación de no poder manejar los problemas de la vida' },
      { numero: 31, texto: 'Dificultades para dormir o problemas de concentración' },
    ],
  },
];

// ─── Tipos de cargo para determinar Forma A vs Forma B ────────────────────────

export type TipoCargo = 'jefatura' | 'profesional' | 'tecnico' | 'auxiliar' | 'operario';

export function determinarForma(tipoCargo: TipoCargo): 'A' | 'B' {
  return ['jefatura', 'profesional', 'tecnico'].includes(tipoCargo) ? 'A' : 'B';
}

export function getCuestionario(forma: 'A' | 'B'): SeccionCuestionario[] {
  return forma === 'A' ? FORMA_A : FORMA_B;
}

export const ESCALA_RESPUESTAS: { valor: Opcion; label: string }[] = [
  { valor: 'siempre',       label: 'Siempre' },
  { valor: 'casi_siempre', label: 'Casi siempre' },
  { valor: 'algunas_veces', label: 'Algunas veces' },
  { valor: 'casi_nunca',   label: 'Casi nunca' },
  { valor: 'nunca',        label: 'Nunca' },
];

export const ESCALA_ESTRES: { valor: string; label: string }[] = [
  { valor: 'siempre',       label: 'Siempre' },
  { valor: 'casi_siempre', label: 'Casi siempre' },
  { valor: 'algunas_veces', label: 'A veces' },
  { valor: 'nunca',        label: 'Nunca' },
];
