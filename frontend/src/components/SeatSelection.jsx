import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaPlane } from 'react-icons/fa';

/**
 * SeatSelection — interactive seat map for flight booking.
 * Renders a grid of seats per row, colour-coded by class zone.
 * Calls onConfirm(seatLabel) when the user confirms their pick.
 */
const ROWS = 30;
const COLS = ['A', 'B', 'C', '', 'D', 'E', 'F'];

const zoneClass = (row) => {
  if (row <= 3) return 'first';
  if (row <= 8) return 'business';
  return 'economy';
};

const zoneColour = {
  first:    'bg-yellow-400 hover:bg-yellow-300 text-gray-900',
  business: 'bg-blue-400  hover:bg-blue-300  text-white',
  economy:  'bg-gray-200  hover:bg-gray-100  text-gray-800',
};

const takenColour = 'bg-gray-500 cursor-not-allowed opacity-60';
const selectedColour = 'bg-green-500 text-white ring-2 ring-green-300';

// deterministic "taken" seats so the map looks realistic
const isTaken = (row, col) => (row * 7 + col) % 5 === 0;

const SeatSelection = ({ isOpen, onClose, flightId, onConfirm }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  const colIndex = (col) => COLS.filter(Boolean).indexOf(col);

  const handleSeat = (row, col) => {
    if (isTaken(row, colIndex(col))) return;
    setSelected(`${row}${col}`);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <FaPlane className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Select Your Seat</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-6 pt-4 text-xs flex-wrap">
          {[
            { label: 'First Class',   colour: 'bg-yellow-400' },
            { label: 'Business',      colour: 'bg-blue-400'   },
            { label: 'Economy',       colour: 'bg-gray-200'   },
            { label: 'Taken',         colour: 'bg-gray-500'   },
            { label: 'Selected',      colour: 'bg-green-500'  },
          ].map(({ label, colour }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-4 h-4 rounded ${colour} inline-block`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Column labels */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex gap-1 ml-9">
            {COLS.map((col, i) =>
              col === '' ? (
                <span key={i} className="w-7" />
              ) : (
                <span key={col} className="w-7 text-center text-xs font-semibold text-gray-500">
                  {col}
                </span>
              )
            )}
          </div>
        </div>

        {/* Seat grid */}
        <div className="px-6 pb-4 space-y-1">
          {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => {
            const zone = zoneClass(row);
            return (
              <div key={row} className="flex items-center gap-1">
                <span className="w-7 text-right text-xs text-gray-400 pr-1">{row}</span>
                {COLS.map((col, ci) =>
                  col === '' ? (
                    <span key={ci} className="w-7" />
                  ) : (
                    <button
                      key={col}
                      onClick={() => handleSeat(row, col)}
                      disabled={isTaken(row, colIndex(col))}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        selected === `${row}${col}`
                          ? selectedColour
                          : isTaken(row, colIndex(col))
                          ? takenColour
                          : zoneColour[zone]
                      }`}
                    >
                      {col}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-2xl">
          <span className="text-sm text-gray-600">
            {selected ? (
              <>Selected: <span className="font-semibold text-green-600">Seat {selected}</span></>
            ) : (
              'No seat selected'
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
              Confirm Seat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SeatSelection;
