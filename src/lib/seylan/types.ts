// ── Seylan Bank API types (from Web API Manual v1.0) ──

export interface SeylanStatus {
  Transaction_Reference: string;
  Timestamp: string;
  Code: string;
  Message?: string | null;
  Description?: string | null;
}

// ── 1. Internal Transfer ──

export interface FundsTransferRequest {
  Account_category: "INT" | "EXT";
  Source_account_number: string;
  Destination_account_number: string;
  Transaction_amount: string;
  Debit_transaction_code?: string;
  Credit_transaction_code?: string;
  User_reference?: string;
  Source_account_narration_1?: string;
  Source_account_narration_2?: string;
  Source_account_narration_3?: string;
  Destination_account_narration_1?: string;
  Destination_account_narration_2?: string;
  Destination_account_narration_3?: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
  Charges_origination_account?: string;
  Charge_code?: string;
  Charge_amount?: string;
}

export interface FundsTransferResponse {
  FundsTransfer_Response: {
    Status: SeylanStatus;
  };
}

// ── 2. CEFTS Transfer ──

export interface CEFTSTransactionRequest {
  Processing_code: string;
  Transaction_code: string;
  Transaction_amount: string;
  Account_category: "INT" | "EXT";
  Source_account_number: string;
  Source_customer_name: string;
  Destination_account_number: string;
  Destination_bank_code: string;
  Destination_customer_name: string;
  Currency_code: string;
  Reference: string;
  Card_acceptor_terminal_id?: string;
  Card_acceptor_id?: string;
  Terminal_location?: string;
  Channel_type?: string;
  Source_card_number?: string;
  Source_bank_code?: string;
  Source_branch_code?: string;
  Source_wallet_number?: string;
  Destination_card_number?: string;
  Destination_branch_code?: string;
  Destination_wallet_number?: string;
  Particular_details?: string;
  Additional_data?: string;
  Authorized_user?: string;
  Customer_account_narration_1?: string;
  Customer_account_narration_2?: string;
  Customer_account_narration_3?: string;
  Internal_account_narration_1?: string;
  Internal_account_narration_2?: string;
  Internal_account_narration_3?: string;
  Application_type?: string[] | string;
  Input_branch?: string[] | string;
  Input_user?: string[] | string;
  Workstation_id?: string[] | string;
  Posting_batch?: string[] | string;
  Charges_origination_account?: string[] | string;
  Charge_code?: string[] | string;
  Charge_amount?: string[] | string;
  Charges_credit_branch?: string[] | string;
  Charges_narrative_1?: string[] | string;
  Charges_narrative_2?: string[] | string;
  Charges_narrative_3?: string[] | string;
  Existing_hold_amount?: string[] | string;
  Hold_reference?: string[] | string;
}

export interface CEFTSTransactionResponse {
  CEFTSTransactionResponse: {
    Status: SeylanStatus;
    CEFTSTransaction_Detail?: {
      Transaction_Date: string;
      Transaction_id: string;
      Approval_number: string;
      System_trace_audit_number: string;
      Response_code: string;
      Response_code_desc: string;
    };
  };
}

// ── 3. Account Inquiry ──

export interface AccountBalanceResponse {
  Account_Balance_Inquiry: {
    Status: SeylanStatus;
    Account?: Record<string, string | null>;
  };
}

export interface TransactionHistoryResponse {
  TransactionHistoryInquiryResponse: {
    Status: SeylanStatus;
    AccountSummary?: Record<string, string | number | null | object>;
    Transaction?: Array<Record<string, string | null>>;
  };
}

// ── 4. JustPay Acquirer Services ──

export interface JustPayRegisterRequest {
  Justpay_code: string;
  Device_id: string;
  User_id: string;
  NIC_number: string;
  User_name: string;
  Platform: string;
  Mobile_number: string;
  Email_address: string;
  Retrieval_reference?: string;
  Originating_branch_code?: string;
  Destination_bank_code: string;
  Destination_branch_code?: string;
  Account_number: string;
  Account_title: string;
  Currency: string;
  Input_user?: string;
  Input_branch?: string;
  Application_type?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}

export interface JustPayRegisterResponse {
  JustPayRegisterAccount_Response: {
    Status: SeylanStatus;
  };
}

