import React, { useState, useEffect } from 'react';
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName = "File" }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileType, setFileType] = useState(null);

    useEffect(() => {
        if (fileUrl && isOpen) {
            setIsLoading(true);
            setError(null);
            
            // Determine file type from URL or file extension
            const getFileType = (url) => {
                const extension = url.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
                    return 'image';
                } else if (extension === 'pdf') {
                    return 'pdf';
                } else if (['doc', 'docx'].includes(extension)) {
                    return 'document';
                } else {
                    return 'unknown';
                }
            };

            setFileType(getFileType(fileUrl));
            setIsLoading(false);
        }
    }, [fileUrl, isOpen]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExternalView = () => {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    const renderFileContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-slate-600">Loading file...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-center">
                        <p className="text-red-600 font-medium">Failed to load file</p>
                        <p className="text-sm text-slate-500 mt-2">{error}</p>
                    </div>
                    <Button
                        text="Try External View"
                        className="btn-outline-primary"
                        onClick={handleExternalView}
                    />
                </div>
            );
        }

        switch (fileType) {
            case 'image':
                return (
                    <div className="flex justify-center">
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                            onError={() => setError('Failed to load image')}
                        />
                    </div>
                );

            case 'pdf':
                return (
                    <div className="w-full">
                        <iframe
                            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full h-96 border rounded-lg"
                            title={fileName}
                            onError={() => setError('Failed to load PDF')}
                        />
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    If the PDF doesn't display properly, you can{' '}
                                    <button 
                                        onClick={handleExternalView}
                                        className="font-medium underline hover:no-underline"
                                    >
                                        open it in a new tab
                                    </button>
                                    {' '}or download it.
                                </span>
                            </div>
                        </div>
                    </div>
                );

            case 'document':
                return (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{fileName}</p>
                                <p className="text-sm text-slate-500 mt-1">Document Preview</p>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                This document type cannot be previewed in the browser.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    text="Open in New Tab"
                                    className="btn-primary"
                                    onClick={handleExternalView}
                                />
                                <Button
                                    text="Download"
                                    className="btn-outline-primary"
                                    onClick={handleDownload}
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{fileName}</p>
                                <p className="text-sm text-slate-500 mt-1">Unknown File Type</p>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                This file type cannot be previewed.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    text="Open in New Tab"
                                    className="btn-primary"
                                    onClick={handleExternalView}
                                />
                                <Button
                                    text="Download"
                                    className="btn-outline-primary"
                                    onClick={handleDownload}
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal
            title={`File Viewer - ${fileName}`}
            activeModal={isOpen}
            onClose={onClose}
            className="max-w-4xl"
            scrollContent={false}
            footerContent={
                <div className="flex gap-3">
                    <Button
                        text="Download"
                        className="btn-outline-primary"
                        onClick={handleDownload}
                    />
                    <Button
                        text="Open in New Tab"
                        className="btn-outline-secondary"
                        onClick={handleExternalView}
                    />
                    <Button
                        text="Close"
                        className="btn-secondary"
                        onClick={onClose}
                    />
                </div>
            }
        >
            <div className="min-h-[400px]">
                {renderFileContent()}
            </div>
        </Modal>
    );
};

export default FileViewerModal;
