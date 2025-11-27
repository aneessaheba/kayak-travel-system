const { Kafka } = require('kafkajs');
const BillingModel = require('../models/billingModel');
const BookingModel = require('../models/bookingModel');
const { generateBillingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 8
  }
});

const consumer = kafka.consumer({ 
  groupId: 'billing-service-group' 
});

let isConnected = false;

async function connectConsumer() {
  try {
    console.log('Connecting Kafka consumer...');
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    await consumer.subscribe({ 
      topic: 'booking.created',
      fromBeginning: false 
    });

    console.log('✅ Subscribed to topic: booking.created');
    isConnected = true;
  } catch (error) {
    console.error('❌ Kafka consumer connection failed:', error.message);
    console.log('⚠️  Consumer will not be available');
    isConnected = false;
  }
}

async function startConsumer() {
  await connectConsumer();

  if (!isConnected) {
    console.log('⚠️  Skipping consumer - Kafka not available');
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log('📥 Received event from topic:', topic);
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

    if (!booking_id || !user_id || !booking_type || !total_amount) {
      console.error('❌ Missing required fields in event');
      return;
    }

    // Check if billing already exists
    const existingBilling = await BillingModel.getBillingByBookingId(booking_id);
    if (existingBilling) {
      console.log('⚠️  Billing already exists for booking:', booking_id);
      return;
    }

    const billing_id = generateBillingId();
    console.log('💳 Processing payment for booking:', booking_id);

    // Process payment
    const paymentSuccess = await processPayment({
      amount: total_amount,
      payment_method,
      user_id
    });

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

    // Update booking status to confirmed if payment successful
    if (paymentSuccess) {
      await BookingModel.updateBookingStatus(booking_id, 'confirmed');
      console.log('✅ Booking confirmed:', booking_id);
    }

    // Publish payment result
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
  }
}

// Mock payment processing
async function processPayment(paymentData) {
  console.log('Processing payment:', paymentData);
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.random() > 0.05; // 95% success rate
}

async function disconnectConsumer() {
  if (isConnected) {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting consumer:', error.message);
    }
  }
}

// IMPORTANT: Export functions
module.exports = {
  startConsumer,
  disconnectConsumer
};