import { PaymentInfo } from "./types";

export async function processPayment(payment: PaymentInfo) {
  if (payment.method === "LOCAL") {
    return {
      success: true,
      message: `Local payment initiated for ${payment.amount} FCFA / local equivalent`
    };
  }

  if (payment.method === "VISA") {
    return {
      success: true,
      message: "Visa / Grey virtual US bank integration placeholder created"
    };
  }

  return {
    success: false,
    message: "Unsupported payment method"
  };
}
