import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import FormBuilder from '../../components/admin/FormBuilder';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function FormEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchForm();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      const docRef = doc(db, 'forms', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setForm({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert('Form not found');
        navigate('/upcoming/forms');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Error loading form');
      navigate('/upcoming/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const formToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (id === 'new') {
        // Create new form
        formToSave.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'forms'), formToSave);
        navigate(`/upcoming/forms/${docRef.id}`);
      } else {
        // Update existing form
        await updateDoc(doc(db, 'forms', id), formToSave);
        navigate('/upcoming/forms');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/upcoming/forms');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormBuilder form={form} onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default FormEditPage;
