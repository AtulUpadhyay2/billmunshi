import React, { useState, useRef } from 'react';
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const UploadBillModal = ({ isOpen, onClose, onUpload, title = "Upload Bills" }) => {
    const [files, setFiles] = useState([]);
    const [fileType, setFileType] = useState('Single Invoice/File');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const fileTypeOptions = [
        { value: 'Single Invoice/File', label: 'Single Invoice/File' },
        { value: 'Multiple Invoice/File', label: 'Multiple Invoice/File' }
    ];

    const handleFileChange = (selectedFiles) => {
        const fileArray = Array.from(selectedFiles);
        setFiles(prevFiles => [...prevFiles, ...fileArray]);
    };

    const handleRemoveFile = (indexToRemove) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = droppedFiles.filter(file => {
            const validTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            return validTypes.includes(fileExtension);
        });
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
    };

    const handleFileInputClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            handleFileChange(selectedFiles);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('Please select at least one file to upload');
            return;
        }

        setIsUploading(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add files to FormData - try different approaches
            if (files.length === 1) {
                // Single file
                formData.append('file', files[0]);
            } else {
                // Multiple files - try both approaches
                files.forEach((file, index) => {
                    formData.append('file', file); // Some servers expect same field name for multiple files
                });
            }
            
            // Add file type
            formData.append('fileType', fileType);
            
            // Debug: Log FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            
            // Call the upload function passed from parent
            await onUpload(formData);
            
            // Reset form and close modal
            setFiles([]);
            setFileType('Single Invoice/File');
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            setFiles([]);
            setFileType('Single Invoice/File');
            onClose();
        }
    };

    return (
        <Modal
            title={title}
            labelClass="btn-outline-dark"
            activeModal={isOpen}
            onClose={handleClose}
            className="max-w-xl"
        >
            <div className="space-y-6">
                {/* File Type Selection */}
                <div>
                    <label className="form-label">File Type</label>
                    <Select
                        placeholder="Select file type"
                        options={fileTypeOptions}
                        value={fileTypeOptions.find(option => option.value === fileType)}
                        onChange={(selectedOption) => setFileType(selectedOption.value)}
                        className="react-select"
                        classNamePrefix="select"
                    />
                </div>

                {/* File Upload */}
                <div>
                    <label className="form-label">Select Files</label>
                    
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                    
                    {/* Drag and Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileInputClick}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                            isDragOver 
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-3">
                            <svg 
                                className={`w-12 h-12 transition-colors duration-200 ${
                                    isDragOver ? 'text-blue-500' : 'text-slate-400'
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={1.5} 
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                                />
                            </svg>
                            <div>
                                <p className="text-slate-600 dark:text-slate-300 font-medium">
                                    {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
                                </p>
                                <p className="text-slate-400 text-sm mt-1">
                                    or <span className="text-blue-600 font-medium">click to browse</span>
                                </p>
                            </div>
                            <div className="text-xs text-slate-500">
                                Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Files Info */}
                {files.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Selected Files ({files.length})
                            </h4>
                            <button
                                onClick={() => setFiles([])}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                type="button"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.map((file, index) => (
                                <div 
                                    key={`${file.name}-${index}`} 
                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {/* File Icon */}
                                        <div className="flex-shrink-0">
                                            {file.type.includes('pdf') ? (
                                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                            ) : file.type.includes('image') ? (
                                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        
                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="flex-shrink-0 ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                                        type="button"
                                        title="Remove file"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        text="Cancel"
                        className="btn-outline-secondary"
                        onClick={handleClose}
                        disabled={isUploading}
                    />
                    <Button
                        text={isUploading ? "Uploading..." : "Upload Bills"}
                        className="btn-primary"
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                        isLoading={isUploading}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default UploadBillModal;
