import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

const Dropzone = ({ onFileLoaded }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onFileLoaded(url, file.name);
    }
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf']
    },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`dropzone-container ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <Upload size={24} className="upload-icon" />
        <p>
          {isDragActive 
            ? "Drop the model here..." 
            : "Drag & drop a 3D model (.glb, .gltf)"}
        </p>
        <span className="browse-text">or click to browse</span>
      </div>
    </div>
  );
};

export default Dropzone;
