import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

function ActivityPaymentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const docRef = doc(db, 'upcomingActivities', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const activityData = { id: docSnap.id, ...docSnap.data() };
        setActivity(activityData);
        setIsPaid(activityData.isPaid || false);
        setFee(activityData.fee || '');
        setPaymentUrl(activityData.paymentDetails?.paymentUrl || '');
        setInstructions(activityData.paymentDetails?.instructions || '');
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

  const handleSave = async () => {
    if (!activity) return;

    if (isPaid && !fee) {
      alert('Please enter the registration fee for paid events.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        isPaid: isPaid,
        updatedAt: new Date().toISOString()
      };

      if (isPaid) {
        updateData.fee = fee;
        updateData.paymentDetails = {
          paymentUrl: paymentUrl,
          instructions: instructions
        };
      } else {
        updateData.fee = '';
        updateData.paymentDetails = {
          paymentUrl: '',
          instructions: ''
        };
      }

      await updateDoc(doc(db, 'upcomingActivities', id), updateData);
      
      alert('Payment settings saved successfully!');
      navigate('/upcoming');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      alert('Error saving payment settings. Please try again.');
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Payment Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Activity: <span className="font-semibold">{activity.title}</span>
          </p>
        </div>

        {/* Payment Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Paid Event Toggle */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <input
                type="checkbox"
                id="isPaid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPaid" className="text-lg font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                This is a paid event
              </label>
            </div>

            {/* Payment Details */}
            {isPaid && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <Input
                  label="Registration Fee (₹)"
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="Enter fee amount"
                  required
                />
                
                <Input
                  label="Payment URL (UPI/QR Code Link)"
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  placeholder="https://example.com/payment-qr or upi://pay?..."
                />
                
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
            )}

            {!isPaid && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-600 dark:text-gray-400">
                <p>This activity is currently free. Enable "This is a paid event" to add payment settings.</p>
              </div>
            )}
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
            Save Payment Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActivityPaymentEditPage;
