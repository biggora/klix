import type { DynamicModule, FactoryProvider, ModuleMetadata, Provider } from '@nestjs/common';
import { Module } from '@nestjs/common';

import { KlixClient } from '../client.js';
import type { KlixClientOptions } from '../core/http-client.js';
import { KlixSignatureVerifier } from './signature-verifier.js';
import { KLIX_CLIENT, KLIX_MODULE_OPTIONS } from './tokens.js';

export type KlixModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider<KlixClientOptions>['inject'];
  useFactory: (...args: any[]) => Promise<KlixClientOptions> | KlixClientOptions;
};

function createClientProvider(): Provider {
  return {
    provide: KLIX_CLIENT,
    inject: [KLIX_MODULE_OPTIONS],
    useFactory: (options: KlixClientOptions) => new KlixClient(options),
  };
}

@Module({})
export class KlixModule {
  static forRoot(options: KlixClientOptions): DynamicModule {
    return {
      module: KlixModule,
      providers: [
        {
          provide: KLIX_MODULE_OPTIONS,
          useValue: options,
        },
        createClientProvider(),
        KlixSignatureVerifier,
      ],
      exports: [KLIX_CLIENT, KlixSignatureVerifier],
    };
  }

  static forRootAsync(options: KlixModuleAsyncOptions): DynamicModule {
    return {
      module: KlixModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: KLIX_MODULE_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        createClientProvider(),
        KlixSignatureVerifier,
      ],
      exports: [KLIX_CLIENT, KlixSignatureVerifier],
    };
  }
}
