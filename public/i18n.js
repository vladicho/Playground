const STORAGE_KEY = "playground-language-v1";

const PT_TO_ES = new Map([
  ["Playground · Biblioteca Matemática", "Playground · Biblioteca Matemática"],
  ["Consulte uma biblioteca matemática privada com respostas fundamentadas em fontes.", "Consulta una biblioteca matemática privada con respuestas fundamentadas en fuentes."],
  ["Página inicial", "Página de inicio"],
  ["Biblioteca Matemática", "Biblioteca Matemática"],
  ["Base conectada", "Base conectada"],
  ["Catálogo", "Catálogo"],
  ["Caderno", "Cuaderno"],
  ["Plano", "Plan"],
  ["Limpar", "Limpiar"],
  ["RAG privado · matemática", "RAG privado · matemáticas"],
  ["Pergunte. Calcule.", "Pregunta. Calcula."],
  ["Confira a fonte.", "Comprueba la fuente."],
  ["Respostas em português ou espanhol, fundamentadas nos documentos indexados da sua biblioteca.", "Respuestas en portugués o español, fundamentadas en los documentos indexados de tu biblioteca."],
  ["Ferramentas de estudo", "Herramientas de estudio"],
  ["Escolha um modo e informe o assunto ou documento.", "Elige un modo e indica el tema o documento."],
  ["Resumo", "Resumen"],
  ["Síntese fundamentada", "Síntesis fundamentada"],
  ["Quiz", "Cuestionario"],
  ["5 questões comentadas", "5 preguntas comentadas"],
  ["Flashcards", "Tarjetas"],
  ["10 cartões de revisão", "10 tarjetas de repaso"],
  ["Mapa mental", "Mapa mental"],
  ["Estrutura em tópicos", "Estructura por temas"],
  ["Podcast", "Pódcast"],
  ["Áudio e videoaula", "Audio y videoclase"],
  ["Simulado", "Examen"],
  ["Prova com cronômetro", "Prueba con cronómetro"],
  ["Perguntas sugeridas", "Preguntas sugeridas"],
  ["Conceito de aritmética", "Concepto de aritmética"],
  ["Resolver um exercício", "Resolver un ejercicio"],
  ["Álgebra linear", "Álgebra lineal"],
  ["Modo da pergunta", "Modo de la pregunta"],
  ["Perguntar", "Preguntar"],
  ["Pergunta", "Pregunta"],
  ["Pergunte sobre os documentos…", "Pregunta sobre los documentos…"],
  ["Enviar pergunta", "Enviar pregunta"],
  ["A IA pode errar. Confira os cálculos e as fontes.", "La IA puede equivocarse. Comprueba los cálculos y las fuentes."],
  ["Acervo matemático", "Colección matemática"],
  ["Catálogo de livros", "Catálogo de libros"],
  ["Os títulos são públicos; os arquivos continuam privados. A classificação é estimada pelo nome.", "Los títulos son públicos; los archivos siguen siendo privados. La clasificación se estima por el nombre."],
  ["Fechar catálogo", "Cerrar catálogo"],
  ["Buscar no catálogo", "Buscar en el catálogo"],
  ["Título, autor ou assunto…", "Título, autor o tema…"],
  ["Filtrar por categoria", "Filtrar por categoría"],
  ["Todas as categorias", "Todas las categorías"],
  ["Aritmética", "Aritmética"],
  ["Álgebra", "Álgebra"],
  ["Geometria e trigonometria", "Geometría y trigonometría"],
  ["Cálculo e análise", "Cálculo y análisis"],
  ["Matemática discreta", "Matemática discreta"],
  ["Estatística e probabilidade", "Estadística y probabilidad"],
  ["Matemática geral", "Matemática general"],
  ["Somente indexados", "Solo indexados"],
  ["Carregando catálogo…", "Cargando catálogo…"],
  ["Indexado = disponível para perguntas no RAG", "Indexado = disponible para preguntas en el RAG"],
  ["Fila de indexação", "Cola de indexación"],
  ["A fila fica salva neste dispositivo e não consome créditos.", "La cola se guarda en este dispositivo y no consume créditos."],
  ["Abrir fila", "Abrir cola"],
  ["Fechar fila", "Cerrar cola"],
  ["Destino do rclone", "Destino de rclone"],
  ["Exemplo: nome-do-remote:nome-do-bucket. Este valor fica somente no navegador.", "Ejemplo: nombre-del-remote:nombre-del-bucket. Este valor permanece solo en el navegador."],
  ["Copiar comandos do Termux", "Copiar comandos de Termux"],
  ["Limpar fila", "Vaciar cola"],
  ["Depois de executar os comandos, confirme no AI Search que o filtro inclui", "Después de ejecutar los comandos, confirma en AI Search que el filtro incluye"],
  ["e inicie a reindexação. O selo “Indexado” só deve ser atualizado após a confirmação.", "e inicia la reindexación. La etiqueta “Indexado” solo debe actualizarse después de la confirmación."],
  ["Mostrar mais", "Mostrar más"],
  ["Materiais salvos", "Materiales guardados"],
  ["Caderno de estudos", "Cuaderno de estudio"],
  ["Respostas, anotações e revisões ficam somente neste navegador.", "Las respuestas, notas y revisiones permanecen solo en este navegador."],
  ["Fechar caderno", "Cerrar cuaderno"],
  ["Pesquisar materiais salvos", "Buscar materiales guardados"],
  ["Pesquisar no caderno…", "Buscar en el cuaderno…"],
  ["Filtrar por tipo de material", "Filtrar por tipo de material"],
  ["Todos os materiais", "Todos los materiales"],
  ["Respostas", "Respuestas"],
  ["Resumos", "Resúmenes"],
  ["Quizzes", "Cuestionarios"],
  ["Mapas mentais", "Mapas mentales"],
  ["Roteiros de podcast", "Guiones de pódcast"],
  ["Simulados", "Exámenes"],
  ["Filtrar por revisão", "Filtrar por revisión"],
  ["Todos os estados", "Todos los estados"],
  ["Revisão pendente", "Revisión pendiente"],
  ["Novos", "Nuevos"],
  ["Aprendendo", "Aprendiendo"],
  ["Dominados", "Dominados"],
  ["Nenhum material salvo", "Ningún material guardado"],
  ["0 revisados", "0 revisados"],
  ["Progresso das revisões", "Progreso de las revisiones"],
  ["Pendentes", "Pendientes"],
  ["Dias seguidos", "Días seguidos"],
  ["Domínio geral", "Dominio general"],
  ["Progresso por livro", "Progreso por libro"],
  ["Progresso por assunto", "Progreso por tema"],
  ["Use “Imprimir caderno” e escolha “Salvar como PDF”.", "Usa “Imprimir cuaderno” y elige “Guardar como PDF”."],
  ["Imprimir caderno", "Imprimir cuaderno"],
  ["Rotina de aprendizagem", "Rutina de aprendizaje"],
  ["Plano de estudos", "Plan de estudio"],
  ["Metas, calendário e tempo estudado ficam somente neste navegador.", "Las metas, el calendario y el tiempo estudiado permanecen solo en este navegador."],
  ["Fechar plano", "Cerrar plan"],
  ["Resumo semanal", "Resumen semanal"],
  ["Min planejados", "Min planificados"],
  ["Min estudados", "Min estudiados"],
  ["Metas concluídas", "Metas completadas"],
  ["Progresso semanal", "Progreso semanal"],
  ["Configurar e gerar semana", "Configurar y generar semana"],
  ["Dias de estudo", "Días de estudio"],
  ["Seg", "Lun"],
  ["Ter", "Mar"],
  ["Qua", "Mié"],
  ["Qui", "Jue"],
  ["Sex", "Vie"],
  ["Sáb", "Sáb"],
  ["Dom", "Dom"],
  ["Minutos por dia", "Minutos por día"],
  ["25 minutos", "25 minutos"],
  ["45 minutos", "45 minutos"],
  ["60 minutos", "60 minutos"],
  ["90 minutos", "90 minutos"],
  ["Gerar metas da semana", "Generar metas de la semana"],
  ["Meta de estudo", "Meta de estudio"],
  ["Nova meta de estudo…", "Nueva meta de estudio…"],
  ["Data", "Fecha"],
  ["Duração em minutos", "Duración en minutos"],
  ["Adicionar", "Añadir"],
  ["Sessão atual", "Sesión actual"],
  ["Estudo", "Estudio"],
  ["Pausar", "Pausar"],
  ["Concluir", "Completar"],
  ["Semana anterior", "Semana anterior"],
  ["Semana atual", "Semana actual"],
  ["Hoje", "Hoy"],
  ["Próxima semana", "Semana siguiente"],
  ["Nenhum livro na fila.", "Ningún libro en la cola."],
  ["Remover", "Quitar"],
  ["A fila aceita no máximo 10 livros por lote.", "La cola admite como máximo 10 libros por lote."],
  ["Novo", "Nuevo"],
  ["Dominado", "Dominado"],
  ["sem data", "sin fecha"],
  ["agora", "ahora"],
  ["Fonte não identificada", "Fuente no identificada"],
  ["Sem livro identificado", "Sin libro identificado"],
  ["Salve materiais com fontes para acompanhar livros.", "Guarda materiales con fuentes para seguir los libros."],
  ["Salve materiais para acompanhar assuntos.", "Guarda materiales para seguir los temas."],
  ["Caderno cheio", "Cuaderno lleno"],
  ["Sem espaço local", "Sin espacio local"],
  ["Salvo no caderno", "Guardado en el cuaderno"],
  ["Data não disponível", "Fecha no disponible"],
  ["Fontes salvas", "Fuentes guardadas"],
  ["Fonte", "Fuente"],
  ["Como foi esta revisão?", "¿Cómo fue esta revisión?"],
  ["A resposta define a próxima data automaticamente.", "La respuesta define automáticamente la próxima fecha."],
  ["Difícil · 1 dia", "Difícil · 1 día"],
  ["Boa · avançar", "Bien · avanzar"],
  ["Fácil · avançar 2", "Fácil · avanzar 2"],
  ["Minhas anotações", "Mis notas"],
  ["Escreva sua anotação…", "Escribe tu nota…"],
  ["Nenhum material corresponde aos filtros.", "Ningún material coincide con los filtros."],
  ["Salve uma resposta da biblioteca para começar seu caderno.", "Guarda una respuesta de la biblioteca para comenzar tu cuaderno."],
  ["Abrir", "Abrir"],
  ["Fechar", "Cerrar"],
  ["Excluir", "Eliminar"],
  ["Continuar", "Continuar"],
  ["Substituir a sessão que já está em andamento?", "¿Sustituir la sesión que ya está en curso?"],
  ["Estudo livre de matemática", "Estudio libre de matemáticas"],
  ["Selecione pelo menos um dia de estudo.", "Selecciona al menos un día de estudio."],
  ["Revisar", "Repasar"],
  ["Estudar", "Estudiar"],
  ["Sem metas", "Sin metas"],
  ["Em andamento", "En curso"],
  ["Iniciar", "Iniciar"],
  ["Concluída ✓", "Completada ✓"],
  ["Nenhum título corresponde a esses filtros.", "Ningún título coincide con estos filtros."],
  ["Indexado", "Indexado"],
  ["Na fila", "En la cola"],
  ["Perguntar sobre este livro", "Preguntar sobre este libro"],
  ["Remover da fila", "Quitar de la cola"],
  ["Adicionar à fila", "Añadir a la cola"],
  ["Não foi possível carregar o catálogo.", "No se pudo cargar el catálogo."],
  ["Você", "Tú"],
  ["Biblioteca", "Biblioteca"],
  ["Fontes recuperadas", "Fuentes recuperadas"],
  ["Similaridade indica recuperação, não garante que toda a resposta esteja na fonte.", "La similitud indica recuperación, pero no garantiza que toda la respuesta esté en la fuente."],
  ["Score bruto", "Puntuación bruta"],
  ["▶ Ouvir roteiro", "▶ Escuchar guion"],
  ["■ Parar", "■ Detener"],
  ["↓ Gerar áudio", "↓ Generar audio"],
  ["🎬 Gerar videoaula", "🎬 Generar videoclase"],
  ["Gerando narração…", "Generando narración…"],
  ["Baixar MP3", "Descargar MP3"],
  ["Áudio pronto.", "Audio listo."],
  ["Montando videoaula… mantenha esta tela aberta.", "Creando videoclase… mantén esta pantalla abierta."],
  ["Baixar videoaula", "Descargar videoclase"],
  ["Videoaula pronta.", "Videoclase lista."],
  ["Este navegador não consegue gerar o vídeo. Baixe o áudio.", "Este navegador no puede generar el video. Descarga el audio."],
  ["Não foi possível gerar o áudio do podcast agora.", "No se pudo generar el audio del pódcast en este momento."],
  ["Não foi possível montar o vídeo.", "No se pudo crear el video."],
  ["Mapa mental gráfico", "Mapa mental gráfico"],
  ["Diminuir mapa", "Reducir mapa"],
  ["Ampliar mapa", "Ampliar mapa"],
  ["Preparando PNG…", "Preparando PNG…"],
  ["Abrir PNG", "Abrir PNG"],
  ["PNG indisponível", "PNG no disponible"],
  ["Baixar PNG", "Descargar PNG"],
  ["Simulado pronto. As respostas serão reveladas somente após a entrega.", "Examen listo. Las respuestas se mostrarán solo después de entregarlo."],
  ["5 questões · 20 minutos", "5 preguntas · 20 minutos"],
  ["Tempo restante", "Tiempo restante"],
  ["Entregar simulado", "Entregar examen"],
  ["Correta", "Correcta"],
  ["Incorreta", "Incorrecta"],
  ["Sem explicação adicional.", "Sin explicación adicional."],
  ["Tempo encerrado", "Tiempo agotado"],
  ["Simulado entregue", "Examen entregado"],
  ["Encerrado", "Finalizado"],
  ["Parabéns: nenhuma questão errada", "Enhorabuena: ninguna respuesta incorrecta"],
  ["Relatório de erros", "Informe de errores"],
  ["Você acertou todas as questões.", "Has acertado todas las preguntas."],
  ["não respondida", "sin responder"],
  ["Salvar no caderno", "Guardar en el cuaderno"],
  ["Imprimir / Salvar PDF", "Imprimir / Guardar PDF"],
  ["Resposta da biblioteca", "Respuesta de la biblioteca"],
  ["Roteiro de podcast", "Guion de pódcast"],
  ["Não foi possível consultar a biblioteca.", "No se pudo consultar la biblioteca."],
  ["A biblioteca não retornou uma resposta.", "La biblioteca no devolvió una respuesta."],
  ["Ocorreu um erro inesperado.", "Ocurrió un error inesperado."],
  ["Fila limpa.", "Cola vaciada."],
  ["Informe o destino como remote:nome-do-bucket.", "Indica el destino como remote:nombre-del-bucket."],
  ["Não foi possível copiar automaticamente. Tente novamente pelo navegador.", "No se pudo copiar automáticamente. Inténtalo de nuevo desde el navegador."],
  ["Envie uma conversa válida terminando com uma pergunta.", "Envía una conversación válida que termine con una pregunta."],
  ["A conversa excedeu o limite permitido.", "La conversación superó el límite permitido."],
  ["JSON inválido.", "JSON no válido."],
  ["O controle de uso está temporariamente indisponível.", "El control de uso no está disponible temporalmente."],
  ["Você atingiu o limite diário de perguntas. Tente novamente amanhã.", "Has alcanzado el límite diario de preguntas. Inténtalo de nuevo mañana."],
  ["A biblioteca atingiu o limite diário de uso. Tente novamente amanhã.", "La biblioteca alcanzó el límite diario de uso. Inténtalo de nuevo mañana."],
  ["Não foi possível consultar a biblioteca agora.", "No se pudo consultar la biblioteca en este momento."],
  ["Explique um conceito de aritmética encontrado nos documentos e dê um exemplo.", "Explica un concepto de aritmética encontrado en los documentos y da un ejemplo."],
  ["Encontre um exercício de aritmética nos documentos e resolva passo a passo usando a fonte.", "Encuentra un ejercicio de aritmética en los documentos y resuélvelo paso a paso usando la fuente."],
  ["Explique uma ideia de álgebra linear usando apenas os documentos e cite a fonte.", "Explica una idea de álgebra lineal usando solo los documentos y cita la fuente."],
  ["Assunto ou nome do documento para resumir…", "Tema o nombre del documento para resumir…"],
  ["Assunto do quiz…", "Tema del cuestionario…"],
  ["Assunto dos flashcards…", "Tema de las tarjetas…"],
  ["Assunto do mapa mental…", "Tema del mapa mental…"],
  ["Assunto do roteiro de podcast…", "Tema del guion de pódcast…"],
  ["Assunto ou documento do simulado…", "Tema o documento del examen…"],
  ["Idioma da interface", "Idioma de la interfaz"],
]);

