import { MedicalCategory } from '../types.js';

export interface SeedMedicalSource {
  sourceId: string;
  title: string;
  publisher: 'WHO' | 'CDC' | 'NCBI' | 'NLM';
  sourceUrl: string;
  licenseType: string;
  licenseUrl: string;
  version: string;
  category: MedicalCategory;
  sections: Array<{
    heading: string;
    page?: number;
    ageMinMonths?: number;
    ageMaxMonths?: number;
    content: string;
  }>;
}

export const SEED_MEDICAL_SOURCES: SeedMedicalSource[] = [
  {
    sourceId: 'WHO_CHILD_HEALTH_CARE_2023',
    title: 'WHO Pocket Book of Hospital Care for Children: Guidelines for the Management of Common Illnesses',
    publisher: 'WHO',
    sourceUrl: 'https://www.who.int/publications/i/item/9789241548373',
    licenseType: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 IGO (CC BY-NC-SA 3.0 IGO)',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/igo/',
    version: '2nd Edition',
    category: 'symptoms',
    sections: [
      {
        heading: 'Cough and Respiratory Symptoms in Infants and Toddlers',
        page: 45,
        ageMinMonths: 0,
        ageMaxMonths: 60,
        content: `Cough is one of the most common presenting symptoms in young children. In most infants and toddlers under 5 years of age, cough is caused by a self-limiting viral upper respiratory tract infection (URTI). Supportive care involves keeping the child hydrated with frequent feeds, clearing nasal secretions with saline drops, and monitoring for danger signs. Danger signs that require immediate escalation include fast breathing (tachypnea), chest in-drawing, stridor in a calm child, inability to drink or breastfeed, or central cyanosis. Avoid giving over-the-counter cough syrups or sedatives to infants under 2 years of age.`
      },
      {
        heading: 'Assessment and Supportive Care for Pediatric Fever',
        page: 62,
        ageMinMonths: 0,
        ageMaxMonths: 60,
        content: `Fever is a physiological response to infection. In neonates under 90 days of age, any rectal temperature of 38.0°C (100.4°F) or higher requires immediate emergency evaluation by a physician to rule out serious bacterial infection (SBI). For older infants and children with mild fever, focus on hydration, light clothing, and maintaining comfortable room temperature. Parents should observe activity levels, oral fluid intake, and wet diaper count.`
      }
    ]
  },
  {
    sourceId: 'CDC_INFANT_NUTRITION_FEEDING_2024',
    title: 'CDC Infant and Toddler Nutrition & Feeding Guidelines',
    publisher: 'CDC',
    sourceUrl: 'https://www.cdc.gov/nutrition/infantandtoddlernutrition/index.html',
    licenseType: 'Public Domain (US Government Work)',
    licenseUrl: 'https://www.cdc.gov/other/privacy.html',
    version: '2024 Update',
    category: 'nutrition',
    sections: [
      {
        heading: 'Introducing Solid Foods to Infants (6 to 12 Months)',
        page: 12,
        ageMinMonths: 6,
        ageMaxMonths: 12,
        content: `The American Academy of Pediatrics and CDC recommend exclusive breastfeeding or formula feeding for the first 6 months of life. Around 6 months of age, infants demonstrate readiness for solid foods when they can sit up with little support, control their head and neck, and bring objects to their mouth. Introduce one single-ingredient food at a time (such as iron-fortified cereal, pureed meats, vegetables, or fruits) and wait 3 to 5 days before introducing another new food to monitor for allergic reactions.`
      },
      {
        heading: 'Feeding Framework for 12 to 24 Month Old Toddlers',
        page: 28,
        ageMinMonths: 12,
        ageMaxMonths: 24,
        content: `Between 12 and 24 months, toddlers transition to eating family foods. A balanced plate for a toddler includes iron-rich proteins, vegetables, fruits, whole grains, and healthy fats. Offer 3 main meals and 2 to 3 healthy snacks daily. Encourage self-feeding with spoon and open cup. Limit added sugars, sodium, and sweetened beverages.`
      }
    ]
  },
  {
    sourceId: 'NCBI_PEDIATRIC_MILESTONES_2023',
    title: 'CDC / AAP Evidence-Based Developmental Milestone Checklists',
    publisher: 'NCBI',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK557577/',
    licenseType: 'NCBI Bookshelf Public Domain / Open Access',
    licenseUrl: 'https://www.ncbi.nlm.nih.gov/home/about/policies/',
    version: '2023 Revision',
    category: 'development',
    sections: [
      {
        heading: 'Developmental Milestones at 6 Months of Age',
        page: 8,
        ageMinMonths: 5,
        ageMaxMonths: 8,
        content: `By 6 months of age, most infants reach key milestones across motor, cognitive, and social domains. Social/Emotional: knows familiar faces, likes to play with others. Language/Communication: responds to sounds by making sounds, strings vowels together when babbling ("ah", "eh", "oh"). Cognitive: looks around at things nearby, brings items to mouth. Movement/Physical: rolls over in both directions (front to back, back to front), begins to sit without support.`
      },
      {
        heading: 'Developmental Milestones at 12 Months of Age',
        page: 18,
        ageMinMonths: 11,
        ageMaxMonths: 15,
        content: `By 12 months of age, toddlers demonstrate emerging independence. Social: shy or nervous with strangers, cries when mom or dad leaves. Language: uses simple gestures like shaking head "no" or waving "bye-bye", says "mama" or "dada". Cognitive: explores items in different ways (shaking, banging, throwing), finds hidden objects easily. Movement: pulls up to stand, walks holding on to furniture ("cruising"), may take a few steps without holding on.`
      }
    ]
  }
];
