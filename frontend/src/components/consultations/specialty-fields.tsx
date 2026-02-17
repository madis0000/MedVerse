import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { SpecialtyField } from '@/types';

interface SpecialtyFieldsProps {
  fields: SpecialtyField[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function SpecialtyFields({
  fields,
  values,
  onChange,
  readOnly,
}: SpecialtyFieldsProps) {
  const { t } = useTranslation();
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleChange = useCallback(
    (fieldName: string, value: unknown) => {
      onChange({ ...values, [fieldName]: value });
    },
    [values, onChange],
  );

  if (sortedFields.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t('consultations.specialtyFields.noFields')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedFields.map((field) => (
        <SpecialtyFieldInput
          key={field.id}
          field={field}
          value={values[field.fieldName]}
          onChange={(value) => handleChange(field.fieldName, value)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

interface SpecialtyFieldInputProps {
  field: SpecialtyField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}

function SpecialtyFieldInput({
  field,
  value,
  onChange,
  readOnly,
}: SpecialtyFieldInputProps) {
  const { t } = useTranslation();
  const fieldType = field.fieldType.toUpperCase();

  switch (fieldType) {
    case 'TEXT':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder={t('consultations.specialtyFields.enterField', { field: field.fieldName.toLowerCase() })}
          />
        </div>
      );

    case 'NUMBER':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={value != null ? String(value) : ''}
            onChange={(e) =>
              onChange(e.target.value === '' ? null : Number(e.target.value))
            }
            disabled={readOnly}
            placeholder={t('consultations.specialtyFields.enterField', { field: field.fieldName.toLowerCase() })}
          />
        </div>
      );

    case 'SELECT': {
      const options: string[] = Array.isArray(field.options)
        ? field.options
        : field.options?.choices ?? field.options?.options ?? [];

      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) ?? ''}
            onValueChange={onChange}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('consultations.specialtyFields.selectField', { field: field.fieldName.toLowerCase() })} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'BOOLEAN':
      return (
        <div className="flex items-center space-x-2 py-1">
          <Checkbox
            id={`field-${field.id}`}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
            disabled={readOnly}
          />
          <Label htmlFor={`field-${field.id}`} className="cursor-pointer">
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );

    case 'DATE':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
      );

    case 'TEXTAREA':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder={t('consultations.specialtyFields.enterField', { field: field.fieldName.toLowerCase() })}
            rows={4}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label>
            {field.fieldName}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder={t('consultations.specialtyFields.enterField', { field: field.fieldName.toLowerCase() })}
          />
        </div>
      );
  }
}
