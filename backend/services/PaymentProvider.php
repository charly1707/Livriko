<?php

namespace Livriko\Services;

interface PaymentProvider
{
    /** @return array{providerTransactionId:string,status:string,raw:array} */
    public function requestPayment(string $reference, float $amount, string $currency, string $phone): array;

    /** @return array{providerTransactionId:string,status:string,raw:array} */
    public function getPaymentStatus(string $providerTransactionId): array;
}