export interface JustPayVerifyResponse {
  JustPayAccountValidation_Response: {
    Status: SeylanStatus;
    Account_token?: string;
    Account_mask?: string;
  };
}

export interface JustPayTransactionRequest {
  Justpay_code: string;
  Device_id: string;
  User_id: string;
  Retrieval_reference?: string;
  NIC_number: string;
  Originating_branch_code?: string;
  Originating_account_number: string;
  Originating_account_name: string;
  Destination_bank_code: string;
  Destination_branch_code?: string;
  Destination_account_number: string;
  Destination_account_name: string;
  Transaction_narration?: string;
  Transaction_amount: string;
  Settlement_act_narration_1?: string;
  Settlement_act_narration_2?: string;
  Settlement_act_narration_3?: string;
  Settlement_act_narration_4?: string;
  Parking_act_narration_1?: string;
  Parking_act_narration_2?: string;
  Parking_act_narration_3?: string;
  Parking_act_narration_4?: string;
  Currency: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}

export interface JustPayTransactionResponse {
  JustPayTransction_Response: {
    Status: SeylanStatus;
    RRN?: string;
    STAN?: string;
    Parking_account_ext?: string | null;
    Parking_account_int?: string | null;
  };
}

export interface JustPayTransactionStatusResponse {
  JustPayTransctionStatus_Response: {
    Status: SeylanStatus;
    Original_transaction_reference?: string;
    RRN?: string;
    STAN?: string;
    Transaction_date?: string;
  };
}

export interface JustPayRefundRequest {
  Justpay_code: string;
  Device_id: string;
  User_id: string;
  Retrieval_reference: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}

export interface JustPayRefundResponse {
  JustPayRefundTransaction_Response: {
    Status: SeylanStatus;
  };
}

// ── 5. LankaQR ──

export interface LankaQRTransactionRequest {
  Justpay_code: string;
  Justpay_user_id: string;
  Device_id: string;
  Institution_id: string;
  Party_id: string;
  Function: string;
  Channel_user_id: string;
  Channel_password: string;
  Payment_mode?: string;
  Retrieval_reference: string;
  Transation_sequence: string;
  QR_payload: string;
  Customer_bank_code: string;
  Customer_branch_code?: string;
  Customer_account: string;
  Customer_name: string;
  Merchant_pan: string;
  Merchant_bank_code: string;
  Merchant_name: string;
  Transaction_ccy: string;
  Transaction_amount: string;
  Tip_indicator?: string;
  Tip_amount?: string;
  Convenience_fee?: string;
  Merchant_catg_code: string;
  Merchant_city: string;
  Country_code: string;
  Postal_code?: string;
  Payment_ref1_code?: string;
  Payment_ref1?: string;
  Payment_ref2_code?: string;
  Payment_ref2?: string;
  Transaction_date: string;
  Transaction_time: string;
  Transaction_desc: string;
  IP_address?: string;
  Session_id?: string;
  Check_value: string;
}

export interface LankaQRTransactionResponse {
  LankaQRTransaction_Response: {
    Status: SeylanStatus;
    Debit_RRN?: string | null;
    Debit_STAN?: string | null;
    Credit_RRN?: string | null;
    Credit_STAN?: string | null;
  };
}

export interface LankaQRStatusResponse {
  LankaQRTransactionStatus: {
    Status: SeylanStatus;
    Original_transaction_reference?: string;
    Transaction_date?: string;
    Transaction_status?: string;
    Debit_RRN?: string | null;
    Debit_STAN?: string | null;
    Credit_RRN?: string | null;
    Credit_STAN?: string | null;
  };
}

// ── 6. Visa/Master QR ──

export interface VMQRTransactionRequest {
  Device_id: string;
  Institution_id: string;
  Party_id: string;
  Function: string;
  Channel_user_id: string;
  Channel_password: string;
  Card_type: "V" | "M";
  Retrieval_reference: string;
  Transation_sequence: string;
  QR_payload: string;
  Customer_card_number: string;
  Customer_name: string;
  Merchant_pan: string;
  Merchant_name: string;
  Transaction_ccy: string;
  Transaction_ccy_num?: string;
  Transaction_amount: string;
  Tip_indicator?: string;
  Tip_amount?: string;
  Convenience_fee?: string;
  Merchant_catg_code: string;
  Merchant_city?: string;
  Country_code?: string;
  Postal_code?: string;
  Transaction_desc: string;
  Payment_ref1_code?: string;
  Payment_ref1?: string;
  Payment_ref2_code?: string;
  Payment_ref2?: string;
  Transaction_date?: string;
  Transaction_time?: string;
  IP_address?: string;
  Session_id?: string;
  Check_value: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}

