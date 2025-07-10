"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number
  taskId?: number
  commentId?: number
  onUploadComplete?: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function FileUploadDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  commentId,
  onUploadComplete,
}: FileUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip",
  ]

  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []
    Array.from(selectedFiles).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed`)
        return
      }

      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB`)
        return
      }

      newFiles.push({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: "pending",
      })
    })

    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData()
    formData.append("file", uploadFile.file)
    if (projectId) formData.append("projectId", projectId.toString())
    if (taskId) formData.append("taskId", taskId.toString())
    if (commentId) formData.append("commentId", commentId.toString())

    try {
      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f)))

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f)))
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: "Upload failed" } : f)),
          )
        }
      })

      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: "Network error" } : f)),
        )
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: "Upload failed" } : f)),
      )
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await uploadFile(file)
    }

    // Check if all uploads completed successfully
    setTimeout(() => {
      const allSuccess = files.every((f) => f.status === "success")
      if (allSuccess) {
        onUploadComplete?.()
        onOpenChange(false)
        setFiles([])
        router.refresh()
      }
    }, 1000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">
              Supported: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP (Max 10MB)
            </p>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.file.size)}</p>
                    {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-1" />}
                    {file.status === "error" && <p className="text-sm text-red-500">{file.error}</p>}
                  </div>
                  {file.status === "pending" && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setFiles([])
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={uploadAll}
              disabled={files.length === 0 || files.every((f) => f.status !== "pending")}
            >
              Upload All ({files.filter((f) => f.status === "pending").length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
