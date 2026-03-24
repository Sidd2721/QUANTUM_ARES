import { Upload, FileCode } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 scale-105"
            : "border-gray-300 bg-white/70"
        }`}
        style={{
          backdropFilter: "blur(20px)",
          boxShadow: isDragging
            ? "0 25px 50px rgba(59, 130, 246, 0.2)"
            : "0 20px 40px rgba(0,0,0,0.08)",
        }}
      >
        <motion.div
          animate={{
            boxShadow: isDragging
              ? ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)"]
              : "0 0 0 0 rgba(59, 130, 246, 0)",
          }}
          transition={{ duration: 1.5, repeat: isDragging ? Infinity : 0 }}
          className="p-12 text-center"
        >
          <motion.div
            animate={{
              y: isDragging ? [0, -10, 0] : 0,
              rotate: isDragging ? [0, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
            className="inline-block"
          >
            <div className="relative">
              <Upload className="w-16 h-16 mx-auto text-gray-400" />
              {isDragging && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30"
                />
              )}
            </div>
          </motion.div>
          <h3 className="mt-4 text-gray-700">
            Drop your infrastructure configuration
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            IaC files, Terraform, Kubernetes YAML, or Helm charts
          </p>
          <label className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105">
            <FileCode className="inline-block w-4 h-4 mr-2" />
            Browse Files
            <input
              type="file"
              className="hidden"
              onChange={handleFileInput}
              accept=".yaml,.yml,.tf,.json"
            />
          </label>
        </motion.div>
      </div>
    </motion.div>
  );
}
