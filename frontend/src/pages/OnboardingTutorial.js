import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ONBOARDING_TRANSLATIONS = {
  en: {
    appTutorial: 'App Tutorial',
    skipTutorial: 'Skip tutorial',
    finishTutorial: 'Finish tutorial',
    tutorialAvailableInSettings: 'You can revisit this tutorial anytime from Settings.',
    tutorialStepCount: 'Step {current} of {total}',
    tutorialHowToOpen: 'How to open',
    tutorialHighlights: 'What this page helps you do',
    tutorialOpenPage: 'Open this page now',
    tutorialOpenedPage: 'Opened in a new tab.',
    stepHomeTitle: 'Home Feed',
    stepHomeBody: 'Start here to see posts, likes, and comments from your network.',
    stepHomeOpen: 'Bottom nav -> Home',
    stepHomePoint1: 'Scroll fitness posts from friends',
    stepHomePoint2: 'Like, save, and open comments quickly',
    stepHomePoint3: 'Track daily activity and engagement',
    stepPostTitle: 'Create Post',
    stepPostBody: 'Share your workout progress with photos, videos, and captions.',
    stepPostOpen: 'Bottom nav -> Post',
    stepPostPoint1: 'Upload media from phone or camera',
    stepPostPoint2: 'Add title and caption',
    stepPostPoint3: 'Publish and update your profile feed',
    stepCalendarTitle: 'Workout Planner Calendar',
    stepCalendarBody: 'Plan sessions, set reminders, and keep your streak consistent.',
    stepCalendarOpen: 'Profile -> Calendar',
    stepCalendarPoint1: 'Set workout type and reminder time',
    stepCalendarPoint2: 'Invite workout buddies',
    stepCalendarPoint3: 'Track planned days and streaks',
    stepFriendsTitle: 'Find Friends',
    stepFriendsBody: 'Discover users and grow your fitness network.',
    stepFriendsOpen: 'Bottom nav -> Find Friends',
    stepFriendsPoint1: 'Search users by username',
    stepFriendsPoint2: 'Send and manage friend requests',
    stepFriendsPoint3: 'Open profiles before connecting',
    stepMessagesTitle: 'Messages',
    stepMessagesBody: 'Chat with friends, react to messages, and share GIFs.',
    stepMessagesOpen: 'Bottom nav -> Messages',
    stepMessagesPoint1: 'Open one-to-one secure chat',
    stepMessagesPoint2: 'Use emoji and GIF tools',
    stepMessagesPoint3: 'Manage block/unblock for safety',
    stepNotificationsTitle: 'Notifications',
    stepNotificationsBody: 'Handle requests, invites, and message alerts in one place.',
    stepNotificationsOpen: 'Header bell icon or route /notifications',
    stepNotificationsPoint1: 'Accept or decline friend requests',
    stepNotificationsPoint2: 'Respond to workout invites',
    stepNotificationsPoint3: 'Jump directly into chats from alerts',
    stepProfileTitle: 'Profile',
    stepProfileBody: 'Manage your identity, posts, and saved content.',
    stepProfileOpen: 'Bottom nav -> Profile',
    stepProfilePoint1: 'Update profile picture, bio, location',
    stepProfilePoint2: 'View your posts and saved posts',
    stepProfilePoint3: 'Share your profile link',
    stepSettingsTitle: 'Settings',
    stepSettingsBody: 'Control theme, language, privacy, timezone, and app tools.',
    stepSettingsOpen: 'Profile -> Settings',
    stepSettingsPoint1: 'Switch theme and app language',
    stepSettingsPoint2: 'Adjust privacy and notifications',
    stepSettingsPoint3: 'Open AI helper and account options'
  },
  es: {
    appTutorial: 'Tutorial de la App',
    skipTutorial: 'Saltar tutorial',
    finishTutorial: 'Finalizar tutorial',
    tutorialAvailableInSettings: 'Puedes volver a ver este tutorial en cualquier momento desde Ajustes.',
    tutorialStepCount: 'Paso {current} de {total}',
    tutorialHowToOpen: 'Como abrirla',
    tutorialHighlights: 'Que puedes hacer aqui',
    tutorialOpenPage: 'Abrir esta pagina ahora',
    tutorialOpenedPage: 'Abierta en una pestana nueva.',
    stepHomeTitle: 'Inicio',
    stepHomeBody: 'Empieza aqui para ver publicaciones, me gusta y comentarios de tu red.',
    stepHomeOpen: 'Barra inferior -> Inicio',
    stepHomePoint1: 'Desplazate por publicaciones fitness de amigos',
    stepHomePoint2: 'Da me gusta, guarda y abre comentarios rapido',
    stepHomePoint3: 'Sigue actividad e interaccion diaria',
    stepPostTitle: 'Crear Publicacion',
    stepPostBody: 'Comparte tu progreso con fotos, videos y descripciones.',
    stepPostOpen: 'Barra inferior -> Publicar',
    stepPostPoint1: 'Sube contenido desde movil o camara',
    stepPostPoint2: 'Agrega titulo y descripcion',
    stepPostPoint3: 'Publica y actualiza tu perfil',
    stepCalendarTitle: 'Calendario de Entrenamiento',
    stepCalendarBody: 'Planifica sesiones, activa recordatorios y manten tu racha.',
    stepCalendarOpen: 'Perfil -> Calendario',
    stepCalendarPoint1: 'Define tipo de entrenamiento y hora',
    stepCalendarPoint2: 'Invita companeros de entrenamiento',
    stepCalendarPoint3: 'Controla dias planificados y rachas',
    stepFriendsTitle: 'Buscar Amigos',
    stepFriendsBody: 'Descubre usuarios y haz crecer tu red fitness.',
    stepFriendsOpen: 'Barra inferior -> Buscar Amigos',
    stepFriendsPoint1: 'Busca por nombre de usuario',
    stepFriendsPoint2: 'Envia y gestiona solicitudes',
    stepFriendsPoint3: 'Revisa perfiles antes de conectar',
    stepMessagesTitle: 'Mensajes',
    stepMessagesBody: 'Chatea con amigos, reacciona a mensajes y comparte GIFs.',
    stepMessagesOpen: 'Barra inferior -> Mensajes',
    stepMessagesPoint1: 'Abre chats privados',
    stepMessagesPoint2: 'Usa emojis y GIFs',
    stepMessagesPoint3: 'Gestiona bloqueo/desbloqueo',
    stepNotificationsTitle: 'Notificaciones',
    stepNotificationsBody: 'Gestiona solicitudes, invitaciones y alertas en un solo lugar.',
    stepNotificationsOpen: 'Icono campana en cabecera o /notifications',
    stepNotificationsPoint1: 'Aceptar o rechazar solicitudes',
    stepNotificationsPoint2: 'Responder invitaciones de entrenamiento',
    stepNotificationsPoint3: 'Entrar al chat desde alertas',
    stepProfileTitle: 'Perfil',
    stepProfileBody: 'Gestiona tu identidad, publicaciones y contenido guardado.',
    stepProfileOpen: 'Barra inferior -> Perfil',
    stepProfilePoint1: 'Actualiza foto, bio y ubicacion',
    stepProfilePoint2: 'Mira tus publicaciones y guardados',
    stepProfilePoint3: 'Comparte enlace de perfil',
    stepSettingsTitle: 'Ajustes',
    stepSettingsBody: 'Controla tema, idioma, privacidad, zona horaria y herramientas.',
    stepSettingsOpen: 'Perfil -> Ajustes',
    stepSettingsPoint1: 'Cambiar tema e idioma',
    stepSettingsPoint2: 'Ajustar privacidad y notificaciones',
    stepSettingsPoint3: 'Abrir helper AI y opciones de cuenta'
  },
  fr: {
    appTutorial: 'Tutoriel de l\'app',
    skipTutorial: 'Passer le tutoriel',
    finishTutorial: 'Terminer le tutoriel',
    tutorialAvailableInSettings: 'Vous pouvez revoir ce tutoriel à tout moment depuis Paramètres.',
    tutorialStepCount: 'Étape {current} sur {total}',
    tutorialHowToOpen: 'Comment l\'ouvrir',
    tutorialHighlights: 'Ce que cette page vous permet de faire',
    tutorialOpenPage: 'Ouvrir cette page maintenant',
    tutorialOpenedPage: 'Ouverte dans un nouvel onglet.',
    stepHomeTitle: 'Accueil',
    stepHomeBody: 'Commencez ici pour voir les publications, les likes et les commentaires.',
    stepHomeOpen: 'Barre du bas -> Accueil',
    stepHomePoint1: 'Faites defiler les posts fitness des amis',
    stepHomePoint2: 'Likez, sauvegardez et ouvrez les commentaires rapidement',
    stepHomePoint3: 'Suivez l\'activite quotidienne',
    stepPostTitle: 'Creer un Post',
    stepPostBody: 'Partagez vos progres avec photos, videos et descriptions.',
    stepPostOpen: 'Barre du bas -> Publier',
    stepPostPoint1: 'Ajoutez des medias depuis mobile ou camera',
    stepPostPoint2: 'Ajoutez titre et legende',
    stepPostPoint3: 'Publiez sur votre profil',
    stepCalendarTitle: 'Calendrier d\'Entrainement',
    stepCalendarBody: 'Planifiez des sessions, activez des rappels et gardez votre serie.',
    stepCalendarOpen: 'Profil -> Calendrier',
    stepCalendarPoint1: 'Definir type d\'entrainement et heure',
    stepCalendarPoint2: 'Inviter des partenaires',
    stepCalendarPoint3: 'Suivre jours planifies et series',
    stepFriendsTitle: 'Trouver des Amis',
    stepFriendsBody: 'Decouvrez des utilisateurs et agrandissez votre reseau fitness.',
    stepFriendsOpen: 'Barre du bas -> Trouver des amis',
    stepFriendsPoint1: 'Recherche par nom utilisateur',
    stepFriendsPoint2: 'Envoyer et gerer les demandes',
    stepFriendsPoint3: 'Voir les profils avant connexion',
    stepMessagesTitle: 'Messages',
    stepMessagesBody: 'Discutez, reagissez aux messages et partagez des GIFs.',
    stepMessagesOpen: 'Barre du bas -> Messages',
    stepMessagesPoint1: 'Ouvrir des chats prives',
    stepMessagesPoint2: 'Utiliser emojis et GIFs',
    stepMessagesPoint3: 'Gerer blocage/deblocage',
    stepNotificationsTitle: 'Notifications',
    stepNotificationsBody: 'Gerez demandes, invitations et alertes dans un seul endroit.',
    stepNotificationsOpen: 'Icone cloche en haut ou /notifications',
    stepNotificationsPoint1: 'Accepter ou refuser des demandes',
    stepNotificationsPoint2: 'Repondre aux invitations sport',
    stepNotificationsPoint3: 'Ouvrir le chat depuis les alertes',
    stepProfileTitle: 'Profil',
    stepProfileBody: 'Gerez identite, publications et contenus sauvegardes.',
    stepProfileOpen: 'Barre du bas -> Profil',
    stepProfilePoint1: 'Modifier photo, bio et lieu',
    stepProfilePoint2: 'Voir vos posts et sauvegardes',
    stepProfilePoint3: 'Partager le lien profil',
    stepSettingsTitle: 'Parametres',
    stepSettingsBody: 'Controlez theme, langue, confidentialite, fuseau et outils.',
    stepSettingsOpen: 'Profil -> Parametres',
    stepSettingsPoint1: 'Changer theme et langue',
    stepSettingsPoint2: 'Ajuster confidentialite et notifications',
    stepSettingsPoint3: 'Ouvrir l\'assistant IA et options compte'
  },
  it: {
    appTutorial: 'Tutorial dell\'app',
    skipTutorial: 'Salta tutorial',
    finishTutorial: 'Termina tutorial',
    tutorialAvailableInSettings: 'Puoi rivedere questo tutorial in qualsiasi momento da Impostazioni.',
    tutorialStepCount: 'Passo {current} di {total}',
    tutorialHowToOpen: 'Come aprirla',
    tutorialHighlights: 'Cosa puoi fare in questa pagina',
    tutorialOpenPage: 'Apri questa pagina ora',
    tutorialOpenedPage: 'Aperta in una nuova scheda.',
    stepHomeTitle: 'Home',
    stepHomeBody: 'Inizia da qui per vedere post, like e commenti della tua rete.',
    stepHomeOpen: 'Barra in basso -> Home',
    stepHomePoint1: 'Scorri i post fitness degli amici',
    stepHomePoint2: 'Metti like, salva e apri i commenti',
    stepHomePoint3: 'Controlla attivita giornaliera',
    stepPostTitle: 'Crea Post',
    stepPostBody: 'Condividi i tuoi progressi con foto, video e descrizioni.',
    stepPostOpen: 'Barra in basso -> Post',
    stepPostPoint1: 'Carica media da telefono o fotocamera',
    stepPostPoint2: 'Aggiungi titolo e didascalia',
    stepPostPoint3: 'Pubblica nel tuo profilo',
    stepCalendarTitle: 'Calendario Allenamenti',
    stepCalendarBody: 'Pianifica sessioni, imposta promemoria e mantieni la serie.',
    stepCalendarOpen: 'Profilo -> Calendario',
    stepCalendarPoint1: 'Imposta tipo allenamento e orario',
    stepCalendarPoint2: 'Invita compagni di allenamento',
    stepCalendarPoint3: 'Traccia giorni pianificati e serie',
    stepFriendsTitle: 'Trova Amici',
    stepFriendsBody: 'Scopri utenti e amplia la tua rete fitness.',
    stepFriendsOpen: 'Barra in basso -> Trova Amici',
    stepFriendsPoint1: 'Cerca utenti per username',
    stepFriendsPoint2: 'Invia e gestisci richieste',
    stepFriendsPoint3: 'Apri profili prima di connetterti',
    stepMessagesTitle: 'Messaggi',
    stepMessagesBody: 'Chatta con amici, reagisci ai messaggi e condividi GIF.',
    stepMessagesOpen: 'Barra in basso -> Messaggi',
    stepMessagesPoint1: 'Apri chat private',
    stepMessagesPoint2: 'Usa emoji e GIF',
    stepMessagesPoint3: 'Gestisci blocco/sblocco',
    stepNotificationsTitle: 'Notifiche',
    stepNotificationsBody: 'Gestisci richieste, inviti e avvisi in un solo posto.',
    stepNotificationsOpen: 'Icona campana in alto o /notifications',
    stepNotificationsPoint1: 'Accetta o rifiuta richieste',
    stepNotificationsPoint2: 'Rispondi agli inviti workout',
    stepNotificationsPoint3: 'Apri chat direttamente dagli avvisi',
    stepProfileTitle: 'Profilo',
    stepProfileBody: 'Gestisci identita, post e contenuti salvati.',
    stepProfileOpen: 'Barra in basso -> Profilo',
    stepProfilePoint1: 'Aggiorna foto, bio e posizione',
    stepProfilePoint2: 'Vedi i tuoi post e salvati',
    stepProfilePoint3: 'Condividi link profilo',
    stepSettingsTitle: 'Impostazioni',
    stepSettingsBody: 'Controlla tema, lingua, privacy, fuso orario e strumenti.',
    stepSettingsOpen: 'Profilo -> Impostazioni',
    stepSettingsPoint1: 'Cambia tema e lingua',
    stepSettingsPoint2: 'Regola privacy e notifiche',
    stepSettingsPoint3: 'Apri helper AI e opzioni account'
  }
};

