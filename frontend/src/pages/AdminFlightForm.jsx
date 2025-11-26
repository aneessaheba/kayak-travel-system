import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlane, FaArrowLeft, FaSave } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { flightAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminFlightForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    flightId: '',
    airline: '',
    departureAirport: {
      code: '',
      name: '',
      city: '',
      country: 'USA'
    },
    arrivalAirport: {
      code: '',
      name: '',
      city: '',
      country: 'USA'
    },
    departureDateTime: '',
    arrivalDateTime: '',
    duration: {
      hours: 0,
      minutes: 0
    },
    flightClass: 'Economy',
    ticketPrice: 0,
    totalAvailableSeats: 0,
    availableSeats: 0,
    // Return flight fields (always required)
    returnFlightId: '',
    returnDepartureDateTime: '',
    returnArrivalDateTime: '',
    returnDuration: {
      hours: 0,
      minutes: 0
    },
    returnTicketPrice: 0,
    returnFlightClass: 'Economy',
    returnTotalAvailableSeats: 0,
    returnAvailableSeats: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchFlight();
    }
  }, [id]);

  // Auto-calculate duration based on departure and arrival times
  useEffect(() => {
    if (formData.departureDateTime && formData.arrivalDateTime) {
      const departure = new Date(formData.departureDateTime);
      const arrival = new Date(formData.arrivalDateTime);
      if (arrival > departure) {
        const diffMs = arrival - departure;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place
        setFormData(prev => ({
          ...prev,
          duration: { ...prev.duration, hours: diffHours, minutes: 0 }
        }));
      }
    }
  }, [formData.departureDateTime, formData.arrivalDateTime]);

  // Auto-calculate return duration based on return departure and arrival times
  useEffect(() => {
    if (formData.returnDepartureDateTime && formData.returnArrivalDateTime) {
      const returnDeparture = new Date(formData.returnDepartureDateTime);
      const returnArrival = new Date(formData.returnArrivalDateTime);
      if (returnArrival > returnDeparture) {
        const diffMs = returnArrival - returnDeparture;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place
        setFormData(prev => ({
          ...prev,
          returnDuration: { ...prev.returnDuration, hours: diffHours, minutes: 0 }
        }));
      }
    }
  }, [formData.returnDepartureDateTime, formData.returnArrivalDateTime]);

  const fetchFlight = async () => {
    try {
      setFetching(true);
      const response = await flightAPI.getFlight(id);
      if (response.data.success) {
        const flight = response.data.data;
        
        setFormData({
          flightId: flight.flightId || '',
          airline: flight.airline || '',
          departureAirport: flight.departureAirport || { code: '', name: '', city: '', country: 'USA' },
          arrivalAirport: flight.arrivalAirport || { code: '', name: '', city: '', country: 'USA' },
          departureDateTime: flight.departureDateTime ? new Date(flight.departureDateTime).toISOString().slice(0, 16) : '',
          arrivalDateTime: flight.arrivalDateTime ? new Date(flight.arrivalDateTime).toISOString().slice(0, 16) : '',
          duration: flight.duration || { hours: 0, minutes: 0 },
          flightClass: flight.flightClass || 'Economy',
          ticketPrice: flight.ticketPrice || flight.fare || 0,
          totalAvailableSeats: flight.totalAvailableSeats || 0,
          availableSeats: flight.availableSeats || 0,
          // Return flight fields (always required)
          returnFlightId: flight.returnFlightId || '',
          returnDepartureDateTime: flight.returnDepartureDateTime ? new Date(flight.returnDepartureDateTime).toISOString().slice(0, 16) : '',
          returnArrivalDateTime: flight.returnArrivalDateTime ? new Date(flight.returnArrivalDateTime).toISOString().slice(0, 16) : '',
          returnDuration: flight.returnDuration || { hours: 0, minutes: 0 },
          returnTicketPrice: flight.returnTicketPrice || 0,
          returnFlightClass: flight.returnFlightClass || 'Economy',
          returnTotalAvailableSeats: flight.returnTotalAvailableSeats || 0,
          returnAvailableSeats: flight.returnAvailableSeats || 0,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch flight details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('departureAirport.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        departureAirport: { ...prev.departureAirport, [field]: value }
      }));
    } else if (name.startsWith('arrivalAirport.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        arrivalAirport: { ...prev.arrivalAirport, [field]: value }
      }));
    } else if (name.startsWith('duration.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        duration: { ...prev.duration, [field]: parseInt(value) || 0 }
      }));
    } else if (name.startsWith('returnDuration.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        returnDuration: { ...prev.returnDuration, [field]: parseInt(value) || 0 }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.flightId) newErrors.flightId = 'Flight ID is required';
    if (!formData.airline) newErrors.airline = 'Airline is required';
    if (!formData.departureAirport.code) newErrors['departureAirport.code'] = 'Departure airport code is required';
    if (!formData.arrivalAirport.code) newErrors['arrivalAirport.code'] = 'Arrival airport code is required';
    if (!formData.departureDateTime) newErrors.departureDateTime = 'Departure date/time is required';
    if (!formData.arrivalDateTime) newErrors.arrivalDateTime = 'Arrival date/time is required';
    if (formData.ticketPrice <= 0) newErrors.ticketPrice = 'Ticket price must be greater than 0';
    if (formData.totalAvailableSeats <= 0) newErrors.totalAvailableSeats = 'Total seats must be greater than 0';
    if (formData.availableSeats > formData.totalAvailableSeats) {
      newErrors.availableSeats = 'Available seats cannot exceed total seats';
    }
    
    // Validate return flight fields (always required)
    if (!formData.returnFlightId) newErrors.returnFlightId = 'Return flight ID is required';
    if (!formData.returnDepartureDateTime) newErrors.returnDepartureDateTime = 'Return departure date/time is required';
    if (!formData.returnArrivalDateTime) newErrors.returnArrivalDateTime = 'Return arrival date/time is required';
    if (formData.returnTicketPrice <= 0) newErrors.returnTicketPrice = 'Return ticket price must be greater than 0';
    if (formData.returnTotalAvailableSeats <= 0) newErrors.returnTotalAvailableSeats = 'Return total seats must be greater than 0';
    if (formData.returnAvailableSeats > formData.returnTotalAvailableSeats) {
      newErrors.returnAvailableSeats = 'Return available seats cannot exceed total seats';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get form values directly from DOM as fallback (in case React state isn't updated)
    const getFormValue = (name) => {
      const input = document.querySelector(`input[name="${name}"], select[name="${name}"]`);
      return input ? input.value : formData[name];
    };
    
    // Update formData with current DOM values to ensure we have the latest data
    // Read ALL fields from DOM to ensure we capture the latest values
    const currentFormData = {
      ...formData,
      // Main flight fields
      flightId: getFormValue('flightId') || formData.flightId,
      airline: getFormValue('airline') || formData.airline,
      departureDateTime: getFormValue('departureDateTime') || formData.departureDateTime,
      arrivalDateTime: getFormValue('arrivalDateTime') || formData.arrivalDateTime,
      ticketPrice: getFormValue('ticketPrice') || formData.ticketPrice,
      totalAvailableSeats: getFormValue('totalAvailableSeats') || formData.totalAvailableSeats,
      availableSeats: getFormValue('availableSeats') || formData.availableSeats,
      flightClass: getFormValue('flightClass') || formData.flightClass,
      // Departure airport fields
      departureAirport: {
        code: getFormValue('departureAirport.code') || formData.departureAirport?.code,
        name: getFormValue('departureAirport.name') || formData.departureAirport?.name,
        city: getFormValue('departureAirport.city') || formData.departureAirport?.city,
        country: getFormValue('departureAirport.country') || formData.departureAirport?.country,
      },
      // Arrival airport fields
      arrivalAirport: {
        code: getFormValue('arrivalAirport.code') || formData.arrivalAirport?.code,
        name: getFormValue('arrivalAirport.name') || formData.arrivalAirport?.name,
        city: getFormValue('arrivalAirport.city') || formData.arrivalAirport?.city,
        country: getFormValue('arrivalAirport.country') || formData.arrivalAirport?.country,
      },
      // Return flight fields
      returnFlightId: getFormValue('returnFlightId') || formData.returnFlightId,
      returnDepartureDateTime: getFormValue('returnDepartureDateTime') || formData.returnDepartureDateTime,
      returnArrivalDateTime: getFormValue('returnArrivalDateTime') || formData.returnArrivalDateTime,
      returnTicketPrice: getFormValue('returnTicketPrice') || formData.returnTicketPrice,
      returnFlightClass: getFormValue('returnFlightClass') || formData.returnFlightClass,
      returnTotalAvailableSeats: getFormValue('returnTotalAvailableSeats') || formData.returnTotalAvailableSeats,
      returnAvailableSeats: getFormValue('returnAvailableSeats') || formData.returnAvailableSeats,
    };
    
    // Initialize duration if not present
    if (!currentFormData.duration) {
      currentFormData.duration = { hours: 0, minutes: 0 };
    }
    if (!currentFormData.returnDuration) {
      currentFormData.returnDuration = { hours: 0, minutes: 0 };
    }
    
    // Calculate duration hours if dates are present but duration is 0 or missing
    if (currentFormData.departureDateTime && currentFormData.arrivalDateTime) {
      const departure = new Date(currentFormData.departureDateTime);
      const arrival = new Date(currentFormData.arrivalDateTime);
      if (arrival > departure && (!currentFormData.duration.hours || currentFormData.duration.hours === 0)) {
        const diffMs = arrival - departure;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        currentFormData.duration = {
          hours: diffHours,
          minutes: 0
        };
      }
    }
    
    // Calculate return duration hours if dates are present but duration is 0 or missing
    if (currentFormData.returnDepartureDateTime && currentFormData.returnArrivalDateTime) {
      const returnDeparture = new Date(currentFormData.returnDepartureDateTime);
      const returnArrival = new Date(currentFormData.returnArrivalDateTime);
      if (returnArrival > returnDeparture && (!currentFormData.returnDuration.hours || currentFormData.returnDuration.hours === 0)) {
        const diffMs = returnArrival - returnDeparture;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        currentFormData.returnDuration = {
          hours: diffHours,
          minutes: 0
        };
      }
    }
    
    // Also get duration hours from DOM as fallback (check DOM first, then use calculated)
    const durationHoursInput = document.querySelector('input[name="duration.hours"]');
    if (durationHoursInput && durationHoursInput.value && parseFloat(durationHoursInput.value) > 0) {
      currentFormData.duration = {
        hours: parseFloat(durationHoursInput.value),
        minutes: 0
      };
    }
    
    // CRITICAL: Calculate return duration from dates if not already calculated
    // This must happen BEFORE validation to ensure returnDuration.hours > 0
    if (currentFormData.returnDepartureDateTime && currentFormData.returnArrivalDateTime) {
      const returnDeparture = new Date(currentFormData.returnDepartureDateTime);
      const returnArrival = new Date(currentFormData.returnArrivalDateTime);
      if (returnArrival > returnDeparture) {
        const diffMs = returnArrival - returnDeparture;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        if (diffHours > 0) {
          currentFormData.returnDuration = { hours: diffHours, minutes: 0 };
          // Also update the DOM input to ensure it's visible
          const returnDurationHoursInput = document.querySelector('input[name="returnDuration.hours"]');
          if (returnDurationHoursInput) {
            returnDurationHoursInput.value = diffHours.toString();
          }
        }
      }
    }
    
    // Also check DOM for return duration (in case it was auto-calculated by React)
    const returnDurationHoursInput = document.querySelector('input[name="returnDuration.hours"]');
    if (returnDurationHoursInput && returnDurationHoursInput.value && parseFloat(returnDurationHoursInput.value) > 0) {
      const domDuration = parseFloat(returnDurationHoursInput.value);
      if (domDuration > 0) {
        currentFormData.returnDuration = {
          hours: domDuration,
          minutes: 0
        };
      }
    }
    
    // Final check: ensure outbound duration is set (if still 0, recalculate from dates)
    if (currentFormData.departureDateTime && currentFormData.arrivalDateTime && (!currentFormData.duration.hours || currentFormData.duration.hours === 0)) {
      const departure = new Date(currentFormData.departureDateTime);
      const arrival = new Date(currentFormData.arrivalDateTime);
      if (arrival > departure) {
        const diffMs = arrival - departure;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        currentFormData.duration = { hours: diffHours, minutes: 0 };
      }
    }
    
    // Final check: ensure return duration is set (if still 0, recalculate from dates)
    // This is a safety check in case the above didn't work
    if (currentFormData.returnDepartureDateTime && currentFormData.returnArrivalDateTime && (!currentFormData.returnDuration || !currentFormData.returnDuration.hours || currentFormData.returnDuration.hours === 0)) {
      const returnDeparture = new Date(currentFormData.returnDepartureDateTime);
      const returnArrival = new Date(currentFormData.returnArrivalDateTime);
      if (returnArrival > returnDeparture) {
        const diffMs = returnArrival - returnDeparture;
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        if (diffHours > 0) {
          currentFormData.returnDuration = { hours: diffHours, minutes: 0 };
        }
      }
    }
    
    // Validate with current form data
    const validateWithData = (data) => {
      const newErrors = {};
      if (!data.flightId) newErrors.flightId = 'Flight ID is required';
      if (!data.airline) newErrors.airline = 'Airline is required';
      if (!data.departureAirport?.code) newErrors['departureAirport.code'] = 'Departure airport code is required';
      if (!data.arrivalAirport?.code) newErrors['arrivalAirport.code'] = 'Arrival airport code is required';
      if (!data.departureDateTime) newErrors.departureDateTime = 'Departure date/time is required';
      if (!data.arrivalDateTime) newErrors.arrivalDateTime = 'Arrival date/time is required';
      if (data.ticketPrice <= 0) newErrors.ticketPrice = 'Ticket price must be greater than 0';
      if (data.totalAvailableSeats <= 0) newErrors.totalAvailableSeats = 'Total seats must be greater than 0';
      if (data.availableSeats > data.totalAvailableSeats) {
        newErrors.availableSeats = 'Available seats cannot exceed total seats';
      }
      
      // Validate return flight fields (always required)
      // Check for null, undefined, empty string, or 0 values
      if (!data.returnFlightId || data.returnFlightId.trim() === '') {
        newErrors.returnFlightId = 'Return flight ID is required';
      }
      if (!data.returnDepartureDateTime || data.returnDepartureDateTime === null) {
        newErrors.returnDepartureDateTime = 'Return departure date/time is required';
      }
      if (!data.returnArrivalDateTime || data.returnArrivalDateTime === null) {
        newErrors.returnArrivalDateTime = 'Return arrival date/time is required';
      }
      if (!data.returnDuration || !data.returnDuration.hours || data.returnDuration.hours <= 0) {
        newErrors.returnDuration = 'Return duration must be greater than 0';
      }
      if (parseFloat(data.returnTicketPrice) <= 0) {
        newErrors.returnTicketPrice = 'Return ticket price must be greater than 0';
      }
      if (parseInt(data.returnTotalAvailableSeats) <= 0) {
        newErrors.returnTotalAvailableSeats = 'Return total seats must be greater than 0';
      }
      if (parseInt(data.returnAvailableSeats) <= 0) {
        newErrors.returnAvailableSeats = 'Return available seats must be greater than 0';
      }
      if (parseInt(data.returnAvailableSeats) > parseInt(data.returnTotalAvailableSeats)) {
        newErrors.returnAvailableSeats = 'Return available seats cannot exceed total seats';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    if (!validateWithData(currentFormData)) return;

    try {
      setLoading(true);
      
      // Build submit data explicitly to avoid issues with nested objects
      // CRITICAL: Read return fields from DOM first, then fall back to formData
      // This ensures we capture values set programmatically
      const returnFlightIdValue = getFormValue('returnFlightId') || currentFormData.returnFlightId || '';
      const returnDepDateTimeValue = getFormValue('returnDepartureDateTime') || currentFormData.returnDepartureDateTime || '';
      const returnArrDateTimeValue = getFormValue('returnArrivalDateTime') || currentFormData.returnArrivalDateTime || '';
      // For duration, check DOM first, then use calculated value from currentFormData
      const returnDurationHoursFromDOM = getFormValue('returnDuration.hours');
      const returnDurationHoursValue = returnDurationHoursFromDOM ? parseFloat(returnDurationHoursFromDOM) : (currentFormData.returnDuration?.hours || 0);
      const returnTicketPriceValue = getFormValue('returnTicketPrice') || currentFormData.returnTicketPrice || 0;
      const returnFlightClassValue = getFormValue('returnFlightClass') || currentFormData.returnFlightClass || 'Economy';
      const returnTotalSeatsValue = getFormValue('returnTotalAvailableSeats') || currentFormData.returnTotalAvailableSeats || 0;
      const returnAvailableSeatsValue = getFormValue('returnAvailableSeats') || currentFormData.returnAvailableSeats || 0;
      
      const submitData = {
        flightId: currentFormData.flightId,
        airline: currentFormData.airline,
        departureAirport: currentFormData.departureAirport,
        arrivalAirport: currentFormData.arrivalAirport,
        departureDateTime: new Date(currentFormData.departureDateTime),
        arrivalDateTime: new Date(currentFormData.arrivalDateTime),
        duration: {
          hours: currentFormData.duration.hours,
          minutes: 0 // Always set minutes to 0 as per UI removal
        },
        flightClass: currentFormData.flightClass,
        ticketPrice: parseFloat(currentFormData.ticketPrice),
        totalAvailableSeats: parseInt(currentFormData.totalAvailableSeats),
        availableSeats: parseInt(currentFormData.availableSeats),
        // Return flight fields (always required)
        // NEVER set return fields to undefined - use empty string or null so validation can catch them
        // But if we have valid values, use them
        returnFlightId: String(returnFlightIdValue).trim() || '',
        returnDepartureDateTime: returnDepDateTimeValue && returnDepDateTimeValue.trim() ? new Date(returnDepDateTimeValue) : null,
        returnArrivalDateTime: returnArrDateTimeValue && returnArrDateTimeValue.trim() ? new Date(returnArrDateTimeValue) : null,
        returnDuration: {
          hours: returnDurationHoursValue > 0 ? returnDurationHoursValue : 0,
          minutes: 0 // Always set minutes to 0 as per UI removal
        },
        returnTicketPrice: parseFloat(returnTicketPriceValue) || 0,
        returnFlightClass: returnFlightClassValue || 'Economy',
        returnTotalAvailableSeats: parseInt(returnTotalSeatsValue) || 0,
        returnAvailableSeats: parseInt(returnAvailableSeatsValue) || 0,
      };
      
      // Remove undefined and empty string values to ensure clean data
      // But NEVER remove return fields - they are required
      Object.keys(submitData).forEach(key => {
        // Never delete return flight fields - they are always required
        if (key.startsWith('return')) {
          return; // Skip return fields
        }
        if (submitData[key] === undefined || submitData[key] === '') {
          delete submitData[key];
        }
      });
      
      // Ensure return fields are properly set (don't convert to undefined - let validation catch empty values)
      // If return fields are missing, log an error for debugging
      if (!submitData.returnFlightId || !submitData.returnDepartureDateTime || !submitData.returnArrivalDateTime) {
        console.error('Missing return flight fields in submitData:', {
          returnFlightId: submitData.returnFlightId,
          returnDepartureDateTime: submitData.returnDepartureDateTime,
          returnArrivalDateTime: submitData.returnArrivalDateTime,
          returnDuration: submitData.returnDuration,
          returnTicketPrice: submitData.returnTicketPrice
        });
      }
      
      // Debug: Log the data being sent BEFORE validation
      console.log('Submitting flight data:', JSON.stringify(submitData, null, 2));
      console.log('Return duration:', submitData.returnDuration);
      console.log('Return duration hours:', submitData.returnDuration?.hours);
      
      // Validate return fields are not empty before submission
      const returnFields = [
        'returnFlightId',
        'returnDepartureDateTime',
        'returnArrivalDateTime',
        'returnDuration',
        'returnTicketPrice',
        'returnFlightClass',
        'returnTotalAvailableSeats',
        'returnAvailableSeats'
      ];
      
      const emptyReturnFields = returnFields.filter(field => {
        if (field === 'returnDuration') {
          // Check if returnDuration exists and has hours > 0
          return !submitData.returnDuration || !submitData.returnDuration.hours || submitData.returnDuration.hours === 0;
        }
        const value = submitData[field];
        // Check for null, undefined, empty string, or 0 for numeric fields
        if (value === null || value === undefined || value === '') {
          return true; // Field is empty
        }
        // For numeric fields, check if they're 0 (which is invalid)
        if ((field === 'returnTicketPrice' || field === 'returnTotalAvailableSeats' || field === 'returnAvailableSeats') && value === 0) {
          return true; // Numeric field is 0, which is invalid
        }
        return false; // Field has a valid value
      });
      
      if (emptyReturnFields.length > 0) {
        console.error('❌ Empty return flight fields:', emptyReturnFields);
        console.error('Submit data:', JSON.stringify(submitData, null, 2));
        console.error('Submit data return fields:', {
          returnFlightId: submitData.returnFlightId,
          returnDepartureDateTime: submitData.returnDepartureDateTime,
          returnArrivalDateTime: submitData.returnArrivalDateTime,
          returnDuration: submitData.returnDuration,
          returnTicketPrice: submitData.returnTicketPrice,
          returnFlightClass: submitData.returnFlightClass,
          returnTotalAvailableSeats: submitData.returnTotalAvailableSeats,
          returnAvailableSeats: submitData.returnAvailableSeats
        });
        toast.error(`Please fill in all return flight fields: ${emptyReturnFields.join(', ')}`);
        setLoading(false);
        return;
      }

      if (isEdit) {
        const response = await flightAPI.updateFlight(id, submitData);
        console.log('Update response:', response.data);
        // Verify return fields were saved
        if (response.data?.data) {
          const updatedFlight = response.data.data;
          console.log('Updated flight return fields:', {
            returnFlightId: updatedFlight.returnFlightId,
            returnDepartureDateTime: updatedFlight.returnDepartureDateTime,
            returnTicketPrice: updatedFlight.returnTicketPrice
          });
          if (!updatedFlight.returnFlightId || !updatedFlight.returnDepartureDateTime) {
            console.error('WARNING: Return fields not saved in update response!');
            toast.error('Return flight fields were not saved. Please check the console for details.');
            setLoading(false);
            return;
          }
        }
        toast.success('Flight updated successfully');
      } else {
        await flightAPI.createFlight(submitData);
        toast.success('Flight created successfully');
      }
      navigate('/admin/flights');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save flight');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/flights')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Edit Flight' : 'Add New Flight'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Flight ID & Airline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Flight ID *</label>
              <input
                type="text"
                name="flightId"
                value={formData.flightId}
                onChange={handleChange}
                className={`input-field ${errors.flightId ? 'border-red-500' : ''}`}
                placeholder="AA1234"
                disabled={isEdit}
              />
              {errors.flightId && <p className="mt-1 text-sm text-red-500">{errors.flightId}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Airline *</label>
              <input
                type="text"
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                className={`input-field ${errors.airline ? 'border-red-500' : ''}`}
                placeholder="American Airlines"
              />
              {errors.airline && <p className="mt-1 text-sm text-red-500">{errors.airline}</p>}
            </div>
          </div>

          {/* Departure Airport */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Departure Airport *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  name="departureAirport.code"
                  value={formData.departureAirport.code}
                  onChange={handleChange}
                  className={`input-field ${errors['departureAirport.code'] ? 'border-red-500' : ''}`}
                  placeholder="JFK"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="departureAirport.name"
                  value={formData.departureAirport.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John F. Kennedy International"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="departureAirport.city"
                  value={formData.departureAirport.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="departureAirport.country"
                  value={formData.departureAirport.country}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          {/* Arrival Airport */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Arrival Airport *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  name="arrivalAirport.code"
                  value={formData.arrivalAirport.code}
                  onChange={handleChange}
                  className={`input-field ${errors['arrivalAirport.code'] ? 'border-red-500' : ''}`}
                  placeholder="LAX"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="arrivalAirport.name"
                  value={formData.arrivalAirport.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Los Angeles International"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="arrivalAirport.city"
                  value={formData.arrivalAirport.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Los Angeles"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="arrivalAirport.country"
                  value={formData.arrivalAirport.country}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Departure Date & Time *</label>
              <input
                type="datetime-local"
                name="departureDateTime"
                value={formData.departureDateTime}
                onChange={handleChange}
                className={`input-field ${errors.departureDateTime ? 'border-red-500' : ''}`}
              />
              {errors.departureDateTime && <p className="mt-1 text-sm text-red-500">{errors.departureDateTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Arrival Date & Time *</label>
              <input
                type="datetime-local"
                name="arrivalDateTime"
                value={formData.arrivalDateTime}
                onChange={handleChange}
                className={`input-field ${errors.arrivalDateTime ? 'border-red-500' : ''}`}
              />
              {errors.arrivalDateTime && <p className="mt-1 text-sm text-red-500">{errors.arrivalDateTime}</p>}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Hours) - Auto-calculated</label>
            <input
              type="number"
              name="duration.hours"
              value={formData.duration.hours}
              onChange={handleChange}
              className="input-field bg-gray-50"
              min="0"
              max="24"
              step="0.1"
              readOnly
              title="Automatically calculated from departure and arrival times"
            />
          </div>

          {/* Flight Class & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Class</label>
              <select
                name="flightClass"
                value={formData.flightClass}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
                <option value="First">First</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Price ($) *</label>
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                className={`input-field ${errors.ticketPrice ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
              />
              {errors.ticketPrice && <p className="mt-1 text-sm text-red-500">{errors.ticketPrice}</p>}
            </div>
          </div>

          {/* Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Available Seats *</label>
              <input
                type="number"
                name="totalAvailableSeats"
                value={formData.totalAvailableSeats}
                onChange={handleChange}
                className={`input-field ${errors.totalAvailableSeats ? 'border-red-500' : ''}`}
                min="1"
              />
              {errors.totalAvailableSeats && <p className="mt-1 text-sm text-red-500">{errors.totalAvailableSeats}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Available Seats *</label>
              <input
                type="number"
                name="availableSeats"
                value={formData.availableSeats}
                onChange={handleChange}
                className={`input-field ${errors.availableSeats ? 'border-red-500' : ''}`}
                min="0"
                max={formData.totalAvailableSeats}
              />
              {errors.availableSeats && <p className="mt-1 text-sm text-red-500">{errors.availableSeats}</p>}
            </div>
          </div>

          {/* Return Flight Section (Always Required) */}
          <div className="border-t pt-6 mt-6">
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Flight Details *</h3>
                
                {/* Return Flight ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Return Flight ID *</label>
                  <input
                    type="text"
                    name="returnFlightId"
                    value={formData.returnFlightId}
                    onChange={handleChange}
                    className={`input-field ${errors.returnFlightId ? 'border-red-500' : ''}`}
                    placeholder="AA5678"
                  />
                  {errors.returnFlightId && <p className="mt-1 text-sm text-red-500">{errors.returnFlightId}</p>}
                </div>

                {/* Return Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Departure Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="returnDepartureDateTime"
                      value={formData.returnDepartureDateTime}
                      onChange={handleChange}
                      className={`input-field ${errors.returnDepartureDateTime ? 'border-red-500' : ''}`}
                    />
                    {errors.returnDepartureDateTime && <p className="mt-1 text-sm text-red-500">{errors.returnDepartureDateTime}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Arrival Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="returnArrivalDateTime"
                      value={formData.returnArrivalDateTime}
                      onChange={handleChange}
                      className={`input-field ${errors.returnArrivalDateTime ? 'border-red-500' : ''}`}
                    />
                    {errors.returnArrivalDateTime && <p className="mt-1 text-sm text-red-500">{errors.returnArrivalDateTime}</p>}
                  </div>
                </div>

                {/* Return Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Return Duration (Hours) - Auto-calculated</label>
                  <input
                    type="number"
                    name="returnDuration.hours"
                    value={formData.returnDuration.hours}
                    onChange={handleChange}
                    className="input-field bg-gray-50"
                    min="0"
                    max="24"
                    step="0.1"
                    readOnly
                    title="Automatically calculated from return departure and arrival times"
                  />
                </div>

                {/* Return Flight Class & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Flight Class</label>
                    <select
                      name="returnFlightClass"
                      value={formData.returnFlightClass}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Business">Business</option>
                      <option value="First">First</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Ticket Price ($) *</label>
                    <input
                      type="number"
                      name="returnTicketPrice"
                      value={formData.returnTicketPrice}
                      onChange={handleChange}
                      className={`input-field ${errors.returnTicketPrice ? 'border-red-500' : ''}`}
                      min="0"
                      step="0.01"
                    />
                    {errors.returnTicketPrice && <p className="mt-1 text-sm text-red-500">{errors.returnTicketPrice}</p>}
                  </div>
                </div>

                {/* Return Seats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Total Available Seats *</label>
                    <input
                      type="number"
                      name="returnTotalAvailableSeats"
                      value={formData.returnTotalAvailableSeats}
                      onChange={handleChange}
                      className={`input-field ${errors.returnTotalAvailableSeats ? 'border-red-500' : ''}`}
                      min="1"
                    />
                    {errors.returnTotalAvailableSeats && <p className="mt-1 text-sm text-red-500">{errors.returnTotalAvailableSeats}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Return Available Seats *</label>
                    <input
                      type="number"
                      name="returnAvailableSeats"
                      value={formData.returnAvailableSeats}
                      onChange={handleChange}
                      className={`input-field ${errors.returnAvailableSeats ? 'border-red-500' : ''}`}
                      min="0"
                      max={formData.returnTotalAvailableSeats}
                    />
                    {errors.returnAvailableSeats && <p className="mt-1 text-sm text-red-500">{errors.returnAvailableSeats}</p>}
                  </div>
                </div>
              </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/flights')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <FaSave />}
              <span>{isEdit ? 'Update Flight' : 'Create Flight'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFlightForm;

