import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Base = {
  label: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
};

export function Field({ label, error, hint, children }: Base) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const { label, error, ...input } = props;

  return (
    <Field label={label} error={error}>
      <input className="control" aria-label={label} {...input} />
    </Field>
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: string[] }) {
  const { label, error, options, ...select } = props;

  return (
    <Field label={label} error={error}>
      <select className="control" aria-label={label} {...select}>
        <option value="">Select an option</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const { label, error, ...textarea } = props;

  return (
    <Field label={label} error={error}>
      <textarea className="control textarea" aria-label={label} {...textarea} />
    </Field>
  );
}