const PROMPTS = new Map([
  [
    'Crie um resumo didático sobre "{topic}" usando somente informações sustentadas pelos documentos recuperados. Organize em: visão geral, conceitos principais, fórmulas ou definições importantes e pontos para revisar. Diferencie claramente o conteúdo das fontes de qualquer explicação sua.',
    'Crea un resumen didáctico sobre "{topic}" usando solo información respaldada por los documentos recuperados. Organízalo en: visión general, conceptos principales, fórmulas o definiciones importantes y puntos para repasar. Distingue claramente el contenido de las fuentes de cualquier explicación propia.',
  ],
  [
    'Crie um quiz de estudo sobre "{topic}" com 5 questões objetivas baseadas nos documentos recuperados. Dê quatro alternativas por questão. Coloque o gabarito comentado somente depois de todas as perguntas e explique qual informação da fonte sustenta cada resposta.',
    'Crea un cuestionario de estudio sobre "{topic}" con 5 preguntas objetivas basadas en los documentos recuperados. Da cuatro alternativas por pregunta. Coloca las respuestas comentadas solo después de todas las preguntas y explica qué información de la fuente respalda cada respuesta.',
  ],
  [
    'Crie 10 flashcards sobre "{topic}" com base nos documentos recuperados. Use o formato numerado "Frente:" e "Verso:". Faça cartões curtos, sem repetir ideias, e não invente informações ausentes nas fontes.',
    'Crea 10 tarjetas sobre "{topic}" basadas en los documentos recuperados. Usa el formato numerado "Anverso:" y "Reverso:". Haz tarjetas breves, sin repetir ideas, y no inventes información ausente en las fuentes.',
  ],
  [
    'Crie um mapa mental sobre "{topic}" usando os documentos recuperados. Dê uma introdução curta e depois inclua obrigatoriamente um bloco entre as linhas "MAPA MENTAL" e "FIM DO MAPA". Dentro dele, use apenas marcadores com hífen: a primeira linha sem recuo é o tema central; ramos usam dois espaços de recuo; sub-ramos usam quatro espaços. Limite a 24 nós com textos curtos. Inclua conceitos, relações, fórmulas e exemplos somente quando sustentados pelas fontes.',
    'Crea un mapa mental sobre "{topic}" usando los documentos recuperados. Da una introducción breve y después incluye obligatoriamente un bloque entre las líneas "MAPA MENTAL" y "FIM DO MAPA". Dentro usa solo viñetas con guion: la primera línea sin sangría es el tema central; las ramas usan dos espacios de sangría y las subramas cuatro. Limita el mapa a 24 nodos con textos breves. Incluye conceptos, relaciones, fórmulas y ejemplos solo cuando estén respaldados por las fuentes.',
  ],
  [
    'Crie um roteiro curto de podcast educativo, de aproximadamente 3 minutos, sobre "{topic}". Use duas vozes chamadas Apresentador e Especialista, linguagem natural e explicações baseadas nos documentos recuperados. Termine com três pontos de revisão. Não invente fatos ausentes nas fontes.',
    'Crea un guion breve de pódcast educativo, de aproximadamente 3 minutos, sobre "{topic}". Usa dos voces llamadas Presentador y Especialista, lenguaje natural y explicaciones basadas en los documentos recuperados. Termina con tres puntos de repaso. No inventes hechos ausentes en las fuentes.',
  ],
  [
    'Crie um simulado sobre "{topic}" usando somente informações sustentadas pelos documentos recuperados. Produza exatamente 5 questões, cada uma com 4 alternativas plausíveis e apenas uma correta. Retorne somente um bloco no formato abaixo, com JSON válido e sem cercas de código ou comentários:\nSIMULADO_JSON\n{"title":"Título curto","questions":[{"question":"Enunciado","options":["Alternativa A","Alternativa B","Alternativa C","Alternativa D"],"correct":0,"explanation":"Correção comentada","source":"Nome do documento que sustenta a questão"}]}\nFIM_SIMULADO_JSON\nO campo correct deve ser um inteiro de 0 a 3. Use notação matemática simples ou escape corretamente barras invertidas do LaTeX dentro do JSON. Não revele respostas fora do JSON.',
    'Crea un examen sobre "{topic}" usando solo información respaldada por los documentos recuperados. Produce exactamente 5 preguntas, cada una con 4 alternativas plausibles y una sola correcta. Devuelve únicamente un bloque con el siguiente formato, JSON válido y sin cercas de código ni comentarios:\nSIMULADO_JSON\n{"title":"Título breve","questions":[{"question":"Enunciado","options":["Alternativa A","Alternativa B","Alternativa C","Alternativa D"],"correct":0,"explanation":"Corrección comentada","source":"Nombre del documento que respalda la pregunta"}]}\nFIM_SIMULADO_JSON\nEl campo correct debe ser un entero de 0 a 3. Usa notación matemática simple o escapa correctamente las barras invertidas de LaTeX dentro del JSON. No reveles respuestas fuera del JSON.',
  ],
]);

