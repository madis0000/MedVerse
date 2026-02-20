import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || password.length < 12) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    return true;
  }

  defaultMessage(): string {
    return 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordPolicyConstraint,
    });
  };
}
