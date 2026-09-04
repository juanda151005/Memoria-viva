// ============================================================================
// mockData.js — Datos de ejemplo de "Memoria Viva"
// ----------------------------------------------------------------------------
// Este archivo simula lo que en producción vendría de una API/BD.
// Mantén la MISMA forma de los objetos para reemplazarlo sin tocar la UI.
// ============================================================================

// --- Taxonomías / catálogos de filtros -------------------------------------

export const departamentos = [
  'Chocó',
  'Bolívar',
  'Amazonas',
  'Cauca',
  'La Guajira',
  'Nariño',
  'Magdalena',
  'Boyacá',
]

export const tiposPatrimonio = [
  { id: 'oralitura', label: 'Oralitura', icon: '📖' },
  { id: 'musica', label: 'Música', icon: '🎶' },
  { id: 'saber', label: 'Saber tradicional', icon: '🌿' },
  { id: 'oficio', label: 'Oficio', icon: '🧺' },
  { id: 'obra', label: 'Obra artística', icon: '🎨' },
]

export const tematicas = [
  'Cosmogonía',
  'Territorio',
  'Resistencia',
  'Naturaleza',
  'Rituales',
  'Cocina',
  'Música y danza',
  'Memoria histórica',
  'Familia',
  'Medicina ancestral',
]

export const epocas = [
  'Anterior a 1950',
  '1950 – 1980',
  '1980 – 2000',
  'Después de 2000',
  'Sin fecha definida',
]

// --- Relatos ----------------------------------------------------------------
// tipo: id de tiposPatrimonio
// estado: 'revisado' | 'en_revision'
// palette: par de colores para la ilustración generada (mock)

