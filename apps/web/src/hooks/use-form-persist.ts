import { useEffect } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

/**
 * Persists a subset of form fields to sessionStorage so they survive
 * navigation (e.g. opening Terms of Service in a mobile PWA context).
 *
 * Never persist sensitive fields like passwords.
 */
export function useFormPersist<T extends FieldValues>(
  key: string,
  {
    control,
    setValue,
    fields,
  }: {
    control: Control<T>;
    setValue: UseFormSetValue<T>;
    fields: readonly Path<T>[];
  },
): { clearPersisted: () => void } {
  const values = useWatch({ control, name: fields as Path<T>[] });

  // Restore persisted values on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, unknown>;
      for (const field of fields) {
        const val = stored[field as string];
        if (val !== undefined) {
          setValue(field, val as PathValue<T, typeof field>, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      }
    } catch {
      // private browsing or stale JSON — silently ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Persist on change
  useEffect(() => {
    const data: Record<string, unknown> = {};
    (fields as Path<T>[]).forEach((field, i) => {
      data[field] = values[i];
    });
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
      // private browsing — silently ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...values]);

  return {
    clearPersisted: () => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // private browsing — silently ignore
      }
    },
  };
}
