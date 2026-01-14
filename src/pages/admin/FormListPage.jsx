import AdminForms from '../../components/admin/AdminForms';

function FormListPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminForms />
      </div>
    </div>
  );
}

export default FormListPage;
