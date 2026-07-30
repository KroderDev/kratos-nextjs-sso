import type { TranslationKeys } from "./en";

export const es: TranslationKeys = {
  common: {
    brand: "CI / Kratos SSO",
    brandAccess: "CI / acceso",
    brandSubtitle: "Redefiniendo la identidad",
    theme: {
      label: "Tema",
      ariaLabel: "Cambiar tema de color",
      appearance: "Apariencia",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    navigation: {
      primary: "Principal",
      workspace: "Espacio de trabajo",
      signIn: "Iniciar sesión",
      getStarted: "Comenzar",
      overview: "Resumen",
      settings: "Configuración",
      signOut: "Cerrar sesión",
      accountMenuAria: "Abrir menú de cuenta para {label}",
      loadingNextPage: "Cargando página siguiente",
    },
    footer: {
      identityInfrastructure: "Infraestructura de identidad para equipos rigurosos.",
      openSignIn: "Abrir inicio de sesión",
    },
  },
  home: {
    hero: {
      badge: "Acceso seguro a la cuenta",
      title: "Una forma más serena de ingresar al trabajo.",
      description: "Un punto de entrada deliberado y renderizado en servidor para iniciar sesión, registrarse, recuperar accesos y configurar su cuenta.",
      enterWorkspace: "Ingresar a tu espacio de trabajo",
      createIdentity: "Crear una identidad",
    },
    card: {
      tag: "acceso a identidad",
      title: "Una entrada clara al trabajo privado.",
      description: "Inicia sesión, crea una identidad o recupera el acceso sin salir de la misma superficie concebida.",
      protectedSession: "Sesión protegida por servidor",
    },
    features: {
      secureByDefault: {
        title: "Seguro por defecto",
        description: "Los controles de seguridad mantienen las cookies, redirecciones y el estado de la sesión cerca del servidor.",
      },
      humanCenter: {
        title: "El ser humano en el centro",
        description: "La interfaz se adapta a los métodos de identidad que tu espacio de trabajo realmente habilita.",
      },
      readyNextStep: {
        title: "Listo para el siguiente paso",
        description: "Inicia sesión, crea una identidad o recupera el acceso sin abandonar la misma superficie deliberada.",
      },
    },
  },
  auth: {
    shell: {
      badge: "infraestructura de identidad",
      title: "Tu espacio de trabajo comienza con una entrega clara.",
      description: "Inicia sesión una vez y continúa. Tu identidad permanece junto al servidor mientras tu trabajo sigue siendo tuyo.",
      sessionLabel: "sesión",
      sessionValue: "Flujo de navegador protegido",
      boundaryLabel: "límite",
      boundaryValue: "Renderizado en servidor",
      footerPrivate: "privado por diseño / 2026",
      footerProtected: "Sesión de navegador protegida",
      loadingForm: "Cargando formulario de autenticación",
    },
    login: {
      title: "Bienvenido de nuevo",
      eyebrow: "Acceso seguro",
      description: "Utiliza el método de identidad configurado para este espacio de trabajo.",
      footer: {
        needIdentity: "¿Necesitas una identidad?",
        createOne: "Crea una",
        recoverAccess: "Recuperar acceso",
      },
    },
    registration: {
      title: "Haz espacio para lo que viene",
      eyebrow: "Nueva identidad",
      description: "Crea una identidad de espacio de trabajo con los campos que tu equipo requiere.",
      footer: {
        alreadyAccess: "¿Ya tienes acceso?",
        signIn: "Iniciar sesión",
      },
    },
    recovery: {
      title: "Recuperemos tu acceso",
      eyebrow: "Recuperación de cuenta",
      description: "Enviaremos el siguiente paso a una dirección verificada de tu cuenta.",
      footer: {
        rememberedDetails: "¿Recordaste tus datos?",
        returnSignIn: "Volver a iniciar sesión",
      },
    },
    verification: {
      title: "Una última señal clara",
      eyebrow: "Verifica tu dirección",
      description: "Confirma la dirección conectada a tu identidad.",
      footer: {
        needStartOver: "¿Necesitas empezar de nuevo?",
        returnSignIn: "Volver a iniciar sesión",
      },
    },
    error: {
      title: "Esa ruta se cerró antes de tiempo",
      eyebrow: "Flujo interrumpido",
      description: "El servicio de identidad no pudo completar esa solicitud. Inicia un nuevo flujo de navegador e inténtalo de nuevo.",
      alertTitle: "Flujo interrumpido",
      fallbackMessage: "No se cambiaron credenciales. Puedes volver de forma segura a la pantalla de inicio de sesión y comenzar de nuevo.",
      backToSignIn: "Volver al inicio de sesión",
    },
  },
  dashboard: {
    loading: "Cargando panel de control",
    overview: {
      eyebrow: "Sala de control / resumen",
      title: "Qué gusto verte, {name}.",
      description: "Tu identidad está activa y tu espacio de trabajo privado está listo para el siguiente paso.",
      sessionActive: "Sesión activa",
      identityCard: {
        title: "Presencia verificada",
        description: "Tu sesión actual es reconocida por el servicio de identidad.",
        established: "Sesión de navegador establecida",
        tag: "identidad",
      },
      postureCard: {
        title: "Tranquilamente protegido",
        description: "Las cookies de sesión y el estado del flujo permanecen en el servidor.",
        reviewSettings: "Revisar configuración de cuenta",
        tag: "postura",
      },
      sessionDetails: {
        title: "Detalles de la sesión",
        description: "La sesión actual del navegador, sin exponer credenciales.",
        serverChecked: "verificado por servidor",
        email: "correo de identidad",
        issued: "emisión de sesión",
        expires: "Expira el {date}",
        notAvailable: "No disponible",
      },
      aside: {
        tag: "Siguiente paso",
        title: "Mantén útiles tus datos de identidad.",
        description: "Añade una dirección verificada o actualiza tus credenciales cuando cambie la dinámica de tu trabajo.",
        openSettings: "Abrir configuración",
      },
      unconfigured: {
        eyebrow: "Espacio de trabajo protegido",
        title: "Tu sala de control está esperando.",
        description: "El servicio de autenticación aún no está listo para aceptar sesiones.",
      },
    },
    settings: {
      eyebrow: "Sala de control / configuración",
      title: "Mantén tu identidad al día.",
      description: "Actualiza los atributos de identidad y las credenciales que controlas.",
      badge: "Controles de cuenta",
      aside: {
        tag: "Siguiente paso",
        title: "Mantén tu acceso útil.",
        description: "Revisa tus datos de identidad y credenciales cuando cambie la dinámica de tu trabajo.",
        returnOverview: "Volver al resumen",
      },
      returnOverview: "Volver al resumen",
    },
  },
  ory: {
    setup: {
      title: "El acceso no está disponible temporalmente",
      returnHome: "Volver al inicio",
    },
    unavailable: {
      title: "Este flujo ya no está disponible",
      description: "Comienza de nuevo desde el principio para que el servicio de identidad emita un nuevo flujo.",
    },
    messages: {
      actionNeeded: "Acción requerida",
      updated: "Actualizado",
      note: "Nota",
    },
    nodes: {
      continue: "Continuar",
      confirmChoice: "Confirmar esta opción",
      verificationCode: "Código de verificación",
      value: "Valor",
      qrCodeAlt: "Código QR para configuración de autenticador",
      identityImageAlt: "Imagen del servicio de identidad",
    },
  },
};
