import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaHotel, FaCheck, FaBed, FaUsers } from 'react-icons/fa';

/**
 * RoomSelection — displays the available room types for a hotel
 * and lets the user pick one before proceeding to checkout.
 * Calls onConfirm(room) with the selected room object.
 */

const TYPE_ICONS = {
  Single:      '🛏️',
  Double:      '🛏️🛏️',
  Suite:       '🏨',
  Deluxe:      '⭐',
  Presidential:'👑',
};

const RoomSelection = ({ isOpen, onClose, hotel, onConfirm }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen || !hotel) return null;

  const rooms = hotel.rooms || hotel.roomTypes || [];

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <FaHotel className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">Select a Room</h2>
              <p className="text-xs text-gray-500">{hotel.hotelName || hotel.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Room list */}
        <div className="p-5 space-y-3">
          {rooms.length === 0 && (
            <p className="text-center text-gray-500 py-8">No rooms available</p>
          )}
          {rooms.map((room, idx) => {
            const isSelected = selected?.type === room.type && selected?._idx === idx;
            const available = room.availableRooms ?? room.availability ?? 0;
            return (
              <button
                key={idx}
                onClick={() => setSelected({ ...room, _idx: idx })}
                disabled={available === 0}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : available === 0
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{TYPE_ICONS[room.type] || '🛏️'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{room.type}</span>
                        {isSelected && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheck size={10} /> Selected
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {room.maxOccupancy && (
                          <span className="flex items-center gap-1">
                            <FaUsers size={10} /> Up to {room.maxOccupancy} guests
                          </span>
                        )}
                        {room.bedType && (
                          <span className="flex items-center gap-1">
                            <FaBed size={10} /> {room.bedType}
                          </span>
                        )}
                      </div>
                      {room.amenities?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {room.amenities.slice(0, 4).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-blue-600">
                      ${room.pricePerNight ?? room.price ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">per night</p>
                    <p className={`text-xs mt-1 ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {available > 0 ? `${available} left` : 'Sold out'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-2xl">
          <span className="text-sm text-gray-600">
            {selected ? (
              <>
                Selected: <span className="font-semibold text-blue-600">{selected.type}</span>
                {' — '}
                <span className="font-semibold">${selected.pricePerNight ?? selected.price ?? 0}/night</span>
              </>
            ) : (
              'No room selected'
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50 hover:bg-blue-700"
            >
              Confirm Room
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomSelection;
