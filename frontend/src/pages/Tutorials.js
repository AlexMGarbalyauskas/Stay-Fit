//tutorials page with exercise tutorials, muscle group filtering, and search functionality
// This page provides users with detailed exercise tutorials, 
// allowing them to filter by muscle group and search for specific exercises. 
// It includes translations for Spanish, French, and Italian to support a wider audience. 
// The page features an interactive body map for selecting muscle groups 
// and displays step-by-step instructions, duration, difficulty level, 
// and media for each exercise tutorial.





//import necessary libraries and components
import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
//imports end 






//block 1 
// Define translations for the tutorial UI
const TUTORIAL_UI_TRANSLATIONS = {

  // UI text translations for Spanish, French, and Italian
  es: {
    pleaseLoginToViewTutorials: 'Inicia sesión para ver los tutoriales.',
    exerciseTutorials: 'Tutoriales de Ejercicios',
    learnProperForm: 'Aprende la técnica correcta para los ejercicios de tus planes de entrenamiento',
    selectMuscleGroup: 'Selecciona un grupo muscular',
    selectMuscleGroupAria: 'Seleccionar {muscle}',
    clearFilter: 'Limpiar filtro',
    showingMuscleExercises: 'Mostrando ejercicios de {muscle}',
    clickMuscleToFilter: 'Haz clic en una zona muscular resaltada del mapa corporal para filtrar ejercicios.',
    searchExercises: 'Buscar ejercicios...',
    allDifficulties: 'Todas las dificultades',
    difficultyBeginner: 'Principiante',
    difficultyIntermediate: 'Intermedio',
    difficultyAdvanced: 'Avanzado',
    noExercisesFoundSearch: 'No se encontraron ejercicios que coincidan con tu búsqueda.',
    backToTutorials: 'Volver a tutoriales',
    durationLabel: 'Duración',
    difficultyLabel: 'Dificultad',
    howToPerform: 'Cómo realizarlo',
    muscleChest: 'Pecho',
    muscleShoulders: 'Hombros',
    muscleNeck: 'Cuello',
    muscleBiceps: 'Bíceps',
    muscleTriceps: 'Tríceps',
    muscleCore: 'Core',
    muscleBack: 'Espalda',
    muscleGlutes: 'Glúteos',
    muscleLegs: 'Piernas'
  },

  //french translations
  fr: {
    pleaseLoginToViewTutorials: 'Veuillez vous connecter pour voir les tutoriels.',
    exerciseTutorials: 'Tutoriels d\'exercices',
    learnProperForm: 'Apprenez la bonne technique pour les exercices de vos programmes',
    selectMuscleGroup: 'Sélectionnez un groupe musculaire',
    selectMuscleGroupAria: 'Sélectionner {muscle}',
    clearFilter: 'Effacer le filtre',
    showingMuscleExercises: 'Affichage des exercices de {muscle}',
    clickMuscleToFilter: 'Cliquez sur une zone musculaire mise en évidence sur le schéma corporel pour filtrer les exercices.',
    searchExercises: 'Rechercher des exercices...',
    allDifficulties: 'Toutes les difficultés',
    difficultyBeginner: 'Débutant',
    difficultyIntermediate: 'Intermédiaire',
    difficultyAdvanced: 'Avancé',
    noExercisesFoundSearch: 'Aucun exercice ne correspond à votre recherche.',
    backToTutorials: 'Retour aux tutoriels',
    durationLabel: 'Durée',
    difficultyLabel: 'Difficulté',
    howToPerform: 'Comment faire',
    muscleChest: 'Poitrine',
    muscleShoulders: 'Épaules',
    muscleNeck: 'Cou',
    muscleBiceps: 'Biceps',
    muscleTriceps: 'Triceps',
    muscleCore: 'Gainage',
    muscleBack: 'Dos',
    muscleGlutes: 'Fessiers',
    muscleLegs: 'Jambes'
  },

  //italian translations
  it: {
    pleaseLoginToViewTutorials: 'Accedi per vedere i tutorial.',
    exerciseTutorials: 'Tutorial degli esercizi',
    learnProperForm: 'Impara la tecnica corretta per gli esercizi nei tuoi piani di allenamento',
    selectMuscleGroup: 'Seleziona un gruppo muscolare',
    selectMuscleGroupAria: 'Seleziona {muscle}',
    clearFilter: 'Cancella filtro',
    showingMuscleExercises: 'Mostra esercizi per {muscle}',
    clickMuscleToFilter: 'Fai clic su una zona muscolare evidenziata nella mappa del corpo per filtrare gli esercizi.',
    searchExercises: 'Cerca esercizi...',
    allDifficulties: 'Tutte le difficoltà',
    difficultyBeginner: 'Principiante',
    difficultyIntermediate: 'Intermedio',
    difficultyAdvanced: 'Avanzato',
    noExercisesFoundSearch: 'Nessun esercizio trovato con la tua ricerca.',
    backToTutorials: 'Torna ai tutorial',
    durationLabel: 'Durata',
    difficultyLabel: 'Difficoltà',
    howToPerform: 'Come eseguirlo',
    muscleChest: 'Petto',
    muscleShoulders: 'Spalle',
    muscleNeck: 'Collo',
    muscleBiceps: 'Bicipiti',
    muscleTriceps: 'Tricipiti',
    muscleCore: 'Core',
    muscleBack: 'Schiena',
    muscleGlutes: 'Glutei',
    muscleLegs: 'Gambe'
  }
};
//end of block 1








