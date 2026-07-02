import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Field({ label, children, error, required, hint, className }) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-primary">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <div className="text-xs text-foreground/55">{hint}</div>
      )}
      {error && <div className="text-xs text-primary">{error}</div>}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  testId,
  error,
  required,
  min = 0,
  hint,
  placeholder,
}) {
  return (
    <Field label={label} error={error} required={required} hint={hint}>
      <RupeeInput
        value={value}
        onChange={onChange}
        testId={testId}
        error={error}
        placeholder={placeholder}
        min={min}
      />
    </Field>
  );
}

export function RupeeInput({
  value,
  onChange,
  testId,
  error,
  placeholder = "0",
  disabled,
  className,
}) {
  const handle = (raw) => {
    const cleaned = String(raw).replace(/[^0-9]/g, "");
    onChange(cleaned === "" ? "" : Number(cleaned));
  };
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-foreground/55 pointer-events-none">
        {"\u20B9"}
      </span>
      <Input
        type="text"
        inputMode="numeric"
        data-testid={testId}
        disabled={disabled}
        value={value === 0 || value ? value : ""}
        placeholder={placeholder}
        onChange={(e) => handle(e.target.value)}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", ".", ","].includes(e.key))
            e.preventDefault();
        }}
        onPaste={(e) => {
          e.preventDefault();
          handle(e.clipboardData.getData("text") || "");
        }}
        className={`pl-6 tabular-nums ${error ? "border-primary" : ""} ${className || ""}`}
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  testId,
  error,
  required,
  placeholder,
  type = "text",
}) {
  return (
    <Field label={label} error={error} required={required}>
      <Input
        type={type}
        data-testid={testId}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-primary" : ""}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  testId,
  error,
  required,
  placeholder,
  rows = 3,
}) {
  return (
    <Field label={label} error={error} required={required}>
      <Textarea
        rows={rows}
        data-testid={testId}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-primary" : ""}
      />
    </Field>
  );
}
