import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  parseNumericValue,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from '@/lib/numericInput';

export function NumericInput({
  value,
  onValueChange,
  onNumberChange,
  fallback = 0,
  decimal = false,
  suffix,
  className,
  wrapperClassName,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const sanitize = decimal ? sanitizeDecimalInput : sanitizeIntegerInput;

  const committedDisplay = () => {
    if (value === '' || value == null) return String(fallback);
    return String(value);
  };

  const displayValue = focused ? draft : committedDisplay();

  const commitValue = (rawDraft) => {
    const sanitized = rawDraft === '' ? '' : sanitize(rawDraft);
    const nextValue = sanitized === '' ? String(fallback) : sanitized;
    const nextNumber = parseNumericValue(nextValue, { decimal, fallback });
    onValueChange?.(nextValue);
    onNumberChange?.(nextNumber);
    return nextValue;
  };

  const handleFocus = (event) => {
    const next = value === '' || value == null ? String(fallback) : String(value);
    setDraft(next);
    setFocused(true);
    requestAnimationFrame(() => event.target.select());
  };

  const handleChange = (event) => {
    const sanitized = sanitize(event.target.value);
    setDraft(sanitized);
    if (sanitized === '') return;

    const nextNumber = parseNumericValue(sanitized, { decimal, fallback });
    onValueChange?.(sanitized);
    onNumberChange?.(nextNumber);
  };

  const handleBlur = () => {
    commitValue(draft);
    setFocused(false);
    setDraft('');
  };

  const input = (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn('tabular-nums', className)}
      {...props}
    />
  );

  if (!suffix) return input;

  return (
    <div className={cn('flex items-center gap-1', wrapperClassName)}>
      {input}
      <span className="text-[10px] text-muted shrink-0">{suffix}</span>
    </div>
  );
}
