// PesaPal payment integration for the MedTech Health app

export interface PaymentDetails {
    amount: number
    description: string
    reference: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  
  // These would be stored in your environment variables in production
  const PESAPAL_CONSUMER_KEY = "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"
  const PESAPAL_CONSUMER_SECRET = "osGQ364R49tXGOzwRF+NHpKrB4c="
  const PESAPAL_API_URL = "https://pay.pesapal.com/v3"
  
  export const initializePayment = async (paymentDetails: PaymentDetails) => {
    try {
      // Step 1: Get authorization token
      const tokenResponse = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          consumer_key: PESAPAL_CONSUMER_KEY,
          consumer_secret: PESAPAL_CONSUMER_SECRET,
        }),
      })
  
      const tokenData = await tokenResponse.json()
  
      if (!tokenData.token) {
        throw new Error("Failed to get authorization token")
      }
  
      // Step 2: Submit order
      const orderResponse = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${tokenData.token}`,
        },
        body: JSON.stringify({
          id: paymentDetails.reference,
          currency: "KES",
          amount: paymentDetails.amount,
          description: paymentDetails.description,
          callback_url: "exp://localhost:8081/--/payment-callback",
          notification_id: "medtech-notification",
          billing_address: {
            email_address: paymentDetails.email,
            phone_number: paymentDetails.phone || "",
            first_name: paymentDetails.firstName,
            last_name: paymentDetails.lastName,
          },
        }),
      })
  
      const orderData = await orderResponse.json()
  
      if (!orderData.redirect_url) {
        throw new Error("Failed to create payment order")
      }
  
      return {
        success: true,
        redirectUrl: orderData.redirect_url,
        orderId: orderData.order_tracking_id,
      }
    } catch (error: any) {
      // Add type annotation here
      console.error("Payment initialization error:", error)
      return {
        success: false,
        error: error.message || "Payment initialization failed",
      }
    }
  }
  
  export const checkPaymentStatus = async (orderId: string) => {
    try {
      // Get token first
      const tokenResponse = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          consumer_key: PESAPAL_CONSUMER_KEY,
          consumer_secret: PESAPAL_CONSUMER_SECRET,
        }),
      })
  
      const tokenData = await tokenResponse.json()
  
      // Check payment status
      const statusResponse = await fetch(
        `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenData.token}`,
          },
        },
      )
  
      const statusData = await statusResponse.json()
  
      return {
        success: true,
        status: statusData.status,
        paymentMethod: statusData.payment_method,
        amount: statusData.amount,
        data: statusData,
      }
    } catch (error: any) {
      // Add type annotation here
      console.error("Payment status check error:", error)
      return {
        success: false,
        error: error.message || "Payment status check failed",
      }
    }
  }
  
  