export default function OnboardingTutorial() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';

  const params = new URLSearchParams(location.search);
  const isAuto = params.get('auto') === '1';
  const returnTo = params.get('return');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userId = user?.id;
  const doneKey = userId ? `onboarding_done_${userId}` : null;

  const tt = (key) => ONBOARDING_TRANSLATIONS[language]?.[key] || ONBOARDING_TRANSLATIONS.en[key] || t(key);

  const steps = useMemo(() => ([
    {
      title: tt('stepHomeTitle'),
      body: tt('stepHomeBody'),
      openHint: tt('stepHomeOpen'),
      route: '/home',
      points: [tt('stepHomePoint1'), tt('stepHomePoint2'), tt('stepHomePoint3')]
    },
    {
      title: tt('stepPostTitle'),
      body: tt('stepPostBody'),
      openHint: tt('stepPostOpen'),
      route: '/post',
      points: [tt('stepPostPoint1'), tt('stepPostPoint2'), tt('stepPostPoint3')]
    },
    {
      title: tt('stepCalendarTitle'),
      body: tt('stepCalendarBody'),
      openHint: tt('stepCalendarOpen'),
      route: '/calendar',
      points: [tt('stepCalendarPoint1'), tt('stepCalendarPoint2'), tt('stepCalendarPoint3')]
    },
    {
      title: tt('stepFriendsTitle'),
      body: tt('stepFriendsBody'),
      openHint: tt('stepFriendsOpen'),
      route: '/find-friends',
      points: [tt('stepFriendsPoint1'), tt('stepFriendsPoint2'), tt('stepFriendsPoint3')]
    },
    {
      title: tt('stepMessagesTitle'),
      body: tt('stepMessagesBody'),
      openHint: tt('stepMessagesOpen'),
      route: '/chat',
      points: [tt('stepMessagesPoint1'), tt('stepMessagesPoint2'), tt('stepMessagesPoint3')]
    },
    {
      title: tt('stepNotificationsTitle'),
      body: tt('stepNotificationsBody'),
      openHint: tt('stepNotificationsOpen'),
      route: '/notifications',
      points: [tt('stepNotificationsPoint1'), tt('stepNotificationsPoint2'), tt('stepNotificationsPoint3')]
    },
    {
      title: tt('stepProfileTitle'),
      body: tt('stepProfileBody'),
      openHint: tt('stepProfileOpen'),
      route: '/profile',
      points: [tt('stepProfilePoint1'), tt('stepProfilePoint2'), tt('stepProfilePoint3')]
    },
    {
      title: tt('stepSettingsTitle'),
      body: tt('stepSettingsBody'),
      openHint: tt('stepSettingsOpen'),
      route: '/settings',
      points: [tt('stepSettingsPoint1'), tt('stepSettingsPoint2'), tt('stepSettingsPoint3')]
    }
  ]), [tt]);

  const [stepIndex, setStepIndex] = useState(0);
  const [openNotice, setOpenNotice] = useState('');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    if (isAuto && doneKey && localStorage.getItem(doneKey)) {
      navigate('/home');
    }
  }, [doneKey, isAuto, navigate, userId]);

  const markComplete = () => {
    if (doneKey) {
      localStorage.setItem(doneKey, 'true');
    }
    localStorage.removeItem('onboarding_pending');
  };

  const handleExit = () => {
    markComplete();
    if (returnTo === 'settings') {
      navigate('/settings');
      return;
    }
    navigate('/home');
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    handleExit();
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      setOpenNotice('');
    }
  };

  const handleOpenPage = () => {
    const targetRoute = steps[stepIndex]?.route || '/home';
    navigate(targetRoute);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          {returnTo === 'settings' ? (
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} /> {t('backToSettings')}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleExit}
            className={`text-sm ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tt('skipTutorial')}
          </button>
        </div>

        <div className={`rounded-2xl border p-8 shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-blue-500" size={24} />
            <p className={`text-sm uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {tt('appTutorial')}
            </p>
          </div>

          <h1 className="text-3xl font-bold mb-3">{steps[stepIndex].title}</h1>
          <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            {steps[stepIndex].body}
          </p>

          <div className={`mt-6 rounded-xl border p-4 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={16} className={isDark ? 'text-blue-300' : 'text-blue-600'} />
              <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tt('tutorialHowToOpen')}</p>
            </div>
            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>{steps[stepIndex].openHint}</p>

            <p className={`text-xs uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tt('tutorialHighlights')}</p>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {steps[stepIndex].points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isDark ? 'bg-blue-300' : 'bg-blue-500'}`} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleOpenPage}
              className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'}`}
            >
              <ExternalLink size={15} /> {tt('tutorialOpenPage')}
            </button>
            {openNotice && (
              <p className={`mt-2 text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>{openNotice}</p>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {tt('tutorialStepCount')
                  .replace('{current}', stepIndex + 1)
                  .replace('{total}', steps.length)}
              </span>
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <span
                    key={`step-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full ${index === stepIndex ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleBack}
                disabled={stepIndex === 0}
                className={`px-4 py-2 rounded-lg border text-sm transition ${stepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t('back')}
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              >
                {stepIndex === steps.length - 1 ? tt('finishTutorial') : t('next')}
              </button>
            </div>
          </div>
        </div>

        <p className={`mt-6 text-sm text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {tt('tutorialAvailableInSettings')}
        </p>
      </div>
    </div>
  );
}
