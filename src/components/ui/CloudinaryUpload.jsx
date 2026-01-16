import React, { useState } from "react";
import { uploadToCloudinary } from "../../utils/cloudinary";

const CloudinaryUpload = ({ onUpload, folder = "", buttonLabel = "Upload Image", showPreview = false, allowMultiple = false }) => {
	const [files, setFiles] = useState([]);
	const [singleFile, setSingleFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");

	const handleFileChange = (e) => {
		const selectedFiles = Array.from(e.target.files);

		if (allowMultiple) {
			setFiles(selectedFiles);
			setSingleFile(null);
			setPreview(null); // No preview for multiple yet
		} else {
			const selectedFile = selectedFiles[0];
			setFiles([]);
			setSingleFile(selectedFile);

			// Create preview only for images
			if (selectedFile && selectedFile.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = (event) => {
					setPreview(event.target.result);
				};
				reader.readAsDataURL(selectedFile);
			} else {
				setPreview(null);
			}
		}
		setError("");
	};

	const handleUpload = async () => {
		if ((!allowMultiple && !singleFile) || (allowMultiple && files.length === 0)) {
			setError("Please select a file to upload.");
			return;
		}
		setUploading(true);
		setError("");

		try {
			if (allowMultiple) {
				const uploadPromises = files.map(f => uploadToCloudinary(f, folder));
				const results = await Promise.all(uploadPromises);
				onUpload && onUpload(results);
				setFiles([]);
			} else {
				const uploadData = await uploadToCloudinary(singleFile, folder);
				onUpload && onUpload(uploadData);
				setSingleFile(null);
				setPreview(null);
			}
		} catch (err) {
			const errorMessage = err.message || "Upload error. Please try again.";
			setError(errorMessage);
			console.error('Upload error details:', err);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Select File{allowMultiple ? 's' : ''}
				</label>
				<input
					type="file"
					multiple={allowMultiple}
					onChange={handleFileChange}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				{allowMultiple && files.length > 0 && (
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						{files.length} file{files.length !== 1 ? 's' : ''} selected
					</p>
				)}
			</div>

			{showPreview && preview && (
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Preview
					</label>
					<img
						src={preview}
						alt="Preview"
						className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
					/>
				</div>
			)}

			{error && (
				<div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
					<p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
				</div>
			)}

			<button
				onClick={handleUpload}
				disabled={uploading || (!singleFile && files.length === 0)}
				className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				{uploading ? "Uploading..." : buttonLabel}
			</button>
		</div>
	);
};

export default CloudinaryUpload;