export const relatos = [
  {
    id: 'el-hombre-caiman',
    titulo: 'El Hombre Caimán de Plato',
    comunidad: 'Comunidad ribereña del Magdalena',
    municipio: 'Plato',
    departamento: 'Magdalena',
    region: 'Caribe',
    narrador: 'Rosalba Manjarrés',
    tipo: 'oralitura',
    tematicas: ['Memoria histórica', 'Naturaleza', 'Territorio'],
    epoca: '1950 – 1980',
    fechaRegistro: '2025-06-14',
    estado: 'revisado',
    duracion: '7:42',
    iaGenerada: true,
    palette: ['#2F4A3C', '#D08C2E'],
    fragmento:
      'Cuentan que se convertía en caimán para espiar a las muchachas que bajaban al río, y que solo el brebaje de su madre podía devolverle la forma de hombre…',
    transcripcion: [
      'Dicen los viejos del pueblo que había un hombre al que le gustaba mirar a las mujeres cuando bajaban a lavar la ropa al río grande. Pero le daba pena que lo vieran, entonces buscó a un brujo de la Mojana para que lo volviera caimán y así nadar entre ellas sin que se dieran cuenta.',
      'El brujo le preparó dos pócimas: una roja para volverse animal y una blanca para volver a ser hombre. Su madre le echaba la blanca en la boca cada vez que salía del agua. Pero un día ella se enfermó, y no hubo quien le diera la pócima blanca completa.',
      'Desde entonces quedó con cuerpo de caimán y cabeza de hombre, penando por el Magdalena. Todavía hoy, cuando el río crece, las abuelas dicen: "cuiden a las niñas, que anda el Hombre Caimán".',
    ],
  },
  {
    id: 'canto-de-boga',
    titulo: 'Canto de boga para subir el río',
    comunidad: 'Bogas del Atrato',
    municipio: 'Quibdó',
    departamento: 'Chocó',
    region: 'Pacífico',
    narrador: 'Aureliano Mosquera',
    tipo: 'musica',
    tematicas: ['Territorio', 'Naturaleza', 'Familia'],
    epoca: 'Anterior a 1950',
    fechaRegistro: '2025-07-02',
    estado: 'revisado',
    duracion: '4:15',
    iaGenerada: true,
    palette: ['#3A4A7A', '#C96B45'],
    fragmento:
      'Los cantos marcaban el ritmo del canalete contra la corriente; sin canto, el brazo se cansa y el río gana…',
    transcripcion: [
      'Antes de que llegaran los motores, uno subía el Atrato a puro canalete. Y el río no se sube en silencio, mijo: se sube cantando. El canto le pone ritmo al brazo, y cuando todos remamos al mismo compás, la champa avanza aunque la corriente esté brava.',
      'Mi papá me enseñó los cantos de boga que le enseñó su papá. Son coplas que hablan del monte, de las mujeres que esperan en el puerto, de los santos que cuidan al navegante. Uno canta y contesta, canta y contesta, y así se van las horas.',
      'Hoy los pelaos ya no los saben. Por eso quise grabarlo, para que no se pierda el son con que nuestros mayores le ganaron al río.',
    ],
  },
  {
    id: 'lumbalu-palenque',
    titulo: 'El Lumbalú: cantos para despedir a los muertos',
    comunidad: 'San Basilio de Palenque',
    municipio: 'Mahates',
    departamento: 'Bolívar',
    region: 'Caribe',
    narrador: 'Graciela Salgado (memoria de)',
    tipo: 'saber',
    tematicas: ['Rituales', 'Resistencia', 'Memoria histórica'],
    epoca: 'Anterior a 1950',
    fechaRegistro: '2025-05-20',
    estado: 'revisado',
    duracion: '9:03',
    iaGenerada: true,
    palette: ['#8F3C20', '#D08C2E'],
    fragmento:
      'Durante nueve noches las mujeres cantan en lengua palenquera para acompañar al muerto en su viaje de regreso a África…',
    transcripcion: [
      'El Lumbalú es el canto fúnebre de Palenque. Cuando alguien muere, las cantadoras se reúnen y durante nueve noches cantan y lloran con un tambor pechiche. No es tristeza sola: es un puente para que el alma cruce de vuelta a la tierra de los ancestros.',
      'Se canta en lengua palenquera, la lengua que nuestros abuelos cimarrones inventaron para hablar sin que el amo entendiera. Cantar el Lumbalú es recordar que fuimos el primer pueblo libre de América.',
      'Por eso lo cuidamos como se cuida un tesoro. Mientras haya quien cante el Lumbalú, Palenque no se muere.',
    ],
  },
  {
    id: 'origen-yurupari',
    titulo: 'El origen del Yuruparí',
    comunidad: 'Pueblo Tucano',
    municipio: 'Mitú',
    departamento: 'Amazonas',
    region: 'Amazonía',
    narrador: 'Payé Benedicto Yépez',
    tipo: 'oralitura',
    tematicas: ['Cosmogonía', 'Rituales', 'Naturaleza'],
    epoca: 'Sin fecha definida',
    fechaRegistro: '2025-04-11',
    estado: 'en_revision',
    duracion: '12:30',
    iaGenerada: true,
    palette: ['#2F4A3C', '#54659A'],
    fragmento:
      'Del primer niño nacido del fuego surgieron las flautas sagradas que las mujeres no pueden ver, y que ordenan el mundo…',
    transcripcion: [
      'En el principio, el mundo estaba desordenado. Entonces nació Yuruparí, un ser que enseñó a los hombres las leyes: cómo cazar, cuándo sembrar, cómo respetar el monte y a los animales dueños de cada lugar.',
      'De su cuerpo salieron las flautas sagradas. Su sonido guarda el conocimiento de los mayores y se toca en las ceremonias de iniciación, cuando los jóvenes dejan de ser niños.',
      'Este relato no se cuenta de cualquier manera ni a cualquier hora. Lo compartimos aquí con permiso del payé, para que los jóvenes de la maloca lo escuchen y lo respeten.',
    ],
  },
  {
    id: 'tejido-wayuu',
    titulo: 'El sueño que enseñó a tejer la mochila',
    comunidad: 'Pueblo Wayúu',
    municipio: 'Uribia',
    departamento: 'La Guajira',
    region: 'Caribe',
    narrador: 'Josefa Epieyú',
    tipo: 'oficio',
    tematicas: ['Cosmogonía', 'Familia', 'Naturaleza'],
    epoca: 'Sin fecha definida',
    fechaRegistro: '2025-08-01',
    estado: 'revisado',
    duracion: '6:20',
    iaGenerada: true,
    palette: ['#B5502E', '#D08C2E'],
    fragmento:
      'Wale’kerü, la araña, le enseñó a la primera mujer wayúu a tejer los kanas, los dibujos que cuentan quiénes somos…',
    transcripcion: [
      'Nosotras las wayúu tejemos porque Wale’kerü, la araña, nos enseñó. Ella tejía de noche unos dibujos hermosos, y una joven la observó hasta aprender. Esos dibujos se llaman kanas, y cada uno tiene un nombre y un significado.',
      'Cuando una niña se hace señorita, pasa un tiempo en encierro y allí las mayores le enseñan a tejer. Tejer no es solo hacer una mochila para vender: es aprender la paciencia, la historia y el pensamiento de nuestro pueblo.',
      'Cada mochila lleva los sueños de quien la teje. Por eso no hay dos iguales.',
    ],
  },
  {
    id: 'medicina-nasa',
    titulo: 'La ritualidad del refrescamiento con el médico tradicional',
    comunidad: 'Pueblo Nasa',
    municipio: 'Toribío',
    departamento: 'Cauca',
    region: 'Andina',
    narrador: 'The’ wala Segundo Yatacué',
    tipo: 'saber',
    tematicas: ['Medicina ancestral', 'Rituales', 'Territorio'],
    epoca: 'Después de 2000',
    fechaRegistro: '2025-07-19',
    estado: 'en_revision',
    duracion: '8:11',
    iaGenerada: true,
    palette: ['#2F4A3C', '#3E5F4E'],
    fragmento:
      'El the’ wala lee las señales del cuerpo y de las plantas para armonizar a la persona con el territorio…',
    transcripcion: [
      'El the’ wala es nuestro médico tradicional. No cura solo el cuerpo: armoniza a la persona con la naturaleza, con la familia y con el territorio. Cuando algo anda mal, hay que "refrescar".',
      'El refrescamiento se hace con plantas frías, con coca, con la lectura de las señales. El cuerpo habla: un salto en el ojo, un dolor, un sueño. El the’ wala sabe leer eso porque los mayores le enseñaron y porque la Madre Tierra le da el don.',
      'Compartimos este saber para que se valore, pero recordamos que la medicina propia se practica dentro de la comunidad y con respeto.',
    ],
  },
  {
    id: 'currulao-marimba',
    titulo: 'La marimba de chonta, piano de la selva',
    comunidad: 'Comunidad afro del Pacífico Sur',
    municipio: 'Tumaco',
    departamento: 'Nariño',
    region: 'Pacífico',
    narrador: 'Genaro Torres',
    tipo: 'musica',
    tematicas: ['Música y danza', 'Territorio', 'Familia'],
    epoca: '1980 – 2000',
    fechaRegistro: '2025-06-30',
    estado: 'revisado',
    duracion: '5:48',
    iaGenerada: true,
    palette: ['#D08C2E', '#8F3C20'],
    fragmento:
      'Se construye con palma de chonta y guadua; su sonido, dicen, imita el agua de los ríos que bajan al mar…',
    transcripcion: [
      'La marimba se hace con chonta, una palma dura del monte. Los tacos golpean las tablillas y suena como el agua bajando. Por eso le decimos el piano de la selva.',
      'Con la marimba tocamos el currulao. Es baile de galanteo: el hombre corteja, la mujer responde con el pañuelo, y los cununos y el guasá llevan el ritmo. En cada arrullo y cada currulao está la historia de nuestros mayores traídos de África.',
      'Hoy enseño a los niños de la escuela a construir y a tocar la marimba, para que el son del Pacífico no se apague.',
    ],
  },
  {
    id: 'leyenda-mohan',
    titulo: 'El Mohán del río Magdalena',
    comunidad: 'Pescadores del alto Magdalena',
    municipio: 'Honda',
    departamento: 'Boyacá',
    region: 'Andina',
    narrador: 'Efraín Rojas',
    tipo: 'oralitura',
    tematicas: ['Naturaleza', 'Territorio', 'Memoria histórica'],
    epoca: '1950 – 1980',
    fechaRegistro: '2025-05-05',
    estado: 'revisado',
    duracion: '6:57',
    iaGenerada: true,
    palette: ['#3A4A7A', '#2F4A3C'],
    fragmento:
      'De cabello largo y ojos de brasa, el Mohán enamora a las lavanderas y esconde los anzuelos de los pescadores…',
    transcripcion: [
      'El Mohán vive en las cuevas del río. Es peludo, de barba larga y ojos que brillan como candela. Le gusta el tabaco, el aguardiente y las mujeres bonitas que van al río.',
      'A los pescadores les enreda las atarrayas y les esconde el pescado si no le dejan su ofrenda. Muchos juran haberlo oído reír entre los peñascos cuando el río baja crecido.',
      'Los abuelos decían que el Mohán es el dueño del agua, y que respetarlo es respetar el río que nos da la comida.',
    ],
  },
  {
    id: 'sancocho-trifasico',
    titulo: 'El sancocho de las tres carnes que une a la vereda',
    comunidad: 'Campesinos del Valle de Tenza',
    municipio: 'Garagoa',
    departamento: 'Boyacá',
    region: 'Andina',
    narrador: 'Blanca Nieves Sáenz',
    tipo: 'saber',
    tematicas: ['Cocina', 'Familia', 'Territorio'],
    epoca: 'Después de 2000',
    fechaRegistro: '2025-08-12',
    estado: 'revisado',
    duracion: '3:58',
    iaGenerada: true,
    palette: ['#C96B45', '#D08C2E'],
    fragmento:
      'Se cocina en leña y en olla grande, porque el sancocho no es para uno solo: es para toda la vereda que llega a la minga…',
    transcripcion: [
      'Aquí el sancocho se hace en olla de barro y con leña, que le da un saborcito que la estufa no da. Lleva gallina criolla, costilla de res y espinazo de cerdo: por eso le decimos trifásico.',
      'No se hace cualquier día. Se hace cuando hay minga, cuando la vereda se junta a trabajar la tierra de un vecino. Todos ponen: uno la yuca, otro la mazorca, otro el plátano.',
      'Comer del mismo sancocho es recordar que solos no podemos, que la tierra se trabaja entre todos.',
    ],
  },
  {
    id: 'mural-comuna',
    titulo: 'Muralismo de la memoria en el barrio',
    comunidad: 'Colectivo de artistas urbanos',
    municipio: 'Quibdó',
    departamento: 'Chocó',
    region: 'Pacífico',
    narrador: 'Yeison Palacios',
    tipo: 'obra',
    tematicas: ['Resistencia', 'Memoria histórica', 'Música y danza'],
    epoca: 'Después de 2000',
    fechaRegistro: '2025-07-28',
    estado: 'en_revision',
    duracion: '5:12',
    iaGenerada: true,
    palette: ['#B5502E', '#3A4A7A'],
    fragmento:
      'Pintamos en las paredes lo que no cabe en los libros: los líderes, las cantadoras, los ríos que nos dan la vida…',
    transcripcion: [
      'En el barrio no teníamos museo, entonces convertimos las paredes en museo. Pintamos a nuestras cantadoras, a los líderes que ya no están, al río Atrato que ganó el derecho a ser sujeto de derechos.',
      'Cada mural nace de una conversación con los vecinos: qué queremos recordar, a quién queremos honrar. El arte urbano aquí no es adorno, es memoria y es denuncia.',
      'Registramos los murales porque las paredes se borran, pero la memoria de por qué los pintamos tiene que quedar.',
    ],
  },
]

