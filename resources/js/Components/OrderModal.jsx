import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router, useForm, usePage } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

import ServiceSelection from './OrderWizard/ServiceSelection.jsx';
import DesignContext from './OrderWizard/DesignContext.jsx';
import MaterialSourcing from './OrderWizard/MaterialSourcing.jsx';
import FitLogistics from './OrderWizard/FitLogistics.jsx';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import Logistics from './OrderWizard/Logistics.jsx';
import OrderSummary from './OrderWizard/OrderSummary.jsx';

export default function OrderModal({ shop, isOpen, onClose, onSuccess }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    service_id: '',
    style_tag: '',
    material_source: 'tailor_choice',
    design_image: null,
    measurement_preference: 'none',
    measurement_date: '', // for workshop_fitting date
    attributes: [],
    notes: '',
  });
  
  const [step, setStep] = useState(0); // 0:Service, 1:Design, 2:Material, 3:Logistics, 4:Fit, 5:Summary
  const [materialDropoffDate, setMaterialDropoffDate] = useState('');
  const [materialDropoffTime, setMaterialDropoffTime] = useState('');
  const [profileMeasurementsLocal, setProfileMeasurementsLocal] = useState({}); // Will sync with auth.user.profile in useEffect

  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [attributeQuantities, setAttributeQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [styleTag, setStyleTag] = useState('');
  const [materialSource, setMaterialSource] = useState('tailor_choice');
  const [measurementPreference, setMeasurementPreference] = useState('none');
  const [measurementDate, setMeasurementDate] = useState('');
  const [measurementTime, setMeasurementTime] = useState('');
  const [rushOrder, setRushOrder] = useState(false);
  const [designImagePreview, setDesignImagePreview] = useState(null);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const isDroppingOff = materialSource === 'customer';
  const { auth } = usePage().props; // Get auth data from Inertia
  // Compute the selected service
  const service = shop?.services?.find(
    s => String(s.id) === String(selectedServiceId)
  ) || null;

  // Group attributes by category
  const attributesByCategory = useMemo(() => {
    if (!shop?.attributes) return {};
    
    const grouped = {};
    shop.attributes.forEach(attr => {
      const categoryName = attr.attribute_category?.name || 'Other';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(attr);
    });
    return grouped;
  }, [shop?.attributes]);

  // Filtered for Job Card - Expanded for Move 2 merging
  const styleAttrs = [
    ...(attributesByCategory['Style'] || []),
    ...(attributesByCategory['T-Shirt Styles'] || []),
    ...(attributesByCategory['Leg Cut'] || []),
    ...(attributesByCategory['Necklines'] || [])
  ];
  const materialAttrs = [
    ...(attributesByCategory['Fabric'] || []),
    ...(attributesByCategory['Material'] || []),
    ...(attributesByCategory['Fasteners'] || []),
    ...(attributesByCategory['Elastic'] || []),
    ...(attributesByCategory['Style'] || []),
    ...(attributesByCategory['T-Shirt Styles'] || []),
    ...(attributesByCategory['Necklines'] || [])
  ];
  // profileMeasurementsLocal no longer needed

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = Number(service?.price) || 0;
    
    selectedAttributes.forEach(attrId => {
      const attr = shop?.attributes?.find(a => a.pivot?.id == attrId);
      const qty = attributeQuantities[attrId] || 1;
      if (attr?.pivot?.price) {
        total += Number(attr.pivot.price) * qty;
      }
    });
    
    return total;
  }, [service?.price, selectedAttributes, attributeQuantities, shop?.attributes]);

  // Check user profile on mount
  useEffect(() => {
    if (isOpen) {
      setProfileCheckLoading(true);
      // No profile measurements needed
      
      if (!auth?.user) {
        setProfileComplete(false);
        setError("Please login to place an order.");
      } else {
        // Logic: Check if the profile object exists AND if the fields are not null/empty
        const userProfile = auth.user.profile;
        
        const hasPhone = !!userProfile?.phone;
        const hasBarangay = !!userProfile?.barangay;
        const hasStreet = !!userProfile?.street;

        if (hasPhone && hasBarangay && hasStreet) {
          setProfileComplete(true);
          setError(null);
        } else {
          setProfileComplete(false);
          let missing = [];
          if (!hasPhone) missing.push('phone');
          if (!hasBarangay) missing.push('barangay');
          if (!hasStreet) missing.push('street');
          setError(`Please complete your profile (${missing.join(', ')}) before ordering custom tailoring services.`);
        }
      }
      setProfileCheckLoading(false);
    }
  }, [isOpen, auth]);

  useEffect(() => {
    if (selectedServiceId) {
      setSelectedAttributes([]);
      setNotes(''); // Clear notes for the NEW service
      setError(null);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    setData('service_id', selectedServiceId);
  }, [selectedServiceId]);

  // Sync local state to form data
  useEffect(() => {
    setData('style_tag', styleTag);
    setData('material_source', materialSource);
    setData('measurement_preference', measurementPreference);
    setData('material_dropoff_date', materialDropoffDate);
    setData('notes', notes);
    setData('attributes', selectedAttributes);
    if (designImageFile) {
      setData('design_image', designImageFile);
    }
  }, [styleTag, materialSource, measurementPreference, materialDropoffDate, notes, selectedAttributes, designImageFile, setData]);

  // Auto-skip ServiceSelection if service_id in URL
  useEffect(() => {
    if (!isOpen || !shop?.services?.length) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedServiceId = urlParams.get('service_id');
    
    if (preselectedServiceId) {
      const serviceIdNum = parseInt(preselectedServiceId);
      const serviceToSelect = shop.services.find(s => s.id === serviceIdNum);
      
      if (serviceToSelect) {
        setSelectedServiceId(serviceToSelect.id);
        setStep(1); // Skip directly to Design step
      }
    }
  }, [isOpen, shop?.services]);





  // 🧹 AUTO-RESET: Completely wipe the modal clean whenever it closes
  useEffect(() => {
    if (!isOpen) {
      reset(); // Clear Inertia form
      setStep(0); // Go back to the first page
      setSelectedServiceId('');
      setStyleTag('');
      setMaterialSource(null);
      setMeasurementPreference('none');
      setMeasurementDate('');
      setMeasurementTime('');
      setRushOrder(false);
      setMaterialDropoffDate('');
      setMaterialDropoffTime('');
      setSelectedAttributes([]);
      setNotes('');
      setDesignImageFile(null);
      setDesignImagePreview(null);
      setError(null);
    }
  }, [isOpen]);

const toggleAttribute = (attrId) => {
    setSelectedAttributes(prev => {
      const newSelected = prev.includes(attrId) 
        ? prev.filter(id => id !== attrId)
        : [...prev, attrId];
      
      if (newSelected.includes(attrId)) {
        // Adding the item: Set its quantity to 1
        setAttributeQuantities(prevQty => ({ ...prevQty, [attrId]: 1 }));
      } else {
        // Removing the item: Delete it from the quantities state safely
        setAttributeQuantities(prevQty => {
            const { [attrId]: _, ...rest } = prevQty;
            return rest;
        });
      }
      
      return newSelected;
    });
  };

  const updateAttributeQuantity = (attrId, qty) => {
    setAttributeQuantities(prev => ({ ...prev, [attrId]: qty }));
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    setData('service_id', serviceId);
    setStep(1);
  };

  const handleDesignImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDesignImageFile(file);
      const preview = URL.createObjectURL(file);
      setDesignImagePreview(preview);
    } else {
      setDesignImageFile(null);
      setDesignImagePreview(null);
    }
  };

  const hasDesignNotes = notes.trim().length > 0;
  const hasReferencePhoto = !!designImageFile;

  useEffect(() => {
    if (step === 1 && hasDesignNotes && hasReferencePhoto && error === 'Please add design notes and attach a reference photo before continuing.') {
      setError(null);
    }
  }, [step, hasDesignNotes, hasReferencePhoto, error]);

  const validateCurrentStep = () => {
    if (step === 0) return !!selectedServiceId;
    if (step === 1) return !!service && hasDesignNotes && hasReferencePhoto;
    if (step === 2) return !!materialSource;
    if (step === 3) return materialSource !== 'customer' || (!!materialDropoffDate && !!materialDropoffTime);
    if (step === 4) return !!measurementPreference;
    if (step === 5) return true;
    return false;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      if (step === 1) {
        setError('Please add design notes and attach a reference photo before continuing.');
      }
      return;
    }

    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(Math.max(0, step - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!service) {
      setError('Please select a service first.');
      return;
    }
    
    setError(null);
    setLoading(true);

    const scheduledDate = measurementPreference === 'workshop_fitting'
      ? (measurementDate || materialDropoffDate)
      : '';

    const scheduledTime = measurementPreference === 'workshop_fitting'
      ? (measurementTime || materialDropoffTime)
      : '';

    const formattedMeasurementDate =
      scheduledDate && scheduledTime
        ? `${scheduledDate} ${scheduledTime}:00`
        : null;

    const payloadDate = measurementPreference === 'workshop_fitting'
      ? scheduledDate
      : materialSource === 'customer'
        ? materialDropoffDate
        : null;

    const payloadTimeStart = measurementPreference === 'workshop_fitting'
      ? scheduledTime
      : materialSource === 'customer'
        ? materialDropoffTime
        : null;

    // --- 2. PREPARE MULTIPART DATA ---
    const submissionData = {
      ...data,
      service_id: selectedServiceId,
      style_tag: styleTag,
      material_source: materialSource,
      measurement_preference: measurementPreference,
      
      // PERFECTLY MATCH THE LARAVEL DATABASE ENUM:
      measurement_type: measurementPreference === 'workshop_fitting' ? 'scheduled' : (measurementPreference === 'none' ? 'none' : 'profile'),
      
      measurement_date: formattedMeasurementDate,
      
      // EXPLICITLY ADD THIS LINE:
      material_dropoff_date: materialDropoffDate,
      material_dropoff_time: materialDropoffTime,
      measurement_time: measurementTime,
      date: payloadDate,
      time_start: payloadTimeStart,
      
      notes: notes,
      rush_order: rushOrder,
      attributes: selectedAttributes,
      attribute_quantities: attributeQuantities,
      design_image: designImageFile,
    };

    // --- 3. SUBMIT MANUALLY ---
    // Note: We use router.post instead of 'post' from useForm to ensure 
    // we send the manual 'submissionData' object immediately.
    router.post(`/shops/${shop.id}/orders`, submissionData, {
      forceFormData: true, // Required for image uploads
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        setLoading(false);
        if (err?.booking) {
          toast.error(err.booking, { duration: 5000, position: 'top-center' });
          setError(err.booking);
          return;
        }

        if (err?.measurement_date) {
          toast.error(err.measurement_date, { duration: 5000, position: 'top-center' });
          setError(err.measurement_date);
          return;
        }

        const firstError = err && typeof err === 'object' ? Object.values(err).find(Boolean) : null;
        if (firstError) {
          toast.error(String(firstError), { duration: 5000, position: 'top-center' });
          setError(String(firstError));
        } else {
          const fallbackMessage = 'Could not schedule appointment. Please check your selected time.';
          toast.error(fallbackMessage, { duration: 5000, position: 'top-center' });
          setError(fallbackMessage);
        }
      },
      onFinish: () => setLoading(false),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-6xl overflow-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-stone-800">
              Job Card Wizard
            </h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['Service', 'Design', 'Material', 'Logistics', 'Fit', 'Review'].map((label, index) => (
                <span key={index} className={`px-2 py-1 rounded-full text-xs ${step === index ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-stone-100 text-stone-500'}`}>
                  {label}
                </span>
              ))}
            </div>

            <p className="mt-1 text-stone-600">{service ? service.service_name : "Select a service"}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Loading Profile Check */}
        {profileCheckLoading && (
          <div className="p-6">
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded-xl mb-6 mx-6 backdrop-blur-sm shadow-lg">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Order Submission Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        {!profileCheckLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow"
            >
              {{
                0: <ServiceSelection shop={shop} onServiceSelect={handleServiceSelect} disabled={profileCheckLoading} />,
                1: <DesignContext 
                      service={service}
                      styleTag={styleTag} 
                      setStyleTag={setStyleTag}
                      rushOrder={rushOrder}
                      setRushOrder={setRushOrder}
                      designImagePreview={designImagePreview}
                      setDesignImageFile={setDesignImageFile}
                      handleDesignImage={handleDesignImage}
                      styleAttrs={styleAttrs}
                      notes={notes}
                      setNotes={setNotes}
                      error={error}
                      onNext={handleNext}
                      canNext={validateCurrentStep()}
                      onBack={handleBack}
                    />,
                2: <MaterialSourcing 
                      service={service}
                      materialSource={materialSource}
                      setMaterialSource={setMaterialSource}
                      materialAttrs={materialAttrs}
                      selectedAttributes={selectedAttributes}
                      toggleAttribute={toggleAttribute}
                      attributeQuantities={attributeQuantities}
                      updateAttributeQuantity={updateAttributeQuantity}
                      onNext={handleNext}
                      canNext={validateCurrentStep()}
                      onBack={handleBack}
                    />,
                3: <Logistics 
                      service={service}
                      shop={shop}
                      materialDropoffDate={materialDropoffDate}
                      setMaterialDropoffDate={setMaterialDropoffDate}
                      materialDropoffTime={materialDropoffTime}
                      setMaterialDropoffTime={setMaterialDropoffTime}
                      materialSource={materialSource}
                      setMaterialSource={setMaterialSource}
                      setProfileMeasurements={setProfileMeasurementsLocal}
                      onNext={(schedule) => {
                        if (schedule) {
                          setMaterialDropoffDate(schedule.date || '');
                          setMaterialDropoffTime(schedule.time || '');
                        }
                        handleNext();
                      }}
                      canNext={validateCurrentStep()}
                      onBack={handleBack}
                    />,

                4: <FitLogistics 
                      service={service}
                      shop={shop}
                      measurementPreference={measurementPreference}
                      setMeasurementPreference={setMeasurementPreference}
                      materialDropoffDate={materialDropoffDate}
                      materialDropoffTime={materialDropoffTime}
                      measurementDate={measurementDate}
                      setMeasurementDate={setMeasurementDate}
                      measurementTime={measurementTime}
                      setMeasurementTime={setMeasurementTime}
                      onNext={handleNext}
                      onBack={handleBack}
                    />,
                5: <OrderSummary 
                      service={service}
                      shop={shop}
                      auth={auth}
                      styleTag={styleTag}
                      materialSource={materialSource}
                      measurementPreference={measurementPreference}
                      measurementDate={measurementDate}
                      measurementTime={measurementTime}
                      materialDropoffDate={materialDropoffDate}
                      materialDropoffTime={materialDropoffTime}
                      notes={notes}
                      rushOrder={rushOrder}
                      selectedAttributes={selectedAttributes}
                      attributeQuantities={attributeQuantities}
                      designImagePreview={designImagePreview}
                      totalPrice={totalPrice}
                      onSubmit={handleSubmit}
                      loading={loading}
                      profileComplete={profileComplete}
                      onBack={handleBack}
                    />

              }[step]}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