//block 2
// Sample exercise tutorials database
const EXERCISE_TUTORIALS = {

  // Each exercise has a description, duration, d
  // ifficulty level, step-by-step instructions, and media links
  'Push-ups': {
    description: 'A classic chest, shoulders, and triceps exercise',
    duration: '2:45',
    difficulty: 'Beginner',
    instructions: [
      'Start in a plank position with hands shoulder-width apart',
      'Lower your body until your chest nearly touches the ground',
      'Keep your elbows close to your body',
      'Push through your palms to return to starting position',
      'Repeat for desired number of reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/pushups.jpg'
  },
  'Squats': {
    description: 'Strengthen your legs and glutes with this fundamental exercise',
    duration: '3:15',
    difficulty: 'Beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body by bending knees and hips',
      'Keep chest up and weight in heels',
      'Lower until thighs are parallel to ground',
      'Push through heels to return to standing'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/squats.png'
  },
  'Deadlifts': {
    description: 'Full body strength training exercise',
    duration: '4:20',
    difficulty: 'Intermediate',
    instructions: [
      'Stand with feet hip-width apart',
      'Grip bar with hands just outside legs',
      'Keep back straight and core engaged',
      'Drive through heels to stand up',
      'Lower bar back to ground with control'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/deadlifts.png'
  },
  'Pull-ups': {
    description: 'Build back and arm strength',
    duration: '3:50',
    difficulty: 'Intermediate',
    instructions: [
      'Grip bar with hands slightly wider than shoulder-width',
      'Pull body up until chin clears the bar',
      'Keep core tight and avoid swinging',
      'Lower body with control',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/pull-up.webp'
  },
  'Bench Press': {
    description: 'Develop chest, shoulders, and triceps',
    duration: '3:30',
    difficulty: 'Intermediate',
    instructions: [
      'Lie flat on bench with feet on ground',
      'Grip bar at shoulder width',
      'Lower bar to chest slowly',
      'Keep elbows at 45-degree angle',
      'Press bar back up to starting position'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/bench%20press.jpg'
  },
  'Plank': {
    description: 'Core strengthening exercise',
    duration: '2:30',
    difficulty: 'Beginner',
    instructions: [
      'Start in forearm plank position',
      'Keep body in straight line from head to heels',
      'Engage core and avoid sagging hips',
      'Hold position for desired time',
      'Rest and repeat'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/plank.webp'
  },
  'Bicycle Crunches': {
    description: 'Dynamic core exercise targeting abs and obliques',
    duration: '2:40',
    difficulty: 'Beginner',
    instructions: [
      'Lie on your back with hands behind your head',
      'Lift shoulders and legs slightly off the floor',
      'Bring right elbow toward left knee while extending right leg',
      'Switch sides in a pedaling motion',
      'Keep core engaged throughout the movement'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/bicyclecrunches.webp'
  },
  'Russian Twists': {
    description: 'Core and oblique exercise for rotational strength',
    duration: '2:30',
    difficulty: 'Beginner',
    instructions: [
      'Sit on the floor with knees bent and feet lightly lifted',
      'Lean back slightly while keeping your chest up',
      'Clasp hands together in front of your chest',
      'Rotate your torso from side to side with control',
      'Keep movement slow and core tight'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/russian-twist.webp'
  },
  'Leg Raises': {
    description: 'Lower abdominal exercise to build core control',
    duration: '2:20',
    difficulty: 'Intermediate',
    instructions: [
      'Lie flat on your back with legs straight',
      'Place hands under your hips for support if needed',
      'Raise your legs until they are near vertical',
      'Lower them slowly without touching the floor',
      'Avoid arching your lower back'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/leg-raises.png'
  },
  'Mountain Climbers': {
    description: 'Cardio-core movement that challenges stability and endurance',
    duration: '2:10',
    difficulty: 'Intermediate',
    instructions: [
      'Start in a high plank position',
      'Drive one knee toward your chest',
      'Quickly switch legs in a running motion',
      'Keep hips level and shoulders over wrists',
      'Maintain a steady pace with controlled breathing'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/mountain-climber-jump.webp'
  },
  'Dumbbell Curls': {
    description: 'Bicep isolation exercise',
    duration: '2:15',
    difficulty: 'Beginner',
    instructions: [
      'Stand with dumbbells at sides, palms facing forward',
      'Bend elbows to curl weights to shoulders',
      'Keep elbows stationary at sides',
      'Lower weights back down with control',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/dumbellcurls.jpg'
  },
  'Lunges': {
    description: 'Leg strengthening and balance exercise',
    duration: '3:00',
    difficulty: 'Beginner',
    instructions: [
      'Stand with feet together',
      'Step forward and lower hips until both knees bent 90 degrees',
      'Front knee should align with ankle',
      'Push back to starting position',
      'Alternate legs for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/lunges.webp'
  },
  'Leg Press': {
    description: 'Machine-based lower body exercise for quads, glutes, and hamstrings',
    duration: '3:10',
    difficulty: 'Beginner',
    instructions: [
      'Sit on the leg press machine with feet shoulder-width apart on the platform',
      'Lower the safety handles and brace your core',
      'Bend knees to lower the platform with control',
      'Press through your heels to return to starting position',
      'Keep knees tracking in line with toes throughout'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/legpress.png'
  },
  'Romanian Deadlift': {
    description: 'Posterior chain exercise targeting hamstrings and glutes',
    duration: '3:20',
    difficulty: 'Intermediate',
    instructions: [
      'Stand tall with dumbbells or barbell in front of your thighs',
      'Hinge at the hips while keeping a slight bend in your knees',
      'Lower the weight along your legs with a flat back',
      'Stop when you feel a stretch in your hamstrings',
      'Drive hips forward to stand back up'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/romaniandeadlift.jpg'
  },
  'Calf Raises': {
    description: 'Isolation movement to strengthen calves and ankle stability',
    duration: '2:20',
    difficulty: 'Beginner',
    instructions: [
      'Stand upright with feet hip-width apart',
      'Rise onto the balls of your feet as high as possible',
      'Pause briefly at the top',
      'Lower heels slowly back down',
      'Use a wall or support for balance if needed'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/calfraises.jpg'
  },
  'Bulgarian Split Squat': {
    description: 'Single-leg exercise for quads, glutes, and balance',
    duration: '3:00',
    difficulty: 'Advanced',
    instructions: [
      'Stand a step in front of a bench and place rear foot on it',
      'Keep torso upright and front foot planted',
      'Lower your body until front thigh is near parallel',
      'Push through front heel to return up',
      'Complete reps then switch sides'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/bulgariansplitsquats.webp'
  },
  'Handstand Push-up': {
    description: 'Advanced vertical press that builds shoulder, tricep, and core strength',
    duration: '3:30',
    difficulty: 'Advanced',
    instructions: [
      'Kick up into a stable handstand against a wall',
      'Keep body tight with glutes and core engaged',
      'Lower until head lightly approaches the floor',
      'Press back up to full lockout',
      'Control each rep and stop if form breaks'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/handstandpushup.jpeg'
  },
  'Muscle-Up': {
    description: 'Explosive pull and press movement for back, chest, and arms',
    duration: '3:40',
    difficulty: 'Advanced',
    instructions: [
      'Start with a strong overhand grip on a pull-up bar',
      'Pull explosively toward the bar using hips and lats',
      'Transition chest over the bar quickly',
      'Press to the top support position',
      'Lower with control and reset between reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/muscleups.webp'
  },
  'Dragon Flag': {
    description: 'Advanced core exercise for full-body tension and control',
    duration: '2:50',
    difficulty: 'Advanced',
    instructions: [
      'Lie on a bench and hold behind your head for support',
      'Lift hips and body into a straight line',
      'Lower body slowly while staying rigid',
      'Stop just above the bench and raise back up',
      'Avoid arching your lower back during the movement'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/dragonfly.webp'
  },
  'Chest Press': {
    description: 'Chest and triceps strengthening exercise',
    duration: '3:15',
    difficulty: 'Beginner',
    instructions: [
      'Lie on bench with feet on ground',
      'Hold dumbbells at shoulder height',
      'Press dumbbells upward',
      'Lower dumbbells back to chest',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/machine-chest-press.jpg'
  },
  'Back Rows': {
    description: 'Back and biceps strengthening exercise',
    duration: '3:30',
    difficulty: 'Intermediate',
    instructions: [
      'Bend forward with knees slightly bent',
      'Hold dumbbells with arms hanging down',
      'Pull dumbbells up to chest',
      'Lower dumbbells back down',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/backrows.webp'
  },
  'Shoulder Press': {
    description: 'Shoulder and upper body strength exercise',
    duration: '3:00',
    difficulty: 'Intermediate',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold dumbbells at shoulder height',
      'Press dumbbells overhead',
      'Lower back to shoulder height',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/shoulderpress.webp'
  },
  'Bicep Curls': {
    description: 'Arm and bicep isolation exercise',
    duration: '2:45',
    difficulty: 'Beginner',
    instructions: [
      'Stand with dumbbells at sides, palms facing forward',
      'Bend elbows to curl weights to shoulders',
      'Keep elbows stationary at sides',
      'Lower weights back down with control',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/bicepcurls.webp'
  },
  'Tricep Dips': {
    description: 'Tricep strengthening bodyweight exercise',
    duration: '2:30',
    difficulty: 'Intermediate',
    instructions: [
      'Use a bench or chair behind you',
      'Lower body by bending elbows',
      'Keep elbows close to body',
      'Push back up to starting position',
      'Repeat for desired reps'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/tricepdips.jpg'
  },
  'Neck Flexion': {
    description: 'Strengthen the front neck muscles with controlled flexion work',
    duration: '2:10',
    difficulty: 'Beginner',
    instructions: [
      'Sit tall with shoulders relaxed and spine neutral',
      'Gently tuck your chin and lower head forward slightly',
      'Pause while keeping movement controlled',
      'Return to neutral without jerking',
      'Repeat slow reps and stop if you feel pain'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/neckflexion.webp'
  },
  'Neck Extension': {
    description: 'Build posterior neck strength using light, controlled extension',
    duration: '2:20',
    difficulty: 'Beginner',
    instructions: [
      'Start seated with head in a neutral position',
      'Press the back of your head lightly into resistance',
      'Hold for one to two seconds',
      'Release slowly back to neutral',
      'Keep shoulders down and avoid overextending the neck'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/neckextension.webp'
  },
  'Dumbbell Shrugs': {
    description: 'Strengthen upper traps and neck-support muscles',
    duration: '2:40',
    difficulty: 'Beginner',
    instructions: [
      'Stand tall holding light dumbbells at your sides',
      'Lift shoulders straight up toward your ears',
      'Pause briefly at the top',
      'Lower shoulders with control',
      'Avoid rolling shoulders forward or backward'
    ],
    videoUrl: '', // Add your video link here
    imageUrl: '/dumbellshrugs2.jpg'
  }
};
//end of block 2









//block 3
// Translations for exercise names and descriptions in Spanish, French, and Italian
const EXERCISE_COPY_TRANSLATIONS = {
  es: {
    'Push-ups': { name: 'Flexiones', description: 'Un ejercicio clásico de pecho, hombros y tríceps' },
    'Squats': { name: 'Sentadillas', description: 'Fortalece piernas y glúteos con este ejercicio fundamental' },
    'Deadlifts': { name: 'Peso muerto', description: 'Ejercicio de fuerza para todo el cuerpo' },
    'Pull-ups': { name: 'Dominadas', description: 'Desarrolla fuerza en espalda y brazos' },
    'Bench Press': { name: 'Press de banca', description: 'Desarrolla pecho, hombros y tríceps' },
    'Plank': { name: 'Plancha', description: 'Ejercicio de fortalecimiento del core' },
    'Bicycle Crunches': { name: 'Crunch bicicleta', description: 'Ejercicio dinámico de core para abdominales y oblicuos' },
    'Russian Twists': { name: 'Giros rusos', description: 'Ejercicio de core y oblicuos para fuerza rotacional' },
    'Leg Raises': { name: 'Elevaciones de piernas', description: 'Ejercicio abdominal inferior para control del core' },
    'Mountain Climbers': { name: 'Escaladores', description: 'Movimiento cardio-core para estabilidad y resistencia' },
    'Dumbbell Curls': { name: 'Curl con mancuernas', description: 'Ejercicio de aislamiento de bíceps' },
    'Lunges': { name: 'Zancadas', description: 'Ejercicio de piernas para fuerza y equilibrio' },
    'Leg Press': { name: 'Prensa de piernas', description: 'Ejercicio en máquina para cuádriceps, glúteos e isquiotibiales' },
    'Romanian Deadlift': { name: 'Peso muerto rumano', description: 'Ejercicio de cadena posterior para isquiotibiales y glúteos' },
    'Calf Raises': { name: 'Elevaciones de pantorrillas', description: 'Ejercicio de aislamiento para fortalecer las pantorrillas' },
    'Bulgarian Split Squat': { name: 'Sentadilla búlgara', description: 'Ejercicio unilateral para cuádriceps, glúteos y equilibrio' },
    'Handstand Push-up': { name: 'Flexión en parada de manos', description: 'Press vertical avanzado para hombros, tríceps y core' },
    'Muscle-Up': { name: 'Muscle-up', description: 'Movimiento explosivo de tracción y empuje para espalda, pecho y brazos' },
    'Dragon Flag': { name: 'Bandera dragón', description: 'Ejercicio avanzado de core para tensión y control corporal total' },
    'Chest Press': { name: 'Press de pecho', description: 'Ejercicio para fortalecer pecho y tríceps' },
    'Back Rows': { name: 'Remo de espalda', description: 'Ejercicio para fortalecer espalda y bíceps' },
    'Shoulder Press': { name: 'Press de hombros', description: 'Ejercicio de fuerza para hombros y tren superior' },
    'Bicep Curls': { name: 'Curl de bíceps', description: 'Ejercicio de aislamiento para brazos y bíceps' },
    'Tricep Dips': { name: 'Fondos de tríceps', description: 'Ejercicio de peso corporal para fortalecer tríceps' },
    'Neck Flexion': { name: 'Flexión de cuello', description: 'Fortalece los músculos anteriores del cuello con flexión controlada' },
    'Neck Extension': { name: 'Extensión de cuello', description: 'Fortalece la parte posterior del cuello con extensión suave y controlada' },
    'Dumbbell Shrugs': { name: 'Encogimientos con mancuernas', description: 'Fortalece trapecios y músculos de soporte del cuello' }
  },
  fr: {
    'Push-ups': { name: 'Pompes', description: 'Un exercice classique pour la poitrine, les épaules et les triceps' },
    'Squats': { name: 'Squats', description: 'Renforcez vos jambes et fessiers avec cet exercice fondamental' },
    'Deadlifts': { name: 'Soulevé de terre', description: 'Exercice de force pour tout le corps' },
    'Pull-ups': { name: 'Tractions', description: 'Développe la force du dos et des bras' },
    'Bench Press': { name: 'Développé couché', description: 'Développe la poitrine, les épaules et les triceps' },
    'Plank': { name: 'Planche', description: 'Exercice de renforcement du gainage' },
    'Bicycle Crunches': { name: 'Crunch vélo', description: 'Exercice dynamique de gainage ciblant abdos et obliques' },
    'Russian Twists': { name: 'Rotations russes', description: 'Exercice pour les obliques et la rotation du tronc' },
    'Leg Raises': { name: 'Relevés de jambes', description: 'Exercice des abdos inférieurs pour le contrôle du tronc' },
    'Mountain Climbers': { name: 'Mountain climbers', description: 'Mouvement cardio-gainage pour stabilité et endurance' },
    'Dumbbell Curls': { name: 'Curl haltères', description: 'Exercice d’isolation des biceps' },
    'Lunges': { name: 'Fentes', description: 'Exercice jambes pour la force et l’équilibre' },
    'Leg Press': { name: 'Presse à jambes', description: 'Exercice machine pour quadriceps, fessiers et ischio-jambiers' },
    'Romanian Deadlift': { name: 'Soulevé de terre roumain', description: 'Exercice de chaîne postérieure pour ischio-jambiers et fessiers' },
    'Calf Raises': { name: 'Élévations mollets', description: 'Exercice d’isolation pour renforcer les mollets' },
    'Bulgarian Split Squat': { name: 'Fente bulgare', description: 'Exercice unilatéral pour quadriceps, fessiers et équilibre' },
    'Handstand Push-up': { name: 'Pompe en équilibre', description: 'Développé vertical avancé pour épaules, triceps et gainage' },
    'Muscle-Up': { name: 'Muscle-up', description: 'Mouvement explosif de tirage-poussée pour dos, poitrine et bras' },
    'Dragon Flag': { name: 'Drapeau du dragon', description: 'Exercice avancé de gainage pour tension et contrôle du corps entier' },
    'Chest Press': { name: 'Presse poitrine', description: 'Exercice de renforcement de la poitrine et des triceps' },
    'Back Rows': { name: 'Rowing dos', description: 'Exercice de renforcement du dos et des biceps' },
    'Shoulder Press': { name: 'Développé épaules', description: 'Exercice de force pour les épaules et le haut du corps' },
    'Bicep Curls': { name: 'Curl biceps', description: 'Exercice d’isolation des bras et biceps' },
    'Tricep Dips': { name: 'Dips triceps', description: 'Exercice au poids du corps pour les triceps' },
    'Neck Flexion': { name: 'Flexion du cou', description: 'Renforce l\'avant du cou avec une flexion contrôlée' },
    'Neck Extension': { name: 'Extension du cou', description: 'Renforce l\'arrière du cou avec une extension douce et contrôlée' },
    'Dumbbell Shrugs': { name: 'Haussements d\'épaules haltères', description: 'Renforce les trapèzes et les muscles de soutien du cou' }
  },
  it: {
    'Push-ups': { name: 'Piegamenti', description: 'Un classico esercizio per petto, spalle e tricipiti' },
    'Squats': { name: 'Squat', description: 'Rinforza gambe e glutei con questo esercizio fondamentale' },
    'Deadlifts': { name: 'Stacchi da terra', description: 'Esercizio di forza per tutto il corpo' },
    'Pull-ups': { name: 'Trazioni', description: 'Sviluppa forza di schiena e braccia' },
    'Bench Press': { name: 'Panca piana', description: 'Sviluppa petto, spalle e tricipiti' },
    'Plank': { name: 'Plank', description: 'Esercizio di rafforzamento del core' },
    'Bicycle Crunches': { name: 'Crunch bicicletta', description: 'Esercizio dinamico per addominali e obliqui' },
    'Russian Twists': { name: 'Twist russi', description: 'Esercizio per core e obliqui con rotazione' },
    'Leg Raises': { name: 'Sollevamento gambe', description: 'Esercizio per addominali bassi e controllo del core' },
    'Mountain Climbers': { name: 'Mountain climber', description: 'Movimento cardio-core per stabilità e resistenza' },
    'Dumbbell Curls': { name: 'Curl con manubri', description: 'Esercizio di isolamento per i bicipiti' },
    'Lunges': { name: 'Affondi', description: 'Esercizio per gambe, forza ed equilibrio' },
    'Leg Press': { name: 'Leg press', description: 'Esercizio alla macchina per quadricipiti, glutei e femorali' },
    'Romanian Deadlift': { name: 'Stacco rumeno', description: 'Esercizio per la catena posteriore, femorali e glutei' },
    'Calf Raises': { name: 'Sollevamenti polpacci', description: 'Esercizio di isolamento per rinforzare i polpacci' },
    'Bulgarian Split Squat': { name: 'Squat bulgaro', description: 'Esercizio unilaterale per quadricipiti, glutei ed equilibrio' },
    'Handstand Push-up': { name: 'Piegamento in verticale', description: 'Spinta verticale avanzata per spalle, tricipiti e core' },
    'Muscle-Up': { name: 'Muscle-up', description: 'Movimento esplosivo di tirata e spinta per schiena, petto e braccia' },
    'Dragon Flag': { name: 'Dragon flag', description: 'Esercizio avanzato per il core con controllo e tensione totale' },
    'Chest Press': { name: 'Chest press', description: 'Esercizio per rafforzare petto e tricipiti' },
    'Back Rows': { name: 'Rematore', description: 'Esercizio per rafforzare schiena e bicipiti' },
    'Shoulder Press': { name: 'Shoulder press', description: 'Esercizio di forza per spalle e parte superiore del corpo' },
    'Bicep Curls': { name: 'Curl bicipiti', description: 'Esercizio di isolamento per braccia e bicipiti' },
    'Tricep Dips': { name: 'Dip tricipiti', description: 'Esercizio a corpo libero per i tricipiti' },
    'Neck Flexion': { name: 'Flessione del collo', description: 'Rinforza la parte anteriore del collo con flessione controllata' },
    'Neck Extension': { name: 'Estensione del collo', description: 'Rinforza la parte posteriore del collo con estensione controllata' },
    'Dumbbell Shrugs': { name: 'Scrollate con manubri', description: 'Rinforza trapezi e muscoli di supporto del collo' }
  }
};
//end of block 3






// Extract unique exercises from plans - if empty, show all exercises
const getExercisesFromWorkouts = (plans) => {





  // Use a Set to avoid duplicates when collecting exercises from different workout types
  const exercises = new Set();
  





//block 4
  // Common exercises in Full Body, Upper Body, Lower Body, etc.
  const workoutExercises = {
    'Full Body': ['Push-ups', 'Squats', 'Deadlifts', 'Bench Press', 'Chest Press', 'Dumbbell Shrugs', 'Romanian Deadlift', 'Calf Raises', 'Dragon Flag'],
    'Upper Body': ['Push-ups', 'Pull-ups', 'Bench Press', 'Chest Press', 'Dumbbell Curls', 'Neck Flexion', 'Neck Extension', 'Dumbbell Shrugs', 'Handstand Push-up', 'Muscle-Up'],
    'Lower Body': ['Squats', 'Lunges', 'Deadlifts', 'Leg Press', 'Romanian Deadlift', 'Calf Raises', 'Bulgarian Split Squat'],
    'Core': ['Plank', 'Leg Raises', 'Mountain Climbers', 'Bicycle Crunches', 'Russian Twists', 'Push-ups', 'Dragon Flag'],
    'Cardio': ['Lunges', 'Squats', 'Calf Raises'],
    'Strength': ['Deadlifts', 'Bench Press', 'Chest Press', 'Pull-ups', 'Dumbbell Shrugs', 'Romanian Deadlift', 'Leg Press', 'Handstand Push-up', 'Muscle-Up', 'Dragon Flag']
  };
//end of block 4













//block 5
// Loop through each plan and add exercises based on the workout type, defaulting to Full Body if not specified
  Object.values(plans).forEach(plan => {
    const workout = plan.workout || 'Full Body';
    const exs = workoutExercises[workout] || ['Push-ups', 'Squats'];
    exs.forEach(ex => exercises.add(ex));
  });
//block 5 end







  return Array.from(exercises);
};










//block 6
// Map of muscle groups to exercises that target them
const MUSCLE_EXERCISE_MAP = {

  // This mapping is based on common exercise-muscle relationships, 
  // but can be adjusted based on specific exercise variations and individual anatomy
  chest: ['Push-ups', 'Bench Press', 'Chest Press', 'Muscle-Up'],
  shoulders: ['Push-ups', 'Shoulder Press', 'Bench Press', 'Handstand Push-up'],
  neck: ['Shoulder Press', 'Back Rows', 'Deadlifts', 'Neck Flexion', 'Neck Extension', 'Dumbbell Shrugs'],
  biceps: ['Dumbbell Curls', 'Bicep Curls', 'Back Rows', 'Pull-ups', 'Muscle-Up'],
  triceps: ['Push-ups', 'Tricep Dips', 'Bench Press', 'Chest Press', 'Handstand Push-up'],
  back: ['Pull-ups', 'Back Rows', 'Deadlifts', 'Muscle-Up'],
  core: ['Plank', 'Leg Raises', 'Mountain Climbers', 'Bicycle Crunches', 'Russian Twists', 'Push-ups', 'Deadlifts', 'Dragon Flag', 'Handstand Push-up'],
  glutes: ['Squats', 'Lunges', 'Deadlifts'],
  legs: ['Squats', 'Lunges', 'Deadlifts', 'Leg Press', 'Romanian Deadlift', 'Calf Raises', 'Bulgarian Split Squat']
};
//end of block 6









//block 7
// Body map areas and hotspots for interactive muscle selection
const BODY_MAP_AREAS = [
  { key: 'chest' },
  { key: 'shoulders' },
  { key: 'neck' },
  { key: 'biceps' },
  { key: 'triceps' },
  { key: 'core' },
  { key: 'back' },
  { key: 'glutes' },
  { key: 'legs' }
];
//end of block 7









//block 8
// Hotspots for front and back body maps with positions and sizes for clickable areas
const BODY_HOTSPOTS = [
  // Front body
  { key: 'neck', label: 'Neck', side: 'front', left: '23%', top: '22.7%', width: '6.4%', height: '7.4%' },
  { key: 'shoulders', label: 'Shoulders', side: 'front', left: '16.1%', top: '23.2%', width: '8.2%', height: '7.4%' },
  { key: 'shoulders', label: 'Shoulders', side: 'front', left: '29.3%', top: '23.2%', width: '8.2%', height: '7.4%' },
  { key: 'chest', label: 'Chest', side: 'front', left: '18.2%', top: '28.6%', width: '8%', height: '7.8%' },
  { key: 'chest', label: 'Chest', side: 'front', left: '26.6%', top: '28.6%', width: '8%', height: '7.8%' },
  { key: 'biceps', label: 'Biceps', side: 'front', left: '12.5%', top: '29.5%', width: '8%', height: '11%' },
  { key: 'core', label: 'Core', side: 'front', left: '21.8%', top: '35%', width: '10%', height: '16%' },
  { key: 'legs', label: 'Legs', side: 'front', left: '14.8%', top: '55.5%', width: '9.4%', height: '27%' },
  { key: 'legs', label: 'Legs', side: 'front', left: '29.2%', top: '55.5%', width: '9.4%', height: '27%' },

  // Back body
  { key: 'neck', label: 'Neck', side: 'back', left: '69.4%', top: '21.1%', width: '6.4%', height: '7.4%' },
  { key: 'shoulders', label: 'Shoulders', side: 'back', left: '61.6%', top: '22.5%', width: '10%', height: '6.5%' },
  { key: 'shoulders', label: 'Shoulders', side: 'back', left: '75.6%', top: '22.5%', width: '10%', height: '6.5%' },
  { key: 'back', label: 'Back', side: 'back', left: '66%', top: '28%', width: '14%', height: '22%' },
  { key: 'triceps', label: 'Triceps', side: 'back', left: '81%', top: '30%', width: '8%', height: '11%' },
  { key: 'glutes', label: 'Glutes', side: 'back', left: '66.5%', top: '44.4%', width: '12.5%', height: '11%' },
  { key: 'legs', label: 'Legs', side: 'back', left: '60%', top: '55.5%', width: '9.4%', height: '27%' },
  { key: 'legs', label: 'Legs', side: 'back', left: '75%', top: '55.5%', width: '9.4%', height: '27%' }
];
//end of block 8










// Main Tutorials component that displays exercise tutorials with search, filter, 
// and interactive body map features
export default function Tutorials({ isAuthenticated }) {
  const { t, language } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const bodyParts = BODY_MAP_AREAS;

  const tt = (key) => TUTORIAL_UI_TRANSLATIONS[language]?.[key] || t(key);

  const translateTemplate = (key, values = {}) => {
    let text = tt(key);
    Object.entries(values).forEach(([name, value]) => {
      text = text.replace(`{${name}}`, String(value));
    });
    return text;
  };

  const muscleLabel = (muscleKey) => {
    if (!muscleKey) return '';
    const normalized = muscleKey.charAt(0).toUpperCase() + muscleKey.slice(1);
    const key = `muscle${normalized}`;
    const translated = tt(key);
    return translated && translated !== key ? translated : normalized;
  };

  const difficultyLabel = (difficulty) => {
    if (difficulty === 'Beginner') return tt('difficultyBeginner');
    if (difficulty === 'Intermediate') return tt('difficultyIntermediate');
    if (difficulty === 'Advanced') return tt('difficultyAdvanced');
    return difficulty;
  };

  const localizedExerciseCopy = (exercise, tutorial) => {
    const localized = EXERCISE_COPY_TRANSLATIONS[language]?.[exercise];
    return {
      name: localized?.name || exercise,
      description: localized?.description || tutorial?.description || '',
      instructions: tutorial?.instructions || []
    };
  };

  // Get exercises from user's workout plans
  const userExercises = useMemo(() => {
    try {
      const stored = localStorage.getItem('workout-plans');
      const plans = stored ? JSON.parse(stored) : {};
      const exercises = getExercisesFromWorkouts(plans);
      // If no exercises from plans, show all available exercises
      return exercises.length > 0 ? exercises : Object.keys(EXERCISE_TUTORIALS);
    } catch (e) {
      console.error('Failed to load exercises:', e);
      return Object.keys(EXERCISE_TUTORIALS);
    }
  }, []);

  // Filter exercises based on search and difficulty
  const filteredExercises = useMemo(() => {
    return userExercises.filter(exercise => {
      const tutorial = EXERCISE_TUTORIALS[exercise];
      const copy = localizedExerciseCopy(exercise, tutorial);
      const matchesSearch = copy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          copy.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'All' || tutorial?.difficulty === filterDifficulty;
      const matchesMuscle = !selectedMuscle || (MUSCLE_EXERCISE_MAP[selectedMuscle] || []).includes(exercise);
      return matchesSearch && matchesDifficulty && matchesMuscle;
    });
  }, [userExercises, searchTerm, filterDifficulty, selectedMuscle, language]);

  const selectedTutorial = selectedExercise ? EXERCISE_TUTORIALS[selectedExercise] : null;
  const selectedExerciseCopy = selectedExercise && selectedTutorial
    ? localizedExerciseCopy(selectedExercise, selectedTutorial)
    : null;

  if (!isAuthenticated) {
    return (
      <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} style={{ minHeight: '100vh' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p>{tt('pleaseLoginToViewTutorials')}</p>
        </main>
        <Navbar />
      </div>
    );
  }

  return (
    <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} style={{ minHeight: '100vh' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 pt-20">
        {!selectedTutorial ? (
          <>
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition mb-4 ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700'
                    : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </button>

              <h1 className="text-3xl font-bold mb-2">{tt('exerciseTutorials')}</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {tt('learnProperForm')}
              </p>
            </div>

            {/* Clickable body map */}
            <div className={`mb-8 rounded-2xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-lg font-bold">{tt('selectMuscleGroup')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMuscle(null)}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-full transition ${
                      isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tt('clearFilter')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="mx-auto w-full max-w-[560px]">
                  <div className={`rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-slate-50 to-slate-100'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-3`}>
                    <div className="relative w-full max-w-[384px] mx-auto aspect-[384/423]">
                      <img src="/bodydiagram.png" alt="Body map" className="absolute inset-0 h-full w-full object-cover pointer-events-none" />

                      {BODY_HOTSPOTS.map((hotspot, idx) => {
                        const active = selectedMuscle === hotspot.key;
                        return (
                          <button
                            key={`${hotspot.key}-${hotspot.side}-${idx}`}
                            type="button"
                            onClick={() => setSelectedMuscle(hotspot.key)}
                            aria-label={translateTemplate('selectMuscleGroupAria', { muscle: muscleLabel(hotspot.key) })}
                            className={`absolute transition ${active ? 'bg-pink-500/40 ring-2 ring-pink-300' : 'bg-transparent hover:bg-pink-400/20'}`}
                            style={{
                              left: hotspot.left,
                              top: hotspot.top,
                              width: hotspot.width,
                              height: hotspot.height,
                              borderRadius: '45%'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    {selectedMuscle
                      ? translateTemplate('showingMuscleExercises', { muscle: muscleLabel(selectedMuscle) })
                      : tt('clickMuscleToFilter')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bodyParts.map((part) => {
                      const active = selectedMuscle === part.key;
                      return (
                        <button
                          key={`chip-${part.key}`}
                          onClick={() => setSelectedMuscle(part.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            active
                              ? 'bg-blue-600 text-white'
                              : isDark
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {muscleLabel(part.key)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`col-span-1 md:col-span-2 relative`}>
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={tt('searchExercises')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className={`px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="All">{tt('allDifficulties')}</option>
                <option value="Beginner">{tt('difficultyBeginner')}</option>
                <option value="Intermediate">{tt('difficultyIntermediate')}</option>
                <option value="Advanced">{tt('difficultyAdvanced')}</option>
              </select>
            </div>

            {/* Exercises Grid */}
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => {
                  const tutorial = EXERCISE_TUTORIALS[exercise];
                  const copy = localizedExerciseCopy(exercise, tutorial);
                  return (
                    <div
                      key={exercise}
                      onClick={() => setSelectedExercise(exercise)}
                      className={`rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <div className={`relative h-40 ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-400 to-purple-500'} flex items-center justify-center overflow-hidden`}>
                        {tutorial?.imageUrl ? (
                          <img
                            src={tutorial.imageUrl}
                            alt={exercise}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Play className="w-16 h-16 text-white opacity-80" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{copy.name}</h3>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {copy.description}
                        </p>

                        <div className="flex justify-between items-center text-sm">
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {tutorial?.duration}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tutorial?.difficulty === 'Beginner'
                              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                              : tutorial?.difficulty === 'Intermediate'
                              ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                            {difficultyLabel(tutorial?.difficulty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {tt('noExercisesFoundSearch')}
                </p>
              </div>
            )}
          </>
        ) : (
          // Tutorial Details View
          <div>
            <button
              onClick={() => setSelectedExercise(null)}
              className={`mb-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
                isDark
                  ? 'bg-gray-800 text-gray-300 shadow-gray-800 hover:bg-gray-700'
                  : 'bg-white text-slate-700 shadow-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              {tt('backToTutorials')}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Section */}
              <div className="lg:col-span-2">
                <div className={`rounded-xl overflow-hidden aspect-video ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {selectedTutorial?.videoUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={selectedTutorial?.videoUrl}
                      title={selectedExerciseCopy?.name || selectedExercise}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : selectedTutorial?.imageUrl ? (
                    <img
                      src={selectedTutorial.imageUrl}
                      alt={selectedExercise}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedExerciseCopy?.name || selectedExercise}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {selectedExerciseCopy?.description || selectedTutorial?.description}
                  </p>
                </div>
              </div>

              {/* Info Sidebar */}
              <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="mb-6">
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tt('durationLabel')}</p>
                  <p className="text-2xl font-bold">{selectedTutorial?.duration}</p>
                </div>

                <div className="mb-6">
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{tt('difficultyLabel')}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTutorial?.difficulty === 'Beginner'
                      ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      : selectedTutorial?.difficulty === 'Intermediate'
                      ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    {difficultyLabel(selectedTutorial?.difficulty)}
                  </span>
                </div>

                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{tt('howToPerform')}</p>
                  <ol className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTutorial?.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className={`font-semibold flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {idx + 1}.
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
//end of render 
