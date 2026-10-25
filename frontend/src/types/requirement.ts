export type Category = 'planner' | 'performer' | 'crew';

export type PlannerDetails = {
  services: string[];
  guestCount: number;
  planningScope: 'full-service' | 'partial-planning' | 'day-of';
  budgetMin?: number;
  budgetMax?: number;
  additionalRequirements?: string;
};

export type PerformerDetails = {
  performanceType: 'singer' | 'dj' | 'band' | 'dancer' | 'host' | 'other';
  durationMinutes: number;
  performerCount: number;
  budgetMin?: number;
  budgetMax?: number;
  technicalRequirements: string[];
  additionalRequirements?: string;
};

export type CrewDetails = {
  crewRoles: string[];
  crewCount: number;
  workingHours: number;
  budgetMin?: number;
  budgetMax?: number;
  equipmentSkills?: string;
  additionalRequirements?: string;
};

export type RequirementDetails = PlannerDetails | PerformerDetails | CrewDetails;

export type RequirementPayload = {
  eventName: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  category: Category;
  details: RequirementDetails;
  additionalDetails: {
    description?: string;
    specialInstructions?: string;
    contactMethod?: 'email' | 'phone';
    responseDeadline?: string;
  };
};

export type CreateResponse = {
  success: true;
  message: string;
  data: {
    id: string;
    category: Category;
    status: 'submitted';
    createdAt: string;
  };
};