// --- Estadísticas de la home ------------------------------------------------

export const estadisticas = [
  { valor: '247', label: 'relatos preservados' },
  { valor: '18', label: 'comunidades' },
  { valor: '6', label: 'departamentos' },
  { valor: '1.240', label: 'horas de audio' },
]

// --- Pasos del "cómo funciona" ---------------------------------------------

export const pasos = [
  {
    n: '01',
    icon: '⬆️',
    titulo: 'La comunidad sube',
    texto:
      'Una persona de la comunidad registra un audio, video, foto o documento desde el celular o el computador.',
  },
  {
    n: '02',
    icon: '📝',
    titulo: 'La IA transcribe',
    texto:
      'El relato se transcribe automáticamente (modelo tipo Whisper) y se organiza en un catálogo inteligente.',
  },
  {
    n: '03',
    icon: '🎨',
    titulo: 'La IA ilustra',
    texto:
      'Si no hay imagen ni video, la IA propone una ilustración representativa, siempre marcada como generada por IA.',
  },
  {
    n: '04',
    icon: '✅',
    titulo: 'La comunidad aprueba',
    texto:
      'Una persona de la comunidad revisa, corrige y aprueba antes de que el relato se publique al público.',
  },
]

// --- Helpers ----------------------------------------------------------------

export const tipoLabel = (id) =>
  tiposPatrimonio.find((t) => t.id === id)?.label ?? id

export const tipoIcon = (id) =>
  tiposPatrimonio.find((t) => t.id === id)?.icon ?? '•'

export const getRelato = (id) => relatos.find((r) => r.id === id)
