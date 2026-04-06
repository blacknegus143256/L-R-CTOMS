import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router, useForm, usePage } from '@inertiajs/react';

import ServiceSelection from './OrderWizard/ServiceSelection.jsx';
import DesignContext from './OrderWizard/DesignContext.jsx';
import MaterialSourcing from './OrderWizard/MaterialSourcing.jsx';
import FitLogistics from './OrderWizard/FitLogistics.jsx';

import Logistics from './OrderWizard/Logistics.jsx';
import OrderSummary from './OrderWizard/OrderSummary.jsx';

export default function OrderModal({ shop, isOpen, onClose, onSuccess }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    service_id: '',
    style_tag: '',
    material_source: 'tailor_choice',
    design_image: null,
    measurement_preference: 'self_measured',
    measurement_date: '', // for workshop_fitting date
    attributes: [],
    notes: '',
  });
  
  const [step, setStep] = useState(0); // 0:Service, 1:Design, 2:Material, 3:Logistics, 4:Fit, 5:Summary
  const [materialDropoffDate, setMaterialDropoffDate] = useState('');
  const [profileMeasurementsLocal, setProfileMeasurementsLocal] = useState({}); // Will sync with auth.user.profile in useEffect

  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [notes, setNotes] = useState('');
  const [styleTag, setStyleTag] = useState('');
  const [materialSource, setMaterialSource] = useState(null);
  const [measurementPreference, setMeasurementPreference] = useState('self_measured');
  const [measurementDate, setMeasurementDate] = useState('');
  const [designImagePreview, setDesignImagePreview] = useState(null);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState('');

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
      const attr = shop?.attributes?.find(a => a.id === attrId);
      if (attr?.pivot?.price) {
        total += Number(attr.pivot.price);
      }
    });
    
    return total;
  }, [service?.price, selectedAttributes, shop?.attributes]);

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




  // 🧹 AUTO-RESET: Completely wipe the modal clean whenever it closes
  useEffect(() => {
    if (!isOpen) {
      reset(); // Clear Inertia form
      setStep(0); // Go back to the first page
      setSelectedServiceId('');
      setStyleTag('');
      setMaterialSource(null);
      setMeasurementPreference('self_measured');
      setMeasurementDate('');
      setMaterialDropoffDate('');
      setSelectedAttributes([]);
      setNotes('');
      setDesignImageFile(null);
      setDesignImagePreview(null);
      setError(null);
    }
  }, [isOpen]);

  const toggleAttribute = (attrId) => {
    setSelectedAttributes(prev => 
      prev.includes(attrId) 
        ? prev.filter(id => id !== attrId)
        : [...prev, attrId]
    );
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

  const validateCurrentStep = () => {
    if (step === 0) return !!selectedServiceId;
    if (step === 1) return service ? true : false;
    if (step === 2) return !!materialSource;
    if (step === 3) return materialSource === 'tailor_choice' || !!materialDropoffDate;
    if (step === 4) return !!measurementPreference;
    if (step === 5) return true;
    return false;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
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

    // Hydrate the date for Laravel validation
    let formattedDate = measurementDate;
    if (measurementDate && measurementDate.length === 10) {
      formattedDate = `${measurementDate} 00:00:00`;
    }

    // --- 2. PREPARE MULTIPART DATA ---
    const submissionData = {
      ...data,
      service_id: selectedServiceId,
      style_tag: styleTag,
      material_source: materialSource,
      measurement_preference: measurementPreference,
      
      // PERFECTLY MATCH THE LARAVEL DATABASE ENUM:
      measurement_type: measurementPreference === 'workshop_fitting' ? 'scheduled' : 'profile',
      
      measurement_date: formattedDate,
      
      // EXPLICITLY ADD THIS LINE:
      material_dropoff_date: materialDropoffDate, 
      
      notes: notes,
      attributes: selectedAttributes,
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
        console.log("Submission Error Details:", err);
        if (err.measurement_date) {
          setError(err.measurement_date);
        } else {
          setError("Failed to save order. Please check the Job Card details.");
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
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
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
                      onNext={handleNext}
                      canNext={validateCurrentStep()}
                      onBack={handleBack}
                    />,
                3: <Logistics 
                      service={service}
                      materialDropoffDate={materialDropoffDate}
                      setMaterialDropoffDate={setMaterialDropoffDate}
                      materialSource={materialSource}
                      setMaterialSource={setMaterialSource}
                      setProfileMeasurements={setProfileMeasurementsLocal}
                      onNext={handleNext}
                      canNext={validateCurrentStep()}
                      onBack={handleBack}
                    />,

                4: <FitLogistics 
                      service={service}
                      measurementPreference={measurementPreference}
                      setMeasurementPreference={setMeasurementPreference}
                      materialDropoffDate={materialDropoffDate}
                      measurementDate={measurementDate}
                      setMeasurementDate={setMeasurementDate}
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
                      materialDropoffDate={materialDropoffDate}
                      notes={notes}
                      selectedAttributes={selectedAttributes}
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
