'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Resolver, UseFormGetValues, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Music2,
  Sparkles,
  Users,
} from 'lucide-react';
import { createRequirement } from '@/lib/api';
import {
  crewDetailsSchema,
  eventStepSchema,
  performerDetailsSchema,
  plannerDetailsSchema,
  requirementSchema,
} from '@/schemas/requirement';
import type { Category, CreateResponse, RequirementPayload } from '@/types/requirement';
import { Field, SelectInput, TextArea, TextInput } from './Field';

const steps = ['Event basics', 'Requirements', 'Additional details', 'Review'];
const today = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
};

const categoryMeta = [
  {
    id: 'planner' as const,
    title: 'Event planner',
    description: 'Plan and coordinate the full experience.',
    Icon: ClipboardList,
  },
  {
    id: 'performer' as const,
    title: 'Performer',
    description: 'Bring the event to life on stage.',
    Icon: Music2,
  },
  {
    id: 'crew' as const,
    title: 'Event crew',
    description: 'Find skilled people to make it happen.',
    Icon: Users,
  },
];

type RequirementFormInput = RequirementPayload;
const defaults: RequirementFormInput = {
  eventName: '',
  eventType: '',
  startDate: '',
  endDate: '',
  location: '',
  venue: '',
  category: 'planner',
  details: {
    services: [],
    guestCount: 100,
    planningScope: 'full-service',
    budgetMin: undefined,
    budgetMax: undefined,
  },
  additionalDetails: {
    description: '',
    specialInstructions: '',
    contactMethod: 'email',
    responseDeadline: '',
  },
};