const ES_TO_PT = new Map([...PT_TO_ES].map(([pt, es]) => [es, pt]));
const listeners = new Set();

function savedLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "pt" || saved === "es") return saved;
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
  return navigator.languages?.some((language) => language.toLowerCase().startsWith("es"))
    ? "es"
    : "pt";
}

let language = typeof window === "undefined" ? "pt" : savedLanguage();

export function getLanguage() {
  return language;
}

export function getLocale() {
  return language === "es" ? "es-419" : "pt-BR";
}

export function localizePrompt(template, topic) {
  const localized = language === "es" ? PROMPTS.get(template) || template : template;
  return localized.replaceAll("{topic}", topic);
}

function translatePattern(value, targetLanguage) {
  const patterns = targetLanguage === "es"
    ? [
        [/^(\d+) título encontrado$/, "$1 título encontrado"],
        [/^(\d+) títulos encontrados$/, "$1 títulos encontrados"],
        [/^(\d+) material exibido$/, "$1 material mostrado"],
        [/^(\d+) materiais exibidos$/, "$1 materiales mostrados"],
        [/^(\d+) de (\d+) respondidas$/, "$1 de $2 respondidas"],
        [/^(\d+) questão\(ões\) para revisar$/, "$1 pregunta(s) para repasar"],
        [/^(\d+) pendente\(s\)$/, "$1 pendiente(s)"],
        [/^(\d+)% · (\d+) pendente\(s\)$/, "$1% · $2 pendiente(s)"],
        [/^(\d+)\/(\d+) revisados · (\d+) pendente\(s\)$/, "$1/$2 revisados · $3 pendiente(s)"],
        [/^Fontes recuperadas \((\d+)\)$/, "Fuentes recuperadas ($1)"],
        [/^Fonte indicada: (.+)$/, "Fuente indicada: $1"],
        [/^Score bruto: (.+)$/, "Puntuación bruta: $1"],
        [/^Excluir meta (.+)$/, "Eliminar meta $1"],
        [/^Questão (\d+): marcou (.+); correta (.+)\. $/, "Pregunta $1: marcó $2; correcta $3. "],
        [/^Mapa mental sobre (.+)$/, "Mapa mental sobre $1"],
        [/^Caderno \((\d+)\)$/, "Cuaderno ($1)"],
        [/^Plano \((\d+)\)$/, "Plan ($1)"],
        [/^(\d+) materiais · (.+)$/, "$1 materiales · $2"],
        [/^(\d+) comando\(s\) copiado\(s\)\. Execute no Termux e depois reindexe o AI Search\.$/, "$1 comando(s) copiado(s). Ejecútalos en Termux y después vuelve a indexar AI Search."],
      ]
    : [
        [/^(\d+) título encontrado$/, "$1 título encontrado"],
        [/^(\d+) títulos encontrados$/, "$1 títulos encontrados"],
        [/^(\d+) material mostrado$/, "$1 material exibido"],
        [/^(\d+) materiales mostrados$/, "$1 materiais exibidos"],
        [/^(\d+) de (\d+) respondidas$/, "$1 de $2 respondidas"],
        [/^(\d+) pregunta\(s\) para repasar$/, "$1 questão(ões) para revisar"],
        [/^(\d+) pendiente\(s\)$/, "$1 pendente(s)"],
        [/^(\d+)% · (\d+) pendiente\(s\)$/, "$1% · $2 pendente(s)"],
        [/^(\d+)\/(\d+) revisados · (\d+) pendiente\(s\)$/, "$1/$2 revisados · $3 pendente(s)"],
        [/^Fuentes recuperadas \((\d+)\)$/, "Fontes recuperadas ($1)"],
        [/^Fuente indicada: (.+)$/, "Fonte indicada: $1"],
        [/^Puntuación bruta: (.+)$/, "Score bruto: $1"],
        [/^Eliminar meta (.+)$/, "Excluir meta $1"],
        [/^Pregunta (\d+): marcó (.+); correcta (.+)\. $/, "Questão $1: marcou $2; correta $3. "],
        [/^Mapa mental sobre (.+)$/, "Mapa mental sobre $1"],
        [/^Cuaderno \((\d+)\)$/, "Caderno ($1)"],
        [/^Plan \((\d+)\)$/, "Plano ($1)"],
        [/^(\d+) materiales · (.+)$/, "$1 materiais · $2"],
        [/^(\d+) comando\(s\) copiado\(s\)\. Ejecútalos en Termux y después vuelve a indexar AI Search\.$/, "$1 comando(s) copiado(s). Execute no Termux e depois reindexe o AI Search."],
      ];
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
  }
  return value;
}

