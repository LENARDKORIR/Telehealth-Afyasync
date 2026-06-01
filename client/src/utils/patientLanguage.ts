export type PatientLanguage = 'en' | 'sw' | 'fr' | 'es';

export interface PatientLanguagePack {
  pageLabel: string;
  emergencyCta: string;
  emergencyHelp: string;
  intakeTitle: string;
  intakeSubtitle: string;
  reminderTitle: string;
  reminderSubtitle: string;
  symptomLabel: string;
  medicationLabel: string;
  allergyLabel: string;
  noteLabel: string;
  submitLabel: string;
}

const languagePacks: Record<PatientLanguage, PatientLanguagePack> = {
  en: {
    pageLabel: 'Patient care',
    emergencyCta: 'Urgent help',
    emergencyHelp: 'If this is a life-threatening emergency, call your local emergency number now.',
    intakeTitle: 'Patient intake form',
    intakeSubtitle: 'Share your symptoms before the visit so the team can prepare.',
    reminderTitle: 'Appointment reminder preferences',
    reminderSubtitle: 'Pick how you want follow-up reminders to reach you.',
    symptomLabel: 'Symptoms',
    medicationLabel: 'Current medications',
    allergyLabel: 'Allergies',
    noteLabel: 'Additional notes',
    submitLabel: 'Save intake',
  },
  sw: {
    pageLabel: 'Huduma kwa mgonjwa',
    emergencyCta: 'Msaada wa haraka',
    emergencyHelp: 'Ikiwa ni dharura inayohatarisha maisha, piga nambari ya dharura ya eneo lako sasa.',
    intakeTitle: 'Fomu ya kuingia kwa mgonjwa',
    intakeSubtitle: 'Shiriki dalili zako kabla ya ziara ili timu iwe tayari.',
    reminderTitle: 'Mapendeleo ya vikumbusho vya miadi',
    reminderSubtitle: 'Chagua jinsi unavyotaka vikumbusho vikufikie.',
    symptomLabel: 'Dalili',
    medicationLabel: 'Dawa za sasa',
    allergyLabel: 'Mzio',
    noteLabel: 'Maelezo ya ziada',
    submitLabel: 'Hifadhi taarifa',
  },
  fr: {
    pageLabel: 'Soins du patient',
    emergencyCta: 'Aide urgente',
    emergencyHelp: 'S’il s’agit d’une urgence vitale, appelez immédiatement le numéro d’urgence local.',
    intakeTitle: 'Formulaire d’admission du patient',
    intakeSubtitle: 'Partagez vos symptômes avant la visite pour préparer l’équipe.',
    reminderTitle: 'Préférences de rappel de rendez-vous',
    reminderSubtitle: 'Choisissez comment recevoir les rappels de suivi.',
    symptomLabel: 'Symptômes',
    medicationLabel: 'Médicaments actuels',
    allergyLabel: 'Allergies',
    noteLabel: 'Notes supplémentaires',
    submitLabel: 'Enregistrer',
  },
  es: {
    pageLabel: 'Atención al paciente',
    emergencyCta: 'Ayuda urgente',
    emergencyHelp: 'Si es una emergencia que pone en peligro la vida, llama ahora al número local de emergencias.',
    intakeTitle: 'Formulario de ingreso del paciente',
    intakeSubtitle: 'Comparte tus síntomas antes de la visita para que el equipo se prepare.',
    reminderTitle: 'Preferencias de recordatorios',
    reminderSubtitle: 'Elige cómo quieres recibir los recordatorios de seguimiento.',
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