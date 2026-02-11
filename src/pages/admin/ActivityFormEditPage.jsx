import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import FormBuilder from '../../components/FormBuilder/FormBuilder';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FiArrowLeft, FiSave, FiUpload } from 'react-icons/fi';
import { uploadUpcomingActivityFile } from '../../utils/cloudinary';

function ActivityFormEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [formSchema, setFormSchema] = useState([]);
  const [formSections, setFormSections] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Create payment section with current payment details
  const createPaymentSection = (customFee = null, customUrl = null, customQrUrl = null, customInstructions = null) => {
    const sectionFee = customFee !== null ? customFee : fee;
    const sectionUrl = customUrl !== null ? customUrl : paymentUrl;
    const sectionQrUrl = customQrUrl !== null ? customQrUrl : qrCodeUrl;
    const sectionInstructions = customInstructions !== null ? customInstructions : instructions;
    const timestamp = Date.now();

    let paymentContentHtml = `<div style="padding: 16px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; margin-bottom: 16px;">
      <p style="font-weight: bold; font-size: 18px; color: #92400e; margin-bottom: 8px;">Payment Required: ₹${sectionFee || '0'}</p>`;

    if (sectionQrUrl) {
      paymentContentHtml += `<div style="margin-bottom: 12px; text-align: center;"><img src="${sectionQrUrl}" alt="Payment QR Code" style="max-width: 200px; border-radius: 8px; border: 1px solid #e5e7eb;" /></div>`;
    }

    if (sectionUrl) {
      paymentContentHtml += `<p style="margin-bottom: 8px;"><a href="${sectionUrl}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 500;">🔗 Open Payment Link</a></p>`;
    }

    if (sectionInstructions) {
      paymentContentHtml += `<p style="color: #78350f; font-size: 14px;"><strong>Instructions:</strong> ${sectionInstructions}</p>`;
    }

    paymentContentHtml += `</div>`;

    return {
      id: `section_payment_${timestamp}`,
      title: "Payment Information",
      description: `Registration Fee: ₹${sectionFee || '0'}`,
      fields: [
        {
          id: `field_payment_info_${timestamp}`,
          type: "label",
          label: "",
          content: paymentContentHtml,
          contentType: "html",
          alignment: "left",
          fontSize: "medium"
        },
        {
          id: `field_payment_screenshot_${timestamp}`,
          type: "file",
          label: "Payment Screenshot",
          required: true,
          placeholder: "Upload payment proof",
          acceptedFileTypes: "image/*,.pdf"
        },
        {
          id: `field_upi_transaction_${timestamp}`,
          type: "text",
          label: "UPI Transaction ID",
          required: true,
          placeholder: "Enter UPI transaction ID"
        }
      ],
      conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] },
      navigation: { type: "submit" }
    };
  };

  // Auto-create/update/remove payment section based on isPaid and payment settings
  useEffect(() => {
    if (loading || formSections.length === 0) return; // Wait for initial load and sections to be ready

    const existingPaymentSectionIndex = formSections.findIndex(s => s.id?.startsWith('section_payment_'));

    if (isPaid) {
      // Create or update payment section
      if (existingPaymentSectionIndex >= 0) {
        // Update existing payment section with new payment details
        const updatedSections = [...formSections];
        const paymentSection = createPaymentSection();
        paymentSection.id = formSections[existingPaymentSectionIndex].id; // Keep same ID
        // Update field IDs to refresh content
        paymentSection.fields[0].id = `field_payment_info_${Date.now()}`;
        paymentSection.fields[1].id = `field_payment_screenshot_${Date.now()}`;
        paymentSection.fields[2].id = `field_upi_transaction_${Date.now()}`;
        updatedSections[existingPaymentSectionIndex] = paymentSection;
        setFormSections(updatedSections);
      } else {
        // Add new payment section at the end
        const paymentSection = createPaymentSection();
        setFormSections(prev => [...prev, paymentSection]);
      }
    } else {
      // Remove payment section if isPaid is unchecked
      if (existingPaymentSectionIndex >= 0) {
        const updatedSections = formSections.filter(s => !s.id?.startsWith('section_payment_'));
        setFormSections(updatedSections);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, fee, paymentUrl, qrCodeUrl, instructions, loading]);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const getDefaultFormSchema = () => {
    return [
      {
        id: `field_${Date.now()}`,
        type: "text",
        label: "Full Name",
        required: true,
        placeholder: "Enter your full name"
      },
      {
        id: `field_${Date.now() + 1}`,
        type: "email",
        label: "Email",
        required: true,
        placeholder: "Enter your email"
      }
    ];
  };

  const fetchActivity = async () => {
    try {
      const docRef = doc(db, 'upcomingActivities', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const activityData = { id: docSnap.id, ...docSnap.data() };
        setActivity(activityData);

        // Load sections if they exist, otherwise convert formSchema to sections
        if (activityData.formSections && activityData.formSections.length > 0) {
          setFormSections(activityData.formSections);
          // Also set formSchema for backward compatibility
          const fields = activityData.formSections.flatMap(s => s.fields || []);
          setFormSchema(fields);
        } else if (activityData.formSchema && activityData.formSchema.length > 0) {
          // Convert flat formSchema to sections
          const sections = [{
            id: `section_${Date.now()}`,
            title: "Section 1",
            description: "",
            fields: activityData.formSchema,
            conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] }
          }];
          setFormSections(sections);
          setFormSchema(activityData.formSchema);
        } else {
          const defaultSections = [{
            id: `section_${Date.now()}`,
            title: "Section 1",
            description: "",
            fields: getDefaultFormSchema(),
            conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] }
          }];
          setFormSections(defaultSections);
          setFormSchema(getDefaultFormSchema());
        }
        setIsPaid(activityData.isPaid || false);
        setFee(activityData.fee || '');
        setPaymentUrl(activityData.paymentDetails?.paymentUrl || '');
        setQrCodeUrl(activityData.paymentDetails?.qrCodeUrl || '');
        setInstructions(activityData.paymentDetails?.instructions || '');

        // If isPaid is true and no payment section exists, create it after a short delay
        if (activityData.isPaid) {
          setTimeout(() => {
            setFormSections(prev => {
              const hasPaymentSection = prev.some(s => s.id?.startsWith('section_payment_'));
              if (!hasPaymentSection && prev.length > 0) {
                const paymentSection = createPaymentSection(
                  activityData.fee,
                  activityData.paymentDetails?.paymentUrl,
                  activityData.paymentDetails?.qrCodeUrl,
                  activityData.paymentDetails?.instructions
                );
                return [...prev, paymentSection];
              }
              return prev;
            });
          }, 100);
        }
      } else {
        alert('Activity not found');
        navigate('/upcoming');
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      alert('Error loading activity');
      navigate('/upcoming');
    } finally {
      setLoading(false);
    }
  };

  // Helper to remove undefined values for Firestore
  const sanitizeForFirestore = (obj) => {
    if (obj === undefined) return null;
    if (obj === null) return null;

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeForFirestore(item));
    }

    if (typeof obj === 'object') {
      const newObj = {};
      Object.keys(obj).forEach(key => {
        const value = sanitizeForFirestore(obj[key]);
        if (value !== undefined) {
          newObj[key] = value;
        } else {
          newObj[key] = null; // Explicitly set undefined to null
        }
      });
      return newObj;
    }

    return obj;
  };

  const handleSave = async () => {
    if (!activity) return;

    if (isPaid && !fee) {
      alert('Please enter the registration fee for paid events.');
      return;
    }

    setSaving(true);
    try {
      // Flatten sections to formSchema for backward compatibility
      const allFields = formSections.flatMap(s => s.fields || []);

      // Sanitize data before sending to Firestore
      const sanitizedSections = sanitizeForFirestore(formSections);
      const sanitizedSchema = sanitizeForFirestore(allFields);

      await updateDoc(doc(db, 'upcomingActivities', id), {
        formSchema: sanitizedSchema,
        formSections: sanitizedSections,
        isPaid: isPaid,
        fee: isPaid ? fee : '',
        paymentDetails: {
          paymentUrl: isPaid ? paymentUrl : '',
          qrCodeUrl: isPaid ? qrCodeUrl : '',
          instructions: isPaid ? instructions : ''
        },
        updatedAt: new Date().toISOString()
      });

      alert('Registration form & payment settings saved successfully!');
      navigate('/upcoming');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingQr(true);
      setUploadingQr(true);
      // Use uploadUpcomingActivityFile with new structure: admin/qr_code
      const response = await uploadUpcomingActivityFile(file, activity.title, 'admin', 'qr_code');
      setQrCodeUrl(response.url);
    } catch (error) {
      console.error('Error uploading QR code:', error);
      alert(`Failed to upload QR code: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/upcoming')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <FiArrowLeft size={20} />
            <span>Back to Activities</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Registration Form
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Activity: <span className="font-semibold">{activity.title}</span>
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Registration Form Builder
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Design your registration form by adding, editing, and arranging form fields.
            Students will fill out this form to register for your activity.
          </p>
        </div>

        {/* Form Builder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <FormBuilder
            formSchema={formSections.length > 0 ? formSections : formSchema.length > 0 ? [{ id: `section_${Date.now()}`, title: "Section 1", description: "", fields: formSchema, conditional: { enabled: false } }] : []}
            onChange={(sections) => {
              if (sections && Array.isArray(sections) && sections.length > 0) {
                setFormSections(sections);
                // Also update formSchema for backward compatibility
                const allFields = sections.flatMap(s => s.fields || []);
                setFormSchema(allFields);
              }
            }}
            isPaid={isPaid}
            fee={fee}
            paymentUrl={paymentUrl}
            paymentInstructions={instructions}
            activityTitle={activity.title}
          />

        </div>

        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
            <input
              type="checkbox"
              id="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="isPaid" className="text-lg font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
              This is a paid event
            </label>
          </div>

          {isPaid ? (
            <div className="space-y-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <Input
                label="Registration Fee (₹)"
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="Enter fee amount"
                required
              />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Payment URL (UPI Link)"
                    value={paymentUrl}
                    onChange={(e) => setPaymentUrl(e.target.value)}
                    placeholder="https:// or upi://pay?..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Provide a direct payment link or UPI ID link.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment QR Code (Image)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${uploadingQr ? 'border-blue-400 bg-blue-50' : 'border-gray-300 dark:border-gray-600'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingQr ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <FiUpload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click to upload QR image
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleQrUpload}
                          disabled={uploadingQr}
                        />
                      </label>
                    </div>
                    {qrCodeUrl && (
                      <div className="relative group">
                        <img
                          src={qrCodeUrl}
                          alt="QR Preview"
                          className="h-32 w-32 object-contain bg-white rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => setQrCodeUrl('')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove QR Code"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="Instructions for payment (e.g., scan QR code, enter UPI ID, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-600 dark:text-gray-400">
              <p>This activity is currently free. Enable "This is a paid event" to add payment settings.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/upcoming')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            className="flex items-center gap-2"
          >
            <FiSave size={18} />
            Save Form
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActivityFormEditPage;