export function t(value) {
  if (typeof value !== "string" || !value) return value;
  const translated = language === "es"
    ? PT_TO_ES.get(value) || value
    : ES_TO_PT.get(value) || value;
  return translatePattern(translated, language);
}

function translateTextNode(node) {
  if (node.parentElement?.closest(".message-content, .notebook-answer, .notebook-print-answer, .source-card > p, .exam-options span, .exam-feedback p, .exam-report li span:last-child, .mindmap-svg text, .catalog-card h3, .notebook-card h3, .plan-task > b")) return;
  const match = node.nodeValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match || !match[2]) return;
  const translated = t(match[2]);
  if (translated !== match[2]) node.nodeValue = `${match[1]}${translated}${match[3]}`;
}

function translateElement(element) {
  for (const attribute of ["placeholder", "title", "aria-label", "data-prompt", "content"]) {
    if (element.hasAttribute(attribute)) {
      const value = element.getAttribute(attribute);
      const translated = t(value);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) translateTextNode(child);
    else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child);
  }
}

export function applyTranslations(root = document.documentElement) {
  if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
  else if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
  document.documentElement.lang = language === "es" ? "es" : "pt-BR";
  document.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

export function setLanguage(nextLanguage) {
  if (nextLanguage !== "pt" && nextLanguage !== "es") return;
  language = nextLanguage;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // The selected language still applies for the current page.
  }
  applyTranslations();
  listeners.forEach((listener) => listener(language));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof document !== "undefined") {
  applyTranslations();
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => applyTranslations(node));
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
