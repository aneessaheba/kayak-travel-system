const { Kafka } = require('kafkajs');
const BillingModel = require('../models/billingModel');
const { generateBillingId } = require('../utils/idGenerator');
const { publishEvent, buildKafkaConfig } = require('../config/kafka');

const kafka = new Kafka(buildKafkaConfig());

const consumer = kafka.consumer({ 
  groupId: 'billing-service-group' 
});

async function connectConsumer() {
  try {
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    // Subscribe to booking.created topic
    await consumer.subscribe({ 
      topic: 'booking.created',
      fromBeginning: false 
    });

    console.log('✅ Subscribed to topic: booking.created');
  } catch (error) {
    console.error('❌ Kafka consumer connection failed:', error.message);
  }
}

async function startConsumer() {
  await connectConsumer();

  // Process incoming messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // Parse message
        const event = JSON.parse(message.value.toString());
        console.log('📥 Received event from topic:', topic);
        console.log('Event data:', event);

        // Handle booking.created event
        await handleBookingCreated(event);

      } catch (error) {
        console.error('❌ Error processing message:', error.message);
      }
    }
  });
}

async function handleBookingCreated(event) {
  try {
    const {
      booking_id,
      user_id,
      booking_type,
      total_amount,
      payment_method = 'credit_card'
    } = event;

    // Validate required fields
    if (!booking_id || !user_id || !booking_type || !total_amount) {
      console.error('❌ Missing required fields in event:', event);
      return;
    }

    // Check if billing already exists for this booking
    const existingBilling = await BillingModel.getBillingByBookingId(booking_id);
    if (existingBilling) {
      console.log('⚠️  Billing already exists for booking:', booking_id);
      return;
    }

    // Generate billing ID
    const billing_id = generateBillingId();

    console.log('💳 Processing payment for booking:', booking_id);

    // TODO: Call actual payment gateway here (Stripe/PayPal)
    // For now, simulate payment processing
    const paymentSuccess = await processPayment({
      amount: total_amount,
      payment_method,
      user_id
    });

    // Create billing record
    const billingData = {
      billing_id,
      user_id,
      booking_type,
      booking_id,
      total_amount,
      payment_method,
      transaction_status: paymentSuccess ? 'completed' : 'failed'
    };

    await BillingModel.createBilling(billingData);
    console.log('✅ Billing created:', billing_id);

    // Publish payment result to Kafka
    await publishEvent('payment.processed', {
      billing_id,
      booking_id,
      user_id,
      amount: total_amount,
      status: billingData.transaction_status,
      booking_type,
      timestamp: new Date().toISOString()
    });

    console.log('📤 Published payment.processed event');

  } catch (error) {
    console.error('❌ Error handling booking.created:', error.message);
    
    // Publish payment failed event
    try {
      await publishEvent('payment.failed', {
        booking_id: event.booking_id,
        user_id: event.user_id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (publishError) {
      console.error('❌ Failed to publish payment.failed event:', publishError.message);
    }
  }
}

// Mock payment processing function
async function processPayment(paymentData) {
  // Simulate payment gateway call
  console.log('Processing payment:', paymentData);
  
  // Simulate delay (payment gateway response time)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock success (90% success rate for testing)
  return Math.random() > 0.1;
}

async function disconnectConsumer() {
  await consumer.disconnect();
  console.log('Kafka consumer disconnected');
}

module.exports = {
  startConsumer,
  disconnectConsumer
};
