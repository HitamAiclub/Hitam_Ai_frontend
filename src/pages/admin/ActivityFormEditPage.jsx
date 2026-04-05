import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import FormBuilder from '../../components/FormBuilder/FormBuilder';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FiArrowLeft, FiSave, FiUpload } from 'react-icons/fi';
import { Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadUpcomingActivityFile } from '../../utils/cloudinary';
import { Zap, Shield, Info, Smile, Type, Eye, Code, ArrowLeft, Star, Archive, Trash, Mail as MailIcon, MoreVertical, ChevronDown } from 'lucide-react';
import ReactQuill from 'react-quill';
const Quill = ReactQuill.Quill;
import 'react-quill/dist/quill.snow.css';

import { MAIL_TEMPLATES, THEMED_BOXES } from '../../config/mailTemplates';

// --- ADVANCED QUILL PERMISSIVE CONFIGURATION ---
if (Quill) {
  // Register standard styles so Quill doesn't strip them during Visual/HTML mode switching
  const BackgroundStyle = Quill.import('attributors/style/background');
  const ColorStyle = Quill.import('attributors/style/color');
  const SizeStyle = Quill.import('attributors/style/size');
  const AlignStyle = Quill.import('attributors/style/align');
  const FontStyle = Quill.import('attributors/style/font');
  const DirectionStyle = Quill.import('attributors/style/direction');

  // Register DIV as a valid block tag to prevent Quill from stripping structural containers
  const Block = Quill.import('blots/block');
  if (Block) {
    class CustomDivBlock extends Block {}
    CustomDivBlock.tagName = 'div';
    CustomDivBlock.className = 'ql-custom-div'; 
    Quill.register(CustomDivBlock, true);
  }

  Quill.register(BackgroundStyle, true);
  Quill.register(ColorStyle, true);
  Quill.register(SizeStyle, true);
  Quill.register(AlignStyle, true);
  Quill.register(FontStyle, true);
  Quill.register(DirectionStyle, true);
}

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean'],
  ],
};

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
  const [joinLink, setJoinLink] = useState('');
  const [joinLinkMessage, setJoinLinkMessage] = useState('');
  const [joinLinkLabel, setJoinLinkLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [autoConfirmEmail, setAutoConfirmEmail] = useState(false);
  const [emailFieldId, setEmailFieldId] = useState('');
  const [nameFieldId, setNameFieldId] = useState('');
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState('');
  const [welcomeEmailBody, setWelcomeEmailBody] = useState('');
  const [welcomeEmailCc, setWelcomeEmailCc] = useState('');
  const [welcomeEmailVenue, setWelcomeEmailVenue] = useState('');
  const [welcomeEmailTime, setWelcomeEmailTime] = useState('');
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'html' for Welcome Email
  const [instructionsEditorMode, setInstructionsEditorMode] = useState('visual');
  const [successEditorMode, setSuccessEditorMode] = useState('visual');

  // Create payment section with current payment details
  const createPaymentSection = (customFee = null, customUrl = null, customQrUrl = null, customInstructions = null, existingFields = []) => {
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

    // Extract dynamic fields (not the default ones we recreate)
    const staticFieldIds = ['payment_info', 'payment_screenshot', 'upi_transaction'];
    const customFields = existingFields.filter(f => !staticFieldIds.includes(f.id));

    return {
      id: `section_payment_${timestamp}`, // Note: We might want to keep the same ID if we were doing deep merges, but FormBuilder handles section swaps ok
      title: "Payment Information",
      description: `Registration Fee: ₹${sectionFee || '0'}`,
      fields: [
        {
          id: `payment_info`,
          type: "label",
          label: "",
          content: paymentContentHtml,
          contentType: "html",
          alignment: "left",
          fontSize: "medium"
        },
        ...customFields, // Insert custom fields after the info label
        {
          id: `payment_screenshot`,
          type: "file",
          label: "Payment Screenshot",
          required: true,
          placeholder: "Upload payment proof",
          acceptedFileTypes: "image/*,.pdf"
        },
        {
          id: `upi_transaction`,
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
        // Update existing payment section with new payment details while preserving custom fields
        const updatedSections = [...formSections];
        const existingFields = formSections[existingPaymentSectionIndex].fields || [];
        const paymentSection = createPaymentSection(null, null, null, null, existingFields);
        paymentSection.id = formSections[existingPaymentSectionIndex].id; // Keep same ID
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

        // Load settings
        setIsPaid(activityData.isPaid || false);
        setFee(activityData.fee || '');
        setPaymentUrl(activityData.paymentDetails?.paymentUrl || '');
        setQrCodeUrl(activityData.paymentDetails?.qrCodeUrl || '');
        setInstructions(activityData.paymentDetails?.instructions || '');
        setJoinLink(activityData.postRegistration?.joinLink || '');
        setJoinLinkMessage(activityData.postRegistration?.joinLinkMessage || '');
        setJoinLinkLabel(activityData.postRegistration?.joinLinkLabel || '');
        setAutoConfirmEmail(activityData.postRegistration?.autoConfirmEmail || false);
        setEmailFieldId(activityData.postRegistration?.emailFieldId || '');
        setNameFieldId(activityData.postRegistration?.nameFieldId || '');
        
        // --- RESTORED MISSING STATES ---
        const postReg = activityData.postRegistration || {};
        const titleLine = `Registration Confirmed: ${activityData.title || ''}`;
        
        setWelcomeEmailSubject(postReg.welcomeEmailSubject || titleLine);
        setWelcomeEmailCc(postReg.welcomeEmailCc || '');
        setWelcomeEmailVenue(postReg.welcomeEmailVenue !== undefined ? postReg.welcomeEmailVenue : (activityData.location || ''));
        setWelcomeEmailTime(postReg.welcomeEmailTime || '');
        
        const savedBody = activityData.postRegistration?.welcomeEmailBody;
        const isCustomLayout = activityData.postRegistration?.isCustomLayout;
        
        // PERSISTENCE FIX: If isCustomLayout is true, or if the field exists, HONOR IT.
        // We only use defaults if it's a brand new activity with no registration settings.
        if (isCustomLayout || (savedBody !== undefined && savedBody !== null)) {
            setWelcomeEmailBody(savedBody || '');
        } else {
            setWelcomeEmailBody(MAIL_TEMPLATES[0].body);
        }

        // --- CONSOLIDATED SECTION MANAGEMENT ---
        // 1. Process Sections
        let processedSections = [];
        if (activityData.formSections && activityData.formSections.length > 0) {
          processedSections = activityData.formSections;
        } else if (activityData.formSchema && activityData.formSchema.length > 0) {
          processedSections = [{
            id: `section_${Date.now()}`,
            title: "Section 1",
            description: "",
            fields: activityData.formSchema,
            conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] }
          }];
        } else {
          processedSections = [{
            id: `section_${Date.now()}`,
            title: "Section 1",
            description: "",
            fields: getDefaultFormSchema(),
            conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] }
          }];
        }

        // 2. Handle Payment Section (Self-Correction on Load)
        if (activityData.isPaid) {
          const hasPaymentSection = processedSections.some(s => s.id?.startsWith('section_payment_'));
          if (!hasPaymentSection && processedSections.length > 0) {
            const paymentSection = createPaymentSection(
              activityData.fee,
              activityData.paymentDetails?.paymentUrl,
              activityData.paymentDetails?.qrCodeUrl,
              activityData.paymentDetails?.instructions
            );
            processedSections = [...processedSections, paymentSection];
          }
        }
        
        // 3. Final State Commit
        setFormSections(processedSections);
        setFormSchema(processedSections.flatMap(s => s.fields || []));
        setLoading(false);
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

      // Using granular dot notation for nested fields ensures other fields in 
      // the same object are NOT overwritten (Standard Firebase best practice).
      const updateData = {
        formSchema: sanitizedSchema,
        formSections: sanitizedSections,
        isPaid: isPaid,
        fee: isPaid ? fee : '',
        'paymentDetails.paymentUrl': isPaid ? paymentUrl : '',
        'paymentDetails.qrCodeUrl': isPaid ? qrCodeUrl : '',
        'paymentDetails.instructions': isPaid ? instructions : '',
        'postRegistration.joinLink': joinLink || '',
        'postRegistration.joinLinkMessage': joinLinkMessage || '',
        'postRegistration.joinLinkLabel': joinLinkLabel || '',
        'postRegistration.autoConfirmEmail': autoConfirmEmail || false,
        'postRegistration.emailFieldId': emailFieldId || '',
        'postRegistration.nameFieldId': nameFieldId || '',
        'postRegistration.welcomeEmailSubject': welcomeEmailSubject || '',
        'postRegistration.welcomeEmailBody': welcomeEmailBody || '',
        'postRegistration.welcomeEmailCc': welcomeEmailCc || '',
        'postRegistration.welcomeEmailVenue': welcomeEmailVenue || '',
        'postRegistration.welcomeEmailTime': welcomeEmailTime || '',
        'postRegistration.isCustomLayout': true, // Mark as custom to prevent auto-overwrites
        'updatedAt': new Date().toISOString()
      };

      await updateDoc(doc(db, 'upcomingActivities', id), updateData);

      alert('Registration form & payment settings saved successfully!');
      navigate('/upcoming');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'upcomingActivities', id);
      const templateData = {
        'postRegistration.welcomeEmailSubject': welcomeEmailSubject,
        'postRegistration.welcomeEmailBody': welcomeEmailBody,
        'postRegistration.welcomeEmailCc': welcomeEmailCc,
        'postRegistration.welcomeEmailVenue': welcomeEmailVenue,
        'postRegistration.welcomeEmailTime': welcomeEmailTime,
        'postRegistration.isCustomLayout': true, // Lock this design
        'updatedAt': new Date().toISOString()
      };
      await updateDoc(docRef, templateData);
      
      // Update local state to stay synced without reload
      setActivity(prev => ({
        ...prev,
        postRegistration: {
            ...(prev.postRegistration || {}),
            welcomeEmailSubject,
            welcomeEmailBody,
            welcomeEmailCc,
            welcomeEmailVenue,
            welcomeEmailTime,
            isCustomLayout: true
        }
      }));

      alert('Email template saved successfully!');
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSuccessMessage = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'upcomingActivities', id);
      const messageData = {
        'postRegistration.joinLink': joinLink,
        'postRegistration.joinLinkLabel': joinLinkLabel,
        'postRegistration.joinLinkMessage': joinLinkMessage,
        'updatedAt': new Date().toISOString()
      };
      await updateDoc(docRef, messageData);
      
      // Update local state to stay synced without reload
      setActivity(prev => ({
        ...prev,
        postRegistration: {
            ...(prev.postRegistration || {}),
            joinLink,
            joinLinkLabel,
            joinLinkMessage
        }
      }));

      alert('Success message settings saved successfully!');
    } catch (err) {
      console.error('Error saving success message:', err);
      alert('Failed to save message: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  Payment Instructions
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setInstructionsEditorMode('visual')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        instructionsEditorMode === 'visual' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Eye size={12} /> VISUAL
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstructionsEditorMode('html')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        instructionsEditorMode === 'html' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Code size={12} /> HTML
                    </button>
                  </div>
                </label>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(THEMED_BOXES).map(([key, box]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInstructions(prev => prev + box.html)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:shadow-md ${box.class}`}
                      >
                        + {box.name}
                      </button>
                    ))}
                  </div>
                  
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                      {instructionsEditorMode === 'visual' ? (
                        <ReactQuill
                          theme="snow"
                          value={instructions}
                          onChange={setInstructions}
                          modules={QUILL_MODULES}
                          className="min-h-[150px]"
                        />
                      ) : (
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                          <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={8}
                            className="flex-1 px-3 py-2 bg-transparent text-gray-900 dark:text-white font-mono text-sm focus:outline-none resize-none"
                            placeholder="Instructions for payment..."
                          />
                          <div className="flex-1 p-4 overflow-y-auto max-h-[300px] bg-gray-50 dark:bg-gray-900/50">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Live Preview</div>
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: instructions || '<p className="text-gray-400 font-italic italic text-xs">No content to preview</p>' }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-600 dark:text-gray-400">
              <p>This activity is currently free. Enable "This is a paid event" to add payment settings.</p>
            </div>
          )}
        </div>

        {/* Post-Registration Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">🎉</span>
            Post-Registration Settings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configure what happens after a student successfully registers.
          </p>

          <div className="space-y-6">
            <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiArrowLeft className="w-5 h-5 text-purple-600 rotate-180" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Success Message & Links</h4>
                  <p className="text-xs text-gray-500">Configure what participants see immediately after they submit the form.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveSuccessMessage}
                  loading={saving}
                  className="text-[10px] h-8 border-purple-200 text-purple-600 hover:bg-purple-50"
                  icon={<FiSave size={12} />}
                >
                  Save Message Settings
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Join Link (WhatsApp/Discord/etc.)"
                  value={joinLink}
                  onChange={(e) => setJoinLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
                <Input
                  label="Join Button Label"
                  value={joinLinkLabel}
                  onChange={(e) => setJoinLinkLabel(e.target.value)}
                  placeholder="Join WhatsApp Group"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  Success Message
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setSuccessEditorMode('visual')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        successEditorMode === 'visual' 
                        ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Eye size={12} /> VISUAL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuccessEditorMode('html')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        successEditorMode === 'html' 
                        ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Code size={12} /> HTML
                    </button>
                  </div>
                </label>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(THEMED_BOXES).map(([key, box]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setJoinLinkMessage(prev => prev + box.html)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:shadow-md ${box.class}`}
                      >
                        + {box.name}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border border-green-200 dark:border-green-800 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                    {successEditorMode === 'visual' ? (
                      <ReactQuill
                        theme="snow"
                        value={joinLinkMessage}
                        onChange={setJoinLinkMessage}
                        modules={QUILL_MODULES}
                        className="min-h-[150px]"
                      />
                    ) : (
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                        <textarea
                          value={joinLinkMessage}
                          onChange={(e) => setJoinLinkMessage(e.target.value)}
                          rows={8}
                          className="flex-1 px-3 py-2 bg-transparent text-gray-900 dark:text-white font-mono text-sm focus:outline-none resize-none"
                          placeholder="Message displayed after registration..."
                        />
                        <div className="flex-1 p-4 overflow-y-auto max-h-[300px] bg-gray-50 dark:bg-gray-900/50">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Live Preview</div>
                          <div 
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: joinLinkMessage || '<p className="text-gray-400 font-italic italic text-xs">No content to preview</p>' }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Email Settings */}
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Email Confirmation</h4>
                  <p className="text-xs text-gray-500">Send an instant "Registration Received" email to participants.</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveEmailTemplate}
                    loading={saving}
                    className="text-[10px] h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                    icon={<FiSave size={12} />}
                  >
                    Save Template
                  </Button>
                  <div className="flex items-center gap-2 border-l border-blue-100 dark:border-blue-800/50 pl-4">
                    <span className={`text-xs font-medium ${autoConfirmEmail ? 'text-blue-600' : 'text-gray-400'}`}>
                      {autoConfirmEmail ? 'Enabled' : 'Disabled'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoConfirmEmail}
                        onChange={(e) => setAutoConfirmEmail(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {autoConfirmEmail && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100 dark:border-blue-800/50"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Recipient Name Field
                    </label>
                    <select
                      value={nameFieldId}
                      onChange={(e) => setNameFieldId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select field...</option>
                      {formSchema.map(f => (
                        <option key={f.id} value={f.label}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Recipient Email Field
                    </label>
                    <select
                      value={emailFieldId}
                      onChange={(e) => setEmailFieldId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select field...</option>
                      {formSchema.map(f => (
                        <option key={f.id} value={f.label}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-blue-100 dark:border-blue-800/50">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={welcomeEmailSubject}
                        onChange={(e) => setWelcomeEmailSubject(e.target.value)}
                        placeholder="Registration Confirmed: [Event Name]"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Welcome Email CC (comma separated)
                      </label>
                      <input
                        type="text"
                        value={welcomeEmailCc}
                        onChange={(e) => setWelcomeEmailCc(e.target.value)}
                        placeholder="admin@example.com, info@example.com"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                      />
                    </div>
                    

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <div>
                          Email Body
                          <span className="ml-2 normal-case font-normal text-gray-400">Placeholders: [Participant Name], [Event Name]</span>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={() => setEditorMode('visual')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                              editorMode === 'visual' 
                              ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Eye size={12} /> VISUAL
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('html')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                              editorMode === 'html' 
                              ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Code size={12} /> HTML
                          </button>
                        </div>
                      </label>

                      {/* Theme Selector */}
                      <div className="mb-6">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Design Gallery</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {MAIL_TEMPLATES.map((tmpl) => (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => {
                                if (welcomeEmailBody && !window.confirm("Selecting a template will replace your current email body. Continue?")) return;
                                setWelcomeEmailBody(tmpl.body);
                                if (tmpl.subject) setWelcomeEmailSubject(tmpl.subject.replace('[Event Name]', activity.title));
                              }}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center group"
                            >
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <tmpl.icon size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-500" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tmpl.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Element Inserter */}
                      <div className="mb-6">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Insert Highlight Elements</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(THEMED_BOXES).map(([key, box]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setWelcomeEmailBody(prev => prev + box.html);
                              }}
                              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all hover:shadow-md active:scale-95 ${box.class}`}
                            >
                              + {box.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Realistic Mobile Shell Backdrop */}
                      <div className="bg-[#fceef0] dark:bg-gray-950 p-4 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl relative min-h-[700px] flex flex-col">
                        
                        {/* Mock Mobile App Header */}
                        <div className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-6">
                            <ArrowLeft size={20} />
                            <div className="w-8 h-8 flex items-center justify-center">
                              <Zap size={22} className="text-gray-400" />
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <Archive size={18} />
                            <Trash size={18} />
                            <MailIcon size={18} />
                            <MoreVertical size={18} />
                          </div>
                        </div>

                        {/* Sender Info Row */}
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">HITAM AI CLUB</span>
                                <span className="text-xs text-gray-400">6:16 PM</span>
                              </div>
                              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                                to me <ChevronDown size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 text-gray-400">
                            <Smile size={18} />
                            <ArrowLeft size={18} className="rotate-180" /> {/* Reply icon mock */}
                            <MoreVertical size={18} />
                          </div>
                        </div>

                        {/* The Email Card (600px) */}
                        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
                          <div className="max-w-[600px] mx-auto flex flex-col bg-white shadow-xl rounded-[24px] overflow-hidden border border-gray-100/50">
                            {editorMode === 'visual' ? (
                              <div className="min-h-[500px]">
                                <style>
                                  {`.ql-container.ql-snow { border: none !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                                    .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f9fafb !important; background: #fff !important; padding: 12px 20px !important; }
                                    .ql-editor { min-height: 500px; padding: 35px !important; color: #111827 !important; line-height: 1.6; }
                                    .ql-editor p { margin-bottom: 14px; }
                                    .ql-editor h2 { color: #10b981 !important; font-weight: 700 !important; font-size: 24px !important; margin-bottom: 20px !important; }`}
                                </style>
                                <ReactQuill
                                  theme="snow"
                                  value={welcomeEmailBody}
                                  onChange={(content, delta, source) => {
                                    // PERSISTENCE FIX: Only update state if the user manually typed.
                                    // This stops Quill from "Cleaning" (mangling) your HTML on mount.
                                    if (source === 'user') {
                                      setWelcomeEmailBody(content);
                                    }
                                  }}
                                  modules={QUILL_MODULES}
                                  className="dark:text-gray-900"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col divide-y divide-gray-100">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 italic text-[10px] text-gray-400 flex items-center justify-between">
                                  <span>HTML Code Editor</span>
                                  <span className="flex items-center gap-1"><Code size={10} /> Raw Structure Mode</span>
                                </div>
                                <textarea
                                  value={welcomeEmailBody}
                                  onChange={(e) => setWelcomeEmailBody(e.target.value)}
                                  rows={12}
                                  className="w-full p-8 text-sm font-mono bg-white text-gray-900 outline-none border-0 selection:bg-blue-100 resize-none h-[500px]"
                                  placeholder="<h1>Hello [Participant Name]!</h1>..."
                                />
                              </div>
                            )}
                            
                            {/* GLOBAL LIVE PREVIEW (Always visible) */}
                            <div className="p-4 bg-blue-50/30 border-t border-blue-50">
                              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                Visual Result (Live)
                              </div>
                              <div 
                                className="p-6 bg-white rounded-xl border border-blue-100 shadow-inner min-h-[200px]"
                                style={{ fontFamily: "'Segoe UI', sans-serif" }}
                                dangerouslySetInnerHTML={{ __html: welcomeEmailBody }} 
                              />
                            </div>
                          </div>

                          {/* Quick Actions (Reply/Forward) */}
                          <div className="max-w-[600px] mx-auto grid grid-cols-2 gap-4 mt-6">
                            <button className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-900/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-700 dark:text-gray-300">
                              <ArrowLeft size={16} /> Reply
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-900/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-700 dark:text-gray-300">
                              <ArrowLeft size={16} className="rotate-180" /> Forward
                            </button>
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                           <div className="w-8 h-1 bg-gray-400/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
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
