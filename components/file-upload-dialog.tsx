"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, X, File } from "lucide-react"

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number
  taskId?: number
}

export function FileUploadDialog({ open, onOpenChange, projectId, taskId }: FileUploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
      "application/zip": [".zip"],
      "application/x-rar-compressed": [".rar"],
    },
  })

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        if (projectId) formData.append("projectId", projectId.toString())
        if (taskId) formData.append("taskId", taskId.toString())

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      toast.success("Files uploaded successfully!")
      setSelectedFiles([])
      onOpenChange(false)
      window.location.reload() // Refresh to show new files
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload files")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Maximum file size: 10MB</p>
                <p className="text-xs text-gray-400 mt-1">Supported: Images, PDF, DOC, XLS, TXT, ZIP, RAR</p>
              </div>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={uploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={uploadFiles} disabled={selectedFiles.length === 0 || uploading}>
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