export interface VMQRTransactionResponse {
  VMQRTransaction_Response: {
    Status: SeylanStatus;
    RRN?: string;
    STAN?: string | null;
  };
}

export interface VMQRStatusResponse {
  VMQRTransactionStatus: {
    Status: SeylanStatus;
    Original_transaction_reference?: string;
    Transaction_status?: string;
    Transaction_date?: string;
    RRN?: string | null;
    STAN?: string | null;
  };
}

// ── 7. QR Merchant API ──

export interface GenerateQRRequest {
  Institution_id: string;
  Channel_user_id: string;
  Channel_pass: string;
  Request_ref_no: string;
  Merchant_login_id: string;
  Merchant_login_pass: string;
  Function: string;
  Device_id?: string;
  Type: "0" | "1";
  Mid: string;
  Tid: string;
  Transaction_amount?: string;
  Transaction_currency?: string;
  Bill_no?: string;
  Mobile_no?: string;
  Store_label?: string;
  Loyalty_number?: string;
  Reference_label?: string;
  Customer_label?: string;
  Terminal_label?: string;
  Purpose_of_transaction?: string;
  Additional_customer_data_request?: string;
  Session_id?: string;
  Ip_address?: string;
  Check_sum: string;
}

export interface GenerateQRResponse {
  GenerateQR_Response: {
    Status: SeylanStatus;
    QR_Information?: {
      Institution_id: string;
      Channel_user_id: string;
      Interchange_list: string[];
      QR_code: string;
      Request_ref_no: string;
      Response_code: string;
      Response_description: string;
      Check_value: string;
      Bank_name: string;
      Bank_name_flag: string;
      Bank_logo_flag: string;
    };
  };
}

export interface TransactionViewRequest {
  Institution_id: string;
  Channel_user_id: string;
  Channel_pass: string;
  Request_ref_no: string;
  Merchant_login_id: string;
  Merchant_login_pass: string;
  Function: string;
  From_date?: string;
  To_date?: string;
  Rrn?: string;
  Mid: string;
  Tid: string;
  Customer_card_no?: string;
  Additional_value_first?: string;
  Additional_value_second?: string;
  Records_per_page_count?: string;
  Page_no?: string;
  Ip_address?: string;
  Check_sum: string;
}

export interface TransactionViewResponse {
  TransactionView_Response: {
    Status: SeylanStatus;
    TransactionView_Information?: {
      Institution_id: string;
      Channel_user_id: string;
      Request_ref_no: string;
      Total_records: string;
      transactionDetails: Array<{
        Retrieval_refernce_no: string;
        Stan: string;
        Merchant_name: string;
        Mid: string;
        Tid: string;
        Transaction_amount: string;
        Transaction_currency: string;
        Transaction_date: string;
        Transaction_description: string;
        Response_code: string;
        Response_description: string;
        [key: string]: string | null | undefined;
      }>;
      Response_code: string;
      Respose_description: string;
      Check_value: string;
    };
  };
}

export interface MerchantRefundRequest {
  Institution_id: string;
  Channel_user_id: string;
  Channel_pass: string;
  Request_ref_no: string;
  Merchant_login_id: string;
  Merchant_login_pass: string;
  Function: string;
  Stan?: string;
  Retrieval_refernce_no: string;
  Refund_amount: string;
  Interchange: string;
  Ip_address?: string;
  Check_sum: string;
}

export interface MerchantRefundResponse {
  MerchantRefund_Response: {
    Status: SeylanStatus;
    MerchantRefund_Information?: {
      Institution_id: string;
      Channel_user_id: string;
      Request_ref_no: string;
      Response_code: string;
      Response_description: string;
      Check_value: string | null;
    };
  };
}
