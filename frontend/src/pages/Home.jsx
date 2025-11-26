import React from 'react';
import Hero from '../components/Hero';
import DealsSection from '../components/DealsSection';
import PopularDestinations from '../components/PopularDestinations';
import { motion } from 'framer-motion';
import { FaPlane, FaHotel, FaCar, FaShieldAlt, FaClock, FaHeadset } from 'react-icons/fa';

const Home = () => {
  const features = [
    {
      icon: FaPlane,
      title: 'Best Flight Deals',
      description: 'Compare prices from hundreds of airlines to find the best deals.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FaHotel,
      title: 'Premium Hotels',
      description: 'Discover amazing hotels with verified reviews and photos.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: FaCar,
      title: 'Car Rentals',
      description: 'Rent a car from trusted providers with flexible cancellation.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: FaShieldAlt,
      title: 'Secure Booking',
      description: 'Your data and payments are protected with industry-leading security.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: FaClock,
      title: '24/7 Support',
      description: 'Get help anytime, anywhere with our round-the-clock customer service.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: FaHeadset,
      title: 'Expert Advice',
      description: 'Get personalized travel recommendations from our AI-powered assistant.',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Deals Section */}
      <DealsSection />

      {/* Popular Destinations */}
      <PopularDestinations />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose KAYAK?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for your perfect trip, all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6 group"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-kayak-blue to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join millions of travelers who trust KAYAK for their travel needs.
            </p>
            <button className="btn-secondary bg-white text-kayak-blue hover:bg-gray-100 text-lg px-8 py-4">
              Get Started Today
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

