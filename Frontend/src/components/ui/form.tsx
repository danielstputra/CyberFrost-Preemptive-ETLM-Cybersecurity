/**
 * Form — React Hook Form wrapper
 * ================================
 * Reusable form component dengan validasi Zod terintegrasi.
 *
 * Usage:
 *   import { useForm } from 'react-hook-form';
 *   import { zodResolver } from '@hookform/resolvers/zod';
 *   import { z } from 'zod';
 *   import { Form, FormField } from '@/components/ui/form';
 *
 *   const schema = z.object({ email: z.string().email() });
 *   const form = useForm({ resolver: zodResolver(schema) });
 *
 *   <Form form={form} onSubmit={handleSubmit}>
 *     <FormField name="email" label="Email" render={<Input />} />
 *   </Form>
 */

'use client';

import React from 'react';
import type {
  UseFormReturn,
  FieldValues,
  Path,
  ControllerRenderProps,
  FieldError,
} from 'react-hook-form';
import { FormProvider, useFormContext, Controller } from 'react-hook-form';

// ──────────────────────────────────────
// Form Provider Wrapper
// ──────────────────────────────────────

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}

// ──────────────────────────────────────
// Form Field — label + error + children
// ──────────────────────────────────────

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  children: (field: ControllerRenderProps<T>) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  description,
  children,
}: FormFieldProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name] as FieldError | undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-1.5">
          {label && (
            <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block">
              {label}
            </label>
          )}
          {children(field)}
          {description && !error && (
            <p className="text-[8px] font-mono text-[#6F7C89]">{description}</p>
          )}
          {error && (
            <p className="text-[9px] font-mono text-[#FF003C]">
              !&gt; {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

// ──────────────────────────────────────
// Form Error — menampilkan error global
// ──────────────────────────────────────

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="text-[10px] font-mono text-[#FF003C] text-center">
      !&gt; {message}
    </p>
  );
}

// ──────────────────────────────────────
// Submit Button wrapper — loading state
// ──────────────────────────────────────

export function FormSubmit({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { formState } = useFormContext();
  const isDisabled = disabled || formState.isSubmitting || loading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="w-full"
    >
      {children}
    </button>
  );
}
