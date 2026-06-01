export type PatientLanguage = 'en' | 'sw' | 'fr' | 'es';

export interface PatientLanguagePack {
  pageLabel: string;
  messagesTitle: string;
  messagesSubtitle: string;
  contactsLabel: string;
  conversationLabel: string;
  chooseContactLabel: string;
  loadingContactsLabel: string;
  loadingThreadLabel: string;
  noContactsLabel: string;
  noMessagesLabel: string;
  subjectLabel: string;
  messageLabel: string;
  sendLabel: string;
  emergencyCta: string;
  emergencyHelp: string;
  intakeTitle: string;
  intakeSubtitle: string;
  reminderTitle: string;
  reminderSubtitle: string;
  appointmentsTitle: string;
  appointmentsSubtitle: string;
  reminderPrompt: string;
  pushReminderLabel: string;
  smsReminderLabel: string;
  emailReminderLabel: string;
  copyLinkLabel: string;
  recordsTitle: string;
  recordsSubtitle: string;
  inboxLabel: string;
  labsLabel: string;
  documentsLabel: string;
  uploadDocumentLabel: string;
  symptomLabel: string;
  medicationLabel: string;
  allergyLabel: string;
  noteLabel: string;
  submitLabel: string;
}

const languagePacks: Record<PatientLanguage, PatientLanguagePack> = {
  en: {
    pageLabel: 'Patient care',
    messagesTitle: 'Messages',
    messagesSubtitle: 'Private threads between patients and providers.',
    contactsLabel: 'Contacts',
    conversationLabel: 'Conversation',
    chooseContactLabel: 'Choose a contact',
    loadingContactsLabel: 'Loading contacts...',
    loadingThreadLabel: 'Loading messages...',
    noContactsLabel: 'No contacts available.',
    noMessagesLabel: 'No messages yet. Start the conversation below.',
    subjectLabel: 'Subject',
    messageLabel: 'Message',
    sendLabel: 'Send securely',
    emergencyCta: 'Urgent help',
    emergencyHelp: 'If this is a life-threatening emergency, call your local emergency number now.',
    intakeTitle: 'Patient intake form',
    intakeSubtitle: 'Share your symptoms before the visit so the team can prepare.',
    reminderTitle: 'Appointment reminder preferences',
    reminderSubtitle: 'Pick how you want follow-up reminders to reach you.',
    appointmentsTitle: 'My Appointments',
    appointmentsSubtitle: 'Review your visits, notes, and next steps on any screen.',
    reminderPrompt: 'Send a push, SMS, or email reminder with a reschedule link.',
    pushReminderLabel: 'Push reminder',
    smsReminderLabel: 'SMS reminder',
    emailReminderLabel: 'Email reminder',
    copyLinkLabel: 'Copy reschedule link',
    recordsTitle: 'Labs & Documents',
    recordsSubtitle: 'Review lab findings and shared patient files.',
    inboxLabel: 'Inbox',
    labsLabel: 'Lab results',
    documentsLabel: 'Documents',
    uploadDocumentLabel: 'Upload document',
    symptomLabel: 'Symptoms',
    medicationLabel: 'Current medications',
    allergyLabel: 'Allergies',
    noteLabel: 'Additional notes',
    submitLabel: 'Save intake',
  },
  sw: {
    pageLabel: 'Huduma kwa mgonjwa',
    messagesTitle: 'Ujumbe',
    messagesSubtitle: 'Mazungumzo ya siri kati ya mgonjwa na mtoa huduma.',
    contactsLabel: 'Anwani',
    conversationLabel: 'Mazungumzo',
    chooseContactLabel: 'Chagua anwani',
    loadingContactsLabel: 'Inapakia anwani...',
    loadingThreadLabel: 'Inapakia ujumbe...',
    noContactsLabel: 'Hakuna anwani zinazopatikana.',
    noMessagesLabel: 'Bado hakuna ujumbe. Anzisha mazungumzo hapa chini.',
    subjectLabel: 'Kichwa',
    messageLabel: 'Ujumbe',
    sendLabel: 'Tuma kwa usalama',
    emergencyCta: 'Msaada wa haraka',
    emergencyHelp: 'Ikiwa ni dharura inayohatarisha maisha, piga nambari ya dharura ya eneo lako sasa.',
    intakeTitle: 'Fomu ya kuingia kwa mgonjwa',
    intakeSubtitle: 'Shiriki dalili zako kabla ya ziara ili timu iwe tayari.',
    reminderTitle: 'Mapendeleo ya vikumbusho vya miadi',
    reminderSubtitle: 'Chagua jinsi unavyotaka vikumbusho vikufikie.',
    appointmentsTitle: 'Miadi Yangu',
    appointmentsSubtitle: 'Pitia ziara, maelezo na hatua zinazofuata kwenye skrini yoyote.',
    reminderPrompt: 'Tuma kikumbusho cha push, SMS au barua pepe chenye kiungo cha kupanga upya.',
    pushReminderLabel: 'Kikumbusho cha push',
    smsReminderLabel: 'Kikumbusho cha SMS',
    emailReminderLabel: 'Kikumbusho cha barua pepe',
    copyLinkLabel: 'Nakili kiungo cha kupanga upya',
    recordsTitle: 'Vipimo na Hati',
    recordsSubtitle: 'Pitia matokeo ya vipimo na faili za mgonjwa.',
    inboxLabel: 'Sanduku la ndani',
    labsLabel: 'Matokeo ya vipimo',
    documentsLabel: 'Hati',
    uploadDocumentLabel: 'Pakia hati',
    symptomLabel: 'Dalili',
    medicationLabel: 'Dawa za sasa',
    allergyLabel: 'Mzio',
    noteLabel: 'Maelezo ya ziada',
    submitLabel: 'Hifadhi taarifa',
  },
  fr: {
    pageLabel: 'Soins du patient',
    messagesTitle: 'Messages',
    messagesSubtitle: 'Conversations privées entre patients et soignants.',
    contactsLabel: 'Contacts',
    conversationLabel: 'Conversation',
    chooseContactLabel: 'Choisir un contact',
    loadingContactsLabel: 'Chargement des contacts...',
    loadingThreadLabel: 'Chargement des messages...',
    noContactsLabel: 'Aucun contact disponible.',
    noMessagesLabel: 'Aucun message pour le moment. Commencez la conversation ci-dessous.',
    subjectLabel: 'Objet',
    messageLabel: 'Message',
    sendLabel: 'Envoyer en toute sécurité',
    emergencyCta: 'Aide urgente',
    emergencyHelp: 'S’il s’agit d’une urgence vitale, appelez immédiatement le numéro d’urgence local.',
    intakeTitle: 'Formulaire d’admission du patient',
    intakeSubtitle: 'Partagez vos symptômes avant la visite pour préparer l’équipe.',
    reminderTitle: 'Préférences de rappel de rendez-vous',
    reminderSubtitle: 'Choisissez comment recevoir les rappels de suivi.',
    appointmentsTitle: 'Mes rendez-vous',
    appointmentsSubtitle: 'Consultez vos visites, notes et prochaines étapes sur n’importe quel écran.',
    reminderPrompt: 'Envoyez un rappel push, SMS ou e-mail avec un lien de reprogrammation.',
    pushReminderLabel: 'Rappel push',
    smsReminderLabel: 'Rappel SMS',
    emailReminderLabel: 'Rappel e-mail',
    copyLinkLabel: 'Copier le lien de reprogrammation',
    recordsTitle: 'Résultats et documents',
    recordsSubtitle: 'Consultez les résultats et les fichiers partagés.',
    inboxLabel: 'Boîte de réception',
    labsLabel: 'Résultats',
    documentsLabel: 'Documents',
    uploadDocumentLabel: 'Téléverser un document',
    symptomLabel: 'Symptômes',
    medicationLabel: 'Médicaments actuels',
    allergyLabel: 'Allergies',
    noteLabel: 'Notes supplémentaires',
    submitLabel: 'Enregistrer',
  },
  es: {
    pageLabel: 'Atención al paciente',
    messagesTitle: 'Mensajes',
    messagesSubtitle: 'Conversaciones privadas entre pacientes y proveedores.',
    contactsLabel: 'Contactos',
    conversationLabel: 'Conversación',
    chooseContactLabel: 'Elegir contacto',
    loadingContactsLabel: 'Cargando contactos...',
    loadingThreadLabel: 'Cargando mensajes...',
    noContactsLabel: 'No hay contactos disponibles.',
    noMessagesLabel: 'Aún no hay mensajes. Inicia la conversación abajo.',
    subjectLabel: 'Asunto',
    messageLabel: 'Mensaje',
    sendLabel: 'Enviar de forma segura',
    emergencyCta: 'Ayuda urgente',
    emergencyHelp: 'Si es una emergencia que pone en peligro la vida, llama ahora al número local de emergencias.',
    intakeTitle: 'Formulario de ingreso del paciente',
    intakeSubtitle: 'Comparte tus síntomas antes de la visita para que el equipo se prepare.',
    reminderTitle: 'Preferencias de recordatorios',
    reminderSubtitle: 'Elige cómo quieres recibir los recordatorios de seguimiento.',
    appointmentsTitle: 'Mis citas',
    appointmentsSubtitle: 'Revisa visitas, notas y próximos pasos en cualquier pantalla.',
    reminderPrompt: 'Envía un recordatorio por push, SMS o correo con enlace para reprogramar.',
    pushReminderLabel: 'Recordatorio push',
    smsReminderLabel: 'Recordatorio SMS',
    emailReminderLabel: 'Recordatorio por correo',
    copyLinkLabel: 'Copiar enlace de reprogramación',
    recordsTitle: 'Resultados y documentos',
    recordsSubtitle: 'Revisa resultados y archivos compartidos.',
    inboxLabel: 'Bandeja',
    labsLabel: 'Resultados',
    documentsLabel: 'Documentos',
    uploadDocumentLabel: 'Subir documento',
    symptomLabel: 'Síntomas',
    medicationLabel: 'Medicamentos actuales',
    allergyLabel: 'Alergias',
    noteLabel: 'Notas adicionales',
    submitLabel: 'Guardar ingreso',
  },
};

export const getPatientLanguage = (userId?: string | null): PatientLanguage => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const stored = window.localStorage.getItem(`afyasync-settings:${userId || 'guest'}`);
    if (!stored) {
      return 'en';
    }

    const parsed = JSON.parse(stored) as { language?: PatientLanguage };
    return parsed.language && languagePacks[parsed.language] ? parsed.language : 'en';
  } catch {
    return 'en';
  }
};

export const getPatientLanguagePack = (userId?: string | null) => languagePacks[getPatientLanguage(userId)];