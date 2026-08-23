export class MtnMomoProvider {
  constructor(config = {}) {
    this.config = config;
    for (const key of ['api_url', 'subscription_key', 'api_user', 'api_key']) {
      if (!String(config[key] || '').trim()) {
        throw new Error('MTN MoMo n’est pas configuré côté serveur.');
      }
    }
  }

  async requestPayment(reference, amount, currency, phone) {
    const token = await this.requestToken();
    const url = `${this.config.api_url.replace(/\/$/, '')}/v1_0/requesttopay`;
    const response = await this.request('POST', url, {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.config.subscription_key,
      'X-Reference-Id': reference,
      'X-Target-Environment': this.config.target_environment || 'sandbox',
      'Content-Type': 'application/json',
    }, {
      amount: Number(amount).toFixed(2),
      currency,
      externalId: reference,
      payer: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage: 'Paiement Livriko',
      payeeNote: `Commande Livriko ${reference}`,
    });

    if (response.status !== 202) {
      throw new Error('Le fournisseur MTN MoMo a refusé la demande de paiement.');
    }

    return { providerTransactionId: reference, status: 'pending', raw: response.body };
  }

  async getPaymentStatus(providerTransactionId) {
    const token = await this.requestToken();
    const url = `${this.config.api_url.replace(/\/$/, '')}/v1_0/requesttopay/${encodeURIComponent(providerTransactionId)}`;
    const response = await this.request('GET', url, {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.config.subscription_key,
      'X-Target-Environment': this.config.target_environment || 'sandbox',
    });
    const status = String(response.body?.status || 'pending').toLowerCase();
    const mapped = status === 'successful'
      ? 'successful'
      : status === 'failed'
        ? 'failed'
        : ['rejected', 'cancelled'].includes(status)
          ? 'cancelled'
          : 'pending';
    return { providerTransactionId, status: mapped, raw: response.body };
  }

  async requestToken() {
    const basic = Buffer.from(`${this.config.api_user}:${this.config.api_key}`).toString('base64');
    const response = await this.request('POST', `${this.config.api_url.replace(/\/$/, '')}/collection/token/`, {
      Authorization: `Basic ${basic}`,
      'Ocp-Apim-Subscription-Key': this.config.subscription_key,
      'Content-Type': 'application/json',
    }, {});
    const token = response.body?.access_token;
    if (!token) {
      throw new Error('Le fournisseur MTN MoMo n’a pas fourni de jeton.');
    }
    return token;
  }

  async request(method, url, headers, payload = null) {
    const response = await fetch(url, {
      method,
      headers,
      body: payload == null ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    }).catch(() => {
      throw new Error('Fournisseur de paiement indisponible.');
    });

    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    return { status: response.status, body };
  }
}
