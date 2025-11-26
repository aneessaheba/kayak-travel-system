import React from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaHotel, FaCar, FaTag, FaArrowRight } from 'react-icons/fa';

const DealsSection = () => {
  const deals = [
    {
      id: 1,
      type: 'flight',
      icon: FaPlane,
      title: 'Europe Summer Sale',
      description: 'Save up to 40% on flights to Europe',
      discount: '40% OFF',
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 2,
      type: 'hotel',
      icon: FaHotel,
      title: 'Luxury Hotels',
      description: 'Premium hotels at unbeatable prices',
      discount: '30% OFF',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 3,
      type: 'car',
      icon: FaCar,
      title: 'Weekend Getaways',
      description: 'Car rentals starting from $25/day',
      discount: '25% OFF',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 4,
      type: 'flight',
      icon: FaPlane,
      title: 'Asia Pacific',
      description: 'Explore Asia with amazing deals',
      discount: '35% OFF',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FaTag className="text-kayak-orange text-2xl" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Exclusive Deals
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't miss out on these limited-time offers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal, index) => {
            const Icon = deal.icon;
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute top-4 right-4 bg-gradient-to-br ${deal.color} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                    {deal.discount}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Icon className="text-white text-2xl mb-2" />
                    <h3 className="text-white font-bold text-lg">{deal.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{deal.description}</p>
                  <button className="flex items-center space-x-2 text-kayak-blue font-semibold hover:text-kayak-blue-dark transition-colors group-hover:translate-x-2 duration-300">
                    <span>View Deal</span>
                    <FaArrowRight className="text-sm" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;