export function RequirementWizard() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<CreateResponse['data'] | null>(null);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<RequirementFormInput, unknown, RequirementPayload>({
    defaultValues: defaults,
    resolver: zodResolver(requirementSchema) as unknown as Resolver<
      RequirementFormInput,
      unknown,
      RequirementPayload
    >,
    shouldUnregister: false,
    mode: 'onTouched',
  });
  const category = useWatch({ control, name: 'category' });
  const eventName = useWatch({ control, name: 'eventName' });
  const fieldError = (path: string) => {
    const error = path.split('.').reduce(
      (value: unknown, key) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[key]
          : undefined,
      errors,
    );

    return error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : undefined;
  };

  const chooseCategory = (next: Category) => {
    const old = getValues('category');
    if (old === next) return;

    const categoryDefaults: RequirementPayload['details'] =
      next === 'planner'
        ? { services: [], guestCount: 100, planningScope: 'full-service' }
        : next === 'performer'
          ? {
              performanceType: 'dj',
              durationMinutes: 60,
              performerCount: 1,
              technicalRequirements: [],
            }
          : { crewRoles: [], crewCount: 1, workingHours: 8 };

    setValue('category', next, { shouldValidate: true });
    setValue('details', categoryDefaults, { shouldValidate: true });
    clearErrors('details');
  };

  const goNext = async () => {
    if (step === 0) {
      const values = getValues();
      const parsed = eventStepSchema.safeParse(values);

      if (!parsed.success) {
        parsed.error.issues.forEach(issue =>
          setError(issue.path.join('.') as keyof RequirementPayload, {
            type: 'manual',
            message: issue.message,
          }),
        );
        return;
      }

      clearErrors();
      setStep(1);
      return;
    }

    if (step === 1) {
      const details = getValues('details');
      const parsedDetails =
        category === 'planner'
          ? plannerDetailsSchema.safeParse(details)
          : category === 'performer'
            ? performerDetailsSchema.safeParse(details)
            : crewDetailsSchema.safeParse(details);

      if (!parsedDetails.success) {
        parsedDetails.error.issues.forEach(issue =>
          setError(`details.${issue.path.join('.')}` as keyof RequirementPayload, {
            type: 'manual',
            message: issue.message,
          }),
        );
        return;
      }
    }

    clearErrors();
    setStep(current => Math.min(3, current + 1));
  };

  const submit = handleSubmit(async values => {
    setSubmitError('');
    setSaving(true);

    try {
      const response = await createRequirement(values);
      setSaved(response.data);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to save this requirement. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }, invalid => {
    setSubmitError(
      firstFieldError(invalid) ??
        'Please review the form and correct the highlighted fields.',
    );
  });

  const restart = () => {
    Object.entries(defaults).forEach(([key, value]) => {
      setValue(key as keyof RequirementPayload, value as never);
    });

    setSaved(null);
    setStep(0);
    setSubmitError('');
    clearErrors();
  };

  const checkboxes = (
    name: 'details.services' | 'details.technicalRequirements' | 'details.crewRoles',
    options: string[],
    error?: string,
  ) => {
    const label = name.endsWith('services')
      ? 'Services required'
      : name.endsWith('crewRoles')
        ? 'Crew roles required'
        : 'Technical requirements';

    return (
      <Field label={label} error={error}>
        <div className="check-grid">
          {options.map(option => (
            <label className="check-option" key={option}>
              <input type="checkbox" value={option.toLowerCase()} {...register(name)} />
              {option}
            </label>
          ))}
        </div>
      </Field>
    );
  };

  if (saved) {
    return (
      <section className="success-card" aria-live="polite">
        <div className="success-icon">
          <CheckCircle2 size={30} />
        </div>
        <p className="eyebrow">Requirement submitted</p>
        <h1>Your event is taking shape.</h1>
        <p className="muted">
          Your request has been saved. You can reference it using this ID.
        </p>
        <div className="id-box">
          <span>Requirement ID</span>
          <strong>{saved.id}</strong>
        </div>
        <div className="success-summary">
          <strong>{eventName}</strong>
          <span>
            {categoryMeta.find(item => item.id === saved.category)?.title} ·{' '}
            {getValues('location')}
          </span>
          <span>Created {new Date(saved.createdAt).toLocaleString()}</span>
        </div>
        <button className="button primary full" onClick={restart}>
          Create another requirement <ArrowRight size={17} />
        </button>
      </section>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="GoPratle home">
          <span className="brand-mark">
            <Sparkles size={17} />
          </span>
          gopratle<span className="brand-period">.</span>
        </a>
        <div className="top-label">
          Requirement posting <span>·</span> New request
        </div>
        <div className="secure-label">
          <span className="secure-dot" /> Secure form
        </div>
      </header>

      <div className="intro">
        <div>
          <p className="eyebrow">
            EVENT MARKETPLACE <span> / </span> POST A REQUIREMENT
          </p>
          <h1>
            Find the right people
            <br className="desktop-break" /> for your event.
          </h1>
          <p className="intro-copy">
            Tell us what you’re planning. We’ll help connect you with the talent to
            make it memorable.
          </p>
        </div>
        <div className="intro-note">
          <span className="note-number">01—04</span>
          <span>
            Thoughtfully planned,
            <br /> beautifully delivered.
          </span>
        </div>
      </div>

      <div className="wizard-card" id="top">
        <StepIndicator step={step} onStepChange={setStep} />

        <form
          onSubmit={step === 3 ? submit : event => {
            event.preventDefault();
            void goNext();
          }}
          noValidate
        >
          <div className="form-content" key={step}>
            {step === 0 && (
              <EventBasicsStep
                category={category}
                chooseCategory={chooseCategory}
                fieldError={fieldError}
                getValues={getValues}
                register={register}
              />
            )}

            {step === 1 && (
              <CategoryDetailsStep
                category={category}
                checkboxes={checkboxes}
                fieldError={fieldError}
                register={register}
              />
            )}

            {step === 2 && (
              <AdditionalDetailsStep
                fieldError={fieldError}
                getValues={getValues}
                register={register}
              />
            )}

            {step === 3 && (
              <ReviewStep
                category={category}
                getValues={getValues}
                setStep={setStep}
                submitError={submitError}
              />
            )}
          </div>

          <FormFooter step={step} saving={saving} setStep={setStep} />
        </form>
      </div>

      <footer className="page-footer">
        <span>
          GOPRATLE <i>·</i> EVENT REQUIREMENTS
        </span>
        <span>Made for moments that matter.</span>
      </footer>
    </main>
  );
}

function StepIndicator({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  return (
    <div className="stepper" aria-label={`Step ${step + 1} of 4`}>
      <div className="stepper-top">
        <span>YOUR REQUIREMENT</span>
        <span>
          STEP {String(step + 1).padStart(2, '0')} <i>/</i> 04
        </span>
      </div>
      <div className="step-track">
        {steps.map((label, index) => (
          <button
            type="button"
            className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}
            key={label}
            onClick={() => index < step && onStepChange(index)}
            aria-current={index === step ? 'step' : undefined}
          >
            <span className="step-number">
              {index < step ? <Check size={13} /> : `0${index + 1}`}
            </span>
            <span className="step-name">{label}</span>
          </button>
        ))}
      </div>
      <div className="mobile-progress">
        <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>
    </div>
  );
}

type FormStepProps = {
  fieldError: (path: string) => string | undefined;
  register: UseFormRegister<RequirementFormInput>;
};

function StepHeading({ number, title, description }: { number: string; title: React.ReactNode; description: string }) {
  return (
    <div className="section-heading">
      <span className="section-kicker">{number}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function EventBasicsStep({
  category,
  chooseCategory,
  fieldError,
  getValues,
  register,
}: FormStepProps & {
  category: Category;
  chooseCategory: (category: Category) => void;
  getValues: UseFormGetValues<RequirementFormInput>;
}) {
  return (
    <>
      <StepHeading
        number="01 / EVENT BASICS"
        title="Let’s start with the essentials"
        description="Share a few details so we can understand your event."
      />

      <div className="form-grid">
        <TextInput
          label="Event name"
          placeholder="e.g. Maya & Arjun’s wedding"
          {...register('eventName')}
          error={fieldError('eventName')}
        />
        <SelectInput
          label="Event type"
          {...register('eventType')}
          options={['Wedding', 'Corporate', 'Concert', 'Private Party', 'Festival', 'Other']}
          error={fieldError('eventType')}
        />
        <TextInput
          label="Start date"
          type="date"
          min={today()}
          {...register('startDate')}
          error={fieldError('startDate')}
        />
        <TextInput
          label="End date"
          type="date"
          min={getValues('startDate') || today()}
          {...register('endDate')}
          error={fieldError('endDate')}
        />
        <TextInput
          label="City or location"
          placeholder="e.g. Mumbai, Maharashtra"
          {...register('location')}
          error={fieldError('location')}
        />
        <TextInput label="Venue name" placeholder="Optional" {...register('venue')} error={fieldError('venue')} />
      </div>

      <Field label="Who are you looking for?" error={fieldError('category')}>
        <div className="category-grid">
          {categoryMeta.map(({ id, title, description, Icon }) => (
            <button
              type="button"
              key={id}
              className={`category-card ${category === id ? 'selected' : ''}`}
              onClick={() => chooseCategory(id)}
              aria-pressed={category === id}
            >
              <span className="category-icon">
                <Icon size={19} />
              </span>
              <span className="category-title">{title}</span>
              <span className="category-desc">{description}</span>
              <span className="radio-dot" />
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

function CategoryDetailsStep({ category, checkboxes, fieldError, register }: FormStepProps & {
  category: Category;
  checkboxes: (
    name: 'details.services' | 'details.technicalRequirements' | 'details.crewRoles',
    options: string[],
    error?: string,
  ) => React.ReactNode;
}) {
  const title = categoryMeta.find(item => item.id === category)?.title;

  return (
    <>
      <StepHeading
        number="02 / THE DETAILS"
        title={`${title} requirements`}
        description="What would make this a perfect fit for your event?"
      />

      {category === 'planner' && (
        <div className="form-grid">
          {checkboxes(
            'details.services',
            ['Event planning', 'Venue coordination', 'Catering', 'Decoration', 'Logistics', 'Other'],
            fieldError('details.services'),
          )}
          <TextInput
            label="Expected guest count"
            type="number"
            min="1"
            {...register('details.guestCount')}
            error={fieldError('details.guestCount')}
          />
          <SelectInput
            label="Planning scope"
            {...register('details.planningScope')}
            options={['full-service', 'partial-planning', 'day-of']}
            error={fieldError('details.planningScope')}
          />
          <Budget register={register} error={fieldError} />
          <TextArea
            label="Additional requirements"
            placeholder="Tell us anything else the planner should know"
            {...register('details.additionalRequirements')}
            error={fieldError('details.additionalRequirements')}
          />
        </div>
      )}

      {category === 'performer' && (
        <div className="form-grid">
          <SelectInput
            label="Performance type"
            {...register('details.performanceType')}
            options={['singer', 'dj', 'band', 'dancer', 'host', 'other']}
            error={fieldError('details.performanceType')}
          />
          <TextInput
            label="Performance duration (minutes)"
            type="number"
            min="1"
            {...register('details.durationMinutes')}
            error={fieldError('details.durationMinutes')}
          />
          <TextInput
            label="Number of performers"
            type="number"
            min="1"
            {...register('details.performerCount')}
            error={fieldError('details.performerCount')}
          />
          {checkboxes(
            'details.technicalRequirements',
            ['Sound', 'Lighting', 'Stage', 'Instruments'],
            fieldError('details.technicalRequirements'),
          )}
          <Budget register={register} error={fieldError} />
          <TextArea
            label="Additional requirements"
            placeholder="Anything the performer should know"
            {...register('details.additionalRequirements')}
            error={fieldError('details.additionalRequirements')}
          />
        </div>
      )}

      {category === 'crew' && (
        <div className="form-grid">
          {checkboxes(
            'details.crewRoles',
            ['Sound technician', 'Lighting technician', 'Stagehand', 'Event coordinator', 'Security', 'Other'],
            fieldError('details.crewRoles'),
          )}
          <TextInput
            label="Crew members needed"
            type="number"
            min="1"
            {...register('details.crewCount')}
            error={fieldError('details.crewCount')}
          />
          <TextInput
            label="Working hours"
            type="number"
            min="1"
            {...register('details.workingHours')}
            error={fieldError('details.workingHours')}
          />
          <Budget register={register} error={fieldError} />
          <TextArea
            label="Equipment or skills"
            placeholder="Optional equipment and skills"
            {...register('details.equipmentSkills')}
            error={fieldError('details.equipmentSkills')}
          />
          <TextArea
            label="Additional requirements"
            placeholder="Anything else the crew should know"
            {...register('details.additionalRequirements')}
            error={fieldError('details.additionalRequirements')}
          />
        </div>
      )}
    </>
  );
}

function AdditionalDetailsStep({ fieldError, getValues, register }: FormStepProps & {
  getValues: UseFormGetValues<RequirementFormInput>;
}) {
  return (
    <>
      <StepHeading
        number="03 / A LITTLE MORE"
        title="Anything else we should know?"
        description="A little context helps the right people respond. Every field here is optional."
      />

      <div className="form-grid">
        <TextArea
          label="Short description"
          placeholder="Paint a picture of your event…"
          {...register('additionalDetails.description')}
          error={fieldError('additionalDetails.description')}
        />
        <TextArea
          label="Special instructions"
          placeholder="Preferences, access notes, or other useful context"
          {...register('additionalDetails.specialInstructions')}
          error={fieldError('additionalDetails.specialInstructions')}
        />
        <SelectInput
          label="Preferred contact method"
          {...register('additionalDetails.contactMethod')}
          options={['email', 'phone']}
        />
        <TextInput
          label="Response deadline"
          type="date"
          max={getValues('startDate')}
          {...register('additionalDetails.responseDeadline')}
          error={fieldError('additionalDetails.responseDeadline')}
        />
      </div>
    </>
  );
}

function ReviewStep({ category, getValues, setStep, submitError }: {
  category: Category;
  getValues: UseFormGetValues<RequirementFormInput>;
  setStep: (step: number) => void;
  submitError: string;
}) {
  return (
    <>
      <StepHeading
        number="04 / LOOKING GOOD"
        title="Review your requirement"
        description="Make sure everything is right before sending it out."
      />

      <div className="review-list">
        <ReviewSection title="Event basics" onEdit={() => setStep(0)}>
          <ReviewRow label="Event" value={getValues('eventName')} />
          <ReviewRow label="Type" value={getValues('eventType')} />
          <ReviewRow
            label="Dates"
            value={`${getValues('startDate')} – ${getValues('endDate')}`}
          />
          <ReviewRow
            label="Location"
            value={[getValues('location'), getValues('venue')].filter(Boolean).join(' · ')}
          />
        </ReviewSection>

        <ReviewSection title="Category & requirements" onEdit={() => setStep(1)}>
          <ReviewRow
            label="Looking for"
            value={categoryMeta.find(item => item.id === category)?.title}
          />
          <ReviewRow label="Requirements" value={summarize(getValues('details'))} />
        </ReviewSection>

        <ReviewSection title="Additional details" onEdit={() => setStep(2)}>
          <ReviewRow
            label="Description"
            value={getValues('additionalDetails.description') || 'None provided'}
          />
          <ReviewRow
            label="Special instructions"
            value={getValues('additionalDetails.specialInstructions') || 'None provided'}
          />
          <ReviewRow
            label="Contact preference"
            value={getValues('additionalDetails.contactMethod') || 'Not specified'}
          />
          <ReviewRow
            label="Response by"
            value={getValues('additionalDetails.responseDeadline') || 'No deadline'}
          />
        </ReviewSection>
      </div>

      {submitError && (
        <div className="submit-error" role="alert">
          {submitError}
        </div>
      )}
    </>
  );
}

function FormFooter({ step, saving, setStep }: {
  step: number;
  saving: boolean;
  setStep: (step: number) => void;
}) {
  return (
    <div className="form-footer">
      <div className="footer-note">
        <span className="footer-lock">✳</span> Your details are only shared with relevant vendors.
      </div>
      <div className="actions">
        {step > 0 && (
          <button className="button secondary" type="button" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {step < 3 ? (
          <button className="button primary" type="submit">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" /> Saving…
              </>
            ) : (
              <>
                Submit requirement <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Budget({ register, error }: FormStepProps) {
  return (
    <div className="budget-row">
      <TextInput
        label="Minimum budget"
        type="number"
        min="0"
        placeholder="₹ 0"
        {...register('details.budgetMin')}
        error={error('details.budgetMin')}
      />
      <TextInput
        label="Maximum budget"
        type="number"
        min="0"
        placeholder="₹ 0"
        {...register('details.budgetMax')}
        error={error('details.budgetMax')}
      />
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="review-section">
      <div className="review-head">
        <h3>{title}</h3>
        <button type="button" className="edit-button" onClick={onEdit}>
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

function summarize(details: RequirementPayload['details']) {
  const values = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length))
    .map(([key, value]) => {
      const label = key.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`);
      const displayValue = Array.isArray(value) ? value.join(', ') : value;

      return `${label}: ${displayValue}`;
    });

  return values.join(' · ') || '—';
}

function firstFieldError(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if ('message' in value && typeof value.message === 'string') return value.message;
  return Object.values(value).map(firstFieldError).find(Boolean);
}
