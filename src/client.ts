import type { KlixClientOptions } from './core/http-client.js';
import { HttpClient } from './core/http-client.js';
import { verifyWebhookPayload } from './core/signature.js';
import { BalanceResource } from './resources/balance.js';
import { BillingResource } from './resources/billing.js';
import { BillingTemplatesResource } from './resources/billing-templates.js';
import { ClientsResource } from './resources/clients.js';
import { CompanyStatementsResource } from './resources/company-statements.js';
import { PaymentMethodsResource } from './resources/payment-methods.js';
import { PublicKeyResource } from './resources/public-key.js';
import { PurchasesResource } from './resources/purchases.js';
import { PayoutMethodsResource } from './resources/payout-methods.js';
import { WebhooksResource } from './resources/webhooks.js';

export class KlixClient {
  readonly balance: BalanceResource;
  readonly billing: BillingResource;
  readonly billingTemplates: BillingTemplatesResource;
  readonly clients: ClientsResource;
  readonly companyStatements: CompanyStatementsResource;
  readonly paymentMethods: PaymentMethodsResource;
  readonly payoutMethods: PayoutMethodsResource;
  readonly publicKey: PublicKeyResource;
  readonly purchases: PurchasesResource;
  readonly webhooks: WebhooksResource;
  private readonly httpClient: HttpClient;
  private successCallbackPublicKey?: string;

  constructor(options: KlixClientOptions) {
    this.httpClient = new HttpClient(options);
    this.balance = new BalanceResource(this.httpClient);
    this.billing = new BillingResource(this.httpClient);
    this.billingTemplates = new BillingTemplatesResource(this.httpClient);
    this.clients = new ClientsResource(this.httpClient);
    this.companyStatements = new CompanyStatementsResource(this.httpClient);
    this.paymentMethods = new PaymentMethodsResource(this.httpClient);
    this.payoutMethods = new PayoutMethodsResource(this.httpClient);
    this.publicKey = new PublicKeyResource(this.httpClient);
    this.purchases = new PurchasesResource(this.httpClient);
    this.webhooks = new WebhooksResource(this.httpClient);
  }

  async verifySuccessCallback(rawBody: Buffer | string, signature: string): Promise<boolean> {
    const publicKey = await this.getSuccessCallbackPublicKey();
    return verifyWebhookPayload(rawBody, signature, publicKey);
  }

  private async getSuccessCallbackPublicKey(): Promise<string> {
    if (this.successCallbackPublicKey) {
      return this.successCallbackPublicKey;
    }

    const response = await this.publicKey.get();
    const publicKey = response;
    if (!publicKey) {
      throw new Error('Klix success callback public key missing from /public_key/ response.');
    }

    this.successCallbackPublicKey = publicKey;
    return publicKey;
  }
}

export function createKlixClient(options: KlixClientOptions): KlixClient {
  return new KlixClient(options);
}
