package com.finance.manager.transaction_service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum DebitCreditIndicator {
    DEBIT("DR"),
    CREDIT("CR");

    @Getter
    private final String name;
}
