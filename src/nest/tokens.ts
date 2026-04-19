import { Inject } from '@nestjs/common';

export const KLIX_CLIENT = Symbol('KLIX_CLIENT');
export const KLIX_MODULE_OPTIONS = Symbol('KLIX_MODULE_OPTIONS');

export function InjectKlixClient(): ParameterDecorator {
  return Inject(KLIX_CLIENT);
}
